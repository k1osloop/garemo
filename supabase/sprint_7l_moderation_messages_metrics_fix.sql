-- Garemo Sprint 7L moderation messages, cases, and admin metrics fix.
-- Run in Supabase SQL Editor or via MCP execute_sql.
-- No service_role is required by the frontend. RLS remains enabled.

begin;

-- 1) Moderation cases / messages.
create table if not exists public.moderation_threads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid null references public.businesses(id) on delete set null,
  report_id uuid null references public.reports(id) on delete set null,
  owner_id uuid null references public.users_profile(id) on delete set null,
  opened_by uuid null references public.users_profile(id) on delete set null,
  assigned_admin_id uuid null references public.users_profile(id) on delete set null,
  type text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  subject text not null,
  last_message_at timestamptz not null default now(),
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moderation_threads_type_check check (
    type in ('verification', 'rejection', 'needs_changes', 'report', 'suspension', 'reactivation', 'general')
  ),
  constraint moderation_threads_status_check check (
    status in ('open', 'waiting_owner', 'waiting_admin', 'resolved', 'closed')
  ),
  constraint moderation_threads_priority_check check (
    priority in ('low', 'normal', 'high', 'critical')
  ),
  constraint moderation_threads_subject_length check (char_length(subject) between 3 and 180)
);

create table if not exists public.moderation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.moderation_threads(id) on delete cascade,
  sender_id uuid null references public.users_profile(id) on delete set null,
  sender_role text not null,
  message text not null,
  message_type text not null default 'message',
  metadata jsonb not null default '{}'::jsonb,
  read_by_owner boolean not null default false,
  read_by_admin boolean not null default false,
  is_internal_to_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint moderation_messages_sender_role_check check (
    sender_role in ('system', 'admin', 'owner')
  ),
  constraint moderation_messages_type_check check (
    message_type in ('message', 'status_change', 'rejection_reason', 'admin_note', 'system')
  ),
  constraint moderation_messages_length check (char_length(message) between 1 and 2000)
);

comment on table public.moderation_threads is
  'Internal moderation cases for admin-owner review, verification feedback, reports, suspension, and reactivation.';

comment on table public.moderation_messages is
  'Messages and status events inside moderation threads. Owner can only see own non-internal rows.';

create index if not exists moderation_threads_owner_status_idx
  on public.moderation_threads(owner_id, status, last_message_at desc);
create index if not exists moderation_threads_business_idx
  on public.moderation_threads(business_id, last_message_at desc);
create index if not exists moderation_threads_report_idx
  on public.moderation_threads(report_id);
create index if not exists moderation_messages_thread_created_idx
  on public.moderation_messages(thread_id, created_at asc);

alter table public.moderation_threads enable row level security;
alter table public.moderation_messages enable row level security;

revoke all on table public.moderation_threads from anon, authenticated;
revoke all on table public.moderation_messages from anon, authenticated;
grant select on table public.moderation_threads to authenticated;
grant select on table public.moderation_messages to authenticated;

drop policy if exists "admin_select_all_moderation_threads" on public.moderation_threads;
drop policy if exists "owner_select_own_moderation_threads" on public.moderation_threads;
drop policy if exists "admin_select_all_moderation_messages" on public.moderation_messages;
drop policy if exists "owner_select_own_moderation_messages" on public.moderation_messages;

create policy "admin_select_all_moderation_threads"
on public.moderation_threads
for select
to authenticated
using (public.is_admin_user());

create policy "owner_select_own_moderation_threads"
on public.moderation_threads
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "admin_select_all_moderation_messages"
on public.moderation_messages
for select
to authenticated
using (public.is_admin_user());

create policy "owner_select_own_moderation_messages"
on public.moderation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.moderation_threads mt
    where mt.id = moderation_messages.thread_id
      and mt.owner_id = (select auth.uid())
      and moderation_messages.is_internal_to_admin = false
  )
);

