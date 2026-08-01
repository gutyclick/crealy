-- Keep reference ordering aligned with generation_references_position (1..4).
-- Patch the deployed function definition in place so later product changes to
-- the RPC are preserved instead of being replaced by an older copied body.
do $$
declare
  function_oid oid;
  current_definition text;
  corrected_definition text;
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
  corrected_definition := replace(
    current_definition,
    'reference_position integer := 0;',
    'reference_position integer := 1;'
  );

  if corrected_definition = current_definition then
    if current_definition like '%reference_position integer := 1;%' then
      return;
    end if;
    raise exception 'reference_position_initializer_not_found';
  end if;

  execute corrected_definition;
end;
$$;
