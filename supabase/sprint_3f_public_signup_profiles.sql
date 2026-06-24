-- Garemo Sprint 3F public signup role onboarding.
-- Run manually in Supabase SQL Editor after Sprint 3E.
-- Creates a safe profile bootstrap RPC for authenticated users only.
-- No service_role required by the frontend. No auth.users writes. No admin role from UI.

begin;

revoke all on table public.users_profile from anon, authenticated;

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

create policy "user_select_own_profile"
on public.users_profile
for select
to authenticated
using (id = auth.uid());

create or replace function public.create_initial_user_profile(
  requested_role public.user_role,
  requested_full_name text default null
)
returns public.users_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '');
  safe_name text := nullif(btrim(coalesce(requested_full_name, '')), '');
  existing_profile public.users_profile;
  created_profile public.users_profile;
begin
  if caller_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if requested_role not in ('buyer'::public.user_role, 'owner'::public.user_role) then
    raise exception 'Initial role must be buyer or owner'
      using errcode = '22023';
  end if;

  if caller_email is null or position('@' in caller_email) <= 1 then
    raise exception 'Confirmed email is required to create profile'
      using errcode = '22023';
  end if;

  select *
  into existing_profile
  from public.users_profile
  where id = caller_id;

  if existing_profile.id is not null then
    if safe_name is not null and existing_profile.full_name is null then
      update public.users_profile
      set
        full_name = left(safe_name, 120),
        updated_at = now()
      where id = caller_id
      returning * into existing_profile;
    end if;

    return existing_profile;
  end if;

  insert into public.users_profile (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  )
  values (
    caller_id,
    lower(caller_email),
    left(safe_name, 120),
    requested_role,
    'active'::public.user_status,
    now(),
    now()
  )
  returning * into created_profile;

  return created_profile;
end;
$$;

comment on function public.create_initial_user_profile(public.user_role, text) is
  'Creates the initial users_profile row for auth.uid() with buyer/owner only. Existing profiles are returned without role escalation.';

revoke all on function public.create_initial_user_profile(public.user_role, text) from public;
grant execute on function public.create_initial_user_profile(public.user_role, text) to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
