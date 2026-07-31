begin;

alter table public.generations
  add column if not exists variant text,
  add column if not exists platform text,
  add column if not exists requested_width integer,
  add column if not exists requested_height integer,
  add column if not exists credit_cost integer,
  add column if not exists profile_mode text,
  add column if not exists generation_metadata jsonb not null default '{}'::jsonb;

-- Release the previous taxonomy before normalizing existing rows.
alter table public.projects
  drop constraint if exists projects_content_type_allowed;
alter table public.generations
  drop constraint if exists generations_content_type_allowed,
  drop constraint if exists generations_requested_format_allowed,
  drop constraint if exists generations_requested_format_check,
  drop constraint if exists generations_format_matches_type,
  drop constraint if exists generations_quality_allowed,
  drop constraint if exists generations_style_allowed,
  drop constraint if exists generations_style_check,
  drop constraint if exists generations_cover_platform_check;

update public.projects
set content_type = 'thumbnail'
where content_type = 'youtube-thumbnail';

update public.generations
set
  content_type = case
    when content_type = 'youtube-thumbnail' then 'thumbnail'
    else content_type
  end,
  requested_format = case requested_format
    when 'youtube-16-9' then 'thumbnail-high'
    when 'youtube-cover' then 'cover-youtube'
    when 'social-square' then 'post-square'
    when 'social-portrait' then 'post-portrait'
    when 'banner-3-1' then 'banner-standard'
    when 'facebook-cover' then 'cover-facebook'
    when 'x-cover' then 'cover-x'
    when 'linkedin-cover' then 'cover-linkedin'
    when 'social-cover-panorama' then 'cover-facebook'
    else requested_format
  end,
  quality = case when quality = 'fast' then 'standard' else quality end;

update public.generations
set
  variant = coalesce(variant, requested_format),
  platform = coalesce(
    platform,
    cover_platform,
    case
      when content_type = 'thumbnail' then 'youtube'
      when content_type in ('social-post', 'story', 'profile-image') then 'instagram'
      else null
    end
  ),
  credit_cost = coalesce(
    credit_cost,
    case
      when requested_format in ('thumbnail-standard', 'post-square', 'post-portrait', 'banner-small') then 1
      when requested_format in ('thumbnail-high', 'banner-standard', 'cover-facebook', 'cover-x', 'cover-linkedin', 'story-standard', 'profile-master') then 2
      when requested_format in ('banner-large', 'cover-youtube', 'story-high') then 3
      when requested_format = 'banner-2k' then 4
      else 2
    end
  ),
  requested_width = coalesce(requested_width, export_width),
  requested_height = coalesce(requested_height, export_height);

alter table public.projects
  add constraint projects_content_type_allowed
  check (content_type in (
    'thumbnail', 'social-post', 'banner', 'social-cover', 'story', 'profile-image',
    'youtube-thumbnail'
  ));

alter table public.generations
  add constraint generations_content_type_allowed
  check (content_type in (
    'thumbnail', 'social-post', 'banner', 'social-cover', 'story', 'profile-image',
    'youtube-thumbnail'
  )),
  add constraint generations_requested_format_allowed
  check (requested_format in (
    'thumbnail-standard', 'thumbnail-high', 'post-square', 'post-portrait',
    'banner-small', 'banner-standard', 'banner-large', 'banner-2k',
    'cover-youtube', 'cover-facebook', 'cover-x', 'cover-linkedin',
    'story-standard', 'story-high', 'profile-master',
    'youtube-16-9', 'youtube-cover', 'social-square', 'social-portrait',
    'banner-3-1', 'facebook-cover', 'x-cover', 'linkedin-cover',
    'social-cover-panorama'
  )),
  add constraint generations_format_matches_type
  check (
    (content_type in ('thumbnail', 'youtube-thumbnail') and requested_format in ('thumbnail-standard', 'thumbnail-high', 'youtube-16-9'))
    or (content_type = 'social-post' and requested_format in ('post-square', 'post-portrait', 'social-square', 'social-portrait'))
    or (content_type = 'banner' and requested_format in ('banner-small', 'banner-standard', 'banner-large', 'banner-2k', 'banner-3-1'))
    or (content_type = 'social-cover' and requested_format in ('cover-youtube', 'cover-facebook', 'cover-x', 'cover-linkedin', 'youtube-cover', 'facebook-cover', 'x-cover', 'linkedin-cover', 'social-cover-panorama'))
    or (content_type = 'story' and requested_format in ('story-standard', 'story-high'))
    or (content_type = 'profile-image' and requested_format = 'profile-master')
  ),
  add constraint generations_quality_allowed
  check (quality in ('standard', 'high', 'fast')),
  add constraint generations_style_allowed
  check (style in (
    'automatic', 'auto', 'viral', 'gamer', 'sports', 'minimal',
    'professional', 'podcast', 'cinematic', 'corporate', 'educational',
    'technology', 'luxury', 'news', 'promotional', 'fashion', 'food',
    'event', 'photographic', 'illustration', 'advertising'
  )),
  add constraint generations_cover_platform_check
  check (
    (content_type = 'social-cover' and cover_platform in ('youtube', 'facebook', 'x', 'linkedin'))
    or (content_type <> 'social-cover' and cover_platform is null)
  ),
  add constraint generations_platform_allowed
  check (platform is null or platform in ('youtube', 'instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'generic')),
  add constraint generations_credit_cost_positive
  check (credit_cost is null or credit_cost between 1 and 20),
  add constraint generations_profile_mode_allowed
  check (profile_mode is null or profile_mode in ('enhance', 'professional', 'black-and-white', 'creative', 'illustrated', 'studio', 'brand'));

create index if not exists generations_product_variant_idx
  on public.generations (content_type, variant, created_at desc);

commit;
