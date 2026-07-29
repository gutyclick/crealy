-- Crealy Fase 7: durable jobs, outbox, attempts, budgets and rate limits.
-- This migration is intentionally additive. Do not edit previously applied migrations.

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('generation', 'edit')),
  status text not null default 'queued' check (
    status in (
      'queued', 'claimed', 'processing', 'retry_scheduled',
      'completed', 'failed', 'cancelled'
    )
  ),
  idempotency_key text not null,
  correlation_id uuid not null default gen_random_uuid(),
  resource_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  input_hash text not null,
  output_sha256 text,
  output_bytes bigint check (output_bytes is null or output_bytes > 0),
  priority smallint not null default 100,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 4 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_by text,
  visibility_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  error_code text,
  estimated_cost_usd numeric(12, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index jobs_claimable_idx
  on public.jobs (status, available_at, priority, created_at)
  where status in ('queued', 'retry_scheduled');
create index jobs_user_created_idx on public.jobs (user_id, created_at desc);
create index jobs_resource_idx on public.jobs (job_type, resource_id);
create index jobs_visibility_idx
  on public.jobs (visibility_expires_at)
  where status in ('claimed', 'processing');

create table public.job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  attempt_no integer not null check (attempt_no > 0),
  worker_id text not null,
  status text not null check (
    status in ('processing', 'completed', 'retry_scheduled', 'failed', 'cancelled')
  ),
  provider_request_id text,
  error_code text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (job_id, attempt_no)
);

create index job_attempts_job_idx on public.job_attempts (job_id, attempt_no desc);

create table public.job_outbox (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  event_type text not null default 'job.created',
  status text not null default 'pending' check (
    status in ('pending', 'publishing', 'published', 'failed')
  ),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  published_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_outbox_pending_idx
  on public.job_outbox (status, available_at, created_at)
  where status in ('pending', 'failed');

create table public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  operation text not null check (operation in ('generation', 'edit')),
  provider_request_id text,
  estimated_cost_usd numeric(12, 6),
  created_at timestamptz not null default now()
);

create index provider_usage_daily_idx on public.provider_usage (created_at, provider);
create index provider_usage_user_idx on public.provider_usage (user_id, created_at desc);

create table public.operational_metrics (
  metric_date date not null default (timezone('utc', now()))::date,
  metric_name text not null,
  dimension text not null default 'all',
  metric_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (metric_date, metric_name, dimension)
);

create table public.rate_limit_counters (
  scope_key text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  primary key (scope_key, action, window_started_at)
);

create index rate_limit_expiry_idx on public.rate_limit_counters (expires_at);

alter table public.jobs enable row level security;
alter table public.job_attempts enable row level security;
alter table public.job_outbox enable row level security;
alter table public.provider_usage enable row level security;
alter table public.operational_metrics enable row level security;
alter table public.rate_limit_counters enable row level security;

revoke all on table public.jobs from public, anon, authenticated;
revoke all on table public.job_attempts from public, anon, authenticated;
revoke all on table public.job_outbox from public, anon, authenticated;
revoke all on table public.provider_usage from public, anon, authenticated;
revoke all on table public.operational_metrics from public, anon, authenticated;
revoke all on table public.rate_limit_counters from public, anon, authenticated;

grant select on table public.jobs to authenticated;
grant select on table public.job_attempts to authenticated;

create policy "Users view their own jobs"
  on public.jobs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users view attempts for their own jobs"
  on public.job_attempts for select to authenticated
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_attempts.job_id
        and jobs.user_id = (select auth.uid())
    )
  );

