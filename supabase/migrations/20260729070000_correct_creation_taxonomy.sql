-- Preserve historical categories/styles while accepting the corrected product taxonomy.

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
        'banner-3-1',
        'facebook-cover',
        'x-cover',
        'linkedin-cover',
        'social-cover-panorama'
      )
    )
  );

alter table public.generations
  drop constraint if exists generations_style_allowed;
alter table public.generations
  add constraint generations_style_allowed
  check (
    style in (
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
