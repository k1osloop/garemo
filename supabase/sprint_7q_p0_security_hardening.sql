-- Garemo Sprint 7Q-P0 production hardening.
-- Idempotent security changes for public RPC exposure and public visibility.
-- Run in Supabase SQL Editor or via execute_sql after reviewing.

begin;

-- 1) Public visibility must not include businesses pending review or moderation.
create or replace function public.is_public_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.businesses b
    join public.categories c on c.id = b.category_id
    where b.id = target_business_id
      and b.status in ('active'::public.business_status, 'approved'::public.business_status)
      and c.is_active = true
  );
$$;

comment on function public.is_public_business(uuid) is
  'Returns true only for category-active businesses in public statuses active/approved.';

revoke all on function public.is_public_business(uuid) from public;
grant execute on function public.is_public_business(uuid) to anon, authenticated;

-- 2) Public search remains public, but only for active/approved businesses.
create or replace function public.search_businesses(
  p_query text default '',
  p_category_slug text default null
)
returns setof public.businesses
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct b.*
  from public.businesses b
  join public.categories c on c.id = b.category_id
  left join public.products p on p.business_id = b.id
  where b.status in ('active'::public.business_status, 'approved'::public.business_status)
    and c.is_active = true
    and (
      p_category_slug is null
      or c.slug = left(p_category_slug, 120)
    )
    and (
      nullif(btrim(coalesce(p_query, '')), '') is null
      or b.name ilike '%' || left(btrim(p_query), 120) || '%'
      or b.description ilike '%' || left(btrim(p_query), 120) || '%'
      or p.name ilike '%' || left(btrim(p_query), 120) || '%'
      or p.description ilike '%' || left(btrim(p_query), 120) || '%'
    )
  order by b.name asc;
$$;

comment on function public.search_businesses(text, text) is
  'Public search RPC. Returns only active/approved businesses in active categories.';

revoke all on function public.search_businesses(text, text) from public;
grant execute on function public.search_businesses(text, text) to anon, authenticated;

-- 3) Public trust summaries remain public and aggregate only public businesses.
create or replace function public.get_public_business_trust_summaries()
returns table(
  business_id uuid,
  average_rating numeric,
  review_count integer,
  whatsapp_click_count integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with review_summary as (
    select
      br.business_id,
      round(avg(br.rating)::numeric, 2) as average_rating,
      count(*)::integer as review_count
    from public.business_reviews br
    where br.status = 'visible'
      and public.is_public_business(br.business_id)
    group by br.business_id
  ),
  click_summary as (
    select
      wc.business_id,
      count(*)::integer as whatsapp_click_count
    from public.whatsapp_clicks wc
    where public.is_public_business(wc.business_id)
    group by wc.business_id
  )
  select
    b.id as business_id,
    r.average_rating,
    coalesce(r.review_count, 0) as review_count,
    coalesce(w.whatsapp_click_count, 0) as whatsapp_click_count
  from public.businesses b
  left join review_summary r on r.business_id = b.id
  left join click_summary w on w.business_id = b.id
  where public.is_public_business(b.id);
$$;

comment on function public.get_public_business_trust_summaries() is
  'Public aggregate trust summary for active/approved businesses only.';

revoke all on function public.get_public_business_trust_summaries() from public;
grant execute on function public.get_public_business_trust_summaries() to anon, authenticated;

-- 4) WhatsApp contact tracking remains RPC-only. It does not store PII and
-- deduplicates obvious repeated clicks by business/product/source in 30 seconds.
create or replace function public.record_whatsapp_click(
  target_business_id uuid,
  target_product_id uuid default null,
  click_source text default 'business_detail'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_source text;
begin
  if not public.is_public_business(target_business_id) then
    raise exception 'Business is not public'
      using errcode = '42501';
  end if;

  if target_product_id is not null
    and not exists (
      select 1
      from public.products p
      where p.id = target_product_id
        and p.business_id = target_business_id
        and p.is_available = true
    )
  then
    raise exception 'Product does not belong to public business'
      using errcode = '22023';
  end if;

  normalized_source := left(
    regexp_replace(
      coalesce(nullif(btrim(click_source), ''), 'business_detail'),
      '[^a-zA-Z0-9_-]',
      '_',
      'g'
    ),
    80
  );

  if char_length(normalized_source) < 2 then
    normalized_source := 'business_detail';
  end if;

  if exists (
    select 1
    from public.whatsapp_clicks wc
    where wc.business_id = target_business_id
      and wc.product_id is not distinct from target_product_id
      and wc.source = normalized_source
      and wc.created_at >= now() - interval '30 seconds'
  ) then
    return;
  end if;

  insert into public.whatsapp_clicks (
    business_id,
    product_id,
    source
  )
  values (
    target_business_id,
    target_product_id,
    normalized_source
  );
end;
$$;

comment on function public.record_whatsapp_click(uuid, uuid, text) is
  'RPC-only public WhatsApp click counter. Validates public business/product and deduplicates obvious repeated clicks.';

revoke all on function public.record_whatsapp_click(uuid, uuid, text) from public;
grant execute on function public.record_whatsapp_click(uuid, uuid, text) to anon, authenticated;

-- Keep whatsapp_clicks closed to direct Data API access. Inserts happen only
-- through record_whatsapp_click(), which validates the public business.
alter table public.whatsapp_clicks enable row level security;
revoke all on table public.whatsapp_clicks from anon, authenticated;

-- Public buckets can serve object URLs without allowing clients to list every
-- object through the Storage API.
drop policy if exists "public_read_garemo_images" on storage.objects;

-- 5) Remove public email enumeration and role/event-trigger execution.
revoke all on function public.is_registered_email(text) from public;
revoke all on function public.is_registered_email(text) from anon;
grant execute on function public.is_registered_email(text) to authenticated;

revoke all on function public.become_owner() from public;
revoke all on function public.become_owner() from anon;
grant execute on function public.become_owner() to authenticated;

revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;

-- 6) Explicitly keep admin RPCs closed to anon/public and available only to
-- authenticated users. The functions themselves still enforce is_admin_user().
revoke all on function public.admin_review_business(uuid, public.business_status, boolean, text, text) from public;
grant execute on function public.admin_review_business(uuid, public.business_status, boolean, text, text) to authenticated;

revoke all on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) from public;
grant execute on function public.admin_resolve_report(uuid, public.report_status, text, public.business_status) to authenticated;

revoke all on function public.get_admin_metrics() from public;
grant execute on function public.get_admin_metrics() to authenticated;

revoke all on function public.admin_send_moderation_message(uuid, text, text, jsonb, boolean) from public;
grant execute on function public.admin_send_moderation_message(uuid, text, text, jsonb, boolean) to authenticated;

revoke all on function public.admin_create_notification(uuid, uuid, text, text, text, jsonb) from public;
grant execute on function public.admin_create_notification(uuid, uuid, text, text, text, jsonb) to authenticated;

revoke all on function public.admin_moderate_business(uuid, public.business_status, text, text) from public;
grant execute on function public.admin_moderate_business(uuid, public.business_status, text, text) to authenticated;

revoke all on function public.admin_create_moderation_thread(uuid, uuid, text, text, text, text, jsonb) from public;
grant execute on function public.admin_create_moderation_thread(uuid, uuid, text, text, text, text, jsonb) to authenticated;

revoke all on function public.admin_close_moderation_thread(uuid) from public;
grant execute on function public.admin_close_moderation_thread(uuid) to authenticated;

commit;
