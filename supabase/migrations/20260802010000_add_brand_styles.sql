create table public.brand_styles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  visual_summary text,
  visual_attributes jsonb,
  consistency_score integer check (consistency_score between 0 and 100),
  warnings jsonb not null default '[]'::jsonb,
  supported_design_types text[] not null default array['thumbnail']::text[],
  analysis_status text not null default 'pending' check (analysis_status in ('pending','analyzing','ready','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_style_references (
  id uuid primary key default gen_random_uuid(),
  style_id uuid not null references public.brand_styles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  file_size bigint not null check (file_size > 0),
  width integer,
  height integer,
  content_hash text not null,
  position integer not null check (position between 1 and 10),
  created_at timestamptz not null default now(),
  unique (style_id, position),
  unique (style_id, content_hash)
);

alter table public.generations
  add column brand_style_id uuid references public.brand_styles(id) on delete set null,
  add column style_consistency text check (style_consistency in ('flexible','balanced','strict'));

create index brand_styles_user_updated_idx on public.brand_styles(user_id, updated_at desc);
create index brand_style_references_style_position_idx on public.brand_style_references(style_id, position);
create index generations_brand_style_idx on public.generations(brand_style_id) where brand_style_id is not null;

alter table public.brand_styles enable row level security;
alter table public.brand_style_references enable row level security;

create policy "brand_styles_owner_select" on public.brand_styles for select using (auth.uid() = user_id);
create policy "brand_styles_owner_insert" on public.brand_styles for insert with check (auth.uid() = user_id);
create policy "brand_styles_owner_update" on public.brand_styles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "brand_styles_owner_delete" on public.brand_styles for delete using (auth.uid() = user_id);
create policy "brand_style_references_owner_select" on public.brand_style_references for select using (auth.uid() = user_id);
create policy "brand_style_references_owner_insert" on public.brand_style_references for insert with check (auth.uid() = user_id);
create policy "brand_style_references_owner_update" on public.brand_style_references for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "brand_style_references_owner_delete" on public.brand_style_references for delete using (auth.uid() = user_id);

create or replace function public.touch_brand_style_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.brand_styles set updated_at = now() where id = coalesce(new.style_id, old.style_id);
  return coalesce(new, old);
end;
$$;

create trigger brand_style_reference_touch after insert or update or delete on public.brand_style_references
for each row execute function public.touch_brand_style_updated_at();
