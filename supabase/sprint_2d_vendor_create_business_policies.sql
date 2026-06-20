-- Garemo Sprint 2D vendor first-business creation policies.
-- Run manually in Supabase SQL Editor after Sprint 2B.
-- Reasserts safe authenticated INSERT for a vendor's own first business.
-- No public writes. No service_role required by the frontend. No DELETE.

begin;

grant usage on schema public to authenticated;

-- Keep browser roles from writing publicly.
revoke insert, update, delete, truncate, references, trigger
  on table public.businesses
  from anon;

-- Keep authenticated writes column-scoped. `is_verified`, `created_at`, and
-- arbitrary owner/status changes are intentionally not writable from the UI.
revoke insert, update, delete, truncate, references, trigger
  on table public.businesses
  from authenticated;

grant select on table public.categories to authenticated;
grant select on table public.businesses to authenticated;
grant select on table public.locations to authenticated;
grant select on table public.contact_info to authenticated;

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

drop policy if exists "owner_insert_own_businesses" on public.businesses;
drop policy if exists "owner_update_own_businesses" on public.businesses;

create policy "owner_insert_own_businesses"
on public.businesses
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.is_vendor_user()
  and status = 'pending_review'::public.business_status
  and is_verified = false
);

create policy "owner_update_own_businesses"
on public.businesses
for update
to authenticated
using (owner_id = auth.uid() and public.is_vendor_user())
with check (
  owner_id = auth.uid()
  and public.is_vendor_user()
);

-- The related one-to-one rows use the owner-only policies from Sprint 2B:
-- locations.business_id and contact_info.business_id must belong to auth.uid().

commit;