-- 2) Internal helpers. These are not exposed to anon/authenticated.
create or replace function public.create_moderation_thread_internal(
  target_business_id uuid,
  target_report_id uuid,
  thread_type text,
  thread_subject text,
  thread_status text default 'waiting_owner',
  thread_priority text default 'normal',
  target_owner_id uuid default null,
  admin_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_owner_id uuid;
  existing_thread_id uuid;
  new_thread_id uuid;
begin
  if thread_type not in ('verification', 'rejection', 'needs_changes', 'report', 'suspension', 'reactivation', 'general') then
    raise exception 'Invalid moderation thread type' using errcode = '22023';
  end if;

  if thread_status not in ('open', 'waiting_owner', 'waiting_admin', 'resolved', 'closed') then
    raise exception 'Invalid moderation thread status' using errcode = '22023';
  end if;

  if thread_priority not in ('low', 'normal', 'high', 'critical') then
    raise exception 'Invalid moderation thread priority' using errcode = '22023';
  end if;

  select coalesce(target_owner_id, b.owner_id)
  into resolved_owner_id
  from public.businesses b
  where b.id = target_business_id;

  if resolved_owner_id is null then
    resolved_owner_id := target_owner_id;
  end if;

  if resolved_owner_id is null then
    raise exception 'Moderation thread owner is required' using errcode = '22023';
  end if;

  select mt.id
  into existing_thread_id
  from public.moderation_threads mt
  where mt.business_id is not distinct from target_business_id
    and mt.report_id is not distinct from target_report_id
    and mt.type = thread_type
    and mt.status in ('open', 'waiting_owner', 'waiting_admin')
  order by mt.updated_at desc
  limit 1;

  if existing_thread_id is not null then
    update public.moderation_threads
    set
      subject = left(nullif(btrim(coalesce(thread_subject, '')), ''), 180),
      status = thread_status,
      priority = thread_priority,
      owner_id = resolved_owner_id,
      assigned_admin_id = admin_id,
      last_message_at = now(),
      updated_at = now()
    where id = existing_thread_id
    returning id into new_thread_id;

    return new_thread_id;
  end if;

  insert into public.moderation_threads (
    business_id,
    report_id,
    owner_id,
    opened_by,
    assigned_admin_id,
    type,
    status,
    priority,
    subject
  )
  values (
    target_business_id,
    target_report_id,
    resolved_owner_id,
    admin_id,
    admin_id,
    thread_type,
    thread_status,
    thread_priority,
    left(nullif(btrim(coalesce(thread_subject, '')), ''), 180)
  )
  returning id into new_thread_id;

  return new_thread_id;
end;
$$;

revoke all on function public.create_moderation_thread_internal(uuid, uuid, text, text, text, text, uuid, uuid) from public;

create or replace function public.insert_moderation_message_internal(
  target_thread_id uuid,
  target_sender_id uuid,
  target_sender_role text,
  target_message text,
  target_message_type text default 'message',
  target_metadata jsonb default '{}'::jsonb,
  target_internal_to_admin boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_message_id uuid;
begin
  if target_sender_role not in ('system', 'admin', 'owner') then
    raise exception 'Invalid moderation sender role' using errcode = '22023';
  end if;

  if target_message_type not in ('message', 'status_change', 'rejection_reason', 'admin_note', 'system') then
    raise exception 'Invalid moderation message type' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(target_message, '')), '') is null then
    raise exception 'Message is required' using errcode = '22023';
  end if;

  insert into public.moderation_messages (
    thread_id,
    sender_id,
    sender_role,
    message,
    message_type,
    metadata,
    read_by_owner,
    read_by_admin,
    is_internal_to_admin
  )
  values (
    target_thread_id,
    target_sender_id,
    target_sender_role,
    left(btrim(target_message), 2000),
    target_message_type,
    coalesce(target_metadata, '{}'::jsonb),
    target_sender_role = 'owner',
    target_sender_role in ('admin', 'system'),
    coalesce(target_internal_to_admin, false)
  )
  returning id into new_message_id;

  update public.moderation_threads
  set
    last_message_at = now(),
    updated_at = now(),
    status = case
      when target_sender_role = 'owner' and status not in ('resolved', 'closed') then 'waiting_admin'
      when target_sender_role in ('admin', 'system') and status not in ('resolved', 'closed') then 'waiting_owner'
      else status
    end
  where id = target_thread_id;

  return new_message_id;
end;
$$;

revoke all on function public.insert_moderation_message_internal(uuid, uuid, text, text, text, jsonb, boolean) from public;

