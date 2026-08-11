alter table public.profiles
  add column if not exists mfa_reminder_disabled boolean not null default false;

comment on column public.profiles.mfa_reminder_disabled is
  'True when the user permanently dismisses the optional MFA security reminder.';
