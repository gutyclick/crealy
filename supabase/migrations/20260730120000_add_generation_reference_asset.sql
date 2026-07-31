begin;

alter table public.generations
  add column if not exists reference_asset_id uuid
  references public.assets(id) on delete set null;

create index if not exists generations_reference_asset_idx
  on public.generations (reference_asset_id)
  where reference_asset_id is not null;

commit;
