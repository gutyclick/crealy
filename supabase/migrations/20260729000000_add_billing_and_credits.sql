create table if not exists public.billing_settings (
  id boolean primary key default true check (id),
  free_signup_credits integer not null default 5 check (free_signup_credits between 0 and 10000),
  pro_monthly_credits integer not null default 100 check (pro_monthly_credits between 1 and 1000000),
  business_monthly_credits integer not null default 500 check (business_monthly_credits between 1 and 1000000),
  updated_at timestamptz not null default now()
);

insert into public.billing_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  livemode boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_stripe_id_length
    check (char_length(stripe_customer_id) between 8 and 255)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  stripe_product_id text,
  plan_key text not null check (plan_key in ('pro', 'business')),
  status text not null check (
    status in (
      'incomplete', 'incomplete_expired', 'trialing', 'active',
      'past_due', 'canceled', 'unpaid', 'paused'
    )
  ),
  currency text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  trial_end timestamptz,
  last_stripe_event_created_at timestamptz,
  last_invoice_paid_at timestamptz,
  livemode boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_currency_length
    check (currency is null or char_length(currency) = 3)
);

create unique index if not exists subscriptions_one_relevant_per_user_idx
  on public.subscriptions (user_id)
  where status in (
    'incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused'
  );

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);

create table if not exists public.credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_balance integer not null default 0 check (available_balance >= 0),
  reserved_balance integer not null default 0 check (reserved_balance >= 0),
  lifetime_granted integer not null default 0 check (lifetime_granted >= 0),
  lifetime_consumed integer not null default 0 check (lifetime_consumed >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (
    source_type in (
      'signup_bonus', 'subscription_cycle', 'promotion',
      'manual_adjustment', 'purchase', 'refund'
    )
  ),
  source_reference text,
  initial_amount integer not null check (initial_amount > 0),
  remaining_amount integer not null check (remaining_amount >= 0),
  reserved_amount integer not null default 0 check (reserved_amount >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint credit_grants_amounts_valid check (
    remaining_amount + reserved_amount <= initial_amount
  )
);

create unique index if not exists credit_grants_source_idempotency_idx
  on public.credit_grants (user_id, source_type, source_reference)
  where source_reference is not null;

create index if not exists credit_grants_consumption_idx
  on public.credit_grants (
    user_id,
    expires_at asc nulls last,
    created_at asc
  )
  where remaining_amount > 0;

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released')),
  reference_type text not null check (reference_type in ('generation', 'edit')),
  reference_id uuid not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  unique (user_id, idempotency_key)
);

create index if not exists credit_reservations_reference_idx
  on public.credit_reservations (reference_type, reference_id);

create table if not exists public.credit_reservation_items (
  reservation_id uuid not null
    references public.credit_reservations(id) on delete cascade,
  grant_id uuid not null references public.credit_grants(id) on delete restrict,
  amount integer not null check (amount > 0),
  primary key (reservation_id, grant_id)
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grant_id uuid references public.credit_grants(id) on delete set null,
  reservation_id uuid references public.credit_reservations(id) on delete set null,
  transaction_type text not null check (
    transaction_type in (
      'grant', 'reserve', 'consume', 'release',
      'expire', 'refund', 'adjustment'
    )
  ),
  amount integer not null,
  balance_after integer check (balance_after is null or balance_after >= 0),
  reference_type text,
  reference_id uuid,
  idempotency_key text,
  description text not null,
  created_at timestamptz not null default now(),
  constraint credit_transactions_description_length
    check (char_length(description) between 1 and 180)
);

create unique index if not exists credit_transactions_idempotency_idx
  on public.credit_transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

create table if not exists public.stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  api_version text,
  livemode boolean not null,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'ignored', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  last_attempt_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now()
);

alter table public.generations
  add column if not exists credit_reservation_id uuid
    references public.credit_reservations(id) on delete set null,
  add column if not exists credit_transaction_id uuid
    references public.credit_transactions(id) on delete set null,
  add column if not exists credit_cost integer
    check (credit_cost is null or credit_cost > 0);

