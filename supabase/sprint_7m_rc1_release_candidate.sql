-- Garemo Sprint 7M RC1 release candidate hardening.
-- Adds notification archive support plus email/audit logs.
-- No public writes. No physical deletes. No service_role assumptions.

begin;

alter table public.user_notifications
  drop constraint if exists user_notifications_status_check;

alter table public.user_notifications
  add constraint user_notifications_status_check
  check (status in ('unread', 'read', 'archived'));

create index if not exists user_notifications_user_status_created_idx
  on public.user_notifications(user_id, status, created_at desc);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users_profile(id) on delete set null,
  business_id uuid null references public.businesses(id) on delete set null,
  notification_id uuid null references public.user_notifications(id) on delete set null,
  moderation_thread_id uuid null references public.moderation_threads(id) on delete set null,
  event_type text not null,
  recipient_email text not null,
  subject text not null,
  provider text not null default 'resend',
  provider_message_id text null,
  status text not null default 'queued',
  attempts int not null default 0,
  last_error text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null,
  constraint email_events_status_check check (
    status in ('queued', 'sent', 'failed', 'skipped')
  ),
  constraint email_events_event_type_length check (
    char_length(event_type) between 3 and 80
  ),
  constraint email_events_subject_length check (
    char_length(subject) between 3 and 200
  )
);

comment on table public.email_events is
  'Transactional email delivery audit log. Written by authenticated server route with RLS.';

create index if not exists email_events_user_created_idx
  on public.email_events(user_id, created_at desc);
create index if not exists email_events_status_created_idx
  on public.email_events(status, created_at desc);
create index if not exists email_events_type_created_idx
  on public.email_events(event_type, created_at desc);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null references public.users_profile(id) on delete set null,
  business_id uuid null references public.businesses(id) on delete set null,
  target_user_id uuid null references public.users_profile(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_logs_action_length check (
    char_length(action) between 3 and 100
  ),
  constraint admin_audit_logs_summary_length check (
    char_length(summary) between 3 and 1000
  )
);

comment on table public.admin_audit_logs is
  'Internal audit trail for admin moderation and release-candidate QA events.';

create index if not exists admin_audit_logs_actor_created_idx
  on public.admin_audit_logs(actor_id, created_at desc);
create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs(entity_type, entity_id, created_at desc);
create index if not exists admin_audit_logs_business_created_idx
  on public.admin_audit_logs(business_id, created_at desc);

alter table public.email_events enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on table public.email_events from anon;
revoke all on table public.admin_audit_logs from anon;
grant select, insert, update on table public.email_events to authenticated;
grant select, insert on table public.admin_audit_logs to authenticated;

drop policy if exists "email_events_admin_select_all" on public.email_events;
drop policy if exists "email_events_user_select_own" on public.email_events;
drop policy if exists "email_events_admin_insert" on public.email_events;
drop policy if exists "email_events_user_insert_own" on public.email_events;
drop policy if exists "email_events_admin_update" on public.email_events;
drop policy if exists "email_events_user_update_own" on public.email_events;

create policy "email_events_admin_select_all"
on public.email_events
for select
to authenticated
using (public.is_admin_user());

create policy "email_events_user_select_own"
on public.email_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "email_events_admin_insert"
on public.email_events
for insert
to authenticated
with check (public.is_admin_user());

create policy "email_events_user_insert_own"
on public.email_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "email_events_admin_update"
on public.email_events
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "email_events_user_update_own"
on public.email_events
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "admin_audit_logs_admin_select_all" on public.admin_audit_logs;
drop policy if exists "admin_audit_logs_admin_insert" on public.admin_audit_logs;

create policy "admin_audit_logs_admin_select_all"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin_user());

create policy "admin_audit_logs_admin_insert"
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin_user());

