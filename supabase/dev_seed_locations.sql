-- DEV ONLY. Do not run in production without review.
-- Adds fictitious map coordinates to the three known Garemo DEV businesses.
-- Coordinates are safe test points around a generic Santa Cruz campus area.

begin;

do $$
declare
  recognized_businesses integer;
  updated_locations integer;
begin
  select count(*)
  into recognized_businesses
  from public.businesses
  where slug in (
    'cafe-central-u',
    'copias-biblioteca',
    'soporte-tecno-campus'
  );

  if recognized_businesses <> 3 then
    raise exception 'DEV location seed expected 3 known businesses, found %.', recognized_businesses;
  end if;

  with dev_coordinates(slug, latitude, longitude, address_text, campus_zone) as (
    values
      (
        'cafe-central-u',
        -17.783260::numeric(9,6),
        -63.182060::numeric(9,6),
        'Pasillo principal del bloque central',
        'Bloque central'
      ),
      (
        'copias-biblioteca',
        -17.783720::numeric(9,6),
        -63.181620::numeric(9,6),
        'Frente a la biblioteca',
        'Zona biblioteca'
      ),
      (
        'soporte-tecno-campus',
        -17.782820::numeric(9,6),
        -63.182740::numeric(9,6),
        'Ingreso lateral del campus',
        'Zona tecnologia'
      )
  ),
  updated as (
    update public.locations
    set
      latitude = dev_coordinates.latitude,
      longitude = dev_coordinates.longitude,
      address_text = dev_coordinates.address_text,
      campus_zone = dev_coordinates.campus_zone,
      updated_at = now()
    from public.businesses
    join dev_coordinates on dev_coordinates.slug = businesses.slug
    where locations.business_id = businesses.id
    returning locations.business_id
  )
  select count(*)
  into updated_locations
  from updated;

  if updated_locations <> 3 then
    raise exception 'DEV location seed expected to update 3 locations, updated %.', updated_locations;
  end if;
end $$;

commit;
