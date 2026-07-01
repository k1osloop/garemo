-- Garemo Sprint 7J admin moderation, notifications, and report safeguards.
-- Idempotent. No auth.users writes. No frontend service_role.

begin;

alter table public.businesses
  add column if not exists moderation_reason text,
  add column if not exists moderation_status_message text,
  add column if not exists suspended_at timestamptz,
  add column if not exists reactivated_at timestamptz;

alter table public.businesses
  drop constraint if exists businesses_moderation_reason_length,
  drop constraint if exists businesses_moderation_status_message_length;

alter table public.businesses
  add constraint businesses_moderation_reason_length check (
    moderation_reason is null or char_length(moderation_reason) <= 80
  ),
  add constraint businesses_moderation_status_message_length check (
    moderation_status_message is null or char_length(moderation_status_message) <= 1000
  );

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  status text not null default 'unread',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint user_notifications_type_check check (
    type in (
      'business_approved',
      'business_rejected',
      'business_needs_changes',
      'business_suspended',
      'business_reported',
      'report_resolved',
      'profile_warning'
    )
  ),
  constraint user_notifications_status_check check (status in ('unread', 'read')),
  constraint user_notifications_title_length check (char_length(title) between 3 and 120),
  constraint user_notifications_message_length check (char_length(message) between 3 and 1200)
);

comment on table public.user_notifications is
  'In-app notifications for buyers, owners, and admins. Users can only read/update their own rows.';

create index if not exists user_notifications_user_created_idx
  on public.user_notifications(user_id, created_at desc);
create index if not exists user_notifications_unread_idx
  on public.user_notifications(user_id, status, created_at desc);
create index if not exists user_notifications_business_idx
  on public.user_notifications(business_id);

alter table public.user_notifications enable row level security;

revoke all on table public.user_notifications from anon, authenticated;
grant select on table public.user_notifications to authenticated;
grant update(status, read_at) on table public.user_notifications to authenticated;

drop policy if exists "user_select_own_notifications" on public.user_notifications;
drop policy if exists "user_update_own_notifications_read_state" on public.user_notifications;
drop policy if exists "admin_select_all_notifications" on public.user_notifications;

create policy "user_select_own_notifications"
on public.user_notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_update_own_notifications_read_state"
on public.user_notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and status = 'read'
  and read_at is not null
);

create policy "admin_select_all_notifications"
on public.user_notifications
for select
to authenticated
using (public.is_admin_user());

grant select on table public.reports to authenticated;
grant update(status, admin_notes, resolved_by, resolved_at, updated_at)
  on table public.reports to authenticated;
grant select on table public.businesses to authenticated;