-- 3) Public RPCs with explicit authorization checks.
create or replace function public.admin_create_moderation_thread(
  target_business_id uuid,
  target_report_id uuid default null,
  thread_type text default 'general',
  thread_subject text default 'Caso de moderacion',
  initial_message text default null,
  thread_priority text default 'normal',
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_id uuid;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can create moderation threads'
      using errcode = '42501';
  end if;

  thread_id := public.create_moderation_thread_internal(
    target_business_id,
    target_report_id,
    thread_type,
    thread_subject,
    'waiting_owner',
    thread_priority,
    null,
    auth.uid()
  );

  if nullif(btrim(coalesce(initial_message, '')), '') is not null then
    perform public.insert_moderation_message_internal(
      thread_id,
      auth.uid(),
      'admin',
      initial_message,
      'message',
      metadata,
      false
    );
  end if;

  return thread_id;
end;
$$;

revoke all on function public.admin_create_moderation_thread(uuid, uuid, text, text, text, text, jsonb) from public;
grant execute on function public.admin_create_moderation_thread(uuid, uuid, text, text, text, text, jsonb) to authenticated;

create or replace function public.admin_send_moderation_message(
  thread_id uuid,
  message text,
  message_type text default 'message',
  metadata jsonb default '{}'::jsonb,
  internal_to_admin boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can send admin messages'
      using errcode = '42501';
  end if;

  return public.insert_moderation_message_internal(
    thread_id,
    auth.uid(),
    'admin',
    message,
    message_type,
    metadata,
    internal_to_admin
  );
end;
$$;

revoke all on function public.admin_send_moderation_message(uuid, text, text, jsonb, boolean) from public;
grant execute on function public.admin_send_moderation_message(uuid, text, text, jsonb, boolean) to authenticated;

create or replace function public.owner_reply_moderation_thread(
  thread_id uuid,
  message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_owner uuid;
  thread_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select owner_id, status
  into thread_owner, thread_status
  from public.moderation_threads
  where id = thread_id;

  if thread_owner is null then
    raise exception 'Moderation thread not found' using errcode = 'P0002';
  end if;

  if thread_owner <> auth.uid() then
    raise exception 'You can only reply to your own moderation cases'
      using errcode = '42501';
  end if;

  if thread_status in ('resolved', 'closed') then
    raise exception 'This moderation case is closed'
      using errcode = '22023';
  end if;

  return public.insert_moderation_message_internal(
    thread_id,
    auth.uid(),
    'owner',
    message,
    'message',
    '{}'::jsonb,
    false
  );
end;
$$;

revoke all on function public.owner_reply_moderation_thread(uuid, text) from public;
grant execute on function public.owner_reply_moderation_thread(uuid, text) to authenticated;

create or replace function public.mark_thread_read(thread_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select owner_id into thread_owner
  from public.moderation_threads
  where id = thread_id;

  if public.is_admin_user() then
    update public.moderation_messages
    set read_by_admin = true
    where moderation_messages.thread_id = mark_thread_read.thread_id;
    return true;
  end if;

  if thread_owner <> auth.uid() then
    raise exception 'You can only mark your own moderation cases'
      using errcode = '42501';
  end if;

  update public.moderation_messages
  set read_by_owner = true
  where moderation_messages.thread_id = mark_thread_read.thread_id
    and is_internal_to_admin = false;

  return true;
end;
$$;

revoke all on function public.mark_thread_read(uuid) from public;
grant execute on function public.mark_thread_read(uuid) to authenticated;

create or replace function public.admin_close_moderation_thread(thread_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can close moderation threads'
      using errcode = '42501';
  end if;

  update public.moderation_threads
  set status = 'closed', closed_at = now(), updated_at = now()
  where id = thread_id;

  return found;
end;
$$;

revoke all on function public.admin_close_moderation_thread(uuid) from public;
grant execute on function public.admin_close_moderation_thread(uuid) to authenticated;

create or replace function public.get_my_moderation_threads()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', mt.id,
        'business_id', mt.business_id,
        'business_name', b.name,
        'report_id', mt.report_id,
        'type', mt.type,
        'status', mt.status,
        'priority', mt.priority,
        'subject', mt.subject,
        'last_message_at', mt.last_message_at,
        'closed_at', mt.closed_at,
        'created_at', mt.created_at,
        'unread_count', (
          select count(*)::int
          from public.moderation_messages mm
          where mm.thread_id = mt.id
            and mm.is_internal_to_admin = false
            and mm.read_by_owner = false
            and mm.sender_role in ('admin', 'system')
        ),
        'messages', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', mm.id,
              'sender_role', mm.sender_role,
              'message', mm.message,
              'message_type', mm.message_type,
              'metadata', mm.metadata,
              'read_by_owner', mm.read_by_owner,
              'read_by_admin', mm.read_by_admin,
              'created_at', mm.created_at
            )
            order by mm.created_at asc
          )
          from public.moderation_messages mm
          where mm.thread_id = mt.id
            and mm.is_internal_to_admin = false
        ), '[]'::jsonb)
      )
      order by mt.last_message_at desc
    )
    from public.moderation_threads mt
    left join public.businesses b on b.id = mt.business_id
    where mt.owner_id = auth.uid()
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.get_my_moderation_threads() from public;
grant execute on function public.get_my_moderation_threads() to authenticated;

