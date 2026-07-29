create or replace function public.reserve_credits_internal(
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
  if p_idempotency_key is null
    or char_length(p_idempotency_key) not between 8 and 180 then
    raise exception 'invalid_idempotency_key';
  end if;

  select r.* into existing_reservation
  from public.credit_reservations as r
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
    from public.credit_accounts as a
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
  from public.credit_accounts as a
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
    set
      remaining_amount = g.remaining_amount - selected_amount,
      reserved_amount = g.reserved_amount + selected_amount
    where g.id = selected_grant.id;

    insert into public.credit_reservation_items (
      reservation_id, grant_id, amount
    )
    values (reservation_id, selected_grant.id, selected_amount);

    amount_left := amount_left - selected_amount;
  end loop;

  if amount_left <> 0 then
    raise exception 'credit_allocation_failed';
  end if;

  update public.credit_accounts as a
  set
    available_balance = a.available_balance - p_amount,
    reserved_balance = a.reserved_balance + p_amount,
    updated_at = now()
  where a.user_id = p_user_id
  returning a.available_balance into credits_remaining;

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

revoke all on function public.reserve_credits_internal(
  uuid, integer, text, uuid, text
) from public, anon, authenticated;

grant execute on function public.reserve_credits_internal(
  uuid, integer, text, uuid, text
) to service_role;

notify pgrst, 'reload schema';
