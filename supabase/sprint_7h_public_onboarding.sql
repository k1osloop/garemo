-- Garemo Sprint 7H public role onboarding.
-- Run manually in Supabase SQL Editor before deploying the Sprint 7H frontend.
-- No service_role required by the frontend. No auth.users writes. No admin role from UI.

begin;

alter table public.users_profile
  add column if not exists onboarding_completed boolean not null default false;

alter table public.users_profile
  add column if not exists selected_role_at timestamptz;

comment on column public.users_profile.onboarding_completed is
  'True after the user has explicitly selected buyer/owner onboarding or already had a trusted role.';

comment on column public.users_profile.selected_role_at is
  'Timestamp when the user selected buyer/owner onboarding.';

-- Do not block existing users. Only new users without a completed profile should
-- see the onboarding choice.
update public.users_profile
set
  onboarding_completed = true,
  selected_role_at = coalesce(selected_role_at, created_at, now()),
  updated_at = now()
where onboarding_completed = false;

grant select (
  id,
  email,
  full_name,
  role,
  phone,
  status,
  onboarding_completed,
  selected_role_at,
  created_at,
  updated_at
) on public.users_profile to authenticated;

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
    onboarding_completed,
    selected_role_at,
    created_at,
    updated_at
  )
  values (
    caller_id,
    lower(caller_email),
    left(safe_name, 120),
    requested_role,
    'active'::public.user_status,
    true,
    now(),
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

create or replace function public.update_my_role(selected_role text)
returns public.users_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '');
  safe_role public.user_role;
  current_profile public.users_profile;
  updated_profile public.users_profile;
begin
  if caller_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if selected_role not in ('buyer', 'owner') then
    raise exception 'Role must be buyer or owner'
      using errcode = '22023';
  end if;

  safe_role := selected_role::public.user_role;

  select *
  into current_profile
  from public.users_profile
  where id = caller_id;

  if current_profile.id is not null and current_profile.role = 'admin'::public.user_role then
    update public.users_profile
    set
      onboarding_completed = true,
      selected_role_at = coalesce(selected_role_at, now()),
      updated_at = now()
    where id = caller_id
    returning * into updated_profile;

    return updated_profile;
  end if;

  if current_profile.id is not null and current_profile.status in (
    'disabled'::public.user_status,
    'under_review'::public.user_status
  ) then
    raise exception 'User cannot update role due to account status'
      using errcode = '42501';
  end if;

  if current_profile.id is null then
    if caller_email is null or position('@' in caller_email) <= 1 then
      raise exception 'Confirmed email is required to create profile'
        using errcode = '22023';
    end if;

    insert into public.users_profile (
      id,
      email,
      role,
      status,
      onboarding_completed,
      selected_role_at,
      created_at,
      updated_at
    )
    values (
      caller_id,
      lower(caller_email),
      safe_role,
      'active'::public.user_status,
      true,
      now(),
      now(),
      now()
    )
    returning * into updated_profile;

    return updated_profile;
  end if;

  update public.users_profile
  set
    role = safe_role,
    onboarding_completed = true,
    selected_role_at = now(),
    updated_at = now()
  where id = caller_id
    and role <> 'admin'::public.user_role
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile could not be updated'
      using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

comment on function public.update_my_role(text) is
  'Lets the authenticated user complete onboarding as buyer or owner only. It never grants admin.';

revoke all on function public.update_my_role(text) from public;
grant execute on function public.update_my_role(text) to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