create or replace function public.get_admin_moderation_threads()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can view moderation threads'
      using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', mt.id,
        'business_id', mt.business_id,
        'business_name', b.name,
        'report_id', mt.report_id,
        'owner_id', mt.owner_id,
        'owner_email', up.email,
        'type', mt.type,
        'status', mt.status,
        'priority', mt.priority,
        'subject', mt.subject,
        'last_message_at', mt.last_message_at,
        'closed_at', mt.closed_at,
        'created_at', mt.created_at,
        'unread_count', (
          select count(*)::int
          from public.moderation_messages mm
          where mm.thread_id = mt.id
            and mm.read_by_admin = false
            and mm.sender_role = 'owner'
        ),
        'messages', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', mm.id,
              'sender_role', mm.sender_role,
              'message', mm.message,
              'message_type', mm.message_type,
              'metadata', mm.metadata,
              'read_by_owner', mm.read_by_owner,
              'read_by_admin', mm.read_by_admin,
              'is_internal_to_admin', mm.is_internal_to_admin,
              'created_at', mm.created_at
            )
            order by mm.created_at asc
          )
          from public.moderation_messages mm
          where mm.thread_id = mt.id
        ), '[]'::jsonb)
      )
      order by mt.last_message_at desc
    )
    from public.moderation_threads mt
    left join public.businesses b on b.id = mt.business_id
    left join public.users_profile up on up.id = mt.owner_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.get_admin_moderation_threads() from public;
grant execute on function public.get_admin_moderation_threads() to authenticated;

