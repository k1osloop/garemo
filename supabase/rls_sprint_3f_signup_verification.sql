-- Garemo Sprint 3F signup role onboarding verification.
-- Run after sprint_3f_public_signup_profiles.sql.
-- Functional auth tests must also be run from normal anon/auth clients.

-- 1) Profile bootstrap RPC exists and is executable by authenticated users.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'create_initial_user_profile';

select
  grantee,
  routine_name,
  privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name = 'create_initial_user_profile'
order by grantee, privilege_type;

-- 2) users_profile stays closed to anon and has no broad client updates.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'users_profile'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 3) Own-profile SELECT policy remains the only profile table policy expected.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'users_profile'
order by policyname;

-- Manual client checks:
-- - anon SELECT users_profile must fail.
-- - anon cannot execute create_initial_user_profile.
-- - authenticated user can call create_initial_user_profile('buyer', ...).
-- - authenticated user can call create_initial_user_profile('owner', ...).
-- - authenticated user cannot call create_initial_user_profile('admin', ...).
-- - existing admin calling the RPC must remain admin; role must not be downgraded or changed.
