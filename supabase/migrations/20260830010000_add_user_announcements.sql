create table if not exists public.user_announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  message text not null,
  credit_amount integer,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_announcements_kind_length check (char_length(kind) between 1 and 80),
  constraint user_announcements_title_length check (char_length(title) between 1 and 120),
  constraint user_announcements_message_length check (char_length(message) between 1 and 500),
  constraint user_announcements_credit_amount_valid check (credit_amount is null or credit_amount > 0),
  unique (user_id, kind)
);

create index if not exists user_announcements_pending_idx
  on public.user_announcements (user_id, created_at desc)
  where acknowledged_at is null;

alter table public.user_announcements enable row level security;

revoke all on table public.user_announcements from public, anon, authenticated;
grant select on table public.user_announcements to authenticated;

create policy "Users view their own announcements"
  on public.user_announcements for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.acknowledge_user_announcement(p_announcement_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'unauthorized'; end if;
  update public.user_announcements
  set acknowledged_at = coalesce(acknowledged_at, now())
  where id = p_announcement_id and user_id = current_user_id;
  return found;
end;
$$;

revoke all on function public.acknowledge_user_announcement(uuid) from public, anon;
grant execute on function public.acknowledge_user_announcement(uuid) to authenticated;
