-- Credits are the generation entitlement. Remove the historical per-user
-- daily cap; the cooldown was already removed when durable queueing landed.
-- The two parameters remain temporarily so deployed clients can migrate
-- without introducing an ambiguous PostgREST RPC overload.
do $$
declare
  function_oid oid;
  current_definition text;
  corrected_definition text;
  daily_guard text := $guard$
  select count(*) into daily_count
  from public.jobs
  where user_id = p_user_id and job_type = 'generation'
    and created_at >= date_trunc('day', timezone('utc', now())) at time zone 'utc';
  if daily_count >= p_daily_limit then raise exception 'generation_limit'; end if;$guard$;
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
  corrected_definition := replace(current_definition, daily_guard, '');

  if corrected_definition = current_definition then
    raise exception 'generation_daily_limit_not_removed';
  end if;
  if corrected_definition like '%raise exception ''generation_limit''%' then
    raise exception 'generation_daily_limit_definition_invalid';
  end if;

  execute corrected_definition;
end;
$$;
