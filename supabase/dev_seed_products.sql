-- DEV ONLY. Do not run in production without review.
-- Adds visible sample products for the three known Garemo DEV businesses.
-- Requires supabase/sprint_2a_public_products.sql to be applied first.

begin;

do $$
declare
  recognized_businesses integer;
  upserted_products integer;
begin
  select count(*)
  into recognized_businesses
  from public.businesses
  where slug in (
    'cafe-central-u',
    'copias-biblioteca',
    'soporte-tecno-campus'
  )
    and status = 'active'::public.business_status;

  if recognized_businesses <> 3 then
    raise exception 'DEV product seed expected 3 active known businesses, found %.', recognized_businesses;
  end if;

  update public.businesses
  set
    is_verified = true,
    status_message = case slug
      when 'cafe-central-u' then 'Abierto hoy con snacks y bebidas frias'
      when 'copias-biblioteca' then 'Entregas rapidas cerca de biblioteca'
      else 'Soporte disponible en campus por WhatsApp'
    end,
    opens_at = '08:00'::time,
    closes_at = '18:00'::time,
    updated_at = now()
  where slug in (
    'cafe-central-u',
    'copias-biblioteca',
    'soporte-tecno-campus'
  );

  with dev_products(
    business_slug,
    name,
    description,
    price,
    offer_price,
    image_url,
    is_available,
    stock_label
  ) as (
    values
      (
        'cafe-central-u',
        'Cafe frio',
        'Cafe frio listo para llevar entre clases.',
        12.00::numeric(10,2),
        10.00::numeric(10,2),
        'https://placehold.co/600x400/png?text=Cafe+Frio',
        true,
        'Disponible hoy'
      ),
      (
        'cafe-central-u',
        'Combo snack',
        'Bebida y snack rapido para descanso corto.',
        18.00::numeric(10,2),
        15.00::numeric(10,2),
        'https://placehold.co/600x400/png?text=Combo+Snack',
        true,
        'Oferta del dia'
      ),
      (
        'copias-biblioteca',
        'Fotocopias B/N',
        'Copias blanco y negro para apuntes y trabajos.',
        0.30::numeric(10,2),
        null::numeric(10,2),
        'https://placehold.co/600x400/png?text=Fotocopias',
        true,
        'Entrega rapida'
      ),
      (
        'copias-biblioteca',
        'Anillado simple',
        'Anillado para informes y proyectos academicos.',
        8.00::numeric(10,2),
        7.00::numeric(10,2),
        'https://placehold.co/600x400/png?text=Anillado',
        true,
        'Bajo pedido'
      ),
      (
        'soporte-tecno-campus',
        'Auriculares basicos',
        'Auriculares de prueba para clases, llamadas y biblioteca.',
        45.00::numeric(10,2),
        39.00::numeric(10,2),
        'https://placehold.co/600x400/png?text=Auriculares',
        true,
        'Pocas unidades'
      ),
      (
        'soporte-tecno-campus',
        'Revision de laptop',
        'Diagnostico rapido de laptop y accesorios en campus.',
        30.00::numeric(10,2),
        null::numeric(10,2),
        'https://placehold.co/600x400/png?text=Soporte+Laptop',
        true,
        'Disponible por WhatsApp'
      )
  ),
  upserted as (
    insert into public.products (
      business_id,
      name,
      description,
      price,
      offer_price,
      image_url,
      is_available,
      stock_label
    )
    select
      businesses.id,
      dev_products.name,
      dev_products.description,
      dev_products.price,
      dev_products.offer_price,
      dev_products.image_url,
      dev_products.is_available,
      dev_products.stock_label
    from dev_products
    join public.businesses on businesses.slug = dev_products.business_slug
    on conflict (business_id, name) do update set
      description = excluded.description,
      price = excluded.price,
      offer_price = excluded.offer_price,
      image_url = excluded.image_url,
      is_available = excluded.is_available,
      stock_label = excluded.stock_label,
      updated_at = now()
    returning id
  )
  select count(*)
  into upserted_products
  from upserted;

  if upserted_products <> 6 then
    raise exception 'DEV product seed expected 6 products, upserted %.', upserted_products;
  end if;
end $$;

commit;
