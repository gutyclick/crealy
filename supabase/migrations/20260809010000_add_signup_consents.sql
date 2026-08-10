-- Record legal acceptance and optional product-email consent at account creation.

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (
    consent_type in ('terms', 'privacy', 'marketing_emails')
  ),
  policy_version text not null,
  granted boolean not null,
  source text not null check (
    source in ('email_signup', 'google_oauth', 'discord_oauth')
  ),
  created_at timestamptz not null default now(),
  unique (user_id, consent_type, policy_version, source)
);

create index if not exists user_consents_user_created_idx
  on public.user_consents (user_id, created_at desc);

alter table public.user_consents enable row level security;

create policy "Users can read own consent history"
on public.user_consents for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_consents from public, anon, authenticated;
grant select on table public.user_consents to authenticated;

create or replace function public.record_signup_consents_internal(
  p_user_id uuid,
  p_terms_version text,
  p_privacy_version text,
  p_marketing_opt_in boolean,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
    or char_length(trim(p_terms_version)) < 1
    or char_length(trim(p_privacy_version)) < 1
    or p_source not in ('email_signup', 'google_oauth', 'discord_oauth') then
    raise exception 'invalid_signup_consent';
  end if;

  insert into public.user_consents (
    user_id, consent_type, policy_version, granted, source
  ) values
    (p_user_id, 'terms', p_terms_version, true, p_source),
    (p_user_id, 'privacy', p_privacy_version, true, p_source),
    (p_user_id, 'marketing_emails', 'signup-v1', p_marketing_opt_in, p_source)
  on conflict (user_id, consent_type, policy_version, source) do nothing;

  insert into public.notification_preferences (
    user_id, product_updates, marketing_emails
  ) values (
    p_user_id, p_marketing_opt_in, p_marketing_opt_in
  )
  on conflict (user_id) do update set
    product_updates = excluded.product_updates,
    marketing_emails = excluded.marketing_emails,
    updated_at = now();
end;
$$;

revoke all on function public.record_signup_consents_internal(
  uuid, text, text, boolean, text
) from public, anon, authenticated;
grant execute on function public.record_signup_consents_internal(
  uuid, text, text, boolean, text
) to service_role;
