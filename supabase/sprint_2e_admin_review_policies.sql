-- Garemo Sprint 2E admin review policies.
-- Run manually in Supabase SQL Editor after Sprint 2D.
-- Adds a minimal admin review surface without public writes or service_role.

begin;

alter table public.businesses
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text;

alter table public.businesses
  drop constraint if exists businesses_review_notes_length;

alter table public.businesses
  add constraint businesses_review_notes_length check (
    review_notes is null or char_length(review_notes) <= 1000
  );

create index if not exists businesses_status_reviewed_idx
  on public.businesses(status, reviewed_at);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin'::public.user_role;
$$;

comment on function public.is_admin_user() is
  'Returns true when auth.uid() has an active admin users_profile role.';

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- Keep public browser role closed for writes.
revoke insert, update, delete, truncate, references, trigger
  on table public.businesses
  from anon;

-- Admin needs to inspect pending businesses and related public profile data.
grant select on table public.categories to authenticated;
grant select on table public.businesses to authenticated;
grant select on table public.locations to authenticated;
grant select on table public.contact_info to authenticated;
grant select on table public.products to authenticated;

-- Direct owner writes remain column-scoped from Sprint 2B/2D.
-- Sensitive review fields are changed through admin_review_business(), not
-- by granting broad update privileges to every authenticated user.

drop policy if exists "admin_select_review_businesses" on public.businesses;
drop policy if exists "admin_update_review_businesses" on public.businesses;
drop policy if exists "admin_select_review_locations" on public.locations;
drop policy if exists "admin_select_review_contact_info" on public.contact_info;
drop policy if exists "admin_select_review_products" on public.products;

create policy "admin_select_review_businesses"
on public.businesses
for select
to authenticated
using (public.is_admin_user());

create policy "admin_update_review_businesses"
on public.businesses
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin_select_review_locations"
on public.locations
for select
to authenticated
using (public.is_admin_user());

create policy "admin_select_review_contact_info"
on public.contact_info
for select
to authenticated
using (public.is_admin_user());

create policy "admin_select_review_products"
on public.products
for select
to authenticated
using (public.is_admin_user());

create or replace function public.admin_review_business(
  target_business_id uuid,
  next_status public.business_status,
  next_is_verified boolean default false,
  notes text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_business public.businesses;
begin
  if not public.is_admin_user() then
    raise exception 'Only active admin users can review businesses'
      using errcode = '42501';
  end if;

  if next_status not in (
    'active'::public.business_status,
    'rejected'::public.business_status,
    'hidden'::public.business_status,
    'pending_review'::public.business_status
  ) then
    raise exception 'Invalid review status'
      using errcode = '22023';
  end if;

  update public.businesses
  set
    status = next_status,
    is_verified = case
      when next_status = 'active'::public.business_status then coalesce(next_is_verified, false)
      else false
    end,
    reviewed_at = now(),
    review_notes = nullif(btrim(coalesce(notes, '')), ''),
    updated_at = now()
  where id = target_business_id
  returning * into reviewed_business;

  if reviewed_business.id is null then
    raise exception 'Business not found'
      using errcode = 'P0002';
  end if;

  return reviewed_business;
end;
$$;

comment on function public.admin_review_business(uuid, public.business_status, boolean, text) is
  'Reviews a business as active/rejected/hidden/pending_review after checking users_profile admin role.';

revoke all on function public.admin_review_business(uuid, public.business_status, boolean, text) from public;
grant execute on function public.admin_review_business(uuid, public.business_status, boolean, text) to authenticated;

commit;
