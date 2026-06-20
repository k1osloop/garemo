-- Garemo Sprint 2B vendor dashboard owner-only RLS policies.
-- Run manually in Supabase SQL Editor after Sprint 2A.
-- Enables authenticated writes only for data owned by auth.uid().
-- Does not open public writes and does not grant DELETE.

begin;

grant usage on schema public to authenticated;

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users_profile
  where id = auth.uid()
    and status = 'active'::public.user_status;
$$;

comment on function public.current_app_role() is
  'Returns the active application role for auth.uid(). Used by authenticated owner-only RLS policies.';

create or replace function public.is_vendor_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('owner'::public.user_role, 'admin'::public.user_role);
$$;

comment on function public.is_vendor_user() is
  'Returns true when auth.uid() is an active owner or admin profile.';

create or replace function public.owns_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
      and public.is_vendor_user()
  );
$$;

comment on function public.owns_business(uuid) is
  'Returns true when auth.uid() owns the requested business and has owner/admin role.';

revoke all on function public.current_app_role() from public;
revoke all on function public.is_vendor_user() from public;
revoke all on function public.owns_business(uuid) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_vendor_user() to authenticated;
grant execute on function public.owns_business(uuid) to authenticated;

-- Keep private tables closed to public browser roles unless explicitly handled later.
revoke all on table public.users_profile from anon, authenticated;
revoke all on table public.favorites from anon, authenticated;
revoke all on table public.reports from anon, authenticated;

-- Ensure no public writes are available.
revoke insert, update, delete, truncate, references, trigger
  on table public.businesses
  from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.products
  from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.locations
  from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.schedules
  from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.contact_info
  from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.business_images
  from anon;

-- Reset broad authenticated writes before granting a narrower dashboard surface.
revoke insert, update, delete, truncate, references, trigger
  on table public.businesses
  from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.products
  from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.locations
  from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.schedules
  from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.contact_info
  from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.business_images
  from authenticated;

-- Public SELECT grants already exist for visible rows. Authenticated owners need SELECT on own pending/hidden rows too.
grant select on table public.businesses to authenticated;
grant select on table public.products to authenticated;
grant select on table public.locations to authenticated;
grant select on table public.schedules to authenticated;
grant select on table public.contact_info to authenticated;
grant select on table public.business_images to authenticated;
grant select on table public.categories to authenticated;

-- Column-level authenticated write grants. No DELETE is granted.
grant insert (
  owner_id,
  category_id,
  name,
  slug,
  description,
  status,
  price_range,
  status_message,
  opens_at,
  closes_at
) on public.businesses to authenticated;

grant update (
  category_id,
  name,
  slug,
  description,
  price_range,
  status_message,
  opens_at,
  closes_at,
  updated_at
) on public.businesses to authenticated;

grant insert (
  business_id,
  name,
  description,
  price,
  offer_price,
  image_url,
  is_available,
  stock_label
) on public.products to authenticated;

grant update (
  name,
  description,
  price,
  offer_price,
  image_url,
  is_available,
  stock_label,
  updated_at
) on public.products to authenticated;

grant insert (
  business_id,
  address_text,
  campus_zone,
  latitude,
  longitude
) on public.locations to authenticated;

grant update (
  address_text,
  campus_zone,
  latitude,
  longitude,
  updated_at
) on public.locations to authenticated;

grant insert (
  business_id,
  day_of_week,
  opens_at,
  closes_at,
  is_closed
) on public.schedules to authenticated;

grant update (
  opens_at,
  closes_at,
  is_closed,
  updated_at
) on public.schedules to authenticated;

grant insert (
  business_id,
  whatsapp_number,
  instagram_url,
  facebook_url,
  website_url
) on public.contact_info to authenticated;

grant update (
  whatsapp_number,
  instagram_url,
  facebook_url,
  website_url,
  updated_at
) on public.contact_info to authenticated;

