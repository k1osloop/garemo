-- Garemo Sprint 2D RLS verification helper.
-- Run manually in Supabase SQL Editor for policy inspection.
-- Functional anon/auth checks should also be run from a normal anon client.

-- Expected policies for business creation.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('businesses', 'locations', 'contact_info')
order by tablename, policyname;

-- Expected column grants: authenticated can insert only safe business columns.
select
  grantee,
  table_name,
  column_name,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'businesses'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE')
order by grantee, privilege_type, column_name;

-- Sensitive columns should not appear as INSERT/UPDATE grants for authenticated.
select
  column_name,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'businesses'
  and grantee = 'authenticated'
  and column_name in ('is_verified', 'created_at')
  and privilege_type in ('INSERT', 'UPDATE');

-- Public writes should not exist.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in ('businesses', 'locations', 'contact_info')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE');
