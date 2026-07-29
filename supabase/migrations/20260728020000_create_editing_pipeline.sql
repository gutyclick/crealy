create table if not exists public.user_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size integer not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now(),
  constraint user_uploads_filename_length
    check (char_length(btrim(original_filename)) between 1 and 180),
  constraint user_uploads_mime_allowed
    check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  constraint user_uploads_file_size
    check (file_size between 1 and 20971520),
  constraint user_uploads_dimensions_positive
    check (width > 0 and height > 0),
  constraint user_uploads_path_owned
    check (storage_path like user_id::text || '/%')
);

create table if not exists public.edit_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  source_generation_id uuid references public.generations(id) on delete restrict,
  source_upload_id uuid references public.user_uploads(id) on delete restrict,
  title text not null,
  status text not null default 'active',
  current_version_id uuid,
  previous_response_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint edit_sessions_title_length
    check (char_length(btrim(title)) between 1 and 80),
  constraint edit_sessions_status_allowed
    check (status in ('active', 'archived', 'failed')),
  constraint edit_sessions_single_source
    check (num_nonnulls(source_generation_id, source_upload_id) = 1),
  constraint edit_sessions_response_id_length
    check (previous_response_id is null or char_length(previous_response_id) <= 255)
);

create table if not exists public.edit_versions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.edit_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid,
  parent_version_id uuid references public.edit_versions(id) on delete restrict,
  source_generation_id uuid references public.generations(id) on delete restrict,
  source_upload_id uuid references public.user_uploads(id) on delete restrict,
  status text not null default 'pending',
  storage_path text,
  mime_type text,
  width integer,
  height integer,
  instruction text,
  enhanced_instruction text,
  preserve_composition boolean not null default true,
  model text,
  provider_response_id text,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint edit_versions_status_allowed
    check (status in ('pending', 'processing', 'completed', 'failed')),
  constraint edit_versions_instruction_length
    check (instruction is null or char_length(btrim(instruction)) between 10 and 1000),
  constraint edit_versions_enhanced_length
    check (
      enhanced_instruction is null
      or char_length(enhanced_instruction) between 10 and 5000
    ),
  constraint edit_versions_source_shape
    check (
      (
        parent_version_id is null
        and num_nonnulls(source_generation_id, source_upload_id) = 1
        and instruction is null
        and client_request_id is null
      )
      or (
        parent_version_id is not null
        and source_generation_id is null
        and source_upload_id is null
        and instruction is not null
        and client_request_id is not null
      )
    ),
  constraint edit_versions_dimensions_positive
    check (
      (width is null and height is null)
      or (width > 0 and height > 0)
    ),
  constraint edit_versions_path_owned
    check (storage_path is null or storage_path like user_id::text || '/%'),
  constraint edit_versions_completion_consistency
    check (
      (
        status = 'completed'
        and (
          storage_path is not null
          or num_nonnulls(source_generation_id, source_upload_id) = 1
        )
        and mime_type is not null
        and width is not null
        and height is not null
        and completed_at is not null
        and error_code is null
      )
      or (
        status <> 'completed'
        and storage_path is null
        and completed_at is null
      )
    ),
  constraint edit_versions_failure_consistency
    check (
      (status = 'failed' and error_code is not null)
      or (status <> 'failed' and error_code is null)
    ),
  unique (session_id, client_request_id)
);

alter table public.edit_sessions
  drop constraint if exists edit_sessions_current_version_id_fkey;
alter table public.edit_sessions
  add constraint edit_sessions_current_version_id_fkey
  foreign key (current_version_id)
  references public.edit_versions(id)
  on delete restrict
  deferrable initially deferred;

create table if not exists public.edit_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.edit_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_id uuid references public.edit_versions(id) on delete set null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint edit_messages_role_allowed
    check (role in ('user', 'assistant', 'system')),
  constraint edit_messages_content_length
    check (char_length(btrim(content)) between 1 and 1200)
);

create index if not exists user_uploads_user_created_idx
  on public.user_uploads (user_id, created_at desc);
create index if not exists edit_sessions_user_updated_idx
  on public.edit_sessions (user_id, updated_at desc);
create index if not exists edit_versions_session_created_idx
  on public.edit_versions (session_id, created_at asc);
create index if not exists edit_versions_active_user_idx
  on public.edit_versions (user_id, status)
  where status in ('pending', 'processing');
create index if not exists edit_messages_session_created_idx
  on public.edit_messages (session_id, created_at asc);

