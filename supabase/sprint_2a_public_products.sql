-- Garemo Sprint 2A public products, search and trust layer.
-- Run manually in Supabase SQL Editor after Sprint 1 schema, seed and RLS policies.
-- This script prepares public-read products only. It does not open public writes.

begin;

alter table public.businesses
  add column if not exists is_verified boolean not null default false,
  add column if not exists status_message text,
  add column if not exists opens_at time,
  add column if not exists closes_at time;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_status_message_length'
  ) then
    alter table public.businesses
      add constraint businesses_status_message_length
      check (status_message is null or char_length(status_message) <= 140);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_public_hours_validity'
  ) then
    alter table public.businesses
      add constraint businesses_public_hours_validity
      check (
        (opens_at is null and closes_at is null)
        or (opens_at is not null and closes_at is not null and opens_at < closes_at)
      );
  end if;
end $$;

comment on column public.businesses.is_verified is
  'Manual 2DevDogs trust marker for public MVP validation. It is not a payment or delivery guarantee.';
comment on column public.businesses.status_message is
  'Short public availability or promotion message managed manually during validation.';
comment on column public.businesses.opens_at is
  'Optional simplified daily opening time for public cards.';
comment on column public.businesses.closes_at is
  'Optional simplified daily closing time for public cards.';

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  offer_price numeric(10,2),
  image_url text,
  is_available boolean not null default true,
  stock_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_length check (char_length(name) between 2 and 120),
  constraint products_description_length check (
    description is null or char_length(description) <= 300
  ),
  constraint products_price_positive check (price is null or price >= 0),
  constraint products_offer_price_positive check (offer_price is null or offer_price >= 0),
  constraint products_offer_not_above_price check (
    price is null or offer_price is null or offer_price <= price
  ),
  constraint products_image_url_length check (
    image_url is null or char_length(image_url) <= 500
  ),
  constraint products_stock_label_length check (
    stock_label is null or char_length(stock_label) <= 80
  ),
  unique (business_id, name)
);

comment on table public.products is
  'Public product or service items shown in Garemo profiles and search results. Sprint 2A keeps them manually managed.';
comment on column public.products.is_available is
  'Manual availability flag for public display. It is not advanced inventory.';
comment on column public.products.stock_label is
  'Optional human label such as Disponible hoy, Pocas unidades or Bajo pedido.';

create index if not exists products_business_idx
  on public.products(business_id);
create index if not exists products_available_business_idx
  on public.products(is_available, business_id);
create index if not exists products_name_idx
  on public.products(name);
create index if not exists products_price_idx
  on public.products(price);
create index if not exists businesses_verified_status_idx
  on public.businesses(is_verified, status);
create index if not exists businesses_public_hours_idx
  on public.businesses(opens_at, closes_at);

alter table public.products enable row level security;

grant select on table public.products to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.products
  from anon, authenticated;

drop policy if exists "public_read_visible_business_products" on public.products;

create policy "public_read_visible_business_products"
on public.products
for select
to anon, authenticated
using (public.is_public_business(business_id));

insert into public.categories (
  name,
  slug,
  description,
  is_active,
  sort_order
)
values (
  'Servicios digitales',
  'servicios-digitales',
  'Servicios tecnologicos, configuracion, soporte y tareas digitales permitidas con revision manual.',
  true,
  95
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
