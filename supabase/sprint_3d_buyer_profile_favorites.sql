-- Garemo Sprint 3D buyer profile and favorites policies.
-- Run manually in Supabase SQL Editor after Sprint 3C.
-- Adds private favorites and own-profile read without public writes.
-- No service_role required by the frontend. No public favorite metrics.

begin;

alter table public.favorites
  add column if not exists updated_at timestamptz not null default now();

create index if not exists favorites_user_created_idx
  on public.favorites(user_id, created_at desc);

comment on table public.favorites is
  'Private saved businesses for authenticated users. Favorites are not exposed as public ranking metrics.';

alter table public.favorites enable row level security;

revoke all on table public.favorites from anon, authenticated;

grant select on table public.favorites to authenticated;
grant insert (
  user_id,
  business_id,
  created_at,
  updated_at
) on public.favorites to authenticated;
grant delete on table public.favorites to authenticated;

-- Allow users to read only their own application profile. No profile update
-- grants are added, so users cannot change role or self-promote to admin.
grant select (
  id,
  email,
  full_name,
  role,
  phone,
  status,
  created_at,
  updated_at
) on public.users_profile to authenticated;

drop policy if exists "user_select_own_profile" on public.users_profile;
drop policy if exists "user_select_own_favorites" on public.favorites;
drop policy if exists "user_insert_own_public_favorites" on public.favorites;
drop policy if exists "user_delete_own_favorites" on public.favorites;

create policy "user_select_own_profile"
on public.users_profile
for select
to authenticated
using (id = auth.uid());

create policy "user_select_own_favorites"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

create policy "user_insert_own_public_favorites"
on public.favorites
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_public_business(business_id)
);

create policy "user_delete_own_favorites"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

-- Keep anonymous users closed for favorites and profiles.
revoke insert, update, delete, truncate, references, trigger
  on table public.favorites
  from anon;
revoke select, insert, update, delete, truncate, references, trigger
  on table public.users_profile
  from anon;

select pg_notify('pgrst', 'reload schema');

commit;