create or replace function public.set_edit_session_updated_at()
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

drop trigger if exists set_edit_sessions_updated_at on public.edit_sessions;
create trigger set_edit_sessions_updated_at
  before update on public.edit_sessions
  for each row execute function public.set_edit_session_updated_at();

alter table public.user_uploads enable row level security;
alter table public.edit_sessions enable row level security;
alter table public.edit_versions enable row level security;
alter table public.edit_messages enable row level security;

revoke all on table public.user_uploads from public, anon, authenticated;
revoke all on table public.edit_sessions from public, anon, authenticated;
revoke all on table public.edit_versions from public, anon, authenticated;
revoke all on table public.edit_messages from public, anon, authenticated;
grant select, insert, delete on table public.user_uploads to authenticated;
grant select on table public.edit_sessions to authenticated;
grant select on table public.edit_versions to authenticated;
grant select on table public.edit_messages to authenticated;

create policy "Users manage their own uploads"
  on public.user_uploads for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users view their own edit sessions"
  on public.edit_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create their own edit sessions"
  on public.edit_sessions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = (select auth.uid())
      )
    )
    and (
      source_generation_id is null
      or exists (
        select 1 from public.generations g
        where g.id = source_generation_id and g.user_id = (select auth.uid())
      )
    )
    and (
      source_upload_id is null
      or exists (
        select 1 from public.user_uploads u
        where u.id = source_upload_id and u.user_id = (select auth.uid())
      )
    )
  );
create policy "Users update their own edit sessions"
  on public.edit_sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = (select auth.uid())
      )
    )
    and (
      source_generation_id is null
      or exists (
        select 1 from public.generations g
        where g.id = source_generation_id and g.user_id = (select auth.uid())
      )
    )
    and (
      source_upload_id is null
      or exists (
        select 1 from public.user_uploads u
        where u.id = source_upload_id and u.user_id = (select auth.uid())
      )
    )
    and (
      current_version_id is null
      or exists (
        select 1 from public.edit_versions v
        where v.id = current_version_id
          and v.session_id = edit_sessions.id
          and v.user_id = (select auth.uid())
      )
    )
  );

create policy "Users view their own edit versions"
  on public.edit_versions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create versions in their sessions"
  on public.edit_versions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.edit_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
    and (
      source_generation_id is null
      or exists (
        select 1 from public.generations g
        where g.id = source_generation_id and g.user_id = (select auth.uid())
      )
    )
    and (
      source_upload_id is null
      or exists (
        select 1 from public.user_uploads u
        where u.id = source_upload_id and u.user_id = (select auth.uid())
      )
    )
    and (
      parent_version_id is null
      or exists (
        select 1 from public.edit_versions parent
        where parent.id = parent_version_id
          and parent.session_id = edit_versions.session_id
          and parent.user_id = (select auth.uid())
      )
    )
  );
create policy "Users update versions in their sessions"
  on public.edit_versions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.edit_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
    and (
      parent_version_id is null
      or exists (
        select 1 from public.edit_versions parent
        where parent.id = parent_version_id
          and parent.session_id = edit_versions.session_id
          and parent.user_id = (select auth.uid())
      )
    )
    and (
      source_generation_id is null
      or exists (
        select 1 from public.generations g
        where g.id = source_generation_id and g.user_id = (select auth.uid())
      )
    )
    and (
      source_upload_id is null
      or exists (
        select 1 from public.user_uploads u
        where u.id = source_upload_id and u.user_id = (select auth.uid())
      )
    )
  );

create policy "Users view their own edit messages"
  on public.edit_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create messages in their sessions"
  on public.edit_messages for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.edit_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
    and (
      version_id is null
      or exists (
        select 1 from public.edit_versions v
        where v.id = version_id
          and v.session_id = edit_messages.session_id
          and v.user_id = (select auth.uid())
      )
    )
  );

