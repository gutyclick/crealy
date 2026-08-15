-- Profitability must include provider spend from failed jobs while recognizing
-- revenue and charged credits only for successfully completed generations.
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
      g.status,
      g.content_type,
      coalesce(g.variant, g.requested_format) as format,
      g.credit_cost,
      g.created_at,
      g.completed_at,
      g.generation_metadata,
      coalesce(g.generation_metadata->>'planKeyAtCreation', 'free') as plan_key,
      case when g.status = 'completed'
        then coalesce((g.generation_metadata->>'allocatedRevenueUsd')::numeric, 0)
        else 0
      end as recognized_revenue_usd,
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
  ), summary as (
    select jsonb_build_object(
      'createdResults', count(*),
      'completedResults', count(*) filter (where status = 'completed'),
      'failedResults', count(*) filter (where status = 'failed'),
      'ratedResults', count(*) filter (where status = 'completed' and verdict is not null),
      'approvedResults', count(*) filter (where status = 'completed' and verdict = 'useful'),
      'rejectedResults', count(*) filter (where status = 'completed' and verdict = 'not_useful'),
      'approvalRate', coalesce(round(
        count(*) filter (where status = 'completed' and verdict = 'useful')::numeric
        / nullif(count(*) filter (where status = 'completed' and verdict is not null), 0), 4
      ), 0),
      'downloadRate', coalesce(round(
        count(*) filter (where status = 'completed' and first_downloaded_at is not null)::numeric
        / nullif(count(*) filter (where status = 'completed'), 0), 4
      ), 0),
      'correctionRequestRate', coalesce(round(
        count(*) filter (where status = 'completed' and correction_requested)::numeric
        / nullif(count(*) filter (where status = 'completed' and verdict is not null), 0), 4
      ), 0),
      'correctionsRequested', count(*) filter (where status = 'completed' and correction_requested),
      'repeatedAfterFailure', count(*) filter (where repeated_after_failure),
      'providerRetries', coalesce(sum(greatest(coalesce(attempt_count, 1) - 1, 0)), 0),
      'subjectsOmittedOrDuplicated', count(*) filter (where status = 'completed' and (
        reasons @> array['subjects']::text[]
        or (generation_metadata->'criticalErrors') ?| array['missing_subject', 'duplicated_subject']
        or (generation_metadata->'recreateCriticalErrors') ?| array['missing_subject', 'duplicated_subject']
      )),
      'incorrectText', count(*) filter (where status = 'completed' and (
        reasons @> array['text']::text[]
        or (generation_metadata->'criticalErrors') ?| array['incorrect_text', 'cropped_text']
        or (generation_metadata->'recreateCriticalErrors') ?| array['incorrect_text', 'unreadable_text']
      )),
      'abandonedResults', count(*) filter (where status = 'completed' and abandoned),
      'averageHoursToFirstDownload', round(avg(
        extract(epoch from (first_downloaded_at - created_at)) / 3600
      ) filter (where status = 'completed' and first_downloaded_at is not null)::numeric, 3),
      'totalCostUsd', round(sum(total_cost_usd), 6),
      'allocatedRevenueUsd', round(sum(recognized_revenue_usd), 6),
      'grossMarginUsd', round(sum(recognized_revenue_usd - total_cost_usd), 6),
      'creditsCharged', coalesce(sum(credit_cost) filter (where status = 'completed'), 0)
    ) value from scoped
  ), by_format as (
    select coalesce(jsonb_agg(value order by value->>'format'), '[]'::jsonb) value
    from (
      select jsonb_build_object(
        'format', format,
        'createdResults', count(*),
        'completedResults', count(*) filter (where status = 'completed'),
        'failedResults', count(*) filter (where status = 'failed'),
        'approvalRate', coalesce(round(count(*) filter (where status = 'completed' and verdict = 'useful')::numeric / nullif(count(*) filter (where status = 'completed' and verdict is not null), 0), 4), 0),
        'downloadRate', coalesce(round(count(*) filter (where status = 'completed' and first_downloaded_at is not null)::numeric / nullif(count(*) filter (where status = 'completed'), 0), 4), 0),
        'totalCostUsd', round(sum(total_cost_usd), 6),
        'allocatedRevenueUsd', round(sum(recognized_revenue_usd), 6),
        'grossMarginUsd', round(sum(recognized_revenue_usd - total_cost_usd), 6),
        'creditsCharged', coalesce(sum(credit_cost) filter (where status = 'completed'), 0)
      ) value from scoped group by format
    ) rows
  ), by_plan as (
    select coalesce(jsonb_agg(value order by value->>'plan'), '[]'::jsonb) value
    from (
      select jsonb_build_object(
        'plan', plan_key,
        'createdResults', count(*),
        'completedResults', count(*) filter (where status = 'completed'),
        'failedResults', count(*) filter (where status = 'failed'),
        'totalCostUsd', round(sum(total_cost_usd), 6),
        'allocatedRevenueUsd', round(sum(recognized_revenue_usd), 6),
        'grossMarginUsd', round(sum(recognized_revenue_usd - total_cost_usd), 6),
        'costPerCompletedResultUsd', round(sum(total_cost_usd) / nullif(count(*) filter (where status = 'completed'), 0), 6),
        'creditsCharged', coalesce(sum(credit_cost) filter (where status = 'completed'), 0)
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

revoke all on function public.product_analytics_internal(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.product_analytics_internal(timestamptz, timestamptz) to service_role;
