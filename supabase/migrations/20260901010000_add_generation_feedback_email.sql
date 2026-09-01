alter table public.email_deliveries
  drop constraint if exists email_deliveries_email_type_check;

alter table public.email_deliveries
  add constraint email_deliveries_email_type_check check (
    email_type in (
      'welcome', 'generation_ready', 'edit_ready', 'asset_expiring',
      'low_credits', 'subscription_active', 'payment_failed',
      'credit_gift', 'support_received', 'support_internal',
      'generation_feedback_internal'
    )
  );
