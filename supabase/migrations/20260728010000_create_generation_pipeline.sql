create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_length
    check (char_length(btrim(title)) between 1 and 60),
  constraint projects_content_type_allowed
    check (
      content_type in (
        'youtube-thumbnail',
        'social-post',
        'banner',
        'social-cover'
      )
    )
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  status text not null default 'pending',
  user_prompt text not null,
  enhanced_prompt text,
  content_type text not null,
  requested_format text not null,
  output_size text,
  style text not null,
  quality text not null,
  primary_text text,
  color_preference text not null,
  custom_colors text[],
  storage_path text,
  mime_type text,
  width integer,
  height integer,
  provider text not null default 'openai',
  model text,
  provider_request_id text,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint generations_status_allowed
    check (status in ('pending', 'processing', 'completed', 'failed')),
  constraint generations_content_type_allowed
    check (
      content_type in (
        'youtube-thumbnail',
        'social-post',
        'banner',
        'social-cover'
      )
    ),
  constraint generations_requested_format_allowed
    check (
      requested_format in (
        'youtube-16-9',
        'social-square',
        'social-portrait',
        'banner-3-1',
        'social-cover-panorama'
      )
    ),
  constraint generations_format_matches_type
    check (
      (content_type = 'youtube-thumbnail' and requested_format = 'youtube-16-9')
      or (
        content_type = 'social-post'
        and requested_format in ('social-square', 'social-portrait')
      )
      or (content_type = 'banner' and requested_format = 'banner-3-1')
      or (
        content_type = 'social-cover'
        and requested_format = 'social-cover-panorama'
      )
    ),
  constraint generations_style_allowed
    check (
      style in (
        'auto',
        'photographic',
        'illustration',
        'minimal',
        'cinematic',
        'advertising'
      )
    ),
  constraint generations_quality_allowed
    check (quality in ('fast', 'high')),
  constraint generations_color_preference_allowed
    check (
      color_preference in ('auto', 'dark', 'vibrant', 'warm', 'cool', 'custom')
    ),
  constraint generations_prompt_length
    check (char_length(btrim(user_prompt)) between 10 and 1500),
  constraint generations_enhanced_prompt_length
    check (
      enhanced_prompt is null
      or char_length(enhanced_prompt) between 10 and 8000
    ),
  constraint generations_primary_text_length
    check (primary_text is null or char_length(primary_text) <= 120),
  constraint generations_custom_colors_count
    check (
      custom_colors is null
      or cardinality(custom_colors) between 1 and 2
    ),
  constraint generations_dimensions_positive
    check (
      (width is null and height is null)
      or (width > 0 and height > 0)
    ),
  constraint generations_storage_path_owned
    check (
      storage_path is null
      or storage_path like user_id::text || '/%'
    ),
  constraint generations_completion_consistency
    check (
      (
        status = 'completed'
        and storage_path is not null
        and mime_type is not null
        and completed_at is not null
        and error_code is null
      )
      or (
        status <> 'completed'
        and storage_path is null
        and completed_at is null
      )
    ),
  constraint generations_failure_consistency
    check (
      (status = 'failed' and error_code is not null)
      or (status <> 'failed' and error_code is null)
    ),
  constraint generations_provider_request_id_length
    check (
      provider_request_id is null
      or char_length(provider_request_id) <= 255
    ),
  unique (user_id, client_request_id)
);

create index if not exists projects_user_created_idx
  on public.projects (user_id, created_at desc);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

create index if not exists generations_project_created_idx
  on public.generations (project_id, created_at desc);

create index if not exists generations_active_user_idx
  on public.generations (user_id, status)
  where status in ('pending', 'processing');

create or replace function public.set_project_updated_at()
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

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_project_updated_at();

alter table public.projects enable row level security;
alter table public.generations enable row level security;

revoke all on table public.projects from public;
revoke all on table public.projects from anon;
revoke all on table public.projects from authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