create or replace function public.create_edit_session_from_generation(
  p_generation_id uuid
)
returns table (created_session_id uuid, created_version_id uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_generation public.generations%rowtype;
  selected_title text;
begin
  if current_user_id is null then raise exception 'unauthorized'; end if;

  select g, p.title into selected_generation, selected_title
  from public.generations g
  join public.projects p on p.id = g.project_id
  where g.id = p_generation_id
    and g.user_id = current_user_id
    and g.status = 'completed'
    and g.storage_path is not null
    and g.mime_type is not null
    and g.width is not null
    and g.height is not null;
  if not found then raise exception 'generation_not_found'; end if;

  insert into public.edit_sessions (
    user_id, project_id, source_generation_id, title
  ) values (
    current_user_id, selected_generation.project_id,
    selected_generation.id, selected_title
  ) returning id into created_session_id;

  insert into public.edit_versions (
    session_id, user_id, source_generation_id, status,
    mime_type, width, height, completed_at
  ) values (
    created_session_id, current_user_id, selected_generation.id, 'completed',
    selected_generation.mime_type, selected_generation.width,
    selected_generation.height, selected_generation.completed_at
  ) returning id into created_version_id;

  update public.edit_sessions
  set current_version_id = created_version_id
  where id = created_session_id;

  insert into public.edit_messages (session_id, user_id, version_id, role, content)
  values (
    created_session_id, current_user_id, created_version_id, 'assistant',
    'Imagen lista. Cuéntame qué quieres cambiar y crearé una nueva versión.'
  );
  return next;
end;
$$;

create or replace function public.create_edit_session_from_upload(
  p_upload_id uuid,
  p_title text
)
returns table (created_session_id uuid, created_version_id uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_upload public.user_uploads%rowtype;
begin
  if current_user_id is null then raise exception 'unauthorized'; end if;
  select * into selected_upload from public.user_uploads
  where id = p_upload_id and user_id = current_user_id;
  if not found then raise exception 'upload_not_found'; end if;

  insert into public.edit_sessions (user_id, source_upload_id, title)
  values (
    current_user_id, selected_upload.id,
    left(coalesce(nullif(btrim(p_title), ''), 'Nueva edición'), 80)
  ) returning id into created_session_id;

  insert into public.edit_versions (
    session_id, user_id, source_upload_id, status,
    mime_type, width, height, completed_at
  ) values (
    created_session_id, current_user_id, selected_upload.id, 'completed',
    selected_upload.mime_type, selected_upload.width,
    selected_upload.height, now()
  ) returning id into created_version_id;

  update public.edit_sessions set current_version_id = created_version_id
  where id = created_session_id;
  insert into public.edit_messages (session_id, user_id, version_id, role, content)
  values (
    created_session_id, current_user_id, created_version_id, 'assistant',
    'Imagen cargada. Describe el primer cambio que quieres probar.'
  );
  return next;
end;
$$;

create or replace function public.reserve_edit_version(
  p_session_id uuid,
  p_client_request_id uuid,
  p_base_version_id uuid,
  p_instruction text,
  p_enhanced_instruction text,
  p_preserve_composition boolean,
  p_daily_limit integer,
  p_cooldown_seconds integer,
  p_version_limit integer
)
returns table (
  reserved_version_id uuid,
  selected_base_version_id uuid,
  version_status text,
  is_existing boolean
)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_session public.edit_sessions%rowtype;
  existing_version public.edit_versions%rowtype;
  base_version_id uuid;
  daily_count integer;
  session_count integer;
  latest_edit_at timestamptz;
begin
  if current_user_id is null then raise exception 'unauthorized'; end if;
  if p_daily_limit < 1 or p_cooldown_seconds < 1 or p_version_limit < 2
    then raise exception 'invalid_limits'; end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 1));
  select * into selected_session from public.edit_sessions
  where id = p_session_id and user_id = current_user_id;
  if not found or selected_session.status <> 'active' then
    raise exception 'session_not_found';
  end if;

  select * into existing_version from public.edit_versions
  where session_id = p_session_id and client_request_id = p_client_request_id;
  if found then
    return query select existing_version.id, existing_version.parent_version_id,
      existing_version.status, true;
    return;
  end if;

  if exists (
    select 1 from public.edit_versions
    where user_id = current_user_id and status in ('pending', 'processing')
  ) then raise exception 'edit_active'; end if;

  select count(*) into daily_count from public.edit_versions
  where user_id = current_user_id
    and parent_version_id is not null
    and created_at >= date_trunc('day', timezone('utc', now())) at time zone 'utc';
  if daily_count >= p_daily_limit then raise exception 'edit_limit'; end if;

  select created_at into latest_edit_at from public.edit_versions
  where user_id = current_user_id and parent_version_id is not null
  order by created_at desc limit 1;
  if latest_edit_at is not null
    and latest_edit_at > now() - make_interval(secs => p_cooldown_seconds)
    then raise exception 'edit_cooldown'; end if;

  select count(*) into session_count from public.edit_versions
  where session_id = p_session_id;
  if session_count >= p_version_limit then raise exception 'version_limit'; end if;

  base_version_id := coalesce(p_base_version_id, selected_session.current_version_id);
  if not exists (
    select 1 from public.edit_versions
    where id = base_version_id and session_id = p_session_id and status = 'completed'
  ) then raise exception 'version_not_found'; end if;

  insert into public.edit_versions (
    session_id, user_id, client_request_id, parent_version_id,
    status, instruction, enhanced_instruction, preserve_composition
  ) values (
    p_session_id, current_user_id, p_client_request_id, base_version_id,
    'pending', btrim(p_instruction), p_enhanced_instruction,
    p_preserve_composition
  ) returning id into reserved_version_id;

  insert into public.edit_messages (session_id, user_id, version_id, role, content)
  values (
    p_session_id, current_user_id, reserved_version_id, 'user',
    btrim(p_instruction)
  );
  selected_base_version_id := base_version_id;
  version_status := 'pending';
  is_existing := false;
  return next;
