-- Garemo Sprint 3E Storage verification.
-- Run after sprint_3e_secure_image_uploads.sql.
-- SQL-level checks are informational; client tests must verify auth.uid().

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'garemo-images';

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like '%garemo_images%'
order by policyname;

select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'can_manage_garemo_image_object';

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('products', 'business_images')
  and column_name in ('image_url', 'image_path', 'storage_path', 'public_url')
order by table_name, ordinal_position;

select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('products', 'business_images')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Expected client-side checks:
-- - anon upload to garemo-images must fail.
-- - owner upload to businesses/{own_business_id}/cover/*.webp must succeed.
-- - owner upload to businesses/{other_business_id}/cover/*.webp must fail.
-- - owner upload to businesses/{own_business_id}/products/{own_product_id}/*.webp must succeed.
-- - owner upload to a product not owned by them must fail.
-- - SVG, empty files, and files over 2MB must be blocked by frontend and bucket limits.
