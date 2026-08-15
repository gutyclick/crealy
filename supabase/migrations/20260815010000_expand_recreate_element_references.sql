-- Recreate accepts one composition reference plus up to four user elements.
alter table public.generation_references
  drop constraint if exists generation_references_position;

alter table public.generation_references
  add constraint generation_references_position
  check (position between 1 and 5);

do $$
declare
  function_oid oid;
  current_definition text;
  expanded_definition text;
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
  expanded_definition := replace(
    current_definition,
    'array_length(p_reference_upload_ids, 1), 0) > 4',
    'array_length(p_reference_upload_ids, 1), 0) > 5'
  );

  if expanded_definition = current_definition then
    if current_definition like '%array_length(p_reference_upload_ids, 1), 0) > 5%' then
      return;
    end if;
    raise exception 'generation_reference_limit_not_found';
  end if;

  execute expanded_definition;
end;
$$;

do $$
declare
  function_oid oid;
  current_definition text;
  expanded_definition text;
begin
  select p.oid
    into function_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'attach_generation_references';

  if function_oid is null then
    return;
  end if;

  current_definition := pg_get_functiondef(function_oid);
  expanded_definition := replace(
    current_definition,
    'cardinality(p_upload_ids) > 4',
    'cardinality(p_upload_ids) > 5'
  );

  if expanded_definition <> current_definition then
    execute expanded_definition;
  end if;
end;
$$;
