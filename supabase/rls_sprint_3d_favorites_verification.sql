-- Garemo Sprint 3D favorites verification.
-- Run after sprint_3d_buyer_profile_favorites.sql.
-- SQL-level checks are informational; client tests must verify auth.uid().

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('favorites', 'users_profile')
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('favorites', 'users_profile')
order by tablename, policyname;

select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('favorites', 'users_profile')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Expected client-side checks:
-- - anon SELECT/INSERT favorites must fail.
-- - anon SELECT users_profile must fail.
-- - authenticated user can SELECT/INSERT/DELETE only their own favorites.
-- - authenticated user cannot favorite hidden/rejected/pending businesses.
-- - authenticated user can SELECT only their own users_profile row.
-- - no authenticated UPDATE grant exists on users_profile, so role cannot be changed from frontend.
