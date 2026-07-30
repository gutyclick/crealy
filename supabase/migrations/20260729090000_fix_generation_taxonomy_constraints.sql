begin;

-- Earlier phases used the *_allowed names. Replace both historical and
-- transitional constraints so there is only one source of truth in PostgreSQL.
alter table public.generations
  drop constraint if exists generations_requested_format_allowed,
  drop constraint if exists generations_requested_format_check,
  drop constraint if exists generations_format_matches_type,
  drop constraint if exists generations_style_allowed,
  drop constraint if exists generations_style_check;

alter table public.generations
  add constraint generations_requested_format_allowed
  check (
    requested_format in (
      'youtube-16-9',
      'youtube-cover',
      'social-square',
      'social-portrait',
      'banner-3-1',
      'facebook-cover',
      'x-cover',
      'linkedin-cover',
      'social-cover-panorama'
    )
  ),
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
        'youtube-cover',
        'facebook-cover',
        'x-cover',
        'linkedin-cover',
        -- Historical rows remain readable during the progressive migration.
        'banner-3-1',
        'social-cover-panorama'
      )
    )
  ),
  add constraint generations_style_allowed
  check (
    style in (
      'automatic',
      'auto',
      'viral',
      'gamer',
      'sports',
      'minimal',
      'professional',
      'podcast',
      'cinematic',
      'corporate',
      'educational',
      'technology',
      'luxury',
      'news',
      'photographic',
      'illustration',
      'advertising'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.generations'::regclass
      and conname = 'generations_requested_format_allowed'
  ) or not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.generations'::regclass
      and conname = 'generations_format_matches_type'
  ) or not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.generations'::regclass
      and conname = 'generations_style_allowed'
  ) then
    raise exception 'generation_taxonomy_constraints_missing';
  end if;
end;
$$;

commit;

