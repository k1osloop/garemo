-- Garemo Sprint 3C trust ratings and contact counters.
-- Run manually in Supabase SQL Editor after Sprint 3B.
-- Adds moderated ratings and minimal WhatsApp click tracking.
-- No service_role required by the frontend. No public direct table writes.

begin;

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.users_profile(id) on delete cascade,
  rating integer not null,
  comment text,
  status text not null default 'visible',
  moderation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id),
  constraint business_reviews_rating_range check (rating between 1 and 5),
  constraint business_reviews_comment_length check (
    comment is null or char_length(comment) <= 280
  ),
  constraint business_reviews_status_check check (
    status in ('visible', 'hidden', 'pending_review')
  ),
  constraint business_reviews_moderation_notes_length check (
    moderation_notes is null or char_length(moderation_notes) <= 1000
  )
);

comment on table public.business_reviews is
  'Authenticated user ratings for visible businesses. One review per user and business.';
comment on column public.business_reviews.status is
  'Moderation state. Only visible reviews are exposed publicly.';

create index if not exists business_reviews_business_status_idx
  on public.business_reviews(business_id, status);
create index if not exists business_reviews_user_idx
  on public.business_reviews(user_id);
create index if not exists business_reviews_rating_idx
  on public.business_reviews(rating);

create table if not exists public.whatsapp_clicks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  source text not null default 'business_detail',
  created_at timestamptz not null default now(),
  constraint whatsapp_clicks_source_length check (char_length(source) between 2 and 80)
);

comment on table public.whatsapp_clicks is
  'Minimal WhatsApp contact click events. These are contacts generated, not sales.';

create index if not exists whatsapp_clicks_business_created_idx
  on public.whatsapp_clicks(business_id, created_at desc);
create index if not exists whatsapp_clicks_product_idx
  on public.whatsapp_clicks(product_id);

alter table public.business_reviews enable row level security;
alter table public.whatsapp_clicks enable row level security;

revoke all on table public.business_reviews from anon, authenticated;
revoke all on table public.whatsapp_clicks from anon, authenticated;

grant select on table public.business_reviews to anon, authenticated;
grant insert (
  id,
  business_id,
  user_id,
  rating,
  comment,
  status,
  created_at,
  updated_at
) on public.business_reviews to authenticated;
grant update (
  rating,
  comment,
  updated_at
) on public.business_reviews to authenticated;
grant update (
  status,
  moderation_notes,
  updated_at
) on public.business_reviews to authenticated;

drop policy if exists "public_read_visible_business_reviews" on public.business_reviews;
drop policy if exists "user_insert_own_visible_review" on public.business_reviews;
drop policy if exists "user_update_own_visible_review" on public.business_reviews;
drop policy if exists "admin_select_all_reviews" on public.business_reviews;
drop policy if exists "admin_moderate_reviews" on public.business_reviews;

create policy "public_read_visible_business_reviews"
on public.business_reviews
for select
to anon, authenticated
using (
  status = 'visible'
  and public.is_public_business(business_id)
);

create policy "user_insert_own_visible_review"
on public.business_reviews
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'visible'
  and public.is_public_business(business_id)
  and not exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_id = auth.uid()
  )
);

create policy "user_update_own_visible_review"
on public.business_reviews
for update
to authenticated
using (
  user_id = auth.uid()
  and status = 'visible'
  and public.is_public_business(business_id)
  and not exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and status = 'visible'
  and public.is_public_business(business_id)
  and not exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_id = auth.uid()
  )
);

create policy "admin_select_all_reviews"
on public.business_reviews
for select
to authenticated
using (public.is_admin_user());

create policy "admin_moderate_reviews"
on public.business_reviews
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create or replace function public.get_public_business_trust_summaries()
returns table (
  business_id uuid,
  average_rating numeric,
  review_count integer,
  whatsapp_click_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  with review_summary as (
    select
      business_id,
      round(avg(rating)::numeric, 2) as average_rating,
      count(*)::integer as review_count
    from public.business_reviews
    where status = 'visible'
    group by business_id
  ),
  click_summary as (
    select
      business_id,
      count(*)::integer as whatsapp_click_count
    from public.whatsapp_clicks
    group by business_id
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
  'Returns public aggregate ratings and WhatsApp click counts for visible businesses only.';

create or replace function public.record_whatsapp_click(
  target_business_id uuid,
  target_product_id uuid default null,
  click_source text default 'business_detail'
)
returns void
language plpgsql
security definer
set search_path = public
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
    )
  then
    raise exception 'Product does not belong to business'
      using errcode = '22023';
  end if;

  normalized_source := left(
    regexp_replace(coalesce(nullif(btrim(click_source), ''), 'business_detail'), '[^a-zA-Z0-9_-]', '_', 'g'),
    80
  );

  if char_length(normalized_source) < 2 then
    normalized_source := 'business_detail';
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
  'Records a minimal WhatsApp contact click for a public business. This is a contact signal, not a sale.';

revoke all on function public.get_public_business_trust_summaries() from public;
revoke all on function public.record_whatsapp_click(uuid, uuid, text) from public;
grant execute on function public.get_public_business_trust_summaries() to anon, authenticated;
grant execute on function public.record_whatsapp_click(uuid, uuid, text) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');

commit;
