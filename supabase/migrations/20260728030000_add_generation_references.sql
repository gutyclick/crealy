create table if not exists public.generation_references (
  generation_id uuid not null references public.generations(id) on delete cascade,
  upload_id uuid not null references public.user_uploads(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null,
  created_at timestamptz not null default now(),
  primary key (generation_id, upload_id),
  unique (generation_id, position),
  constraint generation_references_position
    check (position between 1 and 4)
);

create index if not exists generation_references_user_idx
  on public.generation_references (user_id, created_at desc);

alter table public.generation_references enable row level security;

revoke all on table public.generation_references from public, anon, authenticated;
grant select on table public.generation_references to authenticated;

create policy "Users view their own generation references"
  on public.generation_references for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.attach_generation_references(
  p_generation_id uuid,
  p_upload_ids uuid[]
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  distinct_count integer;
  owned_count integer;
begin
  if current_user_id is null then raise exception 'unauthorized'; end if;
  if p_upload_ids is null or cardinality(p_upload_ids) = 0 then return; end if;
  if cardinality(p_upload_ids) > 4 then raise exception 'too_many_references'; end if;

  select count(distinct item) into distinct_count
  from unnest(p_upload_ids) as refs(item);
  if distinct_count <> cardinality(p_upload_ids) then
    raise exception 'duplicate_references';
  end if;

  if not exists (
    select 1 from public.generations
    where id = p_generation_id
      and user_id = current_user_id
      and status = 'pending'
  ) then raise exception 'generation_not_found'; end if;

  select count(*) into owned_count
  from public.user_uploads
  where id = any(p_upload_ids) and user_id = current_user_id;
  if owned_count <> cardinality(p_upload_ids) then
    raise exception 'reference_not_found';
  end if;

  insert into public.generation_references (
    generation_id, upload_id, user_id, position
  )
  select p_generation_id, item, current_user_id, ordinality::smallint
  from unnest(p_upload_ids) with ordinality as refs(item, ordinality);
end;
$$;

revoke all on function public.attach_generation_references(uuid,uuid[])
  from public, anon;
grant execute on function public.attach_generation_references(uuid,uuid[])
  to authenticated;
