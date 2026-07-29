-- Fase 7.5 is additive: it preserves every historical generation and upload.

alter table public.generations
  drop constraint if exists generations_requested_format_allowed;
alter table public.generations
  add constraint generations_requested_format_allowed
  check (
    requested_format in (
      'youtube-16-9',
      'social-square',
      'social-portrait',
      'banner-3-1',
      'facebook-cover',
      'x-cover',
      'linkedin-cover',
      'social-cover-panorama'
    )
  );

alter table public.generations
  drop constraint if exists generations_format_matches_type;
alter table public.generations
  add constraint generations_format_matches_type
  check (
    (content_type = 'youtube-thumbnail' and requested_format = 'youtube-16-9')
    or (
      content_type = 'social-post'
      and requested_format in ('social-square', 'social-portrait')
    )
    or (content_type = 'banner' and requested_format = 'banner-3-1')
    or (
      content_type = 'social-cover'
      and requested_format in (
        'facebook-cover',
        'x-cover',
        'linkedin-cover',
        'social-cover-panorama'
      )
    )
  );

alter table public.generations
  drop constraint if exists generations_custom_colors_count;
alter table public.generations
  add constraint generations_custom_colors_count
  check (
    custom_colors is null
    or cardinality(custom_colors) between 1 and 5
  );

alter table public.user_uploads
  add column if not exists purpose text not null default 'reference',
  add column if not exists expires_at timestamptz;

alter table public.user_uploads
  drop constraint if exists user_uploads_purpose_allowed;
alter table public.user_uploads
  add constraint user_uploads_purpose_allowed
  check (purpose in ('reference', 'edit'));

update public.user_uploads
set expires_at = created_at + interval '30 days'
where purpose = 'reference' and expires_at is null;

create index if not exists user_uploads_expiry_idx
  on public.user_uploads (expires_at)
  where expires_at is not null;

create or replace function public.list_expired_uploads_internal(p_limit integer default 100)
returns table (upload_id uuid, storage_path text)
language sql
security definer
set search_path = ''
as $$
  select u.id, u.storage_path
  from public.user_uploads u
  where u.expires_at is not null
    and u.expires_at <= now()
    and not exists (
      select 1
      from public.edit_sessions s
      where s.source_upload_id = u.id
    )
    and not exists (
      select 1
      from public.generation_references r
      join public.generations g on g.id = r.generation_id
      where r.upload_id = u.id
        and g.status in ('pending', 'processing')
    )
  order by u.expires_at
  limit greatest(1, least(p_limit, 500));
$$;

revoke all on function public.list_expired_uploads_internal(integer)
  from public, anon, authenticated;
grant execute on function public.list_expired_uploads_internal(integer)
  to service_role;
