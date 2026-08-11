-- Durable evidence of the user's express request to begin digital supply.

create table if not exists public.checkout_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  public_plan text not null check (public_plan in ('starter', 'creator', 'pro')),
  billing_period text not null check (billing_period in ('monthly', 'annual')),
  consent_version text not null,
  terms_version text not null,
  refund_policy_version text not null,
  accepted boolean not null check (accepted),
  accepted_at timestamptz not null default now(),
  stripe_checkout_session_id text,
  completed_at timestamptz,
  unique (user_id, client_request_id)
);

create index if not exists checkout_consents_user_created_idx
  on public.checkout_consents (user_id, accepted_at desc);

create unique index if not exists checkout_consents_stripe_session_idx
  on public.checkout_consents (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.checkout_consents enable row level security;

create policy "Users can read own checkout consents"
on public.checkout_consents for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.checkout_consents from public, anon, authenticated;
grant select on table public.checkout_consents to authenticated;
grant all on table public.checkout_consents to service_role;
