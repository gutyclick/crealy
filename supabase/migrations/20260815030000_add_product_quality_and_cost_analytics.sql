-- Product-quality signals and immutable provider-cost ledger.
-- Additive: existing jobs, generations, credits and migrations remain authoritative.

create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'created', 'started', 'completed', 'failed', 'retry_scheduled',
    'repeated_after_failure', 'evaluation_completed', 'evaluation_failed',
    'automatic_correction_requested', 'automatic_correction_completed',
    'automatic_correction_failed', 'downloaded', 'approved', 'rejected',
    'correction_requested', 'abandoned'
  )),
  idempotency_key text not null check (char_length(idempotency_key) between 2 and 160),
  properties jsonb not null default '{}'::jsonb,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  occurred_at timestamptz not null default now(),
  unique (generation_id, idempotency_key)
);

create index if not exists generation_events_type_time_idx
  on public.generation_events (event_type, occurred_at desc);
create index if not exists generation_events_generation_time_idx
  on public.generation_events (generation_id, occurred_at);
create index if not exists generation_events_properties_idx
  on public.generation_events using gin (properties);

create table if not exists public.provider_cost_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_no integer not null check (attempt_no > 0),
  idempotency_key text not null check (char_length(idempotency_key) between 2 and 160),
  operation text not null check (char_length(operation) between 2 and 80),
  provider text not null,
  model text not null,
  provider_request_id text,
  input_text_tokens integer not null default 0 check (input_text_tokens >= 0),
  input_image_tokens integer not null default 0 check (input_image_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_text_tokens integer not null default 0 check (output_text_tokens >= 0),
  output_image_tokens integer not null default 0 check (output_image_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  actual_cost_usd numeric(14, 9) check (actual_cost_usd is null or actual_cost_usd >= 0),
  estimated_cost_usd numeric(14, 9) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  cost_source text not null check (cost_source in (
    'calculated_from_usage', 'usage_without_pricing', 'estimated'
  )),
  pricing_version text not null,
  duration_ms integer not null check (duration_ms >= 0),
  succeeded boolean not null,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_id, idempotency_key)
);

create index if not exists provider_cost_events_job_idx
  on public.provider_cost_events (job_id, created_at);
create index if not exists provider_cost_events_generation_idx
  on public.provider_cost_events (generation_id, created_at);
create index if not exists provider_cost_events_profit_idx
  on public.provider_cost_events (created_at, operation, model);

create table if not exists public.billing_revenue_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_invoice_id text not null unique,
  plan_key text not null check (plan_key in ('starter', 'pro', 'business')),
  currency text not null check (char_length(currency) = 3),
  gross_amount_minor bigint not null check (gross_amount_minor >= 0),
  credits_granted integer not null check (credits_granted > 0),
  gross_revenue_per_credit_usd numeric(14, 9),
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists billing_revenue_user_paid_idx
  on public.billing_revenue_events (user_id, paid_at desc);

alter table public.generation_events enable row level security;
alter table public.provider_cost_events enable row level security;
alter table public.billing_revenue_events enable row level security;

revoke all on table public.generation_events from public, anon, authenticated;
revoke all on table public.provider_cost_events from public, anon, authenticated;
revoke all on table public.billing_revenue_events from public, anon, authenticated;

create or replace function public.record_generation_event_internal(
  p_generation_id uuid,
  p_user_id uuid,
  p_job_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_properties jsonb default '{}'::jsonb,
  p_duration_ms integer default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.generations
    where id = p_generation_id and user_id = p_user_id
  ) then raise exception 'generation_not_found'; end if;
  if p_job_id is not null and not exists (
    select 1 from public.jobs
    where id = p_job_id and user_id = p_user_id and resource_id = p_generation_id
  ) then raise exception 'job_mismatch'; end if;

  insert into public.generation_events (
    generation_id, job_id, user_id, event_type, idempotency_key,
    properties, duration_ms
  ) values (
    p_generation_id, p_job_id, p_user_id, p_event_type, p_idempotency_key,
    coalesce(p_properties, '{}'::jsonb), p_duration_ms
  ) on conflict (generation_id, idempotency_key) do nothing;
end;
$$;

