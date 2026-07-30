-- Reconcile account counters with their authoritative credit grants.
--
-- During the billing rollout, an account counter could retain a legacy
-- balance that was not represented by consumable grants. Preserve balances
-- already shown to users by converting any positive discrepancy into an
-- idempotent manual-adjustment grant.

begin;

do $$
declare
  selected_account record;
  ledger_available integer;
  ledger_reserved integer;
  unbacked_balance integer;
begin
  for selected_account in
    select a.user_id, a.available_balance
    from public.credit_accounts a
    order by a.user_id
    for update
  loop
    select
      coalesce(sum(g.remaining_amount) filter (
        where g.expires_at is null or g.expires_at > now()
      ), 0)::integer,
      coalesce(sum(g.reserved_amount), 0)::integer
    into ledger_available, ledger_reserved
    from public.credit_grants g
    where g.user_id = selected_account.user_id;

    unbacked_balance :=
      greatest(0, selected_account.available_balance - ledger_available);

    update public.credit_accounts
    set
      available_balance = ledger_available,
      reserved_balance = ledger_reserved,
      updated_at = now()
    where user_id = selected_account.user_id;

    if unbacked_balance > 0 then
      perform public.grant_credits_internal(
        selected_account.user_id,
        'manual_adjustment',
        'ledger-reconcile:20260730100000:' || selected_account.user_id::text,
        unbacked_balance,
        null,
        'Reconciliación de saldo anterior'
      );
    end if;
  end loop;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.credit_accounts a
    left join lateral (
      select
        coalesce(sum(g.remaining_amount) filter (
          where g.expires_at is null or g.expires_at > now()
        ), 0)::integer as available_balance,
        coalesce(sum(g.reserved_amount), 0)::integer as reserved_balance
      from public.credit_grants g
      where g.user_id = a.user_id
    ) ledger on true
    where a.available_balance <> ledger.available_balance
      or a.reserved_balance <> ledger.reserved_balance
  ) then
    raise exception 'credit_ledger_reconciliation_failed';
  end if;
end;
$$;

commit;
