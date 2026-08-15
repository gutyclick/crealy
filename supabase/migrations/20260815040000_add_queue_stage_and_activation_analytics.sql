-- Queue-stage latency and first-value activation analytics.
-- Raw rows remain service-role only; only aggregate security-definer reports
-- are exposed to internal server routes.

create table public.job_stage_spans (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_no integer not null check (attempt_no > 0),
  stage text not null check (stage in (
    'waiting', 'preparation', 'generation', 'evaluation',
    'correction', 'processing_storage'
  )),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null,
  completed_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, attempt_no, stage)
);

create index job_stage_spans_stage_time_idx
  on public.job_stage_spans (stage, completed_at desc);
create index job_stage_spans_running_idx
  on public.job_stage_spans (started_at)
  where status = 'running';

create table public.activation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'goal_selected', 'example_viewed', 'recommended_configuration_loaded',
    'onboarding_completed', 'generation_started', 'first_result_downloaded',
    'visual_signature_invited', 'visual_signature_started', 'visual_signature_saved'
  )),
  idempotency_key text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index activation_events_type_time_idx
  on public.activation_events (event_type, occurred_at desc);
create index activation_events_user_time_idx
  on public.activation_events (user_id, occurred_at);

create table public.user_activity_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create index user_activity_days_date_idx
  on public.user_activity_days (activity_date, user_id);

alter table public.job_stage_spans enable row level security;
alter table public.activation_events enable row level security;
alter table public.user_activity_days enable row level security;

revoke all on table public.job_stage_spans from public, anon, authenticated;
revoke all on table public.activation_events from public, anon, authenticated;
revoke all on table public.user_activity_days from public, anon, authenticated;