create or replace function public.record_provider_cost_internal(
  p_job_id uuid,
  p_generation_id uuid,
  p_user_id uuid,
  p_attempt_no integer,
  p_idempotency_key text,
  p_operation text,
  p_provider text,
  p_model text,
  p_provider_request_id text,
  p_input_text_tokens integer,
  p_input_image_tokens integer,
  p_cached_input_tokens integer,
  p_output_text_tokens integer,
  p_output_image_tokens integer,
  p_total_tokens integer,
  p_actual_cost_usd numeric,
  p_estimated_cost_usd numeric,
  p_cost_source text,
  p_pricing_version text,
  p_duration_ms integer,
  p_succeeded boolean,
  p_error_code text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.jobs
    where id = p_job_id and user_id = p_user_id and resource_id = p_generation_id
  ) then raise exception 'job_mismatch'; end if;

  insert into public.provider_cost_events (
    job_id, generation_id, user_id, attempt_no, idempotency_key, operation,
    provider, model, provider_request_id, input_text_tokens, input_image_tokens,
    cached_input_tokens, output_text_tokens, output_image_tokens, total_tokens,
    actual_cost_usd, estimated_cost_usd, cost_source, pricing_version,
    duration_ms, succeeded, error_code, metadata
  ) values (
    p_job_id, p_generation_id, p_user_id, p_attempt_no, p_idempotency_key,
    p_operation, p_provider, p_model, p_provider_request_id,
    p_input_text_tokens, p_input_image_tokens, p_cached_input_tokens,
    p_output_text_tokens, p_output_image_tokens, p_total_tokens,
    p_actual_cost_usd, p_estimated_cost_usd, p_cost_source, p_pricing_version,
    p_duration_ms, p_succeeded, p_error_code, coalesce(p_metadata, '{}'::jsonb)
  ) on conflict (job_id, idempotency_key) do nothing;
end;
$$;

