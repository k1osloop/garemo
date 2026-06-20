-- Garemo Sprint 2E admin review verification helper.
-- Run in Supabase SQL Editor after sprint_2e_admin_review_policies.sql.
-- Functional role checks should also be run from normal anon/auth clients.

-- Businesses should now include review metadata.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'businesses'
  and column_name in ('reviewed_at', 'review_notes', 'status', 'is_verified')
order by column_name;

-- Admin review policies should exist.
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
  and policyname like 'admin_%review%'
order by tablename, policyname;

-- RPC functions should be executable only by authenticated/browser session users.
select
  routine_schema,
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('is_admin_user', 'admin_review_business')
order by routine_name;

-- Public writes should not exist.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in ('businesses', 'locations', 'contact_info', 'products')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

-- Sensitive direct column grants should not be broadly available to anon.
select
  grantee,
  table_name,
  column_name,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'businesses'
  and grantee = 'anon'
  and column_name in ('status', 'is_verified', 'owner_id', 'reviewed_at', 'review_notes')
  and privilege_type in ('INSERT', 'UPDATE');
