-- Garemo public read RLS policies.
-- Run this manually after schema.sql and seed.sql.
-- This file allows controlled public SELECT access only.
-- It does not create public INSERT, UPDATE, or DELETE policies.

begin;

-- Make reruns deterministic if the policy file is applied more than once.
drop policy if exists "public_read_active_categories" on public.categories;
drop policy if exists "public_read_active_businesses" on public.businesses;
drop policy if exists "public_read_visible_business_locations" on public.locations;
drop policy if exists "public_read_visible_business_schedules" on public.schedules;
drop policy if exists "public_read_visible_business_images" on public.business_images;
drop policy if exists "public_read_visible_business_contact_info" on public.contact_info;

-- Keep private tables closed to browser roles unless explicit future policies are added.
revoke all on table public.users_profile from anon, authenticated;
revoke all on table public.favorites from anon, authenticated;
revoke all on table public.reports from anon, authenticated;

-- Grant only read privileges to the public directory tables.
grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.businesses to anon, authenticated;
grant select on table public.locations to anon, authenticated;
grant select on table public.schedules to anon, authenticated;
grant select on table public.business_images to anon, authenticated;
grant select on table public.contact_info to anon, authenticated;

-- Remove public write and table-management privileges defensively, even if they were never granted.
revoke insert, update, delete, truncate, references, trigger
  on table public.categories
  from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.businesses
  from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.locations
  from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.schedules
  from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.business_images
  from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.contact_info
  from anon, authenticated;

-- Helper used by related-table policies. It exposes only a boolean visibility check.
create or replace function public.is_public_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    join public.categories c on c.id = b.category_id
    where b.id = target_business_id
      and b.status = 'active'::public.business_status
      and c.is_active = true
  );
$$;

comment on function public.is_public_business(uuid) is
  'Returns true when a business is active and its category is active. Used by public read RLS policies.';

revoke all on function public.is_public_business(uuid) from public;
grant execute on function public.is_public_business(uuid) to anon, authenticated;

-- Public directory categories: only active categories should be visible in the app.
create policy "public_read_active_categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

-- Public businesses: only active businesses in active categories are visible.
create policy "public_read_active_businesses"
on public.businesses
for select
to anon, authenticated
using (public.is_public_business(id));

-- Related public data is readable only when the parent business is visible.
create policy "public_read_visible_business_locations"
on public.locations
for select
to anon, authenticated
using (public.is_public_business(business_id));

create policy "public_read_visible_business_schedules"
on public.schedules
for select
to anon, authenticated
using (public.is_public_business(business_id));

create policy "public_read_visible_business_images"
on public.business_images
for select
to anon, authenticated
using (public.is_public_business(business_id));

create policy "public_read_visible_business_contact_info"
on public.contact_info
for select
to anon, authenticated
using (public.is_public_business(business_id));

commit;