create or replace function public.record_generation_abandonments_internal(
  p_after_hours integer default 72,
  p_limit integer default 500
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare inserted_count integer;
begin
  if p_after_hours < 24 or p_after_hours > 720 or p_limit < 1 or p_limit > 5000 then
    raise exception 'invalid_abandonment_window';
  end if;
  with candidates as (
    select g.id, g.user_id, j.id as job_id
    from public.generations g
    left join public.jobs j
      on j.job_type = 'generation' and j.resource_id = g.id
    where g.status = 'completed'
      and g.completed_at < now() - make_interval(hours => p_after_hours)
      and not exists (
        select 1 from public.generation_events e
        where e.generation_id = g.id
          and e.event_type in ('downloaded', 'approved', 'rejected', 'abandoned')
      )
      and not exists (
        select 1 from public.generation_feedback f where f.generation_id = g.id
      )
    order by g.completed_at
    limit p_limit
  )
  insert into public.generation_events (
    generation_id, job_id, user_id, event_type, idempotency_key, properties
  )
  select id, job_id, user_id, 'abandoned', 'abandoned:' || p_after_hours,
    jsonb_build_object('afterHours', p_after_hours)
  from candidates
  on conflict (generation_id, idempotency_key) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.product_analytics_internal(
  p_from timestamptz default now() - interval '30 days',
  p_to timestamptz default now()
)
returns jsonb
language sql security definer set search_path = ''
as $$
  with scoped as (
    select
      g.id,
      g.content_type,
      coalesce(g.variant, g.requested_format) as format,
      g.credit_cost,
      g.created_at,
      g.completed_at,
      g.generation_metadata,
      coalesce(g.generation_metadata->>'planKeyAtCreation', 'free') as plan_key,
      coalesce((g.generation_metadata->>'allocatedRevenueUsd')::numeric, 0) as allocated_revenue_usd,
      f.verdict,
      f.reasons,
      f.correction_requested,
      j.attempt_count,
      (
        select min(e.occurred_at) from public.generation_events e
        where e.generation_id = g.id and e.event_type = 'downloaded'
      ) as first_downloaded_at,
      exists (
        select 1 from public.generation_events e
        where e.generation_id = g.id and e.event_type = 'abandoned'
      ) as abandoned,
      exists (
        select 1 from public.generation_events e
        where e.generation_id = g.id and e.event_type = 'repeated_after_failure'
      ) as repeated_after_failure,
      coalesce((
        select sum(coalesce(c.actual_cost_usd, c.estimated_cost_usd, 0))
        from public.provider_cost_events c where c.generation_id = g.id
      ), 0) as total_cost_usd
    from public.generations g
    left join public.generation_feedback f on f.generation_id = g.id
    left join public.jobs j on j.job_type = 'generation' and j.resource_id = g.id
    where g.created_at >= p_from and g.created_at < p_to
      and g.status = 'completed'
  ), summary as (
    select jsonb_build_object(
      'completedResults', count(*),
      'ratedResults', count(*) filter (where verdict is not null),
      'approvalRate', coalesce(round(
        count(*) filter (where verdict = 'useful')::numeric
        / nullif(count(*) filter (where verdict is not null), 0), 4
      ), 0),
      'downloadRate', coalesce(round(
        count(*) filter (where first_downloaded_at is not null)::numeric
        / nullif(count(*), 0), 4
      ), 0),
      'correctionRequestRate', coalesce(round(
        count(*) filter (where correction_requested)::numeric
        / nullif(count(*) filter (where verdict is not null), 0), 4
      ), 0),
      'correctionsRequested', count(*) filter (where correction_requested),
      'repeatedAfterFailure', count(*) filter (where repeated_after_failure),
      'providerRetries', coalesce(sum(greatest(coalesce(attempt_count, 1) - 1, 0)), 0),
      'subjectsOmittedOrDuplicated', count(*) filter (where
        reasons @> array['subjects']::text[]
        or (generation_metadata->'criticalErrors') ?| array['missing_subject', 'duplicated_subject']
        or (generation_metadata->'recreateCriticalErrors') ?| array['missing_subject', 'duplicated_subject']
      ),
      'incorrectText', count(*) filter (where
        reasons @> array['text']::text[]
        or (generation_metadata->'criticalErrors') ?| array['incorrect_text', 'cropped_text']
        or (generation_metadata->'recreateCriticalErrors') ?| array['incorrect_text', 'unreadable_text']
      ),
      'abandonedResults', count(*) filter (where abandoned),
      'averageHoursToFirstDownload', round(avg(
        extract(epoch from (first_downloaded_at - created_at)) / 3600
      ) filter (where first_downloaded_at is not null)::numeric, 3),
      'totalCostUsd', round(sum(total_cost_usd), 6),
      'allocatedRevenueUsd', round(sum(allocated_revenue_usd), 6),
      'grossMarginUsd', round(sum(allocated_revenue_usd - total_cost_usd), 6),
      'creditsCharged', coalesce(sum(credit_cost), 0)
    ) value from scoped
  ), by_format as (
    select coalesce(jsonb_agg(value order by value->>'format'), '[]'::jsonb) value
    from (
      select jsonb_build_object(
        'format', format,
        'completedResults', count(*),
        'approvalRate', coalesce(round(count(*) filter (where verdict = 'useful')::numeric / nullif(count(*) filter (where verdict is not null), 0), 4), 0),
        'downloadRate', coalesce(round(count(*) filter (where first_downloaded_at is not null)::numeric / nullif(count(*), 0), 4), 0),
        'totalCostUsd', round(sum(total_cost_usd), 6),
        'allocatedRevenueUsd', round(sum(allocated_revenue_usd), 6),
        'grossMarginUsd', round(sum(allocated_revenue_usd - total_cost_usd), 6),
        'creditsCharged', coalesce(sum(credit_cost), 0)
      ) value from scoped group by format
    ) rows
  ), by_plan as (
    select coalesce(jsonb_agg(value order by value->>'plan'), '[]'::jsonb) value
    from (
      select jsonb_build_object(
        'plan', plan_key,
        'completedResults', count(*),
        'totalCostUsd', round(sum(total_cost_usd), 6),
        'allocatedRevenueUsd', round(sum(allocated_revenue_usd), 6),
        'grossMarginUsd', round(sum(allocated_revenue_usd - total_cost_usd), 6),
        'costPerResultUsd', round(avg(total_cost_usd), 6),
        'creditsCharged', coalesce(sum(credit_cost), 0)
      ) value from scoped group by plan_key
    ) rows
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'summary', summary.value,
    'byFormat', by_format.value,
    'byPlan', by_plan.value
  ) from summary, by_format, by_plan;
$$;

revoke all on function public.record_generation_event_internal(uuid, uuid, uuid, text, text, jsonb, integer) from public, anon, authenticated;
revoke all on function public.record_provider_cost_internal(uuid, uuid, uuid, integer, text, text, text, text, text, integer, integer, integer, integer, integer, integer, numeric, numeric, text, text, integer, boolean, text, jsonb) from public, anon, authenticated;
revoke all on function public.record_generation_abandonments_internal(integer, integer) from public, anon, authenticated;
revoke all on function public.product_analytics_internal(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.record_generation_event_internal(uuid, uuid, uuid, text, text, jsonb, integer) to service_role;
grant execute on function public.record_provider_cost_internal(uuid, uuid, uuid, integer, text, text, text, text, text, integer, integer, integer, integer, integer, integer, numeric, numeric, text, text, integer, boolean, text, jsonb) to service_role;
grant execute on function public.record_generation_abandonments_internal(integer, integer) to service_role;
grant execute on function public.product_analytics_internal(timestamptz, timestamptz) to service_role;

-- Historical baseline: preserves the old estimate until per-call token usage arrives.
insert into public.provider_cost_events (
  job_id, generation_id, user_id, attempt_no, idempotency_key, operation,
  provider, model, provider_request_id, estimated_cost_usd, cost_source,
  pricing_version, duration_ms, succeeded
)
select
  j.id, g.id, j.user_id, greatest(j.attempt_count, 1), 'legacy:aggregate',
  'legacy_generation_aggregate', coalesce(g.provider, 'openai'),
  coalesce(g.model, u.model), coalesce(g.provider_request_id, u.provider_request_id),
  coalesce(u.estimated_cost_usd, j.estimated_cost_usd), 'estimated',
  'legacy', coalesce(a.duration_ms, 0), j.status = 'completed'
from public.jobs j
join public.generations g on g.id = j.resource_id
left join public.provider_usage u on u.job_id = j.id
left join lateral (
  select duration_ms from public.job_attempts
  where job_id = j.id order by attempt_no desc limit 1
) a on true
where j.job_type = 'generation'
  and j.status in ('completed', 'failed')
  and coalesce(u.model, g.model) is not null
on conflict (job_id, idempotency_key) do nothing;

notify pgrst, 'reload schema';
