-- Record cancellations as an operational metric.
-- The function was introduced in 20260729030000 and is replaced additively.

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
  perform public.increment_operational_metric_internal(
    'jobs_cancelled', selected_job.job_type
  );
  return true;
end;
$$;

revoke all on function public.cancel_job_internal(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_job_internal(uuid, uuid)
  to service_role;

notify pgrst, 'reload schema';
