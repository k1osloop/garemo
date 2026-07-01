-- Garemo Sprint 7K internal notifications and email readiness.
-- Idempotent. No auth.users writes. No frontend service_role.
-- Applies reliable in-app notifications for moderation events.

begin;

alter table public.user_notifications
  drop constraint if exists user_notifications_type_check;

alter table public.user_notifications
  add constraint user_notifications_type_check check (
    type in (
      'business_approved',
      'business_rejected',
      'business_needs_changes',
      'business_suspended',
      'business_reactivated',
      'business_reported',
      'report_resolved',
      'profile_warning'
    )
  );

grant select on table public.user_notifications to authenticated;
grant update(status, read_at) on table public.user_notifications to authenticated;
revoke insert, delete, truncate, references, trigger
  on table public.user_notifications
  from anon, authenticated;

create or replace function public.admin_create_notification(
  target_user_id uuid,
  business_id uuid,
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
  clean_type text := nullif(btrim(coalesce(notification_type, '')), '');
  clean_title text := nullif(btrim(coalesce(notification_title, '')), '');
  clean_message text := nullif(btrim(coalesce(notification_message, '')), '');
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can create notifications'
      using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'Notification target user is required'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.users_profile where id = target_user_id) then
    raise exception 'Notification target user not found'
      using errcode = 'P0002';
  end if;

  if clean_type not in (
    'business_approved',
    'business_rejected',
    'business_needs_changes',
    'business_suspended',
    'business_reactivated',
    'business_reported',
    'report_resolved',
    'profile_warning'
  ) then
    raise exception 'Notification type is not allowed'
      using errcode = '22023';
  end if;

  if clean_title is null or char_length(clean_title) < 3 then
    raise exception 'Notification title is required'
      using errcode = '22023';
  end if;

  if clean_message is null or char_length(clean_message) < 3 then
    raise exception 'Notification message is required'
      using errcode = '22023';
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
    business_id,
    clean_type,
    left(clean_title, 120),
    left(clean_message, 1200),
    coalesce(notification_metadata, '{}'::jsonb)
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

comment on function public.admin_create_notification(uuid, uuid, text, text, text, jsonb) is
  'Admin-only RPC for creating safe human-readable in-app notifications.';

revoke all on function public.admin_create_notification(uuid, uuid, text, text, text, jsonb) from public;
grant execute on function public.admin_create_notification(uuid, uuid, text, text, text, jsonb) to authenticated;