alter table public.edit_versions
  add column if not exists credit_reservation_id uuid
    references public.credit_reservations(id) on delete set null,
  add column if not exists credit_transaction_id uuid
    references public.credit_transactions(id) on delete set null,
  add column if not exists credit_cost integer
    check (credit_cost is null or credit_cost > 0);

create index if not exists generations_credit_transaction_idx
  on public.generations (credit_transaction_id)
  where credit_transaction_id is not null;

create index if not exists edit_versions_credit_transaction_idx
  on public.edit_versions (credit_transaction_id)
  where credit_transaction_id is not null;

create or replace function public.set_billing_updated_at()
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

drop trigger if exists set_billing_customers_updated_at on public.billing_customers;
create trigger set_billing_customers_updated_at
  before update on public.billing_customers
  for each row execute function public.set_billing_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_billing_updated_at();

drop function if exists public.sync_credit_settings_internal(integer, integer, integer);
create function public.sync_credit_settings_internal(
  p_free_signup_credits integer,
  p_pro_monthly_credits integer,
  p_business_monthly_credits integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_free_signup_credits not between 0 and 10000
    or p_pro_monthly_credits not between 1 and 1000000
    or p_business_monthly_credits not between 1 and 1000000 then
    raise exception 'invalid_credit_settings';
  end if;

  insert into public.billing_settings (
    id, free_signup_credits, pro_monthly_credits, business_monthly_credits
  )
  values (
    true, p_free_signup_credits, p_pro_monthly_credits,
    p_business_monthly_credits
  )
  on conflict (id) do update set
    free_signup_credits = excluded.free_signup_credits,
    pro_monthly_credits = excluded.pro_monthly_credits,
    business_monthly_credits = excluded.business_monthly_credits,
    updated_at = now();
end;
$$;

drop function if exists public.grant_credits_internal(
  uuid, text, text, integer, timestamptz, text
);
create function public.grant_credits_internal(
  p_user_id uuid,
  p_source_type text,
  p_source_reference text,
  p_amount integer,
  p_expires_at timestamptz,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_grant_id uuid;
  next_balance integer;
begin
  if p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid_credit_amount';
  end if;
  if p_source_type not in (
    'signup_bonus', 'subscription_cycle', 'promotion',
    'manual_adjustment', 'purchase', 'refund'
  ) then
    raise exception 'invalid_credit_source';
  end if;
  if p_description is null or char_length(p_description) not between 1 and 180 then
    raise exception 'invalid_credit_description';
  end if;

  insert into public.credit_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  perform 1 from public.credit_accounts
  where user_id = p_user_id
  for update;

  if p_source_reference is not null then
    select g.id into selected_grant_id
    from public.credit_grants g
    where g.user_id = p_user_id
      and g.source_type = p_source_type
      and g.source_reference = p_source_reference;
    if found then return selected_grant_id; end if;
  end if;

  insert into public.credit_grants (
    user_id, source_type, source_reference, initial_amount,
    remaining_amount, expires_at
  )
  values (
    p_user_id, p_source_type, p_source_reference, p_amount,
    p_amount, p_expires_at
  )
  returning id into selected_grant_id;

  update public.credit_accounts
  set
    available_balance = available_balance + p_amount,
    lifetime_granted = lifetime_granted + p_amount,
    updated_at = now()
  where user_id = p_user_id
  returning available_balance into next_balance;

  insert into public.credit_transactions (
    user_id, grant_id, transaction_type, amount, balance_after,
    reference_type, idempotency_key, description
  )
  values (
    p_user_id, selected_grant_id, 'grant', p_amount, next_balance,
    p_source_type,
    case
      when p_source_reference is null then null
      else 'grant:' || p_source_type || ':' || p_source_reference
    end,
    p_description
  );

  return selected_grant_id;
end;
$$;

drop function if exists public.expire_credits_internal(uuid);
create function public.expire_credits_internal(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_grant record;
  expired_total integer := 0;
  next_balance integer;
begin
  insert into public.credit_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  perform 1 from public.credit_accounts
  where user_id = p_user_id
  for update;

  for selected_grant in
    select g.id, g.remaining_amount
    from public.credit_grants g
    where g.user_id = p_user_id
      and g.expires_at is not null
      and g.expires_at <= now()
      and g.remaining_amount > 0
    order by g.expires_at, g.created_at
    for update
  loop
    update public.credit_grants
    set remaining_amount = 0
    where id = selected_grant.id;

    update public.credit_accounts
    set
      available_balance = available_balance - selected_grant.remaining_amount,
      updated_at = now()
    where user_id = p_user_id
    returning available_balance into next_balance;

    insert into public.credit_transactions (
      user_id, grant_id, transaction_type, amount, balance_after,
      reference_type, idempotency_key, description
    )
    values (
      p_user_id, selected_grant.id, 'expire',
      -selected_grant.remaining_amount, next_balance, 'credit_grant',
      'expire:' || selected_grant.id::text,
      'Créditos vencidos'
    )
    on conflict (user_id, idempotency_key)
      where idempotency_key is not null do nothing;

    expired_total := expired_total + selected_grant.remaining_amount;
  end loop;

  return expired_total;
end;
$$;

drop function if exists public.reserve_credits_internal(
  uuid, integer, text, uuid, text
);
create function public.reserve_credits_internal(
  p_user_id uuid,
  p_amount integer,
  p_reference_type text,
  p_reference_id uuid,
  p_idempotency_key text
)
returns table (
  reservation_id uuid,
  reserved_amount integer,
  credits_remaining integer,
  is_existing boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_reservation public.credit_reservations%rowtype;
  selected_grant record;
  selected_amount integer;
  amount_left integer := p_amount;
  account_balance integer;
begin
  if p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid_credit_amount';
  end if;
  if p_reference_type not in ('generation', 'edit') then
    raise exception 'invalid_credit_reference';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 180 then
    raise exception 'invalid_idempotency_key';
  end if;

  select r.* into existing_reservation
  from public.credit_reservations r
  where r.user_id = p_user_id
    and r.idempotency_key = p_idempotency_key
  for update;

  if found then
    if existing_reservation.amount <> p_amount
      or existing_reservation.reference_type <> p_reference_type
      or existing_reservation.reference_id <> p_reference_id then
      raise exception 'idempotency_conflict';
    end if;
    select a.available_balance into account_balance
    from public.credit_accounts a
    where a.user_id = p_user_id;
    return query select
      existing_reservation.id,
      existing_reservation.amount,
      coalesce(account_balance, 0),
      true;
    return;
  end if;

  perform public.expire_credits_internal(p_user_id);

  select a.available_balance into account_balance
  from public.credit_accounts a
  where a.user_id = p_user_id
  for update;

  if account_balance is null or account_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_reservations (
    user_id, amount, reference_type, reference_id, idempotency_key
  )
  values (
    p_user_id, p_amount, p_reference_type, p_reference_id, p_idempotency_key
  )
  returning id into reservation_id;

  for selected_grant in
    select g.id, g.remaining_amount
    from public.credit_grants g
    where g.user_id = p_user_id
      and g.remaining_amount > 0
      and (g.expires_at is null or g.expires_at > now())
    order by g.expires_at asc nulls last, g.created_at, g.id
    for update
  loop
    exit when amount_left = 0;
    selected_amount := least(amount_left, selected_grant.remaining_amount);

    update public.credit_grants
    set
      remaining_amount = remaining_amount - selected_amount,
      reserved_amount = reserved_amount + selected_amount
    where id = selected_grant.id;

    insert into public.credit_reservation_items (
      reservation_id, grant_id, amount
    )
    values (reservation_id, selected_grant.id, selected_amount);

    amount_left := amount_left - selected_amount;
  end loop;

  if amount_left <> 0 then
    raise exception 'credit_allocation_failed';
  end if;

  update public.credit_accounts
  set
    available_balance = available_balance - p_amount,
    reserved_balance = reserved_balance + p_amount,
    updated_at = now()
  where user_id = p_user_id
  returning available_balance into credits_remaining;

  insert into public.credit_transactions (
    user_id, reservation_id, transaction_type, amount, balance_after,
    reference_type, reference_id, idempotency_key, description
  )
  values (
    p_user_id, reservation_id, 'reserve', 0, credits_remaining,
    p_reference_type, p_reference_id,
    'reserve:' || p_idempotency_key,
    'Créditos reservados'
  );

  reserved_amount := p_amount;
  is_existing := false;
  return next;
end;
$$;

drop function if exists public.consume_reserved_credits_internal(
  uuid, uuid, text, uuid, text
);
create function public.consume_reserved_credits_internal(
  p_user_id uuid,
  p_reservation_id uuid,
  p_reference_type text,
  p_reference_id uuid,
  p_description text
)
returns table (
  transaction_id uuid,
  consumed_amount integer,
  credits_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_reservation public.credit_reservations%rowtype;
  selected_item record;
begin
  select r.* into selected_reservation
  from public.credit_reservations r
  where r.id = p_reservation_id
    and r.user_id = p_user_id
  for update;

  if not found then raise exception 'credit_reservation_not_found'; end if;
  if selected_reservation.reference_type <> p_reference_type
    or selected_reservation.reference_id <> p_reference_id then
    raise exception 'credit_reservation_mismatch';
  end if;

  if selected_reservation.status = 'consumed' then
    select t.id, -t.amount, t.balance_after
    into transaction_id, consumed_amount, credits_remaining
    from public.credit_transactions t
    where t.user_id = p_user_id
      and t.idempotency_key = 'consume:' || p_reservation_id::text;
    return next;
    return;
  end if;
  if selected_reservation.status <> 'reserved' then
    raise exception 'credit_reservation_released';
  end if;

  perform 1 from public.credit_accounts
  where user_id = p_user_id
  for update;

  for selected_item in
    select i.grant_id, i.amount
    from public.credit_reservation_items i
    where i.reservation_id = p_reservation_id
  loop
    update public.credit_grants
    set reserved_amount = reserved_amount - selected_item.amount
    where id = selected_item.grant_id;
  end loop;

  update public.credit_accounts
  set
    reserved_balance = reserved_balance - selected_reservation.amount,
    lifetime_consumed = lifetime_consumed + selected_reservation.amount,
    updated_at = now()
  where user_id = p_user_id
  returning available_balance into credits_remaining;

  insert into public.credit_transactions (
    user_id, reservation_id, transaction_type, amount, balance_after,
    reference_type, reference_id, idempotency_key, description
  )
  values (
    p_user_id, p_reservation_id, 'consume', -selected_reservation.amount,
    credits_remaining, p_reference_type, p_reference_id,
    'consume:' || p_reservation_id::text, p_description
  )
  returning id into transaction_id;

  update public.credit_reservations
  set status = 'consumed', finalized_at = now()
  where id = p_reservation_id;

  consumed_amount := selected_reservation.amount;
  return next;
end;
$$;

drop function if exists public.release_reserved_credits_internal(uuid, uuid);
create function public.release_reserved_credits_internal(
  p_user_id uuid,
  p_reservation_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_reservation public.credit_reservations%rowtype;
  selected_item record;
  restorable_amount integer := 0;
  expired_amount integer := 0;
  next_balance integer;
begin
  select r.* into selected_reservation
  from public.credit_reservations r
  where r.id = p_reservation_id
    and r.user_id = p_user_id
  for update;

  if not found then raise exception 'credit_reservation_not_found'; end if;
  if selected_reservation.status = 'released' then
    select available_balance into next_balance
    from public.credit_accounts where user_id = p_user_id;
    return next_balance;
  end if;
  if selected_reservation.status = 'consumed' then
    raise exception 'credit_reservation_consumed';
  end if;

  perform 1 from public.credit_accounts
  where user_id = p_user_id
  for update;

  for selected_item in
    select i.grant_id, i.amount, g.expires_at
    from public.credit_reservation_items i
    join public.credit_grants g on g.id = i.grant_id
    where i.reservation_id = p_reservation_id
    for update of g
  loop
    if selected_item.expires_at is not null
      and selected_item.expires_at <= now() then
      update public.credit_grants
      set reserved_amount = reserved_amount - selected_item.amount
      where id = selected_item.grant_id;
      expired_amount := expired_amount + selected_item.amount;
    else
      update public.credit_grants
      set
        reserved_amount = reserved_amount - selected_item.amount,
        remaining_amount = remaining_amount + selected_item.amount
      where id = selected_item.grant_id;
      restorable_amount := restorable_amount + selected_item.amount;
    end if;
  end loop;

  update public.credit_accounts
  set
    available_balance = available_balance + restorable_amount,
    reserved_balance = reserved_balance - selected_reservation.amount,
    updated_at = now()
  where user_id = p_user_id
  returning available_balance into next_balance;

  insert into public.credit_transactions (
    user_id, reservation_id, transaction_type, amount, balance_after,
    reference_type, reference_id, idempotency_key, description
  )
  values (
    p_user_id, p_reservation_id, 'release', 0, next_balance,
    selected_reservation.reference_type, selected_reservation.reference_id,
    'release:' || p_reservation_id::text, 'Reserva liberada'
  )
  on conflict (user_id, idempotency_key)
    where idempotency_key is not null do nothing;

  if expired_amount > 0 then
    insert into public.credit_transactions (
      user_id, reservation_id, transaction_type, amount, balance_after,
      reference_type, reference_id, idempotency_key, description
    )
    values (
      p_user_id, p_reservation_id, 'expire', -expired_amount, next_balance,
      selected_reservation.reference_type, selected_reservation.reference_id,
      'expire-reservation:' || p_reservation_id::text,
      'Créditos vencidos durante la operación'
    )
    on conflict (user_id, idempotency_key)
      where idempotency_key is not null do nothing;
  end if;

  update public.credit_reservations
  set status = 'released', finalized_at = now()
  where id = p_reservation_id;

  return next_balance;
end;
$$;

drop function if exists public.grant_subscription_credits_internal(
  uuid, text, integer, timestamptz, text
);
create function public.grant_subscription_credits_internal(
  p_user_id uuid,
  p_invoice_id text,
  p_amount integer,
  p_expires_at timestamptz,
  p_plan_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_grant_id uuid;
  selected_grant record;
  next_balance integer;
begin
  if p_plan_key not in ('pro', 'business') then
    raise exception 'invalid_plan';
  end if;

  select g.id into existing_grant_id
  from public.credit_grants g
  where g.user_id = p_user_id
    and g.source_type = 'subscription_cycle'
    and g.source_reference = p_invoice_id;
  if found then return existing_grant_id; end if;

  insert into public.credit_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  perform 1 from public.credit_accounts
  where user_id = p_user_id
  for update;

  for selected_grant in
    select g.id, g.remaining_amount
    from public.credit_grants g
    where g.user_id = p_user_id
      and g.source_type = 'subscription_cycle'
      and g.remaining_amount > 0
    for update
  loop
    update public.credit_grants
    set remaining_amount = 0
    where id = selected_grant.id;

    update public.credit_accounts
    set
      available_balance = available_balance - selected_grant.remaining_amount,
      updated_at = now()
    where user_id = p_user_id
    returning available_balance into next_balance;

    insert into public.credit_transactions (
      user_id, grant_id, transaction_type, amount, balance_after,
      reference_type, idempotency_key, description
    )
    values (
      p_user_id, selected_grant.id, 'expire',
      -selected_grant.remaining_amount, next_balance,
      'subscription_cycle',
      'expire-cycle:' || selected_grant.id::text,
      'Créditos del ciclo anterior vencidos'
    )
    on conflict (user_id, idempotency_key)
      where idempotency_key is not null do nothing;
  end loop;

  return public.grant_credits_internal(
    p_user_id,
    'subscription_cycle',
    p_invoice_id,
    p_amount,
    p_expires_at,
    'Renovación mensual del plan ' || initcap(p_plan_key)
  );
end;
$$;

drop function if exists public.claim_stripe_event_internal(
  text, text, text, boolean
);
create function public.claim_stripe_event_internal(
  p_event_id text,
  p_event_type text,
  p_api_version text,
  p_livemode boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event public.stripe_events%rowtype;
begin
  select e.* into selected_event
  from public.stripe_events e
  where e.stripe_event_id = p_event_id
  for update;

  if not found then
    insert into public.stripe_events (
      stripe_event_id, event_type, api_version, livemode
    )
    values (p_event_id, p_event_type, p_api_version, p_livemode);
    return 'claimed';
  end if;

  if selected_event.status in ('processed', 'ignored') then
    return 'duplicate';
  end if;

  if selected_event.status = 'processing'
    and selected_event.last_attempt_at > now() - interval '15 minutes' then
    return 'duplicate';
  end if;

  update public.stripe_events
  set
    status = 'processing',
    attempts = attempts + 1,
    last_attempt_at = now(),
    error_code = null
  where stripe_event_id = p_event_id;
  return 'claimed';
end;
$$;

drop function if exists public.finish_stripe_event_internal(text, text, text);
create function public.finish_stripe_event_internal(
  p_event_id text,
  p_status text,
  p_error_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('processed', 'ignored', 'failed') then
    raise exception 'invalid_stripe_event_status';
  end if;

  update public.stripe_events
  set
    status = p_status,
    processed_at = case
      when p_status in ('processed', 'ignored') then now()
      else null
    end,
    error_code = case
      when p_status = 'failed' then left(coalesce(p_error_code, 'unknown'), 120)
      else null
    end
  where stripe_event_id = p_event_id;
end;
$$;

drop function if exists public.complete_generation_with_credits_internal(
  uuid, uuid, uuid, text, text, integer, integer, text, text
);
create function public.complete_generation_with_credits_internal(
  p_user_id uuid,
  p_generation_id uuid,
  p_reservation_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_model text,
  p_provider_request_id text
)
returns table (
  credit_transaction_id uuid,
  credits_used integer,
  credits_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumption record;
begin
  if not exists (
    select 1 from public.generations g
    where g.id = p_generation_id
      and g.user_id = p_user_id
      and g.status = 'processing'
      and g.credit_reservation_id = p_reservation_id
  ) then
    raise exception 'generation_not_ready';
  end if;

  select * into consumption
  from public.consume_reserved_credits_internal(
    p_user_id, p_reservation_id, 'generation', p_generation_id,
    'Generación de imagen'
  );

  update public.generations
  set
    status = 'completed',
    storage_path = p_storage_path,
    mime_type = p_mime_type,
    width = p_width,
    height = p_height,
    model = p_model,
    provider_request_id = p_provider_request_id,
    credit_transaction_id = consumption.transaction_id,
    completed_at = now()
  where id = p_generation_id and user_id = p_user_id;

  return query select
    consumption.transaction_id,
    consumption.consumed_amount,
    consumption.credits_remaining;
end;
$$;

drop function if exists public.complete_edit_version_with_credits_internal(
  uuid, uuid, uuid, text, text, integer, integer, text, text
);
create function public.complete_edit_version_with_credits_internal(
  p_user_id uuid,
  p_version_id uuid,
  p_reservation_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_model text,
  p_provider_response_id text
)
returns table (
  credit_transaction_id uuid,
  credits_used integer,
  credits_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_version public.edit_versions%rowtype;
  consumption record;
begin
  select v.* into selected_version
  from public.edit_versions v
  where v.id = p_version_id
    and v.user_id = p_user_id
    and v.status = 'processing'
    and v.credit_reservation_id = p_reservation_id
  for update;
  if not found then raise exception 'edit_version_not_ready'; end if;

  select * into consumption
  from public.consume_reserved_credits_internal(
    p_user_id, p_reservation_id, 'edit', p_version_id,
    'Edición de imagen'
  );

  update public.edit_versions
  set
    status = 'completed',
    storage_path = p_storage_path,
    mime_type = p_mime_type,
    width = p_width,
    height = p_height,
    model = p_model,
    provider_response_id = p_provider_response_id,
    credit_transaction_id = consumption.transaction_id,
    completed_at = now()
  where id = p_version_id;

  update public.edit_sessions
  set
    current_version_id = p_version_id,
    previous_response_id = p_provider_response_id,
    updated_at = now()
  where id = selected_version.session_id and user_id = p_user_id;

  insert into public.edit_messages (
    session_id, user_id, version_id, role, content
  )
  values (
    selected_version.session_id, p_user_id, p_version_id, 'assistant',
    'Listo. Creé una nueva versión con los cambios solicitados.'
  );

  return query select
    consumption.transaction_id,
    consumption.consumed_amount,
    consumption.credits_remaining;
end;
$$;

drop function if exists public.initialize_credit_account_for_new_user();
create function public.initialize_credit_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_amount integer;
begin
  select s.free_signup_credits into signup_amount
  from public.billing_settings s
  where s.id = true;

  insert into public.credit_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if coalesce(signup_amount, 0) > 0 then
    perform public.grant_credits_internal(
      new.id,
      'signup_bonus',
      'signup:' || new.id::text,
      signup_amount,
      null,
      'Créditos de bienvenida'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_credit_account_created on auth.users;
create trigger on_auth_user_credit_account_created
  after insert on auth.users
  for each row execute function public.initialize_credit_account_for_new_user();

do $$
declare
  existing_user record;
  signup_amount integer;
begin
  select s.free_signup_credits into signup_amount
  from public.billing_settings s where s.id = true;

  for existing_user in select id from auth.users loop
    insert into public.credit_accounts (user_id)
    values (existing_user.id)
    on conflict (user_id) do nothing;

    if coalesce(signup_amount, 0) > 0 then
      perform public.grant_credits_internal(
        existing_user.id,
        'signup_bonus',
        'signup:' || existing_user.id::text,
        signup_amount,
        null,
        'Créditos de bienvenida'
      );
    end if;
  end loop;
end;
$$;

alter table public.billing_settings enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_grants enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.credit_reservation_items enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.stripe_events enable row level security;

revoke all on table public.billing_settings from public, anon, authenticated;
revoke all on table public.billing_customers from public, anon, authenticated;
revoke all on table public.subscriptions from public, anon, authenticated;
revoke all on table public.credit_accounts from public, anon, authenticated;
revoke all on table public.credit_grants from public, anon, authenticated;
revoke all on table public.credit_reservations from public, anon, authenticated;
revoke all on table public.credit_reservation_items from public, anon, authenticated;
revoke all on table public.credit_transactions from public, anon, authenticated;
revoke all on table public.stripe_events from public, anon, authenticated;

grant select on table public.subscriptions to authenticated;
grant select on table public.credit_accounts to authenticated;
grant select on table public.credit_grants to authenticated;
grant select on table public.credit_transactions to authenticated;

create policy "Users view their own subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users view their own credit account"
  on public.credit_accounts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users view their own credit grants"
  on public.credit_grants for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users view their own credit transactions"
  on public.credit_transactions for select to authenticated
  using ((select auth.uid()) = user_id);

do $$
declare
  signature regprocedure;
begin
  foreach signature in array array[
    'public.sync_credit_settings_internal(integer,integer,integer)'::regprocedure,
    'public.grant_credits_internal(uuid,text,text,integer,timestamptz,text)'::regprocedure,
    'public.expire_credits_internal(uuid)'::regprocedure,
    'public.reserve_credits_internal(uuid,integer,text,uuid,text)'::regprocedure,
    'public.consume_reserved_credits_internal(uuid,uuid,text,uuid,text)'::regprocedure,
    'public.release_reserved_credits_internal(uuid,uuid)'::regprocedure,
    'public.grant_subscription_credits_internal(uuid,text,integer,timestamptz,text)'::regprocedure,
    'public.claim_stripe_event_internal(text,text,text,boolean)'::regprocedure,
    'public.finish_stripe_event_internal(text,text,text)'::regprocedure,
    'public.complete_generation_with_credits_internal(uuid,uuid,uuid,text,text,integer,integer,text,text)'::regprocedure,
    'public.complete_edit_version_with_credits_internal(uuid,uuid,uuid,text,text,integer,integer,text,text)'::regprocedure
  ]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', signature);
    execute format('grant execute on function %s to service_role', signature);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