-- 4) Fix admin metrics. Avoid nonexistent columns and return a stable JSON shape.
create or replace function public.get_admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  top_reviewed jsonb;
  critical_businesses int;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can view admin metrics'
      using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(item order by (item->>'review_count')::int desc), '[]'::jsonb)
  into top_reviewed
  from (
    select jsonb_build_object(
      'business_id', br.business_id,
      'business_name', b.name,
      'review_count', count(*)::int
    ) as item
    from public.business_reviews br
    left join public.businesses b on b.id = br.business_id
    where coalesce(br.status, 'visible') in ('visible', 'approved', 'active')
    group by br.business_id, b.name
    order by count(*) desc
    limit 5
  ) ranked;

  select count(*)::int
  into critical_businesses
  from (
    select r.business_id
    from public.reports r
    where r.status in ('open', 'reviewing')
    group by r.business_id
    having count(distinct r.reporter_id) >= 3
  ) critical;

  return jsonb_build_object(
    'businesses', jsonb_build_object(
      'total', (select count(*)::int from public.businesses),
      'public_visible', (select count(*)::int from public.businesses where status in ('active', 'approved')),
      'pending', (select count(*)::int from public.businesses where status in ('pending_review', 'draft')),
      'rejected_or_reviewing', (select count(*)::int from public.businesses where status in ('rejected', 'under_review', 'hidden')),
      'rejected', (select count(*)::int from public.businesses where status in ('rejected', 'hidden')),
      'under_review', (select count(*)::int from public.businesses where status = 'under_review'),
      'suspended', (select count(*)::int from public.businesses where status = 'under_review'),
      'without_location', (
        select count(*)::int
        from public.businesses b
        where not exists (select 1 from public.locations l where l.business_id = b.id)
      ),
      'without_products', (
        select count(*)::int
        from public.businesses b
        where not exists (select 1 from public.products p where p.business_id = b.id)
      ),
      'without_schedules', (
        select count(*)::int
        from public.businesses b
        where not exists (select 1 from public.schedules s where s.business_id = b.id)
      ),
      'without_whatsapp', (
        select count(*)::int
        from public.businesses b
        where not exists (
          select 1 from public.contact_info ci
          where ci.business_id = b.id and nullif(btrim(ci.whatsapp_number), '') is not null
        )
      ),
      'without_description', (
        select count(*)::int
        from public.businesses b
        where nullif(btrim(coalesce(b.description, '')), '') is null
      ),
      'with_3_unique_reports', critical_businesses
    ),
    'products', jsonb_build_object(
      'total', (select count(*)::int from public.products),
      'active', (select count(*)::int from public.products where is_available = true),
      'inactive', (select count(*)::int from public.products where is_available = false),
      'with_price', (select count(*)::int from public.products where price is not null),
      'without_price', (select count(*)::int from public.products where price is null)
    ),
    'users', jsonb_build_object(
      'buyers', (select count(*)::int from public.users_profile where role = 'buyer'),
      'owners', (select count(*)::int from public.users_profile where role = 'owner'),
      'admins', (select count(*)::int from public.users_profile where role = 'admin'),
      'onboarding_complete', (select count(*)::int from public.users_profile where onboarding_completed = true),
      'onboarding_pending', (select count(*)::int from public.users_profile where coalesce(onboarding_completed, false) = false)
    ),
    'reviews', jsonb_build_object(
      'total', (select count(*)::int from public.business_reviews),
      'average_rating', (select round(avg(rating)::numeric, 2) from public.business_reviews where coalesce(status, 'visible') in ('visible', 'approved', 'active')),
      'top_businesses', coalesce(top_reviewed, '[]'::jsonb)
    ),
    'reports', jsonb_build_object(
      'total', (select count(*)::int from public.reports),
      'pending', (select count(*)::int from public.reports where status = 'open'),
      'active', (select count(*)::int from public.reports where status in ('open', 'reviewing')),
      'reviewing', (select count(*)::int from public.reports where status = 'reviewing'),
      'resolved', (select count(*)::int from public.reports where status = 'resolved'),
      'dismissed', (select count(*)::int from public.reports where status = 'dismissed'),
      'with_3_unique_reports', critical_businesses
    ),
    'notifications', jsonb_build_object(
      'total', (select count(*)::int from public.user_notifications),
      'unread', (select count(*)::int from public.user_notifications where status = 'unread'),
      'sent_approved', (select count(*)::int from public.user_notifications where type = 'business_approved'),
      'sent_rejected', (select count(*)::int from public.user_notifications where type in ('business_rejected', 'business_needs_changes')),
      'sent_suspended', (select count(*)::int from public.user_notifications where type = 'business_suspended'),
      'sent_reactivated', (select count(*)::int from public.user_notifications where type = 'business_reactivated'),
      'messages_total', (select count(*)::int from public.moderation_messages),
      'messages_unread_owner', (select count(*)::int from public.moderation_messages where sender_role in ('admin', 'system') and read_by_owner = false and is_internal_to_admin = false),
      'threads_open', (select count(*)::int from public.moderation_threads where status in ('open', 'waiting_owner', 'waiting_admin')),
      'threads_closed', (select count(*)::int from public.moderation_threads where status in ('closed', 'resolved'))
    ),
    'quality', jsonb_build_object(
      'without_schedules', (
        select count(*)::int
        from public.businesses b
        where not exists (select 1 from public.schedules s where s.business_id = b.id)
      ),
      'without_whatsapp', (
        select count(*)::int
        from public.businesses b
        where not exists (
          select 1 from public.contact_info ci
          where ci.business_id = b.id and nullif(btrim(ci.whatsapp_number), '') is not null
        )
      ),
      'without_image', (
        select count(*)::int
        from public.businesses b
        where not exists (select 1 from public.business_images bi where bi.business_id = b.id)
      ),
      'without_description', (
        select count(*)::int
        from public.businesses b
        where nullif(btrim(coalesce(b.description, '')), '') is null
      ),
      'without_category', (select count(*)::int from public.businesses where category_id is null)
    )
  );
end;
$$;