grant insert (
  business_id,
  storage_path,
  public_url,
  alt_text,
  sort_order
) on public.business_images to authenticated;

grant update (
  storage_path,
  public_url,
  alt_text,
  sort_order
) on public.business_images to authenticated;

drop policy if exists "owner_select_own_businesses" on public.businesses;
drop policy if exists "owner_insert_own_businesses" on public.businesses;
drop policy if exists "owner_update_own_businesses" on public.businesses;
drop policy if exists "owner_select_own_products" on public.products;
drop policy if exists "owner_insert_own_products" on public.products;
drop policy if exists "owner_update_own_products" on public.products;
drop policy if exists "owner_select_own_locations" on public.locations;
drop policy if exists "owner_insert_own_locations" on public.locations;
drop policy if exists "owner_update_own_locations" on public.locations;
drop policy if exists "owner_select_own_schedules" on public.schedules;
drop policy if exists "owner_insert_own_schedules" on public.schedules;
drop policy if exists "owner_update_own_schedules" on public.schedules;
drop policy if exists "owner_select_own_contact_info" on public.contact_info;
drop policy if exists "owner_insert_own_contact_info" on public.contact_info;
drop policy if exists "owner_update_own_contact_info" on public.contact_info;
drop policy if exists "owner_select_own_business_images" on public.business_images;
drop policy if exists "owner_insert_own_business_images" on public.business_images;
drop policy if exists "owner_update_own_business_images" on public.business_images;

create policy "owner_select_own_businesses"
on public.businesses
for select
to authenticated
using (owner_id = auth.uid() and public.is_vendor_user());

create policy "owner_insert_own_businesses"
on public.businesses
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.is_vendor_user()
  and status = 'pending_review'::public.business_status
);

create policy "owner_update_own_businesses"
on public.businesses
for update
to authenticated
using (owner_id = auth.uid() and public.is_vendor_user())
with check (owner_id = auth.uid() and public.is_vendor_user());

create policy "owner_select_own_products"
on public.products
for select
to authenticated
using (public.owns_business(business_id));

create policy "owner_insert_own_products"
on public.products
for insert
to authenticated
with check (public.owns_business(business_id));

create policy "owner_update_own_products"
on public.products
for update
to authenticated
using (public.owns_business(business_id))
with check (public.owns_business(business_id));

create policy "owner_select_own_locations"
on public.locations
for select
to authenticated
using (public.owns_business(business_id));

create policy "owner_insert_own_locations"
on public.locations
for insert
to authenticated
with check (public.owns_business(business_id));

create policy "owner_update_own_locations"
on public.locations
for update
to authenticated
using (public.owns_business(business_id))
with check (public.owns_business(business_id));

create policy "owner_select_own_schedules"
on public.schedules
for select
to authenticated
using (public.owns_business(business_id));

create policy "owner_insert_own_schedules"
on public.schedules
for insert
to authenticated
with check (public.owns_business(business_id));

create policy "owner_update_own_schedules"
on public.schedules
for update
to authenticated
using (public.owns_business(business_id))
with check (public.owns_business(business_id));

create policy "owner_select_own_contact_info"
on public.contact_info
for select
to authenticated
using (public.owns_business(business_id));

create policy "owner_insert_own_contact_info"
on public.contact_info
for insert
to authenticated
with check (public.owns_business(business_id));

create policy "owner_update_own_contact_info"
on public.contact_info
for update
to authenticated
using (public.owns_business(business_id))
with check (public.owns_business(business_id));

create policy "owner_select_own_business_images"
on public.business_images
for select
to authenticated
using (public.owns_business(business_id));

create policy "owner_insert_own_business_images"
on public.business_images
for insert
to authenticated
with check (public.owns_business(business_id));

create policy "owner_update_own_business_images"
on public.business_images
for update
to authenticated
using (public.owns_business(business_id))
with check (public.owns_business(business_id));

commit;
