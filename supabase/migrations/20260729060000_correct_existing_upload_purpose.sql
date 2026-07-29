-- Existing uploads used as edit-session sources are durable, not temporary.
update public.user_uploads u
set purpose = 'edit',
    expires_at = null
where exists (
  select 1
  from public.edit_sessions s
  where s.source_upload_id = u.id
);
