alter table public.subscriptions drop constraint if exists subscriptions_plan_key_check;
alter table public.subscriptions add constraint subscriptions_plan_key_check check (plan_key in ('starter', 'pro', 'business'));

create or replace function public.grant_subscription_credits_internal(
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
  if p_plan_key not in ('starter', 'pro', 'business') then raise exception 'invalid_plan'; end if;
  select g.id into existing_grant_id from public.credit_grants g where g.user_id = p_user_id and g.source_type = 'subscription_cycle' and g.source_reference = p_invoice_id;
  if found then return existing_grant_id; end if;
  insert into public.credit_accounts (user_id) values (p_user_id) on conflict (user_id) do nothing;
  perform 1 from public.credit_accounts where user_id = p_user_id for update;
  for selected_grant in select g.id, g.remaining_amount from public.credit_grants g where g.user_id = p_user_id and g.source_type = 'subscription_cycle' and g.remaining_amount > 0 for update
  loop
    update public.credit_grants set remaining_amount = 0 where id = selected_grant.id;
    update public.credit_accounts set available_balance = available_balance - selected_grant.remaining_amount, updated_at = now() where user_id = p_user_id returning available_balance into next_balance;
    insert into public.credit_transactions (user_id, grant_id, transaction_type, amount, balance_after, reference_type, idempotency_key, description)
    values (p_user_id, selected_grant.id, 'expire', -selected_grant.remaining_amount, next_balance, 'subscription_cycle', 'expire-cycle:' || selected_grant.id::text, 'Créditos del ciclo anterior vencidos')
    on conflict (user_id, idempotency_key) where idempotency_key is not null do nothing;
  end loop;
  return public.grant_credits_internal(p_user_id, 'subscription_cycle', p_invoice_id, p_amount, p_expires_at, 'Renovación del plan ' || initcap(p_plan_key));
end;
$$;