revoke all on function public.get_admin_metrics() from public;
grant execute on function public.get_admin_metrics() to authenticated;

-- 5) Enrich admin review: notification + moderation case/message.
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
  thread_type text := 'verification';
  thread_subject text := 'Revision de negocio';
  thread_priority text := 'normal';
  thread_id uuid;
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
    raise exception 'A clear correction note is required when returning a business for corrections'
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
      thread_type := 'reactivation';
      thread_subject := 'Negocio reactivado';
    else
      notification_type := 'business_approved';
      notification_title := 'Tu negocio fue aprobado';
      notification_message := 'Tu emprendimiento ya esta visible en Garemo. Los compradores pueden encontrarte en el directorio y el mapa.';
      thread_type := 'verification';
      thread_subject := 'Negocio aprobado';
    end if;
  elsif next_status in ('rejected'::public.business_status, 'hidden'::public.business_status) then
    notification_type := 'business_needs_changes';
    notification_title := 'Tu negocio requiere correcciones';
    notification_message := 'El equipo de Garemo reviso tu publicacion y necesita que corrijas algunos datos antes de aprobarla.';
    thread_type := 'needs_changes';
    thread_subject := 'Devolucion de verificacion';
    thread_priority := 'high';
  elsif next_status = 'under_review'::public.business_status then
    notification_type := 'business_suspended';
    notification_title := 'Tu negocio esta en revision';
    notification_message := 'Tu negocio fue suspendido temporalmente mientras revisamos reportes de la comunidad. Puedes revisar tu informacion desde tu panel.';
    thread_type := 'suspension';
    thread_subject := 'Negocio en revision';
    thread_priority := 'high';
  else
    notification_type := 'business_needs_changes';
    notification_title := 'Tu negocio sigue en revision';
    notification_message := coalesce(clean_notes, 'Tu negocio esta en revision. Te avisaremos cuando cambie el estado.');
    thread_type := 'verification';
    thread_subject := 'Seguimiento de revision';
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

  thread_id := public.create_moderation_thread_internal(
    reviewed_business.id,
    null,
    thread_type,
    thread_subject,
    case
      when next_status in ('active'::public.business_status, 'approved'::public.business_status) then 'resolved'
      else 'waiting_owner'
    end,
    thread_priority,
    reviewed_business.owner_id,
    auth.uid()
  );

  perform public.insert_moderation_message_internal(
    thread_id,
    auth.uid(),
    'admin',
    case
      when next_status in ('rejected'::public.business_status, 'hidden'::public.business_status) then
        'Tu negocio requiere correcciones. Motivo: ' || coalesce(clean_reason, 'Revision de datos') || '. ' || coalesce(clean_notes, 'Completa la informacion solicitada y responde este caso.')
      when next_status = 'under_review'::public.business_status then
        coalesce(clean_notes, 'Tu negocio esta suspendido temporalmente mientras revisamos reportes de la comunidad.')
      else
        coalesce(clean_notes, notification_message)
    end,
    case
      when next_status in ('rejected'::public.business_status, 'hidden'::public.business_status) then 'rejection_reason'
      when next_status = 'under_review'::public.business_status then 'status_change'
      else 'status_change'
    end,
    jsonb_build_object(
      'business_status', reviewed_business.status::text,
      'previous_status', existing_business.status::text,
      'reason', clean_reason,
      'reviewed_at', now()
    ),
    false
  );

  return reviewed_business;
end;
$$;

comment on function public.admin_review_business(uuid, public.business_status, boolean, text, text) is
  'Reviews, approves, returns, suspends, or reactivates a business, notifies the owner, and records a moderation thread.';

revoke all on function public.admin_review_business(uuid, public.business_status, boolean, text, text) from public;
grant execute on function public.admin_review_business(uuid, public.business_status, boolean, text, text) to authenticated;

-- 6) Enrich report resolution with moderation thread/message.
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
  report_row public.reports;
  business_row public.businesses;
  clean_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  thread_id uuid;
  unique_active_reports int;
