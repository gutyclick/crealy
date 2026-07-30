-- Crealy Fase 8: private beta, onboarding, transactional email and support.
-- Additive migration. Do not edit previously applied migrations.

create or replace function public.touch_launch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_use_cases text[] not null default '{}'::text[],
  user_role text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_use_cases_check check (
    primary_use_cases <@ array[
      'youtube_thumbnail', 'banners_covers', 'social_posts',
      'promotional_creatives', 'explore_formats'
    ]::text[]
  ),
  constraint user_preferences_role_check check (
    user_role is null or user_role in (
      'content_creator', 'youtuber', 'streamer', 'community_manager',
      'entrepreneur', 'agency', 'business', 'other'
    )
  )
);

create trigger user_preferences_touch_updated_at
before update on public.user_preferences
for each row execute function public.touch_launch_updated_at();

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  generation_ready boolean not null default false,
  edit_ready boolean not null default false,
  asset_expiring boolean not null default true,
  low_credits boolean not null default true,
  billing_updates boolean not null default true,
  product_updates boolean not null default false,
  marketing_emails boolean not null default false,
  deliverability_blocked_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_touch_updated_at
before update on public.notification_preferences
for each row execute function public.touch_launch_updated_at();

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email_type text not null check (
    email_type in (
      'welcome', 'generation_ready', 'edit_ready', 'asset_expiring',
      'low_credits', 'subscription_active', 'payment_failed',
      'support_received', 'support_internal'
    )
  ),
  recipient_hash text,
  status text not null default 'queued' check (
    status in (
      'queued', 'processing', 'sent', 'delivered', 'failed',
      'bounced', 'complained', 'suppressed'
    )
  ),
  provider text not null default 'resend' check (provider = 'resend'),
  provider_message_id text,
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text,
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_deliveries_user_created_idx
  on public.email_deliveries (user_id, created_at desc);
create unique index email_deliveries_provider_message_idx
  on public.email_deliveries (provider_message_id)
  where provider_message_id is not null;

create trigger email_deliveries_touch_updated_at
before update on public.email_deliveries
for each row execute function public.touch_launch_updated_at();

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (
    category in (
      'technical', 'billing', 'account_security',
      'generation_editing', 'suggestion', 'other'
    )
  ),
  subject text not null check (char_length(subject) between 4 and 120),
  message text not null check (char_length(message) between 20 and 4000),
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  priority text not null default 'normal' check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  related_reference_type text check (
    related_reference_type is null or related_reference_type in (
      'generation', 'edit_session', 'billing', 'asset', 'job'
    )
  ),
  related_reference_id uuid,
  requester_email_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_requests_user_created_idx
  on public.support_requests (user_id, created_at desc);
create index support_requests_status_created_idx
  on public.support_requests (status, created_at);

create trigger support_requests_touch_updated_at
before update on public.support_requests
for each row execute function public.touch_launch_updated_at();

create table public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (
    category in ('broken', 'suggestion', 'poor_result', 'other')
  ),
  message text not null check (char_length(message) between 10 and 2000),
  page_path text check (
    page_path is null
    or (char_length(page_path) <= 240 and page_path like '/%')
  ),
  related_reference_type text check (
    related_reference_type is null or related_reference_type in (
      'generation', 'edit_session', 'tool'
    )
  ),
  related_reference_id uuid,
  consent_to_share_content boolean not null default false,
  status text not null default 'new' check (
    status in ('new', 'reviewed', 'planned', 'closed')
  ),
  created_at timestamptz not null default now()
);

create index product_feedback_user_created_idx
  on public.product_feedback (user_id, created_at desc);

create table public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text,
  code_hash text not null unique,
  status text not null default 'available' check (
    status in ('available', 'used', 'revoked', 'expired')
  ),
  max_uses integer not null default 1 check (max_uses between 1 and 1000),
  use_count integer not null default 0 check (
    use_count >= 0 and use_count <= max_uses
  ),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index beta_invites_status_expiry_idx
  on public.beta_invites (status, expires_at);

create trigger beta_invites_touch_updated_at
before update on public.beta_invites
for each row execute function public.touch_launch_updated_at();

alter table public.user_preferences enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.support_requests enable row level security;
alter table public.product_feedback enable row level security;
alter table public.beta_invites enable row level security;

