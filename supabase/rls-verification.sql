-- Garemo RLS verification queries.
-- Run after schema.sql, seed.sql, and policies.sql.
-- These checks are read-only and should not create or modify data.

-- 1. Confirm RLS is enabled for every application table.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'users_profile',
    'categories',
    'businesses',
    'locations',
    'schedules',
    'business_images',
    'contact_info',
    'favorites',
    'reports'
  )
order by c.relname;

-- 2. Confirm active public categories are visible.
select
  id,
  name,
  slug,
  sort_order
from public.categories
where is_active = true
order by sort_order, name;

-- 3. Confirm public businesses are filtered to active businesses only.
select
  b.id,
  b.name,
  b.slug,
  b.status,
  c.name as category_name
from public.businesses b
join public.categories c on c.id = b.category_id
where public.is_public_business(b.id)
order by b.name;

-- 4. Confirm the exact public read policies that should exist.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in (
    'categories',
    'businesses',
    'locations',
    'schedules',
    'business_images',
    'contact_info'
  )
order by tablename, policyname;

-- 5. This should return zero rows: no public INSERT/UPDATE/DELETE/ALL policies.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and (
    roles @> array['anon']::name[]
    or roles @> array['authenticated']::name[]
    or roles @> array['public']::name[]
  )
  and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
order by tablename, policyname;

-- 6. This should return zero rows: private tables must not have public policies.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in ('users_profile', 'favorites', 'reports')
  and (
    roles @> array['anon']::name[]
    or roles @> array['authenticated']::name[]
    or roles @> array['public']::name[]
  )
order by tablename, policyname;

-- 7. This should return zero rows: browser roles should not have table write grants.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
order by grantee, table_name, privilege_type;

-- 8. Confirm browser roles only have SELECT grants on public directory tables.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'categories',
    'businesses',
    'locations',
    'schedules',
    'business_images',
    'contact_info'
  )
order by grantee, table_name, privilege_type;

-- 9. Optional role simulation for SQL Editor.
-- Expected: active categories are readable as anon.
begin;
set local role anon;
select
  count(*) as visible_categories_as_anon
from public.categories;
rollback;
