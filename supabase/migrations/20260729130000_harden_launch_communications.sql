-- Harden launch communication flows without changing previously applied migrations.

alter table public.support_requests
  add column requester_email text;

alter table public.support_requests
  add constraint support_requests_requester_email_check
  check (
    requester_email is null
    or (
      char_length(requester_email) between 3 and 320
      and requester_email like '%_@_%._%'
    )
  );

comment on column public.support_requests.requester_email is
  'Contact address required to answer the support request. Service-role writes only.';

create or replace function public.enqueue_transactional_email_internal(
  p_delivery_id uuid,
  p_job_id uuid,
  p_user_id uuid,
  p_email_type text,
  p_audience text,
  p_idempotency_key text,
  p_data jsonb,
  p_input_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_delivery_id uuid;
  email_payload jsonb;
begin
  if p_delivery_id is null
    or p_job_id is null
    or p_idempotency_key is null
    or char_length(p_idempotency_key) < 4
    or p_audience not in ('user', 'support')
    or (p_audience = 'user' and p_user_id is null)
    or char_length(p_input_hash) <> 64 then
    raise exception 'invalid_email_job';
  end if;

  select id into existing_delivery_id
  from public.email_deliveries
  where idempotency_key = p_idempotency_key;
  if existing_delivery_id is not null then
    return existing_delivery_id;
  end if;

  email_payload := jsonb_build_object(
    'deliveryId', p_delivery_id,
    'audience', p_audience,
    'type', p_email_type,
    'data', coalesce(p_data, '{}'::jsonb)
  );

  insert into public.email_deliveries (
    id, user_id, email_type, idempotency_key
  ) values (
    p_delivery_id, p_user_id, p_email_type, p_idempotency_key
  );

  insert into public.jobs (
    id, user_id, job_type, idempotency_key, resource_id, payload,
    input_hash, priority, max_attempts
  ) values (
    p_job_id, p_user_id, 'send_transactional_email',
    'email:' || p_delivery_id::text, p_delivery_id, email_payload,
    p_input_hash, 50, 4
  );

  insert into public.job_outbox (job_id) values (p_job_id);
  return p_delivery_id;
exception
  when unique_violation then
    select id into existing_delivery_id
    from public.email_deliveries
    where idempotency_key = p_idempotency_key;
    if existing_delivery_id is not null then
      return existing_delivery_id;
    end if;
    raise;
end;
$$;

revoke all on function public.enqueue_transactional_email_internal(
  uuid, uuid, uuid, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.enqueue_transactional_email_internal(
  uuid, uuid, uuid, text, text, text, jsonb, text
) to service_role;