create or replace function public.create_user_notification(
  target_user_id uuid,
  target_business_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can create notifications'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.users_profile where id = target_user_id) then
    raise exception 'Notification target user not found'
      using errcode = 'P0002';
  end if;

  insert into public.user_notifications (
    user_id,
    business_id,
    type,
    title,
    message,
    metadata
  )
  values (
    target_user_id,
    target_business_id,
    notification_type,
    left(nullif(btrim(coalesce(notification_title, '')), ''), 120),
    left(nullif(btrim(coalesce(notification_message, '')), ''), 1200),
    coalesce(notification_metadata, '{}'::jsonb)
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

comment on function public.create_user_notification(uuid, uuid, text, text, text, jsonb) is
  'Admin-only helper to create internal user notifications.';

revoke all on function public.create_user_notification(uuid, uuid, text, text, text, jsonb) from public;
grant execute on function public.create_user_notification(uuid, uuid, text, text, text, jsonb) to authenticated;

create or replace function public.insert_system_notification(
  target_user_id uuid,
  target_business_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  insert into public.user_notifications (
    user_id,
    business_id,
    type,
    title,
    message,
    metadata
  )
  values (
    target_user_id,
    target_business_id,
    notification_type,
    left(nullif(btrim(coalesce(notification_title, '')), ''), 120),
    left(nullif(btrim(coalesce(notification_message, '')), ''), 1200),
    coalesce(notification_metadata, '{}'::jsonb)
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

comment on function public.insert_system_notification(uuid, uuid, text, text, text, jsonb) is
  'Internal SECURITY DEFINER helper used by moderation RPCs. Not executable by API roles.';

revoke all on function public.insert_system_notification(uuid, uuid, text, text, text, jsonb) from public;

create or replace function public.mark_notification_read(notification_id uuid)
returns public.user_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_notification public.user_notifications;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  update public.user_notifications
  set status = 'read', read_at = coalesce(read_at, now())
  where id = notification_id
    and user_id = auth.uid()
  returning * into updated_notification;

  if updated_notification.id is null then
    raise exception 'Notification not found'
      using errcode = 'P0002';
  end if;

  return updated_notification;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_my_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  update public.user_notifications
  set status = 'read', read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and status = 'unread';

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

revoke all on function public.mark_all_my_notifications_read() from public;
grant execute on function public.mark_all_my_notifications_read() to authenticated;

drop function if exists public.admin_review_business(uuid, public.business_status, boolean, text);
create or replace function public.admin_review_business(
  target_business_id uuid,
  next_status public.business_status,
  next_is_verified boolean default false,
  notes text default null,
  reason text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_business public.businesses;
  target_owner_id uuid;
  clean_notes text := nullif(btrim(coalesce(notes, '')), '');
  clean_reason text := nullif(btrim(coalesce(reason, '')), '');
  notification_type text;
  notification_title text;
  notification_message text;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can review businesses'
      using errcode = '42501';
  end if;

  if next_status not in (
    'active'::public.business_status,
    'approved'::public.business_status,
    'rejected'::public.business_status,
    'hidden'::public.business_status,
    'pending_review'::public.business_status,
    'under_review'::public.business_status
  ) then
    raise exception 'Invalid review status'
      using errcode = '22023';
  end if;

  if next_status in ('rejected'::public.business_status, 'hidden'::public.business_status)
    and clean_notes is null then
    raise exception 'A clear correction note is required when rejecting a business'
      using errcode = '22023';
  end if;

  update public.businesses
  set
    status = next_status,
    is_verified = case
      when next_status in ('active'::public.business_status, 'approved'::public.business_status) then coalesce(next_is_verified, false)
      else false
    end,
    reviewed_at = now(),
    review_notes = clean_notes,
    moderation_reason = clean_reason,
    moderation_status_message = clean_notes,
    suspended_at = case
      when next_status = 'under_review'::public.business_status then coalesce(suspended_at, now())
      else suspended_at
    end,
    reactivated_at = case
      when next_status in ('active'::public.business_status, 'approved'::public.business_status) then now()
      else reactivated_at
    end,
    updated_at = now()
  where id = target_business_id
  returning * into reviewed_business;

  if reviewed_business.id is null then
    raise exception 'Business not found'
      using errcode = 'P0002';
  end if;

  target_owner_id := reviewed_business.owner_id;

  if next_status in ('active'::public.business_status, 'approved'::public.business_status) then
    notification_type := 'business_approved';
    notification_title := 'Tu negocio fue aprobado';
    notification_message := 'Tu emprendimiento ya está visible en Garemo. Ahora los compradores pueden encontrarte en el directorio y mapa.';
  elsif next_status in ('rejected'::public.business_status, 'hidden'::public.business_status) then
    notification_type := 'business_rejected';
    notification_title := 'Tu negocio necesita correcciones';
    notification_message := 'El administrador revisó tu negocio y encontró observaciones: ' || clean_notes || ' Corrige la información y vuelve a enviarlo a revisión.';
  elsif next_status = 'under_review'::public.business_status then
    notification_type := 'business_suspended';
    notification_title := 'Tu negocio está en revisión';
    notification_message := coalesce(clean_notes, 'Tu negocio fue suspendido temporalmente mientras el administrador revisa el caso.');
  else
    notification_type := 'business_needs_changes';
    notification_title := 'Tu negocio sigue en revisión';
    notification_message := coalesce(clean_notes, 'Tu negocio está en revisión. Te avisaremos cuando cambie el estado.');
  end if;

  perform public.insert_system_notification(
    target_owner_id,
    reviewed_business.id,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object(
      'business_status', reviewed_business.status::text,
      'reason', clean_reason,
      'reviewed_at', now()
    )
  );

  return reviewed_business;
end;
$$;

comment on function public.admin_review_business(uuid, public.business_status, boolean, text, text) is
  'Reviews, approves, rejects, or suspends a business and notifies the owner.';

revoke all on function public.admin_review_business(uuid, public.business_status, boolean, text, text) from public;
grant execute on function public.admin_review_business(uuid, public.business_status, boolean, text, text) to authenticated;

create or replace function public.admin_moderate_business(
  target_business_id uuid,
  next_status public.business_status,
  notes text default null,
  reason text default null
)
returns public.businesses
language sql
security definer
set search_path = public
as $$
  select public.admin_review_business(
    target_business_id,
    next_status,
    next_status in ('active'::public.business_status, 'approved'::public.business_status),
    notes,
    reason
  );
$$;

revoke all on function public.admin_moderate_business(uuid, public.business_status, text, text) from public;
grant execute on function public.admin_moderate_business(uuid, public.business_status, text, text) to authenticated;

drop function if exists public.submit_report(text, uuid, public.report_reason, text);
create or replace function public.submit_report(
  p_target_type text,
  p_target_id uuid,
  p_reason public.report_reason,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  clean_target_type text := lower(nullif(btrim(coalesce(p_target_type, '')), ''));
  clean_description text := nullif(btrim(coalesce(p_description, '')), '');
  target_business_id uuid;
  target_owner_id uuid;
  report_id uuid;
  unique_reporters integer := 0;
begin
  if caller_id is null then
    raise exception 'REPORT_AUTH_REQUIRED'
      using errcode = '42501';
  end if;

  if clean_target_type not in ('business', 'product', 'review') then
    raise exception 'Invalid report target'
      using errcode = '22023';
  end if;

  if clean_target_type = 'business' then
    select b.id, b.owner_id
    into target_business_id, target_owner_id
    from public.businesses b
    where b.id = p_target_id;
  elsif clean_target_type = 'product' then
    select b.id, b.owner_id
    into target_business_id, target_owner_id
    from public.products p
    join public.businesses b on b.id = p.business_id
    where p.id = p_target_id;
  else
    select br.business_id, b.owner_id
    into target_business_id, target_owner_id
    from public.business_reviews br
    join public.businesses b on b.id = br.business_id
    where br.id = p_target_id;
  end if;

  if target_business_id is null then
    raise exception 'Report target not found'
      using errcode = 'P0002';
  end if;

  if target_owner_id = caller_id then
    raise exception 'REPORT_OWN_BUSINESS'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.reports r
    where r.reporter_id = caller_id
      and r.target_type = clean_target_type
      and r.target_id = p_target_id
      and r.status <> 'dismissed'::public.report_status
  ) then
    raise exception 'REPORT_DUPLICATE'
      using errcode = '23505';
  end if;

  insert into public.reports (
    reporter_id,
    business_id,
    target_type,
    target_id,
    reason,
    description,
    details,
    status,
    created_at,
    updated_at
  )
  values (
    caller_id,
    target_business_id,
    clean_target_type,
    p_target_id,
    p_reason,
    left(clean_description, 1000),
    left(clean_description, 1000),
    'open'::public.report_status,
    now(),
    now()
  )
  returning id into report_id;

  select count(distinct reporter_id)
  into unique_reporters
  from public.reports
  where business_id = target_business_id
    and status in ('open'::public.report_status, 'reviewing'::public.report_status)
    and reporter_id is not null;

  if unique_reporters >= 3 then
    update public.businesses
    set
      status = 'under_review'::public.business_status,
      is_verified = false,
      suspended_at = coalesce(suspended_at, now()),
      moderation_reason = 'report_threshold',
      moderation_status_message = 'Este negocio recibió varios reportes de usuarios y fue suspendido temporalmente mientras el administrador revisa el caso.',
      updated_at = now()
    where id = target_business_id
      and status::text not in ('under_review', 'hidden', 'rejected');

    perform public.insert_system_notification(
      target_owner_id,
      target_business_id,
      'business_suspended',
      'Tu negocio está en revisión',
      'Tu negocio recibió varios reportes de usuarios y fue suspendido temporalmente mientras el administrador revisa el caso. Puedes revisar la información y esperar la decisión del administrador.',
      jsonb_build_object('reason', 'unique_report_threshold', 'unique_reporters', unique_reporters)
    );
  elsif unique_reporters = 1 then
    perform public.insert_system_notification(
      target_owner_id,
      target_business_id,
      'business_reported',
      'Tu negocio recibió un reporte',
      'Un usuario reportó información de tu negocio. El administrador revisará el caso si corresponde.',
      jsonb_build_object('reason', p_reason::text, 'unique_reporters', unique_reporters)
    );
  end if;

  return report_id;
end;
$$;

comment on function public.submit_report(text, uuid, public.report_reason, text) is
  'Creates one report per user/target, blocks self-reports, and moves businesses to under_review after 3 unique active reporters.';

revoke all on function public.submit_report(text, uuid, public.report_reason, text) from public;
grant execute on function public.submit_report(text, uuid, public.report_reason, text) to authenticated;

drop function if exists public.admin_resolve_report(uuid, public.report_status, text);
create or replace function public.admin_resolve_report(
  p_report_id uuid,
  p_next_status public.report_status,
  p_notes text default null,
  p_business_status public.business_status default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_report public.reports;
  clean_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  target_owner_id uuid;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can resolve reports'
      using errcode = '42501';
  end if;

  select *
  into target_report
  from public.reports
  where id = p_report_id;

  if target_report.id is null then
    raise exception 'Report not found'
      using errcode = 'P0002';
  end if;

  update public.reports
  set
    status = p_next_status,
    admin_notes = clean_notes,
    resolved_by = auth.uid(),
    resolved_at = case
      when p_next_status in ('resolved'::public.report_status, 'dismissed'::public.report_status) then now()
      else resolved_at
    end,
    updated_at = now()
  where id = p_report_id;

  if p_business_status is not null then
    update public.businesses
    set
      status = p_business_status,
      is_verified = case
        when p_business_status in ('active'::public.business_status, 'approved'::public.business_status) then is_verified
        else false
      end,
      moderation_reason = coalesce(moderation_reason, 'report_review'),
      moderation_status_message = clean_notes,
      suspended_at = case
        when p_business_status = 'under_review'::public.business_status then coalesce(suspended_at, now())
        else suspended_at
      end,
      reactivated_at = case
        when p_business_status in ('active'::public.business_status, 'approved'::public.business_status) then now()
        else reactivated_at
      end,
      updated_at = now()
    where id = target_report.business_id;
  end if;

  select owner_id
  into target_owner_id
  from public.businesses
  where id = target_report.business_id;

  if target_owner_id is not null and p_next_status in ('resolved'::public.report_status, 'dismissed'::public.report_status) then
    perform public.insert_system_notification(
      target_owner_id,
      target_report.business_id,
      'report_resolved',
      'Un reporte fue revisado',
      'El administrador revisó un reporte relacionado con tu negocio. Revisa tu panel para ver si hay observaciones.',
      jsonb_build_object('report_id', p_report_id, 'report_status', p_next_status::text)
    );
  end if;
end;
$$;

comment on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) is
  'Allows active admins to update report status and optionally moderate the related business.';

revoke all on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) from public;
grant execute on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) to authenticated;

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

  result := result || jsonb_build_object(
    'businesses',
    jsonb_build_object(
      'total', (select count(*) from public.businesses),
      'public_visible', (select count(*) from public.businesses where status::text in ('active', 'approved')),
      'pending', (select count(*) from public.businesses where status::text = 'pending_review'),
      'rejected_or_reviewing', (select count(*) from public.businesses where status::text in ('rejected', 'hidden', 'under_review')),
      'rejected', (select count(*) from public.businesses where status::text in ('rejected', 'hidden')),
      'under_review', (select count(*) from public.businesses where status::text = 'under_review'),
      'suspended', (select count(*) from public.businesses where status::text = 'under_review'),
      'without_location', (select count(*) from public.businesses b left join public.locations l on l.business_id = b.id where l.id is null or nullif(btrim(coalesce(l.address_text, '')), '') is null),
      'without_products', (select count(*) from public.businesses b where not exists (select 1 from public.products p where p.business_id = b.id)),
      'with_3_unique_reports', (
        select count(*)
        from (
          select business_id
          from public.reports
          where status in ('open'::public.report_status, 'reviewing'::public.report_status)
            and reporter_id is not null
          group by business_id
          having count(distinct reporter_id) >= 3
        ) flagged
      )
    )
  );

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

  result := result || jsonb_build_object(
    'reviews',
    jsonb_build_object(
      'total', (select count(*) from public.business_reviews),
      'average_rating', (select round(avg(rating)::numeric, 2) from public.business_reviews where coalesce(status, 'visible') = 'visible'),
      'top_businesses', top_reviewed_businesses
    )
  );

  result := result || jsonb_build_object(
    'reports',
    jsonb_build_object(
      'total', (select count(*) from public.reports),
      'pending', (select count(*) from public.reports where status = 'open'::public.report_status),
      'active', (select count(*) from public.reports where status in ('open'::public.report_status, 'reviewing'::public.report_status)),
      'reviewing', (select count(*) from public.reports where status = 'reviewing'::public.report_status),
      'resolved', (select count(*) from public.reports where status = 'resolved'::public.report_status),
      'dismissed', (select count(*) from public.reports where status = 'dismissed'::public.report_status)
    )
  );

  result := result || jsonb_build_object(
    'quality',
    jsonb_build_object(
      'without_schedules', (select count(*) from public.businesses b where not exists (select 1 from public.schedules s where s.business_id = b.id)),
      'without_whatsapp', (select count(*) from public.businesses b left join public.contact_info ci on ci.business_id = b.id where ci.id is null or nullif(btrim(coalesce(ci.whatsapp_number, '')), '') is null),
      'without_image', (select count(*) from public.businesses b where not exists (select 1 from public.business_images bi where bi.business_id = b.id)),
      'without_description', (select count(*) from public.businesses b where nullif(btrim(coalesce(b.description, '')), '') is null),
      'without_category', (select count(*) from public.businesses b left join public.categories c on c.id = b.category_id where c.id is null)
    )
  );

  result := result || jsonb_build_object(
    'notifications',
    jsonb_build_object(
      'total', (select count(*) from public.user_notifications),
      'unread', (select count(*) from public.user_notifications where status = 'unread'),
      'sent_approved', (select count(*) from public.user_notifications where type = 'business_approved'),
      'sent_rejected', (select count(*) from public.user_notifications where type = 'business_rejected'),
      'sent_suspended', (select count(*) from public.user_notifications where type = 'business_suspended')
    )
  );

  return result;
end;
$$;

revoke all on function public.get_admin_metrics() from public;
grant execute on function public.get_admin_metrics() to authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
