-- A consumer may only claim jobs after the request has finished resource metadata.
create or replace function public.mark_job_ready_internal(
  p_job_id uuid,
  p_user_id uuid,
  p_max_attempts integer
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare updated_count integer;
begin
  if p_job_id is null or p_user_id is null or p_max_attempts < 1 or p_max_attempts > 10 then
    raise exception 'invalid_job_ready_request';
  end if;
  update public.jobs
  set payload = payload || jsonb_build_object('ready', true),
      max_attempts = p_max_attempts,
      available_at = now(),
      updated_at = now()
  where id = p_job_id and user_id = p_user_id and status = 'queued';
  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.mark_job_ready_internal(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.mark_job_ready_internal(uuid, uuid, integer) to service_role;

-- Jobs created before this gate are already fully prepared or recoverable.
update public.jobs
set payload = payload || jsonb_build_object('ready', true)
where status in ('queued', 'retry_scheduled') and not (payload ? 'ready');

notify pgrst, 'reload schema';
