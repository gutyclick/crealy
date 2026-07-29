begin;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'user_upload', 'generated_original', 'edited_original', 'preview',
    'temporary_processing', 'style_reference'
  )),
  storage_provider text not null check (storage_provider in ('r2', 'supabase')),
  bucket text not null,
  storage_key text not null unique,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  content_sha256 text,
  status text not null default 'active' check (status in (
    'uploading', 'active', 'expired', 'deleting', 'deleted', 'failed'
  )),
  expires_at timestamptz,
  pinned_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_user_created_idx
  on public.assets (user_id, created_at desc);
create index if not exists assets_expiration_idx
  on public.assets (status, expires_at)
  where expires_at is not null and pinned_at is null;
create index if not exists assets_user_status_idx
  on public.assets (user_id, status, kind);

alter table public.assets enable row level security;

drop policy if exists "Users can read own assets" on public.assets;
create policy "Users can read own assets"
  on public.assets for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.assets from authenticated, anon;
grant select on public.assets to authenticated;

alter table public.generations
  add column if not exists cover_platform text,
  add column if not exists asset_id uuid references public.assets(id) on delete set null,
  add column if not exists preview_asset_id uuid references public.assets(id) on delete set null,
  add column if not exists provider_width integer,
  add column if not exists provider_height integer,
  add column if not exists export_width integer,
  add column if not exists export_height integer,
  add column if not exists size_fallback_used boolean not null default false,
  add column if not exists size_fallback_reason text;

alter table public.generations drop constraint if exists generations_cover_platform_check;
alter table public.generations add constraint generations_cover_platform_check
  check (
    (content_type = 'social-cover' and (cover_platform is null or cover_platform in ('youtube', 'facebook', 'x', 'linkedin')))
    or (content_type <> 'social-cover' and cover_platform is null)
  ) not valid;

alter table public.generations drop constraint if exists generations_requested_format_check;
alter table public.generations add constraint generations_requested_format_check
  check (requested_format in (
    'youtube-16-9', 'youtube-cover', 'social-square', 'social-portrait',
    'banner-3-1', 'facebook-cover', 'x-cover', 'linkedin-cover',
    'social-cover-panorama'
  ));

alter table public.generations drop constraint if exists generations_style_check;
alter table public.generations add constraint generations_style_check
  check (style in (
    'automatic', 'auto', 'viral', 'gamer', 'sports', 'minimal',
    'professional', 'podcast', 'cinematic', 'corporate', 'educational',
    'technology', 'luxury', 'news', 'photographic', 'illustration', 'advertising'
  ));

alter table public.edit_versions
  add column if not exists asset_id uuid references public.assets(id) on delete set null,
  add column if not exists preview_asset_id uuid references public.assets(id) on delete set null;

alter table public.user_uploads
  add column if not exists asset_id uuid references public.assets(id) on delete set null;

alter table public.projects
  add column if not exists preview_asset_id uuid references public.assets(id) on delete set null;

create or replace function public.touch_asset_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assets_touch_updated_at on public.assets;
create trigger assets_touch_updated_at
before update on public.assets
for each row execute function public.touch_asset_updated_at();

commit;
