-- Exact account-wide storage usage. Recent-file lists remain presentation only.
create or replace function public.get_storage_usage_internal(p_user_id uuid)
returns table (
  used_bytes bigint,
  pinned_bytes bigint,
  active_count bigint,
  pinned_count bigint,
  temporary_count bigint,
  expiring_soon_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select
    coalesce(sum(a.file_size_bytes) filter (where a.status = 'active'), 0)::bigint,
    coalesce(sum(a.file_size_bytes) filter (where a.status = 'active' and a.pinned_at is not null), 0)::bigint,
    count(*) filter (where a.status = 'active')::bigint,
    count(*) filter (where a.status = 'active' and a.pinned_at is not null)::bigint,
    count(*) filter (where a.status = 'active' and a.kind in ('temporary_processing', 'user_upload'))::bigint,
    count(*) filter (where a.status = 'active' and a.expires_at is not null and a.expires_at <= now() + interval '7 days')::bigint
  from public.assets a
  where a.user_id = p_user_id
    and ((select auth.uid()) = p_user_id or (select auth.role()) = 'service_role');
$$;

revoke all on function public.get_storage_usage_internal(uuid) from public, anon;
grant execute on function public.get_storage_usage_internal(uuid) to authenticated, service_role;
notify pgrst, 'reload schema';