create or replace function public.archive_notification(notification_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  changed_count int;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.user_notifications
  set
    status = 'archived',
    read_at = coalesce(read_at, now())
  where id = notification_id
    and user_id = auth.uid();

  get diagnostics changed_count = row_count;
  return changed_count > 0;
end;
$$;

revoke all on function public.archive_notification(uuid) from public;
grant execute on function public.archive_notification(uuid) to authenticated;

create or replace function public.record_admin_audit_log(
  target_action text,
  target_entity_type text,
  target_entity_id uuid default null,
  target_business_id uuid default null,
  target_user_id uuid default null,
  target_summary text default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_admin_user() then
    raise exception 'Only active admin users can write audit logs'
      using errcode = '42501';
  end if;

  insert into public.admin_audit_logs (
    actor_id,
    business_id,
    target_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    auth.uid(),
    target_business_id,
    target_user_id,
    nullif(btrim(target_action), ''),
    nullif(btrim(target_entity_type), ''),
    target_entity_id,
    coalesce(nullif(btrim(target_summary), ''), 'Admin action recorded'),
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.record_admin_audit_log(text, text, uuid, uuid, uuid, text, jsonb) from public;
grant execute on function public.record_admin_audit_log(text, text, uuid, uuid, uuid, text, jsonb) to authenticated;

create or replace function public.get_admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Only active admin users can view metrics'
      using errcode = '42501';
  end if;

  return jsonb_build_object(
    'businesses', jsonb_build_object(
      'total', (select count(*)::int from public.businesses),
      'public_visible', (select count(*)::int from public.businesses where status in ('approved', 'active')),
      'pending', (select count(*)::int from public.businesses where status = 'pending_review'),
      'rejected', (select count(*)::int from public.businesses where status = 'rejected'),
      'under_review', (select count(*)::int from public.businesses where status = 'under_review'),
      'suspended', (select count(*)::int from public.businesses where status in ('hidden', 'under_review')),
      'rejected_or_reviewing', (select count(*)::int from public.businesses where status in ('rejected', 'under_review')),
      'without_location', (select count(*)::int from public.businesses b where not exists (select 1 from public.locations l where l.business_id = b.id)),
      'without_products', (select count(*)::int from public.businesses b where not exists (select 1 from public.products p where p.business_id = b.id)),
      'without_schedules', (select count(*)::int from public.businesses b where not exists (select 1 from public.schedules s where s.business_id = b.id)),
      'without_whatsapp', (select count(*)::int from public.businesses b where not exists (select 1 from public.contact_info ci where ci.business_id = b.id and nullif(btrim(ci.whatsapp_number), '') is not null)),
      'without_description', (select count(*)::int from public.businesses where nullif(btrim(description), '') is null),
      'verified', (select count(*)::int from public.businesses where is_verified = true),
      'with_3_unique_reports', (
        select count(*)::int
        from (
          select business_id
          from public.reports
          where status in ('open', 'reviewing')
          group by business_id
          having count(distinct reporter_id) >= 3
        ) report_groups
      )
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
      'onboarding_pending', (select count(*)::int from public.users_profile where onboarding_completed = false),
      'growth_7d', (select count(*)::int from public.users_profile where created_at >= now() - interval '7 days')
    ),
    'reviews', jsonb_build_object(
      'total', (select count(*)::int from public.business_reviews where status = 'visible'),
      'average_rating', (select round(avg(rating)::numeric, 2) from public.business_reviews where status = 'visible'),
      'top_businesses', coalesce((
        select jsonb_agg(row_to_json(top_rows))
        from (
          select br.business_id, b.name as business_name, count(*)::int as review_count
          from public.business_reviews br
          join public.businesses b on b.id = br.business_id
          where br.status = 'visible'
          group by br.business_id, b.name
          order by count(*) desc
          limit 5
        ) top_rows
      ), '[]'::jsonb)
    ),
    'reports', jsonb_build_object(
      'total', (select count(*)::int from public.reports),
      'pending', (select count(*)::int from public.reports where status = 'open'),
      'active', (select count(*)::int from public.reports where status in ('open', 'reviewing')),
      'reviewing', (select count(*)::int from public.reports where status = 'reviewing'),
      'resolved', (select count(*)::int from public.reports where status = 'resolved'),
      'dismissed', (select count(*)::int from public.reports where status = 'dismissed')
    ),
    'notifications', jsonb_build_object(
      'total', (select count(*)::int from public.user_notifications),
      'unread', (select count(*)::int from public.user_notifications where status = 'unread'),
      'archived', (select count(*)::int from public.user_notifications where status = 'archived'),
      'sent_approved', (select count(*)::int from public.user_notifications where type = 'business_approved'),
      'sent_rejected', (select count(*)::int from public.user_notifications where type in ('business_rejected', 'business_needs_changes')),
      'sent_suspended', (select count(*)::int from public.user_notifications where type = 'business_suspended'),
      'sent_reactivated', (select count(*)::int from public.user_notifications where type = 'business_reactivated'),
      'messages_total', (select count(*)::int from public.moderation_messages),
      'messages_unread_owner', (select count(*)::int from public.moderation_messages where sender_role in ('admin', 'system') and read_by_owner = false and is_internal_to_admin = false),
      'threads_open', (select count(*)::int from public.moderation_threads where status in ('open', 'waiting_owner', 'waiting_admin')),
      'threads_closed', (select count(*)::int from public.moderation_threads where status in ('closed', 'resolved'))
    ),
    'email', jsonb_build_object(
      'total', (select count(*)::int from public.email_events),
      'sent', (select count(*)::int from public.email_events where status = 'sent'),
      'failed', (select count(*)::int from public.email_events where status = 'failed'),
      'queued', (select count(*)::int from public.email_events where status = 'queued')
    ),
    'audit', jsonb_build_object(
      'admin_actions_total', (select count(*)::int from public.admin_audit_logs),
      'admin_actions_24h', (select count(*)::int from public.admin_audit_logs where created_at >= now() - interval '24 hours')
    ),
    'growth', jsonb_build_object(
      'businesses_7d', (select count(*)::int from public.businesses where created_at >= now() - interval '7 days'),
      'products_7d', (select count(*)::int from public.products where created_at >= now() - interval '7 days'),
      'reviews_7d', (select count(*)::int from public.business_reviews where created_at >= now() - interval '7 days'),
      'reports_7d', (select count(*)::int from public.reports where created_at >= now() - interval '7 days'),
      'contacts_7d', (select count(*)::int from public.whatsapp_clicks where created_at >= now() - interval '7 days')
    )
  );
end;
$$;

revoke all on function public.get_admin_metrics() from public;
grant execute on function public.get_admin_metrics() to authenticated;

commit;