create policy "Users can read own preferences"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can insert own preferences"
on public.user_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update own preferences"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read own notification preferences"
on public.notification_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can insert own notification preferences"
on public.notification_preferences for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and billing_updates = true
  and deliverability_blocked_at is null
);

create policy "Users can read own email delivery metadata"
on public.email_deliveries for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can read own support requests"
on public.support_requests for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can submit own feedback"
on public.product_feedback for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'new');

revoke all on table public.user_preferences from public, anon;
revoke all on table public.notification_preferences from public, anon;
revoke all on table public.email_deliveries from public, anon, authenticated;
revoke all on table public.support_requests from public, anon, authenticated;
revoke all on table public.product_feedback from public, anon;
revoke all on table public.beta_invites from public, anon, authenticated;

grant select, insert, update on public.user_preferences to authenticated;
grant select, insert on public.notification_preferences to authenticated;
grant select on public.email_deliveries to authenticated;
grant select on public.support_requests to authenticated;
grant insert on public.product_feedback to authenticated;

create or replace function public.claim_beta_invite_internal(
  p_code_hash text,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_id uuid;
  normalized_email text := lower(trim(p_email));
begin
  if char_length(p_code_hash) <> 64 or char_length(normalized_email) > 320 then
    return false;
  end if;

  select i.id into selected_id
  from public.beta_invites i
  where i.code_hash = p_code_hash
    and i.status = 'available'
    and i.use_count < i.max_uses
    and (i.expires_at is null or i.expires_at > now())
    and (i.email is null or lower(i.email) = normalized_email)
  for update skip locked;

  if selected_id is null then
    update public.beta_invites
    set status = 'expired'
    where code_hash = p_code_hash
      and status = 'available'
      and expires_at is not null
      and expires_at <= now();
    return false;
  end if;

  update public.beta_invites
  set
    use_count = use_count + 1,
    status = case when use_count + 1 >= max_uses then 'used' else 'available' end,
    updated_at = now()
  where id = selected_id;

  return true;
end;
$$;

revoke all on function public.claim_beta_invite_internal(text, text)
from public, anon, authenticated;
grant execute on function public.claim_beta_invite_internal(text, text)
to service_role;

create or replace function public.validate_beta_invite_internal(
  p_code_hash text,
  p_email text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.beta_invites i
    where i.code_hash = p_code_hash
      and i.status = 'available'
      and i.use_count < i.max_uses
      and (i.expires_at is null or i.expires_at > now())
      and (i.email is null or lower(i.email) = lower(trim(p_email)))
  );
$$;

revoke all on function public.validate_beta_invite_internal(text, text)
from public, anon, authenticated;
grant execute on function public.validate_beta_invite_internal(text, text)
to service_role;

create or replace function public.update_notification_preferences(
  p_generation_ready boolean,
  p_edit_ready boolean,
  p_asset_expiring boolean,
  p_low_credits boolean,
  p_product_updates boolean,
  p_marketing_emails boolean
)
returns public.notification_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.notification_preferences;
begin
  if (select auth.uid()) is null then
    raise exception 'unauthorized';
  end if;
  insert into public.notification_preferences (
    user_id, generation_ready, edit_ready, asset_expiring, low_credits,
    billing_updates, product_updates, marketing_emails
  ) values (
    (select auth.uid()), p_generation_ready, p_edit_ready, p_asset_expiring,
    p_low_credits, true, p_product_updates, p_marketing_emails
  )
  on conflict (user_id) do update set
    generation_ready = excluded.generation_ready,
    edit_ready = excluded.edit_ready,
    asset_expiring = excluded.asset_expiring,
    low_credits = excluded.low_credits,
    billing_updates = true,
    product_updates = excluded.product_updates,
    marketing_emails = excluded.marketing_emails
  returning * into result;
  return result;
end;
$$;

revoke all on function public.update_notification_preferences(
  boolean, boolean, boolean, boolean, boolean, boolean
) from public, anon;
grant execute on function public.update_notification_preferences(
  boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;

alter table public.jobs drop constraint if exists jobs_job_type_check;
alter table public.jobs
  add constraint jobs_job_type_check
  check (job_type in ('generation', 'edit', 'send_transactional_email'));

alter table public.jobs alter column user_id drop not null;
alter table public.jobs
  add constraint jobs_user_required_check
  check (job_type = 'send_transactional_email' or user_id is not null);
