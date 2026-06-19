-- DEV ONLY. Do not run in production without review.
-- Creates sample active businesses for local/manual testing of the public directory.
-- Requires at least one existing users_profile row with role owner or admin.

begin;

with seed_owner as (
  select id
  from public.users_profile
  where role in ('owner', 'admin')
    and status = 'active'
  order by created_at
  limit 1
),
sample_businesses as (
  insert into public.businesses (
    owner_id,
    category_id,
    name,
    slug,
    description,
    status,
    price_range
  )
  select
    seed_owner.id,
    categories.id,
    seed_values.name,
    seed_values.slug,
    seed_values.description,
    'active'::public.business_status,
    seed_values.price_range
  from (
    values
      (
        'Cafe Central U',
        'cafe-central-u',
        'Bebidas frias, cafe y snacks rapidos cerca del bloque central.',
        'Bs 5 - 25',
        'comida-bebidas'
      ),
      (
        'Copias Biblioteca',
        'copias-biblioteca',
        'Fotocopias, impresiones y anillados para trabajos academicos.',
        'Bs 1 - 35',
        'fotocopias-impresiones'
      ),
      (
        'Soporte Tecno Campus',
        'soporte-tecno-campus',
        'Revision rapida de laptops, accesorios y soporte basico para estudiantes.',
        'Bs 20 - 120',
        'tecnologia-reparacion'
      )
  ) as seed_values(name, slug, description, price_range, category_slug)
  cross join seed_owner
  join public.categories on categories.slug = seed_values.category_slug
  on conflict (slug) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    status = 'active'::public.business_status,
    price_range = excluded.price_range,
    updated_at = now()
  returning id, slug
),
sample_locations as (
  insert into public.locations (business_id, address_text, campus_zone)
  select
    sample_businesses.id,
    case sample_businesses.slug
      when 'cafe-central-u' then 'Pasillo principal del bloque central'
      when 'copias-biblioteca' then 'Frente a la biblioteca'
      else 'Ingreso lateral del campus'
    end,
    case sample_businesses.slug
      when 'cafe-central-u' then 'Bloque central'
      when 'copias-biblioteca' then 'Zona biblioteca'
      else 'Zona tecnologia'
    end
  from sample_businesses
  on conflict (business_id) do update set
    address_text = excluded.address_text,
    campus_zone = excluded.campus_zone,
    updated_at = now()
  returning business_id
),
sample_contacts as (
  insert into public.contact_info (business_id, whatsapp_number)
  select
    sample_businesses.id,
    case sample_businesses.slug
      when 'cafe-central-u' then '59170000001'
      when 'copias-biblioteca' then '59170000002'
      else '59170000003'
    end
  from sample_businesses
  on conflict (business_id) do update set
    whatsapp_number = excluded.whatsapp_number,
    updated_at = now()
  returning business_id
)
insert into public.schedules (
  business_id,
  day_of_week,
  opens_at,
  closes_at,
  is_closed
)
select
  sample_businesses.id,
  days.day_of_week,
  '08:00'::time,
  '18:00'::time,
  false
from sample_businesses
cross join generate_series(1, 5) as days(day_of_week)
on conflict (business_id, day_of_week) do update set
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  is_closed = excluded.is_closed,
  updated_at = now();

commit;