create or replace function public.start_job_stage_internal(
  p_job_id uuid,
  p_generation_id uuid,
  p_user_id uuid,
  p_attempt_no integer,
  p_stage text,
  p_started_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_attempt_no < 1 or p_stage not in (
    'waiting', 'preparation', 'generation', 'evaluation',
    'correction', 'processing_storage'
  ) or p_started_at is null then
    raise exception 'invalid_job_stage';
  end if;
  if not exists (
    select 1 from public.jobs
    where id = p_job_id and resource_id = p_generation_id and user_id = p_user_id
      and job_type = 'generation'
  ) then raise exception 'job_stage_relationship_invalid'; end if;

  insert into public.job_stage_spans (
    job_id, generation_id, user_id, attempt_no, stage, status, started_at, metadata
  ) values (
    p_job_id, p_generation_id, p_user_id, p_attempt_no, p_stage,
    'running', p_started_at, coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (job_id, attempt_no, stage) do nothing;
end;
$$;

create or replace function public.finish_job_stage_internal(
  p_job_id uuid,
  p_attempt_no integer,
  p_stage text,
  p_status text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_status not in ('completed', 'failed') then
    raise exception 'invalid_job_stage_status';
  end if;
  update public.job_stage_spans set
    status = p_status,
    completed_at = now(),
    duration_ms = greatest(0, floor(extract(epoch from (now() - started_at)) * 1000)::integer),
    metadata = metadata || coalesce(p_metadata, '{}'::jsonb),
    updated_at = now()
  where job_id = p_job_id and attempt_no = p_attempt_no and stage = p_stage
    and status = 'running';
end;
$$;

create or replace function public.fail_open_job_stages_internal(
  p_job_id uuid,
  p_attempt_no integer,
  p_error_code text
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  update public.job_stage_spans set
    status = 'failed',
    completed_at = now(),
    duration_ms = greatest(0, floor(extract(epoch from (now() - started_at)) * 1000)::integer),
    metadata = metadata || jsonb_build_object('errorCode', left(coalesce(p_error_code, 'unknown'), 120)),
    updated_at = now()
  where job_id = p_job_id and attempt_no = p_attempt_no and status = 'running';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.record_activation_event_internal(
  p_user_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_properties jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_event_type not in (
    'goal_selected', 'example_viewed', 'recommended_configuration_loaded',
    'onboarding_completed', 'generation_started', 'first_result_downloaded',
    'visual_signature_invited', 'visual_signature_started', 'visual_signature_saved'
  ) or length(p_idempotency_key) < 3 or length(p_idempotency_key) > 160 then
    raise exception 'invalid_activation_event';
  end if;
  insert into public.activation_events (user_id, event_type, idempotency_key, properties)
  values (p_user_id, p_event_type, p_idempotency_key, coalesce(p_properties, '{}'::jsonb))
  on conflict (user_id, idempotency_key) do nothing;
end;
$$;

create or replace function public.record_user_activity_internal(p_user_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.user_activity_days (user_id, activity_date)
  values (p_user_id, (timezone('utc', now()))::date)
  on conflict (user_id, activity_date) do update set last_seen_at = now();
$$;

create or replace function public.queue_stage_analytics_internal(
  p_from timestamptz default now() - interval '7 days',
  p_to timestamptz default now(),
  p_stuck_minutes integer default 15
)
returns jsonb
language sql security definer set search_path = ''
as $$
  with stages(stage) as (
    values ('waiting'), ('preparation'), ('generation'), ('evaluation'),
      ('correction'), ('processing_storage')
  ), scoped as (
    select * from public.job_stage_spans
    where started_at >= p_from and started_at < p_to
  ), stage_rows as (
    select jsonb_build_object(
      'stage', s.stage,
      'sampleCount', count(q.duration_ms) filter (where q.status = 'completed'),
      'failedCount', count(q.id) filter (where q.status = 'failed'),
      'stuckCount', count(q.id) filter (
        where q.status = 'running'
          and q.started_at < now() - make_interval(mins => greatest(1, p_stuck_minutes))
      ),
      'p50Ms', coalesce(round(percentile_cont(0.50) within group (order by q.duration_ms)
        filter (where q.status = 'completed')), 0),
      'p95Ms', coalesce(round(percentile_cont(0.95) within group (order by q.duration_ms)
        filter (where q.status = 'completed')), 0),
      'averageMs', coalesce(round(avg(q.duration_ms)
        filter (where q.status = 'completed')), 0)
    ) value
    from stages s left join scoped q on q.stage = s.stage
    group by s.stage
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'stuckAfterMinutes', greatest(1, p_stuck_minutes),
    'stuckJobs', (
      select count(*) from public.jobs
      where status in ('queued', 'claimed', 'processing', 'retry_scheduled')
        and updated_at < now() - make_interval(mins => greatest(1, p_stuck_minutes))
    ),
    'byStage', coalesce(jsonb_agg(value order by
      case value->>'stage'
        when 'waiting' then 1 when 'preparation' then 2 when 'generation' then 3
        when 'evaluation' then 4 when 'correction' then 5 else 6 end
    ), '[]'::jsonb)
  ) from stage_rows;
$$;

create or replace function public.activation_analytics_internal(
  p_from timestamptz default now() - interval '30 days',
  p_to timestamptz default now()
)
returns jsonb
language sql security definer set search_path = ''
as $$
  with cohort as (
    select id as user_id, created_at from auth.users
    where created_at >= p_from and created_at < p_to
  ), first_download as (
    select e.user_id, min(e.occurred_at) downloaded_at
    from public.generation_events e
    where e.event_type = 'downloaded'
    group by e.user_id
  ), first_completion as (
    select g.user_id, min(g.completed_at) completed_at
    from public.generations g where g.status = 'completed'
    group by g.user_id
  ), user_funnel as (
    select
      c.user_id,
      c.created_at,
      p.onboarding_completed_at,
      fc.completed_at,
      fd.downloaded_at,
      exists (
        select 1 from public.user_activity_days a
        where a.user_id = c.user_id
          and fd.downloaded_at is not null
          and a.activity_date > (fd.downloaded_at at time zone 'utc')::date
          and a.activity_date <= (fd.downloaded_at at time zone 'utc')::date + 7
      ) returned_within_7d
    from cohort c
    left join public.user_preferences p on p.user_id = c.user_id
    left join first_completion fc on fc.user_id = c.user_id
    left join first_download fd on fd.user_id = c.user_id
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'registeredUsers', count(*),
    'onboardingCompletedUsers', count(*) filter (where onboarding_completed_at is not null),
    'firstResultCompletedUsers', count(*) filter (where completed_at is not null),
    'firstResultDownloadedUsers', count(*) filter (where downloaded_at is not null),
    'firstDownloadActivationRate', coalesce(round(
      count(*) filter (where downloaded_at is not null)::numeric / nullif(count(*), 0), 4
    ), 0),
    'medianHoursToFirstDownload', round((percentile_cont(0.5) within group (
      order by extract(epoch from (downloaded_at - created_at)) / 3600
    ) filter (where downloaded_at is not null))::numeric, 3),
    'returnEligibleUsers', count(*) filter (where downloaded_at < p_to - interval '7 days'),
    'returnedWithin7Days', count(*) filter (
      where downloaded_at < p_to - interval '7 days' and returned_within_7d
    ),
    'sevenDayReturnRate', coalesce(round(
      count(*) filter (where downloaded_at < p_to - interval '7 days' and returned_within_7d)::numeric
      / nullif(count(*) filter (where downloaded_at < p_to - interval '7 days'), 0), 4
    ), 0),
    'goalSelectedUsers', (select count(distinct user_id) from public.activation_events
      where event_type = 'goal_selected' and occurred_at >= p_from and occurred_at < p_to),
    'exampleViewedUsers', (select count(distinct user_id) from public.activation_events
      where event_type = 'example_viewed' and occurred_at >= p_from and occurred_at < p_to),
    'recommendedConfigurationUsers', (select count(distinct user_id) from public.activation_events
      where event_type = 'recommended_configuration_loaded' and occurred_at >= p_from and occurred_at < p_to),
    'visualSignatureInvitedUsers', (select count(distinct user_id) from public.activation_events
      where event_type = 'visual_signature_invited' and occurred_at >= p_from and occurred_at < p_to)
  ) from user_funnel;
$$;

revoke all on function public.start_job_stage_internal(uuid,uuid,uuid,integer,text,timestamptz,jsonb) from public, anon, authenticated;
revoke all on function public.finish_job_stage_internal(uuid,integer,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.fail_open_job_stages_internal(uuid,integer,text) from public, anon, authenticated;
revoke all on function public.record_activation_event_internal(uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.record_user_activity_internal(uuid) from public, anon, authenticated;
revoke all on function public.queue_stage_analytics_internal(timestamptz,timestamptz,integer) from public, anon, authenticated;
revoke all on function public.activation_analytics_internal(timestamptz,timestamptz) from public, anon, authenticated;

grant execute on function public.start_job_stage_internal(uuid,uuid,uuid,integer,text,timestamptz,jsonb) to service_role;
grant execute on function public.finish_job_stage_internal(uuid,integer,text,text,jsonb) to service_role;
grant execute on function public.fail_open_job_stages_internal(uuid,integer,text) to service_role;
grant execute on function public.record_activation_event_internal(uuid,text,text,jsonb) to service_role;
grant execute on function public.record_user_activity_internal(uuid) to service_role;
grant execute on function public.queue_stage_analytics_internal(timestamptz,timestamptz,integer) to service_role;
grant execute on function public.activation_analytics_internal(timestamptz,timestamptz) to service_role;
