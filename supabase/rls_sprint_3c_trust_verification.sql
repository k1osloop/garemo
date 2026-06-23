-- Garemo Sprint 3C trust and contact verification.
-- Run after sprint_3c_trust_ratings_contacts.sql.
-- These checks should be run manually in Supabase SQL Editor and with anon/auth clients.

-- 1. Tables and functions exist.
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('business_reviews', 'whatsapp_clicks')
order by table_name;

select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'get_public_business_trust_summaries',
    'record_whatsapp_click'
  )
order by routine_name;

-- 2. RLS enabled.
select relname, relrowsecurity
from pg_class
where relname in ('business_reviews', 'whatsapp_clicks')
order by relname;

-- 3. Public trust summaries should return visible businesses only.
select *
from public.get_public_business_trust_summaries()
order by business_id;

-- 4. No direct broad table writes should be granted to anon.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('business_reviews', 'whatsapp_clicks')
  and grantee = 'anon'
order by table_name, privilege_type;

-- 5. Client-side checks still required:
-- - anon direct insert into business_reviews must fail.
-- - anon direct insert into whatsapp_clicks must fail.
-- - anon RPC record_whatsapp_click(public business) may succeed.
-- - authenticated non-owner can insert/update one review per visible business.
-- - owner cannot review own business.
-- - admin can hide a review by setting status = 'hidden'.