end;
$$;

create or replace function public.complete_edit_version(
  p_version_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_model text,
  p_provider_response_id text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_version public.edit_versions%rowtype;
begin
  select * into selected_version from public.edit_versions
  where id = p_version_id and user_id = current_user_id and status = 'processing';
  if not found then raise exception 'version_not_found'; end if;
  if p_storage_path not like current_user_id::text || '/%'
    then raise exception 'invalid_storage_path'; end if;

  update public.edit_versions set
    status = 'completed', storage_path = p_storage_path, mime_type = p_mime_type,
    width = p_width, height = p_height, model = p_model,
    provider_response_id = p_provider_response_id, completed_at = now()
  where id = p_version_id;
  update public.edit_sessions set
    current_version_id = p_version_id,
    previous_response_id = p_provider_response_id
  where id = selected_version.session_id and user_id = current_user_id;
  insert into public.edit_messages (session_id, user_id, version_id, role, content)
  values (
    selected_version.session_id, current_user_id, p_version_id, 'assistant',
    'Listo. Creé una nueva versión con los cambios solicitados.'
  );
end;
$$;

create or replace function public.fail_edit_version(
  p_version_id uuid,
  p_error_code text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  update public.edit_versions set status = 'failed', error_code = left(p_error_code, 80)
  where id = p_version_id and user_id = current_user_id
    and status in ('pending', 'processing');
end;
$$;

create or replace function public.restore_edit_version(
  p_session_id uuid,
  p_version_id uuid
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare current_user_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.edit_versions
    where id = p_version_id and session_id = p_session_id
      and user_id = current_user_id and status = 'completed'
  ) then raise exception 'version_not_found'; end if;
  update public.edit_sessions
  set current_version_id = p_version_id, previous_response_id = null
  where id = p_session_id and user_id = current_user_id and status = 'active';
  if not found then raise exception 'session_not_found'; end if;
  insert into public.edit_messages (session_id, user_id, version_id, role, content)
  values (
    p_session_id, current_user_id, p_version_id, 'system',
    'Esta versión vuelve a ser la base de los próximos cambios.'
  );
end;
$$;

create or replace function public.archive_edit_session(
  p_session_id uuid,
  p_archived boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'unauthorized'; end if;
  if exists (
    select 1 from public.edit_versions
    where session_id = p_session_id and user_id = current_user_id
      and status in ('pending', 'processing')
  ) then raise exception 'edit_active'; end if;

  update public.edit_sessions
  set status = case when p_archived then 'archived' else 'active' end,
      previous_response_id = case
        when p_archived then null else previous_response_id
      end
  where id = p_session_id
    and user_id = current_user_id
    and status in ('active', 'archived');
  if not found then raise exception 'session_not_found'; end if;
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'public.create_edit_session_from_generation(uuid)',
    'public.create_edit_session_from_upload(uuid,text)',
    'public.reserve_edit_version(uuid,uuid,uuid,text,text,boolean,integer,integer,integer)',
    'public.complete_edit_version(uuid,text,text,integer,integer,text,text)',
    'public.fail_edit_version(uuid,text)',
    'public.restore_edit_version(uuid,uuid)',
    'public.archive_edit_session(uuid,boolean)'
  ] loop
    execute format('revoke all on function %s from public, anon', signature);
    execute format('grant execute on function %s to authenticated', signature);
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generations', 'generations', false, 20971520,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can delete their own generated images" on storage.objects;
create policy "Users can delete their own generated images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'generations'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
