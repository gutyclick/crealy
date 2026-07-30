create table if not exists public.tool_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed')),
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  image_mime_type text not null,
  model text not null,
  result jsonb,
  error_code text,
  credit_transaction_id uuid
    references public.credit_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, client_request_id)
);

create index if not exists tool_analysis_requests_user_created_idx
  on public.tool_analysis_requests (user_id, created_at desc);

alter table public.tool_analysis_requests enable row level security;
revoke all on table public.tool_analysis_requests
  from public, anon, authenticated;

create or replace function public.consume_tool_analysis_credit_internal(
  p_user_id uuid,
  p_reference_id uuid,
  p_amount integer
)
returns table (
  transaction_id uuid,
  consumed_amount integer,
  credits_remaining integer,
  is_existing boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_transaction public.credit_transactions%rowtype;
  selected_grant record;
  selected_amount integer;
  amount_left integer := p_amount;
  account_balance integer;
begin
  if p_amount <= 0 or p_amount > 100 then
    raise exception 'invalid_credit_amount';
  end if;

  select t.* into existing_transaction
  from public.credit_transactions as t
  where t.user_id = p_user_id
    and t.idempotency_key =
      'consume:thumbnail_analysis:' || p_reference_id::text
  for update;

  if found then
    return query select
      existing_transaction.id,
      -existing_transaction.amount,
      existing_transaction.balance_after,
      true;
    return;
  end if;

  perform public.expire_credits_internal(p_user_id);

  select a.available_balance into account_balance
  from public.credit_accounts as a
  where a.user_id = p_user_id
  for update;

  if account_balance is null or account_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;

  for selected_grant in
    select g.id, g.remaining_amount
    from public.credit_grants as g
    where g.user_id = p_user_id
      and g.remaining_amount > 0
      and (g.expires_at is null or g.expires_at > now())
    order by g.expires_at asc nulls last, g.created_at, g.id
    for update
  loop
    exit when amount_left = 0;
    selected_amount := least(amount_left, selected_grant.remaining_amount);
    update public.credit_grants as g
    set remaining_amount = g.remaining_amount - selected_amount
    where g.id = selected_grant.id;
    amount_left := amount_left - selected_amount;
  end loop;

  if amount_left <> 0 then
    raise exception 'credit_allocation_failed';
  end if;

  update public.credit_accounts as a
  set
    available_balance = a.available_balance - p_amount,
    lifetime_consumed = a.lifetime_consumed + p_amount,
    updated_at = now()
  where a.user_id = p_user_id
  returning a.available_balance into credits_remaining;

  insert into public.credit_transactions (
    user_id, transaction_type, amount, balance_after, reference_type,
    reference_id, idempotency_key, description
  )
  values (
    p_user_id, 'consume', -p_amount, credits_remaining,
    'thumbnail_analysis', p_reference_id,
    'consume:thumbnail_analysis:' || p_reference_id::text,
    'Análisis visual de miniatura'
  )
  returning id into transaction_id;

  consumed_amount := p_amount;
  is_existing := false;
  return next;
end;
$$;

revoke all on function public.consume_tool_analysis_credit_internal(
  uuid, uuid, integer
) from public, anon, authenticated;
grant execute on function public.consume_tool_analysis_credit_internal(
  uuid, uuid, integer
) to service_role;

notify pgrst, 'reload schema';