create or replace function public.create_business_notification_for_owner(
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
  target_owner_id uuid;
  notification_id uuid;
  clean_type text := nullif(btrim(coalesce(notification_type, '')), '');
  clean_title text := nullif(btrim(coalesce(notification_title, '')), '');
  clean_message text := nullif(btrim(coalesce(notification_message, '')), '');
begin
  if target_business_id is null then
    raise exception 'Business is required for notification'
      using errcode = '22023';
  end if;

  select owner_id
  into target_owner_id
  from public.businesses
  where id = target_business_id;

  if target_owner_id is null then
    raise exception 'Business owner not found'
      using errcode = 'P0002';
  end if;

  if clean_type not in (
    'business_approved',
    'business_rejected',
    'business_needs_changes',
    'business_suspended',
    'business_reactivated',
    'business_reported',
    'report_resolved',
    'profile_warning'
  ) then
    raise exception 'Notification type is not allowed'
      using errcode = '22023';
  end if;

  if clean_title is null or char_length(clean_title) < 3 then
    raise exception 'Notification title is required'
      using errcode = '22023';
  end if;

  if clean_message is null or char_length(clean_message) < 3 then
    raise exception 'Notification message is required'
      using errcode = '22023';
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
    target_owner_id,
    target_business_id,
    clean_type,
    left(clean_title, 120),
    left(clean_message, 1200),
    coalesce(notification_metadata, '{}'::jsonb)
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

comment on function public.create_business_notification_for_owner(uuid, text, text, text, jsonb) is
  'Internal helper used by moderation/report RPCs to notify a business owner.';

revoke all on function public.create_business_notification_for_owner(uuid, text, text, text, jsonb) from public;

create or replace function public.create_user_notification(
  target_user_id uuid,
  target_business_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.admin_create_notification(
    target_user_id,
    target_business_id,
    notification_type,
    notification_title,
    notification_message,
    notification_metadata
  );
$$;

comment on function public.create_user_notification(uuid, uuid, text, text, text, jsonb) is
  'Backward-compatible admin-only helper to create internal user notifications.';

revoke all on function public.create_user_notification(uuid, uuid, text, text, text, jsonb) from public;
grant execute on function public.create_user_notification(uuid, uuid, text, text, text, jsonb) to authenticated;

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
  existing_business public.businesses;
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

  select *
  into existing_business
  from public.businesses
  where id = target_business_id;

  if existing_business.id is null then
    raise exception 'Business not found'
      using errcode = 'P0002';
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

  if next_status in ('active'::public.business_status, 'approved'::public.business_status) then
    if clean_reason = 'reactivated'
      or existing_business.status in (
        'under_review'::public.business_status,
        'rejected'::public.business_status,
        'hidden'::public.business_status
      ) then
      notification_type := 'business_reactivated';
      notification_title := 'Tu negocio fue reactivado';
      notification_message := 'Tu negocio vuelve a estar visible en Garemo.';
    else
      notification_type := 'business_approved';
      notification_title := 'Tu negocio fue aprobado';
      notification_message := 'Tu emprendimiento ya esta visible en Garemo. Los compradores pueden encontrarte en el directorio y el mapa.';
    end if;
  elsif next_status in ('rejected'::public.business_status, 'hidden'::public.business_status) then
    notification_type := 'business_rejected';
    notification_title := 'Tu negocio necesita correcciones';
    notification_message := 'El administrador reviso tu negocio y encontro observaciones: ' || clean_notes || ' Corrige la informacion y vuelve a enviarlo a revision.';
  elsif next_status = 'under_review'::public.business_status then
    notification_type := 'business_suspended';
    notification_title := 'Tu negocio esta en revision';
    notification_message := 'Tu negocio fue suspendido temporalmente mientras revisamos reportes de la comunidad. Puedes revisar tu informacion desde tu panel.';
  else
    notification_type := 'business_needs_changes';
    notification_title := 'Tu negocio sigue en revision';
    notification_message := coalesce(clean_notes, 'Tu negocio esta en revision. Te avisaremos cuando cambie el estado.');
  end if;

  perform public.create_business_notification_for_owner(
    reviewed_business.id,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object(
      'business_status', reviewed_business.status::text,
      'previous_status', existing_business.status::text,
      'reason', clean_reason,
      'reviewed_at', now()
    )
  );

  return reviewed_business;
end;
$$;

comment on function public.admin_review_business(uuid, public.business_status, boolean, text, text) is
  'Reviews, approves, rejects, suspends, or reactivates a business and notifies the owner.';

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
      moderation_status_message = 'Este negocio no esta disponible temporalmente porque esta en revision.',
      updated_at = now()
    where id = target_business_id
      and status::text not in ('under_review', 'hidden', 'rejected');

    perform public.create_business_notification_for_owner(
      target_business_id,
      'business_suspended',
      'Tu negocio esta en revision',
      'Tu negocio fue suspendido temporalmente mientras revisamos reportes de la comunidad. Puedes revisar tu informacion desde tu panel.',
      jsonb_build_object('reason', 'unique_report_threshold', 'unique_reporters', unique_reporters)
    );
  elsif unique_reporters = 1 then
    perform public.create_business_notification_for_owner(
      target_business_id,
      'business_reported',
      'Tu negocio recibio un reporte',
      'Un usuario reporto informacion de tu negocio. El administrador revisara el caso si corresponde.',
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
  current_business public.businesses;
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

  select *
  into current_business
  from public.businesses
  where id = target_report.business_id;

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

    if p_business_status = 'under_review'::public.business_status then
      perform public.create_business_notification_for_owner(
        target_report.business_id,
        'business_suspended',
        'Tu negocio esta en revision',
        'Tu negocio fue suspendido temporalmente mientras revisamos reportes de la comunidad. Puedes revisar tu informacion desde tu panel.',
        jsonb_build_object('report_id', p_report_id, 'report_status', p_next_status::text)
      );
    elsif p_business_status in ('active'::public.business_status, 'approved'::public.business_status)
      and current_business.status in (
        'under_review'::public.business_status,
        'rejected'::public.business_status,
        'hidden'::public.business_status
      ) then
      perform public.create_business_notification_for_owner(
        target_report.business_id,
        'business_reactivated',
        'Tu negocio fue reactivado',
        'Tu negocio vuelve a estar visible en Garemo.',
        jsonb_build_object('report_id', p_report_id, 'report_status', p_next_status::text)
      );
    end if;
  end if;

  if p_next_status in ('resolved'::public.report_status, 'dismissed'::public.report_status) then
    perform public.create_business_notification_for_owner(
      target_report.business_id,
      'report_resolved',
      'Un reporte fue revisado',
      'El administrador reviso un reporte relacionado con tu negocio. Revisa tu panel para ver si hay observaciones.',
      jsonb_build_object('report_id', p_report_id, 'report_status', p_next_status::text)
    );
  end if;
end;
$$;

comment on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) is
  'Allows active admins to update report status, optionally moderate the related business, and notify the owner.';

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
      'rejected_or_reviewing', (select count(*) from public.businesses where status::text in ('rejected', 'under_review', 'hidden')),
      'rejected', (select count(*) from public.businesses where status::text = 'rejected'),
      'under_review', (select count(*) from public.businesses where status::text = 'under_review'),
      'suspended', (select count(*) from public.businesses where status::text = 'under_review'),
      'without_location', (
        select count(*)
        from public.businesses b
        where not exists (select 1 from public.locations l where l.business_id = b.id)
      ),
      'without_products', (
        select count(*)
        from public.businesses b
        where not exists (select 1 from public.products p where p.business_id = b.id)
      ),
      'with_3_unique_reports', (
        select count(*)
        from (
          select business_id
          from public.reports
          where status in ('open'::public.report_status, 'reviewing'::public.report_status)
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
      'active', (select count(*) from public.products where is_available is true),
      'inactive', (select count(*) from public.products where is_available is false),
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
      'onboarding_complete', (select count(*) from public.users_profile where status = 'active'),
      'onboarding_pending', (select count(*) from public.users_profile where status <> 'active')
    )
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'business_id', ranked.business_id,
        'business_name', ranked.business_name,
        'review_count', ranked.review_count
      )
      order by ranked.review_count desc
    ),
    '[]'::jsonb
  )
  into top_reviewed_businesses
  from (
    select br.business_id, b.name as business_name, count(*)::int as review_count
    from public.business_reviews br
    left join public.businesses b on b.id = br.business_id
    where coalesce(br.is_public, true) = true
    group by br.business_id, b.name
    order by count(*) desc
    limit 5
  ) ranked;

  result := result || jsonb_build_object(
    'reviews',
    jsonb_build_object(
      'total', (select count(*) from public.business_reviews where coalesce(is_public, true) = true),
      'average_rating', (select round(avg(rating)::numeric, 2) from public.business_reviews where coalesce(is_public, true) = true),
      'top_businesses', top_reviewed_businesses
    )
  );

  result := result || jsonb_build_object(
    'reports',
    jsonb_build_object(
      'total', (select count(*) from public.reports),
      'pending', (select count(*) from public.reports where status in ('open'::public.report_status, 'reviewing'::public.report_status)),
      'active', (select count(*) from public.reports where status in ('open'::public.report_status, 'reviewing'::public.report_status)),
      'reviewing', (select count(*) from public.reports where status = 'reviewing'::public.report_status),
      'resolved', (select count(*) from public.reports where status = 'resolved'::public.report_status),
      'dismissed', (select count(*) from public.reports where status = 'dismissed'::public.report_status)
    )
  );

  result := result || jsonb_build_object(
    'quality',
    jsonb_build_object(
      'without_schedules', (
        select count(*)
        from public.businesses b
        where not exists (select 1 from public.schedules s where s.business_id = b.id)
      ),
      'without_whatsapp', (
        select count(*)
        from public.businesses b
        where not exists (
          select 1 from public.contact_info c
          where c.business_id = b.id and nullif(btrim(coalesce(c.whatsapp_number, '')), '') is not null
        )
      ),
      'without_image', (
        select count(*)
        from public.businesses b
        where not exists (select 1 from public.business_images i where i.business_id = b.id)
      ),
      'without_description', (select count(*) from public.businesses where nullif(btrim(coalesce(description, '')), '') is null),
      'without_category', (select count(*) from public.businesses where category_id is null)
    )
  );

  result := result || jsonb_build_object(
    'notifications',
    jsonb_build_object(
      'total', (select count(*) from public.user_notifications),
      'unread', (select count(*) from public.user_notifications where status = 'unread'),
      'sent_approved', (select count(*) from public.user_notifications where type = 'business_approved'),
      'sent_rejected', (select count(*) from public.user_notifications where type = 'business_rejected'),
      'sent_suspended', (select count(*) from public.user_notifications where type = 'business_suspended'),
      'sent_reactivated', (select count(*) from public.user_notifications where type = 'business_reactivated')
    )
  );

  return result;
end;
$$;

comment on function public.get_admin_metrics() is
  'Admin-only aggregated metrics for Garemo moderation and marketplace health.';

revoke all on function public.get_admin_metrics() from public;
grant execute on function public.get_admin_metrics() to authenticated;

notify pgrst, 'reload schema';

commit;