begin
  if auth.uid() is null or not public.is_admin_user() then
    raise exception 'Only active admin users can resolve reports'
      using errcode = '42501';
  end if;

  if p_next_status not in ('open'::public.report_status, 'reviewing'::public.report_status, 'resolved'::public.report_status, 'dismissed'::public.report_status) then
    raise exception 'Invalid report status' using errcode = '22023';
  end if;

  select * into report_row
  from public.reports
  where id = p_report_id;

  if report_row.id is null then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  select * into business_row
  from public.businesses
  where id = report_row.business_id;

  update public.reports
  set
    status = p_next_status,
    admin_notes = clean_notes,
    resolved_by = case when p_next_status in ('resolved'::public.report_status, 'dismissed'::public.report_status) then auth.uid() else resolved_by end,
    resolved_at = case when p_next_status in ('resolved'::public.report_status, 'dismissed'::public.report_status) then now() else resolved_at end,
    updated_at = now()
  where id = p_report_id;

  if p_business_status is not null and business_row.id is not null then
    update public.businesses
    set
      status = p_business_status,
      is_verified = case
        when p_business_status in ('active'::public.business_status, 'approved'::public.business_status) then is_verified
        else false
      end,
      moderation_reason = case when p_business_status = 'under_review'::public.business_status then 'Reportado por la comunidad' else moderation_reason end,
      moderation_status_message = case
        when p_business_status = 'under_review'::public.business_status then coalesce(clean_notes, 'Este negocio esta en revision por reportes de la comunidad.')
        else moderation_status_message
      end,
      suspended_at = case when p_business_status = 'under_review'::public.business_status then coalesce(suspended_at, now()) else suspended_at end,
      reactivated_at = case when p_business_status in ('active'::public.business_status, 'approved'::public.business_status) then now() else reactivated_at end,
      updated_at = now()
    where id = business_row.id;
  end if;

  if business_row.id is not null then
    select count(distinct reporter_id)::int
    into unique_active_reports
    from public.reports
    where business_id = business_row.id
      and status in ('open', 'reviewing');

    thread_id := public.create_moderation_thread_internal(
      business_row.id,
      p_report_id,
      'report',
      'Reporte de la comunidad',
      case when p_next_status in ('resolved'::public.report_status, 'dismissed'::public.report_status) then 'resolved' else 'waiting_owner' end,
      case when unique_active_reports >= 3 then 'critical' else 'normal' end,
      business_row.owner_id,
      auth.uid()
    );

    perform public.insert_moderation_message_internal(
      thread_id,
      auth.uid(),
      'admin',
      case
        when p_business_status = 'under_review'::public.business_status then coalesce(clean_notes, 'Recibimos reportes de la comunidad y tu negocio fue suspendido temporalmente mientras revisamos el caso.')
        when p_next_status = 'dismissed'::public.report_status then coalesce(clean_notes, 'El reporte fue descartado despues de la revision.')
        when p_next_status = 'resolved'::public.report_status then coalesce(clean_notes, 'El reporte fue resuelto por el equipo de Garemo.')
        else coalesce(clean_notes, 'El reporte esta en revision por el equipo de Garemo.')
      end,
      'status_change',
      jsonb_build_object(
        'report_id', p_report_id,
        'report_status', p_next_status::text,
        'business_status', coalesce(p_business_status::text, business_row.status::text),
        'unique_active_reports', unique_active_reports
      ),
      false
    );

    perform public.create_business_notification_for_owner(
      business_row.id,
      case
        when p_business_status = 'under_review'::public.business_status then 'business_suspended'
        when p_next_status = 'resolved'::public.report_status then 'report_resolved'
        else 'business_reported'
      end,
      case
        when p_business_status = 'under_review'::public.business_status then 'Tu negocio esta en revision'
        when p_next_status = 'resolved'::public.report_status then 'Reporte revisado por Garemo'
        else 'Reporte en revision'
      end,
      case
        when p_business_status = 'under_review'::public.business_status then 'Recibimos reportes de la comunidad y tu negocio fue suspendido temporalmente mientras revisamos el caso.'
        when p_next_status = 'resolved'::public.report_status then 'El equipo de Garemo reviso un reporte relacionado a tu negocio.'
        else 'El equipo de Garemo esta revisando un reporte relacionado a tu negocio.'
      end,
      jsonb_build_object(
        'report_id', p_report_id,
        'report_status', p_next_status::text,
        'unique_active_reports', unique_active_reports
      )
    );
  end if;
end;
$$;

revoke all on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) from public;
grant execute on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) to authenticated;

commit;
