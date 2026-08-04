-- Administrative entitlements are separate from Stripe subscriptions.
-- They are useful for founders, support and controlled testing without
-- fabricating Stripe customer or subscription identifiers.
create table if not exists public.plan_overrides (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_key text not null check (plan_key in ('starter', 'pro', 'business')),
  reason text not null check (char_length(reason) between 3 and 240),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plan_overrides enable row level security;
revoke all on table public.plan_overrides from public, anon, authenticated;
grant select on table public.plan_overrides to authenticated;

drop policy if exists "Users view their own plan override" on public.plan_overrides;
create policy "Users view their own plan override"
  on public.plan_overrides for select to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