revoke all on table public.generations from public;
revoke all on table public.generations from anon;
revoke all on table public.generations from authenticated;
grant select, insert, update on table public.generations to authenticated;

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own projects" on public.projects;
create policy "Users can create their own projects"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own generations" on public.generations;
create policy "Users can view their own generations"
  on public.generations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own generations" on public.generations;
create policy "Users can create their own generations"
  on public.generations
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.projects
      where projects.id = generations.project_id
        and projects.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update their own generations" on public.generations;
create policy "Users can update their own generations"
  on public.generations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.projects
      where projects.id = generations.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create or replace function public.reserve_generation(
  p_client_request_id uuid,
  p_project_id uuid,
  p_title text,
  p_user_prompt text,
  p_content_type text,
  p_requested_format text,
  p_style text,
  p_quality text,
  p_primary_text text,
  p_color_preference text,
  p_custom_colors text[],
  p_daily_limit integer,
  p_cooldown_seconds integer
)
returns table (
  reserved_generation_id uuid,
  reserved_project_id uuid,
  generation_status text,
  is_existing boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
  existing_generation public.generations%rowtype;
  selected_project_id uuid;
  latest_generation_at timestamptz;
  daily_count integer;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthorized';
  end if;

  if p_daily_limit < 1 or p_cooldown_seconds < 1 then
    raise exception using errcode = 'P0001', message = 'invalid_limits';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select *
    into existing_generation
  from public.generations
  where user_id = current_user_id
    and client_request_id = p_client_request_id
  limit 1;

  if found then
    return query
      select
        existing_generation.id,
        existing_generation.project_id,
        existing_generation.status,
        true;
    return;
  end if;

  if exists (
    select 1
    from public.generations
    where user_id = current_user_id
      and status in ('pending', 'processing')
  ) then
    raise exception using errcode = 'P0001', message = 'generation_active';
  end if;

  select count(*)
    into daily_count
  from public.generations
  where user_id = current_user_id
    and created_at >= (
      date_trunc('day', timezone('utc', now())) at time zone 'utc'
    );

  if daily_count >= p_daily_limit then
    raise exception using errcode = 'P0001', message = 'generation_limit';
  end if;

  select created_at
    into latest_generation_at
  from public.generations
  where user_id = current_user_id
  order by created_at desc
  limit 1;

  if latest_generation_at is not null
    and latest_generation_at > now() - make_interval(secs => p_cooldown_seconds) then
    raise exception using errcode = 'P0001', message = 'generation_cooldown';
  end if;

  if p_project_id is null then
    insert into public.projects (user_id, title, content_type)
    values (current_user_id, p_title, p_content_type)
    returning id into selected_project_id;
  else
    select id
      into selected_project_id
    from public.projects
    where id = p_project_id
      and user_id = current_user_id
      and content_type = p_content_type;

    if not found then
      raise exception using errcode = 'P0001', message = 'project_not_found';
    end if;
  end if;

  insert into public.generations (
    project_id,
    user_id,
    client_request_id,
    status,
    user_prompt,
    content_type,
    requested_format,
    style,
    quality,
    primary_text,
    color_preference,
    custom_colors
  )
  values (
    selected_project_id,
    current_user_id,
    p_client_request_id,
    'pending',
    p_user_prompt,
    p_content_type,
    p_requested_format,
    p_style,
    p_quality,
    p_primary_text,
    p_color_preference,
    p_custom_colors
  )
  returning id into reserved_generation_id;

  reserved_project_id := selected_project_id;
  generation_status := 'pending';
  is_existing := false;
  return next;
end;
$$;

revoke all on function public.reserve_generation(
  uuid, uuid, text, text, text, text, text, text, text, text, text[], integer, integer
) from public;
revoke all on function public.reserve_generation(
  uuid, uuid, text, text, text, text, text, text, text, text, text[], integer, integer
) from anon;
grant execute on function public.reserve_generation(
  uuid, uuid, text, text, text, text, text, text, text, text, text[], integer, integer
) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generations',
  'generations',
  false,
  20971520,
  array['image/png']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own generated images" on storage.objects;
create policy "Users can read their own generated images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'generations'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload their own generated images" on storage.objects;
create policy "Users can upload their own generated images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'generations'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
