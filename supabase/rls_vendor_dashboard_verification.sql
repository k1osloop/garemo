-- Garemo Sprint 2B RLS verification queries.
-- Run manually in Supabase SQL Editor after sprint_2b_vendor_dashboard_policies.sql.
-- These checks inspect policy/grant shape. Runtime auth-user checks should also be tested from the app.

-- 1) Owner/dashboard policies should exist.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and policyname like 'owner_%'
order by tablename, policyname;

-- 2) Public browser roles must not have DELETE on dashboard tables.
select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'businesses',
    'products',
    'locations',
    'schedules',
    'contact_info',
    'business_images'
  )
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'DELETE'
order by grantee, table_name;

-- 3) Anonymous role must not have public writes.
select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'businesses',
    'products',
    'locations',
    'schedules',
    'contact_info',
    'business_images'
  )
  and grantee = 'anon'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by table_name, privilege_type;

-- 4) Authenticated role may have INSERT/UPDATE, but RLS policies restrict rows to auth.uid() ownership.
select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'businesses',
    'products',
    'locations',
    'schedules',
    'contact_info',
    'business_images'
  )
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by table_name, privilege_type;

-- 5) Helper functions should be executable only by authenticated.
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'current_app_role',
    'is_vendor_user',
    'owns_business'
  )
order by routine_name, grantee;
