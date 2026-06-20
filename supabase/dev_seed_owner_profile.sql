-- DEV ONLY. Do not run in production without review.
-- Creates or updates one DEV owner profile linked to an existing Supabase Auth user.
-- Replace '<AUTH_USER_ID_AQUI>' with the real UUID from Authentication > Users.
-- Do not run this file while the placeholder is still present.

begin;

do $$
declare
  auth_user_id_text text := '<AUTH_USER_ID_AQUI>';
  auth_user_id uuid;
begin
  if auth_user_id_text = '<AUTH_USER_ID_AQUI>' then
    raise exception 'Replace <AUTH_USER_ID_AQUI> with a real Supabase Auth user UUID before running this seed.';
  end if;

  auth_user_id := auth_user_id_text::uuid;

  if not exists (
    select 1
    from auth.users
    where id = auth_user_id
  ) then
    raise exception 'Auth user % does not exist. Create the user manually in Supabase Auth first.', auth_user_id;
  end if;

  insert into public.users_profile (
    id,
    email,
    full_name,
    role,
    phone,
    status
  )
  select
    auth.users.id,
    coalesce(auth.users.email, 'garemo-dev-owner@example.test'),
    'Garemo DEV Owner',
    'owner'::public.user_role,
    null,
    'active'::public.user_status
  from auth.users
  where auth.users.id = auth_user_id
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = 'owner'::public.user_role,
    status = 'active'::public.user_status,
    updated_at = now();
end $$;

commit;
