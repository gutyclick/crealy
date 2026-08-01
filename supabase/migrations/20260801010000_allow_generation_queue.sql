-- Let each user prepare several creations while the worker processes them
-- sequentially. Credit reservations remain atomic and bound the real spend.
do $$
declare
  function_oid oid;
  current_definition text;
  corrected_definition text;
  active_guard text := $guard$
  if exists (
    select 1 from public.jobs
    where user_id = p_user_id
      and status in ('queued', 'claimed', 'processing', 'retry_scheduled')
  ) then raise exception 'generation_active'; end if;$guard$;
  queue_guard text := $guard$
  if (
    select count(*) from public.jobs
    where user_id = p_user_id
      and job_type = 'generation'
      and status in ('queued', 'claimed', 'processing', 'retry_scheduled')
  ) >= 4 then raise exception 'generation_queue_limit'; end if;$guard$;
  cooldown_guard text := $guard$
  select created_at into latest_generation_at
  from public.jobs where user_id = p_user_id and job_type = 'generation'
  order by created_at desc limit 1;
  if latest_generation_at is not null
    and latest_generation_at > now() - make_interval(secs => p_cooldown_seconds)
    then raise exception 'generation_cooldown'; end if;$guard$;
begin
  select p.oid
    into function_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'create_generation_job_internal';

  if function_oid is null then
    raise exception 'create_generation_job_internal_not_found';
  end if;

  current_definition := pg_get_functiondef(function_oid);
  corrected_definition := replace(current_definition, active_guard, queue_guard);
  corrected_definition := replace(corrected_definition, cooldown_guard, '');

  if corrected_definition = current_definition then
    raise exception 'generation_queue_guards_not_updated';
  end if;
  if corrected_definition not like '%generation_queue_limit%'
    or corrected_definition like '%generation_active%'
    or corrected_definition like '%generation_cooldown%' then
    raise exception 'generation_queue_definition_invalid';
  end if;

  execute corrected_definition;
end;
$$;
