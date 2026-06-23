-- Garemo Sprint 3E secure image uploads.
-- Run manually in Supabase SQL Editor after Sprint 3D.
-- Creates a public Storage bucket with owner-only writes.
-- No service_role required by the frontend. SVG and large files are rejected.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'garemo-images',
  'garemo-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.products
  add column if not exists image_path text;

alter table public.products
  drop constraint if exists products_image_path_length;

alter table public.products
  add constraint products_image_path_length check (
    image_path is null or char_length(image_path) <= 500
  );

comment on column public.products.image_path is
  'Supabase Storage object path for product images in garemo-images bucket.';

grant update (
  image_url,
  image_path,
  updated_at
) on public.products to authenticated;

grant insert (
  business_id,
  name,
  description,
  price,
  offer_price,
  image_url,
  image_path,
  is_available,
  stock_label
) on public.products to authenticated;

create or replace function public.can_manage_garemo_image_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  path_parts text[];
  target_business_id uuid;
  target_product_id uuid;
  safe_name text;
begin
  safe_name := coalesce(object_name, '');

  if lower(safe_name) !~ '^businesses/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover|products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/[a-z0-9._-]+[.](jpg|jpeg|png|webp)$' then
    return false;
  end if;

  path_parts := string_to_array(safe_name, '/');
  target_business_id := path_parts[2]::uuid;

  if not public.owns_business(target_business_id) then
    return false;
  end if;

  if array_length(path_parts, 1) = 4 and path_parts[3] = 'cover' then
    return true;
  end if;

  if array_length(path_parts, 1) = 5 and path_parts[3] = 'products' then
    target_product_id := path_parts[4]::uuid;

    return exists (
      select 1
      from public.products p
      where p.id = target_product_id
        and p.business_id = target_business_id
        and public.owns_business(p.business_id)
    );
  end if;

  return false;
end;
$$;

comment on function public.can_manage_garemo_image_object(text) is
  'Checks if auth.uid() can write a Storage object under businesses/{business_id}/cover or products/{product_id}.';

revoke all on function public.can_manage_garemo_image_object(text) from public;
grant execute on function public.can_manage_garemo_image_object(text) to authenticated;

drop policy if exists "public_read_garemo_images" on storage.objects;
drop policy if exists "owner_insert_garemo_images" on storage.objects;
drop policy if exists "owner_update_garemo_images" on storage.objects;
drop policy if exists "owner_delete_garemo_images" on storage.objects;

create policy "public_read_garemo_images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'garemo-images');

create policy "owner_insert_garemo_images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'garemo-images'
  and public.can_manage_garemo_image_object(name)
);

create policy "owner_update_garemo_images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'garemo-images'
  and public.can_manage_garemo_image_object(name)
)
with check (
  bucket_id = 'garemo-images'
  and public.can_manage_garemo_image_object(name)
);

create policy "owner_delete_garemo_images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'garemo-images'
  and public.can_manage_garemo_image_object(name)
);

select pg_notify('pgrst', 'reload schema');

commit;
