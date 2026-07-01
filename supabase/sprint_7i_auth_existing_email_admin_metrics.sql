-- Garemo Sprint 7I existing email hardening and admin metrics.
-- Safe, idempotent, no auth.users writes, no service_role requirement in frontend.

begin;

create or replace function public.is_registered_email(candidate_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(nullif(btrim(coalesce(candidate_email, '')), ''));
begin
  if normalized_email is null or position('@' in normalized_email) <= 1 then
    return false;
  end if;

  return exists (
    select 1
    from public.users_profile up
    where lower(up.email) = normalized_email
  );
end;
$$;

comment on function public.is_registered_email(text) is
  'Checks whether a public users_profile email already exists. Used only to prevent duplicate signup UX confusion.';

revoke all on function public.is_registered_email(text) from public;
grant execute on function public.is_registered_email(text) to anon, authenticated;

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

  if current_profile.id is not null and current_profile.onboarding_completed = true then
    return current_profile;
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
    and onboarding_completed = false
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile could not be updated'
      using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

comment on function public.update_my_role(text) is
  'Lets an authenticated user complete onboarding as buyer or owner only. Completed profiles are returned without role changes.';

revoke all on function public.update_my_role(text) from public;
grant execute on function public.update_my_role(text) to authenticated;

create or replace function public.get_admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb := '{}'::jsonb;
  top_reviewed_businesses jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can view metrics'
      using errcode = '42501';
  end if;

  if to_regclass('public.businesses') is not null then
    result := result || jsonb_build_object(
      'businesses',
      jsonb_build_object(
        'total', (select count(*) from public.businesses),
        'public_visible', (select count(*) from public.businesses where status::text in ('active', 'approved')),
        'pending', (select count(*) from public.businesses where status::text = 'pending_review'),
        'rejected_or_reviewing', (select count(*) from public.businesses where status::text in ('rejected', 'hidden', 'under_review')),
        'without_location', case when to_regclass('public.locations') is null then null else (
          select count(*)
          from public.businesses b
          left join public.locations l on l.business_id = b.id
          where l.id is null or nullif(btrim(coalesce(l.address_text, '')), '') is null
        ) end,
        'without_products', case when to_regclass('public.products') is null then null else (
          select count(*)
          from public.businesses b
          where not exists (select 1 from public.products p where p.business_id = b.id)
        ) end
      )
    );

    result := result || jsonb_build_object(
      'quality',
      jsonb_build_object(
        'without_schedules', case when to_regclass('public.schedules') is null then null else (
          select count(*)
          from public.businesses b
          where not exists (select 1 from public.schedules s where s.business_id = b.id)
        ) end,
        'without_whatsapp', case when to_regclass('public.contact_info') is null then null else (
          select count(*)
          from public.businesses b
          left join public.contact_info ci on ci.business_id = b.id
          where ci.id is null or nullif(btrim(coalesce(ci.whatsapp_number, '')), '') is null
        ) end,
        'without_image', case when to_regclass('public.business_images') is null then null else (
          select count(*)
          from public.businesses b
          where not exists (select 1 from public.business_images bi where bi.business_id = b.id)
        ) end,
        'without_description', (
          select count(*)
          from public.businesses b
          where nullif(btrim(coalesce(b.description, '')), '') is null
        ),
        'without_category', case when to_regclass('public.categories') is null then null else (
          select count(*)
          from public.businesses b
          left join public.categories c on c.id = b.category_id
          where c.id is null
        ) end
      )
    );
  else
    result := result || jsonb_build_object('businesses', null, 'quality', null);
  end if;

  if to_regclass('public.products') is not null then
    result := result || jsonb_build_object(
      'products',
      jsonb_build_object(
        'total', (select count(*) from public.products),
        'active', (select count(*) from public.products where is_available = true),
        'inactive', (select count(*) from public.products where coalesce(is_available, false) = false),
        'with_price', (select count(*) from public.products where price is not null),
        'without_price', (select count(*) from public.products where price is null)
      )
    );
  else
    result := result || jsonb_build_object('products', null);
  end if;

  if to_regclass('public.users_profile') is not null then
    result := result || jsonb_build_object(
      'users',
      jsonb_build_object(
        'buyers', (select count(*) from public.users_profile where role = 'buyer'::public.user_role),
        'owners', (select count(*) from public.users_profile where role = 'owner'::public.user_role),
        'admins', (select count(*) from public.users_profile where role = 'admin'::public.user_role),
        'onboarding_complete', (select count(*) from public.users_profile where onboarding_completed = true),
        'onboarding_pending', (select count(*) from public.users_profile where onboarding_completed = false)
      )
    );
  else
    result := result || jsonb_build_object('users', null);
  end if;

  if to_regclass('public.business_reviews') is not null then
    if to_regclass('public.businesses') is not null then
      select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      into top_reviewed_businesses
      from (
        select
          br.business_id,
          b.name as business_name,
          count(*)::integer as review_count
        from public.business_reviews br
        join public.businesses b on b.id = br.business_id
        where coalesce(br.status, 'visible') = 'visible'
        group by br.business_id, b.name
        order by count(*) desc, b.name asc
        limit 5
      ) r;
    end if;

    result := result || jsonb_build_object(
      'reviews',
      jsonb_build_object(
        'total', (select count(*) from public.business_reviews),
        'average_rating', (select round(avg(rating)::numeric, 2) from public.business_reviews where coalesce(status, 'visible') = 'visible'),
        'top_businesses', top_reviewed_businesses
      )
    );
  else
    result := result || jsonb_build_object('reviews', null);
  end if;

  if to_regclass('public.reports') is not null then
    result := result || jsonb_build_object(
      'reports',
      jsonb_build_object(
        'total', (select count(*) from public.reports),
        'pending', (select count(*) from public.reports where status = 'open'::public.report_status),
        'reviewing', (select count(*) from public.reports where status = 'reviewing'::public.report_status),
        'resolved', (select count(*) from public.reports where status = 'resolved'::public.report_status),
        'dismissed', (select count(*) from public.reports where status = 'dismissed'::public.report_status)
      )
    );
  else
    result := result || jsonb_build_object('reports', null);
  end if;

  return result;
end;
$$;

comment on function public.get_admin_metrics() is
  'Returns aggregate admin-only metrics for Garemo without exposing data to anon or non-admin users.';

revoke all on function public.get_admin_metrics() from public;
grant execute on function public.get_admin_metrics() to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