create or replace function public.consume_rate_limit_internal(
  p_scope_key text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = ''
as $$
declare
  selected_window timestamptz;
  current_count integer;
begin
  if length(p_scope_key) < 8 or length(p_scope_key) > 160
    or length(p_action) < 2 or length(p_action) > 80
    or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit';
  end if;

  selected_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters (
    scope_key, action, window_started_at, request_count, expires_at
  )
  values (
    p_scope_key, p_action, selected_window, 1,
    selected_window + make_interval(secs => p_window_seconds * 2)
  )
  on conflict (scope_key, action, window_started_at)
  do update set request_count = public.rate_limit_counters.request_count + 1
  returning request_count into current_count;

  allowed := current_count <= p_limit;
  remaining := greatest(0, p_limit - current_count);
  retry_after_seconds := greatest(
    1,
    ceil(extract(epoch from (
      selected_window + make_interval(secs => p_window_seconds) - now()
    )))::integer
  );
  return next;
end;
$$;

create or replace function public.increment_operational_metric_internal(
  p_metric_name text,
  p_dimension text,
  p_increment integer default 1
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if length(p_metric_name) < 2 or length(p_metric_name) > 80
    or length(p_dimension) < 1 or length(p_dimension) > 80
    or p_increment < 1 then
    raise exception 'invalid_metric';
  end if;
  insert into public.operational_metrics (
    metric_date, metric_name, dimension, metric_value
  )
  values (
    (timezone('utc', now()))::date,
    p_metric_name,
    p_dimension,
    p_increment
  )
  on conflict (metric_date, metric_name, dimension)
  do update set
    metric_value = public.operational_metrics.metric_value + excluded.metric_value,
    updated_at = now();
end;
$$;

create or replace function public.assert_operational_budget_internal(
  p_estimated_cost_usd numeric,
  p_daily_budget_usd numeric,
  p_monthly_budget_usd numeric
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  daily_usage numeric;
  monthly_usage numeric;
  reserved_daily numeric;
  reserved_monthly numeric;
begin
  if p_estimated_cost_usd is null then return; end if;
  if p_estimated_cost_usd < 0 then raise exception 'invalid_estimated_cost'; end if;

  select coalesce(sum(estimated_cost_usd), 0) into daily_usage
  from public.provider_usage
  where created_at >= date_trunc('day', timezone('utc', now())) at time zone 'utc';
  select coalesce(sum(estimated_cost_usd), 0) into monthly_usage
  from public.provider_usage
  where created_at >= date_trunc('month', timezone('utc', now())) at time zone 'utc';

  select coalesce(sum(estimated_cost_usd), 0) into reserved_daily
  from public.jobs
  where status in ('queued', 'claimed', 'processing', 'retry_scheduled')
    and created_at >= date_trunc('day', timezone('utc', now())) at time zone 'utc';
  select coalesce(sum(estimated_cost_usd), 0) into reserved_monthly
  from public.jobs
  where status in ('queued', 'claimed', 'processing', 'retry_scheduled')
    and created_at >= date_trunc('month', timezone('utc', now())) at time zone 'utc';

  if p_daily_budget_usd is not null
    and daily_usage + reserved_daily + p_estimated_cost_usd > p_daily_budget_usd then
    raise exception 'daily_budget_exceeded';
  end if;
  if p_monthly_budget_usd is not null
    and monthly_usage + reserved_monthly + p_estimated_cost_usd > p_monthly_budget_usd then
    raise exception 'monthly_budget_exceeded';
  end if;
end;
$$;

create or replace function public.create_generation_job_internal(
  p_user_id uuid,
  p_client_request_id uuid,
  p_project_id uuid,
  p_title text,
  p_user_prompt text,
  p_content_type text,
  p_requested_format text,
  p_style text,
  p_quality text,
  p_primary_text text,
  p_color_preference text,
  p_custom_colors text[],
  p_reference_upload_ids uuid[],
  p_input_hash text,
  p_credit_cost integer,
  p_daily_limit integer,
  p_cooldown_seconds integer,
  p_estimated_cost_usd numeric,
  p_daily_budget_usd numeric,
  p_monthly_budget_usd numeric
)
returns table (
  job_id uuid,
  generation_id uuid,
  project_id uuid,
  job_status text,
  generation_status text,
  is_existing boolean
)
language plpgsql security definer set search_path = ''
as $$
declare
  existing_job public.jobs%rowtype;
  existing_generation public.generations%rowtype;
  selected_project_id uuid;
  selected_generation_id uuid;
  selected_job_id uuid;
  credit_result record;
  latest_generation_at timestamptz;
  daily_count integer;
  selected_upload_id uuid;
  reference_position integer := 0;
begin
  if p_user_id is null or length(p_input_hash) <> 64
    or p_daily_limit < 1 or p_cooldown_seconds < 1
    or p_credit_cost < 1 then raise exception 'invalid_request'; end if;
  if coalesce(array_length(p_reference_upload_ids, 1), 0) > 4 then
    raise exception 'invalid_reference_count';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select j.* into existing_job
  from public.jobs j
  where j.user_id = p_user_id
    and j.idempotency_key = 'generation:' || p_client_request_id::text;
  if found then
    select g.* into existing_generation
    from public.generations g where g.id = existing_job.resource_id;
    return query select existing_job.id, existing_generation.id,
      existing_generation.project_id, existing_job.status,
      existing_generation.status, true;
    return;
  end if;

  if exists (
    select 1 from public.jobs
    where user_id = p_user_id
      and status in ('queued', 'claimed', 'processing', 'retry_scheduled')
  ) then raise exception 'generation_active'; end if;

  select count(*) into daily_count
  from public.jobs
  where user_id = p_user_id and job_type = 'generation'
    and created_at >= date_trunc('day', timezone('utc', now())) at time zone 'utc';
  if daily_count >= p_daily_limit then raise exception 'generation_limit'; end if;

  select created_at into latest_generation_at
  from public.jobs where user_id = p_user_id and job_type = 'generation'
  order by created_at desc limit 1;
  if latest_generation_at is not null
    and latest_generation_at > now() - make_interval(secs => p_cooldown_seconds)
    then raise exception 'generation_cooldown'; end if;

  perform public.assert_operational_budget_internal(
    p_estimated_cost_usd, p_daily_budget_usd, p_monthly_budget_usd
  );

  if p_project_id is null then
    insert into public.projects (user_id, title, content_type)
    values (p_user_id, p_title, p_content_type)
    returning id into selected_project_id;
  else
    select p.id into selected_project_id
    from public.projects p
    where p.id = p_project_id and p.user_id = p_user_id
      and p.content_type = p_content_type;
    if not found then raise exception 'project_not_found'; end if;
  end if;

  insert into public.generations (
    project_id, user_id, client_request_id, status, user_prompt,
    content_type, requested_format, style, quality, primary_text,
    color_preference, custom_colors, credit_cost
  )
  values (
    selected_project_id, p_user_id, p_client_request_id, 'pending',
    p_user_prompt, p_content_type, p_requested_format, p_style, p_quality,
    p_primary_text, p_color_preference, p_custom_colors, p_credit_cost
  )
  returning id into selected_generation_id;

  foreach selected_upload_id in array coalesce(p_reference_upload_ids, array[]::uuid[])
  loop
    if not exists (
      select 1 from public.user_uploads u
      where u.id = selected_upload_id and u.user_id = p_user_id
    ) then raise exception 'invalid_reference'; end if;
    insert into public.generation_references (
      generation_id, upload_id, user_id, position
    ) values (
      selected_generation_id, selected_upload_id, p_user_id, reference_position
    );
    reference_position := reference_position + 1;
  end loop;

  select * into credit_result
  from public.reserve_credits_internal(
    p_user_id, p_credit_cost, 'generation', selected_generation_id,
    'generation:' || p_client_request_id::text
  );

  update public.generations set
    credit_reservation_id = credit_result.reservation_id
  where id = selected_generation_id;

  insert into public.jobs (
    user_id, job_type, idempotency_key, resource_id, payload, input_hash,
    estimated_cost_usd
  )
  values (
    p_user_id, 'generation', 'generation:' || p_client_request_id::text,
    selected_generation_id,
    jsonb_build_object(
      'generationId', selected_generation_id,
      'projectId', selected_project_id
    ), p_input_hash,
    p_estimated_cost_usd
  )
  returning id into selected_job_id;

  insert into public.job_outbox (job_id) values (selected_job_id);
  perform public.increment_operational_metric_internal('jobs_created', 'generation');

  return query select selected_job_id, selected_generation_id,
    selected_project_id, 'queued'::text, 'pending'::text, false;
end;
$$;

create or replace function public.create_edit_job_internal(
  p_user_id uuid,
  p_session_id uuid,
  p_client_request_id uuid,
  p_base_version_id uuid,
  p_instruction text,
  p_enhanced_instruction text,
  p_preserve_composition boolean,
  p_input_hash text,
  p_credit_cost integer,
  p_daily_limit integer,
  p_cooldown_seconds integer,
  p_version_limit integer,
  p_estimated_cost_usd numeric,
  p_daily_budget_usd numeric,
  p_monthly_budget_usd numeric
)
returns table (
  job_id uuid,
  version_id uuid,
  selected_base_version_id uuid,
  job_status text,
  version_status text,
  is_existing boolean
)
language plpgsql security definer set search_path = ''
as $$
declare
  selected_session public.edit_sessions%rowtype;
  existing_job public.jobs%rowtype;
  selected_version public.edit_versions%rowtype;
  base_version_id uuid;
  selected_version_id uuid;
  selected_job_id uuid;
  credit_result record;
  daily_count integer;
  session_count integer;
  latest_edit_at timestamptz;
begin
  if p_user_id is null or length(p_input_hash) <> 64
    or p_credit_cost < 1 or p_daily_limit < 1
    or p_cooldown_seconds < 1 or p_version_limit < 2 then
    raise exception 'invalid_request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));

  select j.* into existing_job from public.jobs j
  where j.user_id = p_user_id
    and j.idempotency_key = 'edit:' || p_client_request_id::text;
  if found then
    select v.* into selected_version from public.edit_versions v
    where v.id = existing_job.resource_id;
    return query select existing_job.id, selected_version.id,
      selected_version.parent_version_id, existing_job.status,
      selected_version.status, true;
    return;
  end if;

  select * into selected_session from public.edit_sessions
  where id = p_session_id and user_id = p_user_id and status = 'active';
  if not found then raise exception 'session_not_found'; end if;

  if exists (
    select 1 from public.jobs where user_id = p_user_id
      and status in ('queued', 'claimed', 'processing', 'retry_scheduled')
  ) then raise exception 'edit_active'; end if;

  select count(*) into daily_count from public.jobs
  where user_id = p_user_id and job_type = 'edit'
    and created_at >= date_trunc('day', timezone('utc', now())) at time zone 'utc';
  if daily_count >= p_daily_limit then raise exception 'edit_limit'; end if;

  select created_at into latest_edit_at from public.jobs
  where user_id = p_user_id and job_type = 'edit'
  order by created_at desc limit 1;
  if latest_edit_at is not null
    and latest_edit_at > now() - make_interval(secs => p_cooldown_seconds)
    then raise exception 'edit_cooldown'; end if;

  select count(*) into session_count from public.edit_versions
  where session_id = p_session_id;
  if session_count >= p_version_limit then raise exception 'version_limit'; end if;

  base_version_id := coalesce(p_base_version_id, selected_session.current_version_id);
  if not exists (
    select 1 from public.edit_versions
    where id = base_version_id and session_id = p_session_id
      and user_id = p_user_id and status = 'completed'
  ) then raise exception 'version_not_found'; end if;

  perform public.assert_operational_budget_internal(
    p_estimated_cost_usd, p_daily_budget_usd, p_monthly_budget_usd
  );

  insert into public.edit_versions (
    session_id, user_id, client_request_id, parent_version_id, status,
    instruction, enhanced_instruction, preserve_composition, credit_cost
  ) values (
    p_session_id, p_user_id, p_client_request_id, base_version_id, 'pending',
    btrim(p_instruction), p_enhanced_instruction, p_preserve_composition,
    p_credit_cost
  ) returning id into selected_version_id;

  insert into public.edit_messages (
    session_id, user_id, version_id, role, content
  ) values (
    p_session_id, p_user_id, selected_version_id, 'user', btrim(p_instruction)
  );

  select * into credit_result
  from public.reserve_credits_internal(
    p_user_id, p_credit_cost, 'edit', selected_version_id,
    'edit:' || p_client_request_id::text
  );

  update public.edit_versions set
    credit_reservation_id = credit_result.reservation_id
  where id = selected_version_id;

  insert into public.jobs (
    user_id, job_type, idempotency_key, resource_id, payload, input_hash,
    estimated_cost_usd
  ) values (
    p_user_id, 'edit', 'edit:' || p_client_request_id::text,
    selected_version_id,
    jsonb_build_object(
      'versionId', selected_version_id,
      'sessionId', p_session_id,
      'baseVersionId', base_version_id
    ), p_input_hash,
    p_estimated_cost_usd
  ) returning id into selected_job_id;

  insert into public.job_outbox (job_id) values (selected_job_id);
  perform public.increment_operational_metric_internal('jobs_created', 'edit');

  return query select selected_job_id, selected_version_id, base_version_id,
    'queued'::text, 'pending'::text, false;
end;
$$;

create or replace function public.publish_job_outbox_internal(p_limit integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  published_count integer;
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  with selected as (
    select id from public.job_outbox
    where status in ('pending', 'failed') and available_at <= now()
    order by created_at
    for update skip locked
    limit p_limit
  )
  update public.job_outbox o set
    status = 'published',
    attempts = attempts + 1,
    published_at = now(),
    last_error_code = null,
    updated_at = now()
  from selected where o.id = selected.id;
  get diagnostics published_count = row_count;
  return published_count;
end;
$$;

create or replace function public.claim_job_internal(
  p_job_id uuid,
  p_worker_id text,
  p_visibility_seconds integer,
  p_global_concurrency integer,
  p_user_concurrency integer
)
returns setof public.jobs
language plpgsql security definer set search_path = ''
as $$
declare
  selected_job public.jobs%rowtype;
begin
  if length(p_worker_id) < 4 or length(p_worker_id) > 120
    or p_visibility_seconds < 60 or p_visibility_seconds > 3600
    or p_global_concurrency < 1 or p_user_concurrency < 1 then
    raise exception 'invalid_claim';
  end if;

  select j.* into selected_job from public.jobs j
  where j.id = p_job_id
    and j.status in ('queued', 'retry_scheduled')
    and j.available_at <= now()
    and j.attempt_count < j.max_attempts
    and (
      select count(*) from public.jobs active
      where active.status in ('claimed', 'processing')
    ) < p_global_concurrency
    and (
      select count(*) from public.jobs active
      where active.user_id = j.user_id
        and active.status in ('claimed', 'processing')
    ) < p_user_concurrency
  for update skip locked;

  if not found then return; end if;

  update public.jobs set
    status = 'claimed',
    attempt_count = attempt_count + 1,
    claimed_at = now(),
    claimed_by = p_worker_id,
    visibility_expires_at = now() + make_interval(secs => p_visibility_seconds),
    error_code = null,
    updated_at = now()
  where id = selected_job.id
  returning * into selected_job;

  insert into public.job_attempts (
    job_id, attempt_no, worker_id, status
  ) values (
    selected_job.id, selected_job.attempt_count, p_worker_id, 'processing'
  );
  return next selected_job;
end;
$$;

create or replace function public.mark_job_processing_internal(
  p_job_id uuid,
  p_worker_id text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare updated_count integer;
begin
  update public.jobs set
    status = 'processing',
    started_at = coalesce(started_at, now()),
    updated_at = now()
  where id = p_job_id and status = 'claimed' and claimed_by = p_worker_id
    and visibility_expires_at > now();
  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

create or replace function public.complete_generation_job_internal(
  p_job_id uuid,
  p_user_id uuid,
  p_generation_id uuid,
  p_reservation_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_model text,
  p_provider_request_id text,
  p_duration_ms integer
)
returns table (credits_used integer, credits_remaining integer)
language plpgsql security definer set search_path = ''
as $$
declare result record;
begin
  if not exists (
    select 1 from public.jobs where id = p_job_id and user_id = p_user_id
      and resource_id = p_generation_id and job_type = 'generation'
      and status = 'processing'
  ) then raise exception 'job_not_ready'; end if;

  select * into result from public.complete_generation_with_credits_internal(
    p_user_id, p_generation_id, p_reservation_id, p_storage_path, p_mime_type,
    p_width, p_height, p_model, p_provider_request_id
  );

  update public.jobs set status = 'completed', completed_at = now(),
    visibility_expires_at = null, updated_at = now()
  where id = p_job_id;
  update public.job_attempts set status = 'completed',
    provider_request_id = p_provider_request_id,
    duration_ms = p_duration_ms, finished_at = now()
  where job_id = p_job_id and attempt_no = (
    select attempt_count from public.jobs where id = p_job_id
  );
  insert into public.provider_usage (
    job_id, user_id, provider, model, operation, provider_request_id,
    estimated_cost_usd
  ) select id, user_id, 'openai', p_model, 'generation',
    p_provider_request_id, estimated_cost_usd
  from public.jobs where id = p_job_id
  on conflict (job_id) do nothing;
  perform public.increment_operational_metric_internal('jobs_completed', 'generation');
  return query select result.credits_used, result.credits_remaining;
end;
$$;

create or replace function public.complete_edit_job_internal(
  p_job_id uuid,
  p_user_id uuid,
  p_version_id uuid,
  p_reservation_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_model text,
  p_provider_response_id text,
  p_duration_ms integer
)
returns table (credits_used integer, credits_remaining integer)
language plpgsql security definer set search_path = ''
as $$
declare result record;
begin
  if not exists (
    select 1 from public.jobs where id = p_job_id and user_id = p_user_id
      and resource_id = p_version_id and job_type = 'edit'
      and status = 'processing'
  ) then raise exception 'job_not_ready'; end if;

  select * into result from public.complete_edit_version_with_credits_internal(
    p_user_id, p_version_id, p_reservation_id, p_storage_path, p_mime_type,
    p_width, p_height, p_model, p_provider_response_id
  );
  update public.jobs set status = 'completed', completed_at = now(),
    visibility_expires_at = null, updated_at = now()
  where id = p_job_id;
  update public.job_attempts set status = 'completed',
    provider_request_id = p_provider_response_id,
    duration_ms = p_duration_ms, finished_at = now()
  where job_id = p_job_id and attempt_no = (
    select attempt_count from public.jobs where id = p_job_id
  );
  insert into public.provider_usage (
    job_id, user_id, provider, model, operation, provider_request_id,
    estimated_cost_usd
  ) select id, user_id, 'openai', p_model, 'edit',
    p_provider_response_id, estimated_cost_usd
  from public.jobs where id = p_job_id
  on conflict (job_id) do nothing;
  perform public.increment_operational_metric_internal('jobs_completed', 'edit');
  return query select result.credits_used, result.credits_remaining;
end;
$$;

create or replace function public.retry_job_internal(
  p_job_id uuid,
  p_error_code text,
  p_delay_seconds integer,
  p_duration_ms integer
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare selected_job public.jobs%rowtype;
begin
  select * into selected_job from public.jobs
  where id = p_job_id and status in ('claimed', 'processing') for update;
  if not found then return 'ignored'; end if;
  if selected_job.attempt_count >= selected_job.max_attempts then
    return 'exhausted';
  end if;
  update public.jobs set status = 'retry_scheduled',
    available_at = now() + make_interval(secs => greatest(1, p_delay_seconds)),
    visibility_expires_at = null, claimed_by = null,
    error_code = left(coalesce(p_error_code, 'transient_error'), 80),
    updated_at = now()
  where id = p_job_id;
  update public.job_attempts set status = 'retry_scheduled',
    error_code = left(coalesce(p_error_code, 'transient_error'), 80),
    duration_ms = p_duration_ms, finished_at = now()
  where job_id = p_job_id and attempt_no = selected_job.attempt_count;
  perform public.increment_operational_metric_internal('jobs_retried', selected_job.job_type);
  return 'scheduled';
end;
$$;

create or replace function public.fail_job_internal(
  p_job_id uuid,
  p_error_code text,
  p_duration_ms integer
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  selected_job public.jobs%rowtype;
  reservation_id uuid;
begin
  select * into selected_job from public.jobs
  where id = p_job_id
    and status in ('queued', 'claimed', 'processing', 'retry_scheduled')
  for update;
  if not found then return false; end if;

  if selected_job.job_type = 'generation' then
    select credit_reservation_id into reservation_id
    from public.generations where id = selected_job.resource_id;
    update public.generations set status = 'failed',
      error_code = left(coalesce(p_error_code, 'job_failed'), 80)
    where id = selected_job.resource_id and status in ('pending', 'processing');
  else
    select credit_reservation_id into reservation_id
    from public.edit_versions where id = selected_job.resource_id;
    update public.edit_versions set status = 'failed',
      error_code = left(coalesce(p_error_code, 'job_failed'), 80)
    where id = selected_job.resource_id and status in ('pending', 'processing');
  end if;

  if reservation_id is not null then
    perform public.release_reserved_credits_internal(
      selected_job.user_id, reservation_id
    );
  end if;
  update public.jobs set status = 'failed', completed_at = now(),
    visibility_expires_at = null, claimed_by = null,
    error_code = left(coalesce(p_error_code, 'job_failed'), 80),
    updated_at = now()
  where id = p_job_id;
  update public.job_attempts set status = 'failed',
    error_code = left(coalesce(p_error_code, 'job_failed'), 80),
    duration_ms = p_duration_ms, finished_at = now()
  where job_id = p_job_id and attempt_no = selected_job.attempt_count
    and status = 'processing';
  perform public.increment_operational_metric_internal('jobs_failed', selected_job.job_type);
  return true;
end;
$$;

create or replace function public.cancel_job_internal(
  p_job_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare selected_job public.jobs%rowtype;
begin
  select * into selected_job from public.jobs
  where id = p_job_id and user_id = p_user_id
    and status in ('queued', 'retry_scheduled')
  for update;
  if not found then return false; end if;
  perform public.fail_job_internal(p_job_id, 'cancelled_by_user', 0);
  update public.jobs set status = 'cancelled', cancelled_at = now(),
    completed_at = now(), error_code = null, updated_at = now()
  where id = p_job_id;
  update public.job_attempts set status = 'cancelled', error_code = null
  where job_id = p_job_id and status in ('processing', 'failed');
  return true;
end;
$$;

create or replace function public.recover_stuck_jobs_internal(p_limit integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  selected_job record;
  recovered_count integer := 0;
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  for selected_job in
    select id, attempt_count, max_attempts
    from public.jobs
    where status in ('claimed', 'processing')
      and visibility_expires_at < now()
    order by visibility_expires_at
    for update skip locked
    limit p_limit
  loop
    if selected_job.attempt_count >= selected_job.max_attempts then
      perform public.fail_job_internal(selected_job.id, 'visibility_timeout', 0);
    else
      perform public.retry_job_internal(selected_job.id, 'visibility_timeout', 5, 0);
    end if;
    recovered_count := recovered_count + 1;
  end loop;
  return recovered_count;
end;
$$;

do $$
declare signature regprocedure;
begin
  foreach signature in array array[
    'public.consume_rate_limit_internal(text,text,integer,integer)'::regprocedure,
    'public.increment_operational_metric_internal(text,text,integer)'::regprocedure,
    'public.assert_operational_budget_internal(numeric,numeric,numeric)'::regprocedure,
    'public.create_generation_job_internal(uuid,uuid,uuid,text,text,text,text,text,text,text,text,text[],uuid[],text,integer,integer,integer,numeric,numeric,numeric)'::regprocedure,
    'public.create_edit_job_internal(uuid,uuid,uuid,uuid,text,text,boolean,text,integer,integer,integer,integer,numeric,numeric,numeric)'::regprocedure,
    'public.publish_job_outbox_internal(integer)'::regprocedure,
    'public.claim_job_internal(uuid,text,integer,integer,integer)'::regprocedure,
    'public.mark_job_processing_internal(uuid,text)'::regprocedure,
    'public.complete_generation_job_internal(uuid,uuid,uuid,uuid,text,text,integer,integer,text,text,integer)'::regprocedure,
    'public.complete_edit_job_internal(uuid,uuid,uuid,uuid,text,text,integer,integer,text,text,integer)'::regprocedure,
    'public.retry_job_internal(uuid,text,integer,integer)'::regprocedure,
    'public.fail_job_internal(uuid,text,integer)'::regprocedure,
    'public.cancel_job_internal(uuid,uuid)'::regprocedure,
    'public.recover_stuck_jobs_internal(integer)'::regprocedure
  ]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', signature);
    execute format('grant execute on function %s to service_role', signature);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
