-- Garemo Sprint 5M report submission hotfix.
-- Aligns the real reports table with the public report modal and admin panel.
-- Safe rules:
-- - no anonymous reports
-- - no public report reads
-- - no public writes
-- - owners cannot report their own businesses/products/reviews
-- - duplicate reports by same user for the same target are blocked

begin;

alter table public.reports
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists description text,
  add column if not exists admin_notes text,
  add column if not exists resolved_by uuid references public.users_profile(id) on delete set null,
  add column if not exists resolved_at timestamptz;

update public.reports
set
  target_type = coalesce(target_type, 'business'),
  target_id = coalesce(target_id, business_id),
  description = coalesce(description, details)
where target_type is null
   or target_id is null
   or (description is null and details is not null);

alter table public.reports
  alter column target_type set default 'business',
  alter column target_type set not null,
  alter column target_id set not null;

alter table public.reports
  drop constraint if exists reports_target_type_check,
  drop constraint if exists reports_description_length;

alter table public.reports
  add constraint reports_target_type_check
    check (target_type in ('business', 'product', 'review')),
  add constraint reports_description_length
    check (description is null or char_length(description) <= 1000);

create unique index if not exists reports_unique_reporter_target_idx
  on public.reports(reporter_id, target_type, target_id)
  where reporter_id is not null;

create index if not exists reports_target_status_idx
  on public.reports(target_type, target_id, status);

revoke all on table public.reports from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.reports
  from anon, authenticated;
grant select on table public.reports to authenticated;
grant update(status, admin_notes, resolved_by, resolved_at, updated_at)
  on table public.reports
  to authenticated;

drop policy if exists "Users can insert their own reports" on public.reports;
drop policy if exists "Users can view their own reports" on public.reports;
drop policy if exists "Admins can view and update all reports" on public.reports;
drop policy if exists "reporter_select_own_reports" on public.reports;
drop policy if exists "admin_select_reports" on public.reports;
drop policy if exists "admin_update_reports" on public.reports;

create policy "reporter_select_own_reports"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_id);

create policy "admin_select_reports"
on public.reports
for select
to authenticated
using (public.is_admin_user());

create policy "admin_update_reports"
on public.reports
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

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
  v_report_id uuid;
  v_business_id uuid;
  v_target_owner_id uuid;
  v_open_reporter_count integer;
begin
  if auth.uid() is null then
    raise exception 'REPORT_AUTH_REQUIRED'
      using errcode = '42501';
  end if;

  if p_target_type not in ('business', 'product', 'review') then
    raise exception 'REPORT_INVALID_TARGET_TYPE'
      using errcode = '22023';
  end if;

  if p_target_type = 'business' then
    select b.id, b.owner_id
      into v_business_id, v_target_owner_id
    from public.businesses b
    where b.id = p_target_id;
  elsif p_target_type = 'product' then
    select p.business_id, b.owner_id
      into v_business_id, v_target_owner_id
    from public.products p
    join public.businesses b on b.id = p.business_id
    where p.id = p_target_id;
  elsif p_target_type = 'review' then
    select br.business_id, b.owner_id
      into v_business_id, v_target_owner_id
    from public.business_reviews br
    join public.businesses b on b.id = br.business_id
    where br.id = p_target_id;
  end if;

  if v_business_id is null then
    raise exception 'REPORT_TARGET_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  if v_target_owner_id = auth.uid() then
    raise exception 'REPORT_OWN_BUSINESS'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.reports r
    where r.reporter_id = auth.uid()
      and r.target_type = p_target_type
      and r.target_id = p_target_id
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
    details,
    description,
    status,
    created_at,
    updated_at
  )
  values (
    auth.uid(),
    v_business_id,
    p_target_type,
    p_target_id,
    p_reason,
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    'open',
    now(),
    now()
  )
  returning id into v_report_id;

  select count(distinct reporter_id)
    into v_open_reporter_count
  from public.reports
  where business_id = v_business_id
    and status in ('open', 'reviewing')
    and reporter_id is not null;

  if v_open_reporter_count >= 3 then
    update public.businesses
    set
      status = 'under_review',
      updated_at = now()
    where id = v_business_id
      and status in ('active', 'approved', 'pending_review');
  end if;

  return v_report_id;
end;
$$;

comment on function public.submit_report(text, uuid, public.report_reason, text) is
  'Creates an authenticated moderation report for a business/product/review and moves the business to under_review after 3 distinct reporters.';

revoke all on function public.submit_report(text, uuid, public.report_reason, text) from public;
grant execute on function public.submit_report(text, uuid, public.report_reason, text) to authenticated;

drop function if exists public.admin_resolve_report(uuid, public.report_status, text);

create or replace function public.admin_resolve_report(
  p_report_id uuid,
  p_next_status public.report_status,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'REPORT_ADMIN_REQUIRED'
      using errcode = '42501';
  end if;

  update public.reports
  set
    status = p_next_status,
    admin_notes = nullif(btrim(coalesce(p_notes, '')), ''),
    resolved_by = case
      when p_next_status in ('resolved', 'dismissed') then auth.uid()
      else null
    end,
    resolved_at = case
      when p_next_status in ('resolved', 'dismissed') then now()
      else null
    end,
    updated_at = now()
  where id = p_report_id;

  if not found then
    raise exception 'REPORT_NOT_FOUND'
      using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.admin_resolve_report(uuid, public.report_status, text) is
  'Allows active Garemo admins to update report status and resolution metadata.';

revoke all on function public.admin_resolve_report(uuid, public.report_status, text) from public;
grant execute on function public.admin_resolve_report(uuid, public.report_status, text) to authenticated;

commit;
