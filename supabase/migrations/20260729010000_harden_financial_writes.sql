revoke update on table public.generations from authenticated;
revoke update on table public.edit_versions from authenticated;

revoke all on function public.complete_edit_version(
  uuid, text, text, integer, integer, text, text
) from public, anon, authenticated;

notify pgrst, 'reload schema';
