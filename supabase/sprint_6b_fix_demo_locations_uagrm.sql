-- Garemo Sprint 6B demo location hotfix.
-- DEMO ONLY. Moves demo business locations from La Paz/El Alto coordinates
-- to approximate UAGRM/Santa Cruz de la Sierra campus coordinates.
-- This script updates only businesses whose slug starts with demo-.
-- It does not delete businesses, products, reviews, reports, or users.

begin;

with demo_locations(slug, address_text, campus_zone, latitude, longitude) as (
  values
    ('demo-cafe-central-u', 'Biblioteca Central UAGRM, bloque de ingreso', 'Biblioteca Central UAGRM', -17.775120, -63.195420),
    ('demo-burger-patio', 'Comedor Universitario UAGRM, patio principal', 'Comedor Universitario UAGRM', -17.776050, -63.194760),
    ('demo-snack-lab', 'FICCT - UAGRM, pasillo de laboratorios', 'FICCT - UAGRM', -17.774650, -63.197180),
    ('demo-postres-de-la-u', 'Modulo 236 UAGRM, entrada lateral', 'Modulo 236 UAGRM', -17.773920, -63.196340),
    ('demo-print-fast', 'Modulo de servicios UAGRM, local 2', 'Servicios UAGRM', -17.776720, -63.196010),
    ('demo-copias-nocturnas', 'Zona universitaria Santa Cruz, residencias cercanas', 'Zona universitaria Santa Cruz', -17.778180, -63.198330),
    ('demo-outfit-campus', 'Plaza del Estudiante UAGRM, stand movil', 'Plaza del Estudiante UAGRM', -17.775780, -63.193640),
    ('demo-accesorios-killa', 'Entrada principal UAGRM, hall de ingreso', 'Entrada principal UAGRM', -17.774040, -63.192980),
    ('demo-tech-rescate', 'Facultad Politecnica UAGRM, aula tecnica', 'Facultad Politecnica UAGRM', -17.777040, -63.197690),
    ('demo-auriculares-zone', 'Biblioteca Central UAGRM, primer piso', 'Biblioteca Central UAGRM', -17.775260, -63.195780),
    ('demo-tutorias-alfa', 'Facultad de Ciencias Economicas UAGRM, sala de estudio', 'Facultad de Ciencias Economicas UAGRM', -17.773480, -63.194180),
    ('demo-resumenes-pro', 'Facultad de Humanidades UAGRM, punto de encuentro', 'Facultad de Humanidades UAGRM', -17.772860, -63.193520),
    ('demo-delivery-campus-run', 'Entrada principal UAGRM, porteria de referencia', 'Entrada principal UAGRM', -17.774420, -63.192610),
    ('demo-beauty-break', 'Zona universitaria Santa Cruz, local compartido cerca de UAGRM', 'Zona universitaria Santa Cruz', -17.779120, -63.190980),
    ('demo-barber-u', 'Facultad de Derecho UAGRM, calle lateral', 'Facultad de Derecho UAGRM', -17.777880, -63.191820),
    ('demo-digital-estudio', 'FICCT - UAGRM, sala cowork estudiantil', 'FICCT - UAGRM', -17.774980, -63.197850),
    ('demo-streaming-legal', 'Zona universitaria Santa Cruz, atencion digital con referencia UAGRM', 'Zona universitaria Santa Cruz', -17.780150, -63.189870),
    ('demo-foto-express', 'Plaza del Estudiante UAGRM, jardin central', 'Plaza del Estudiante UAGRM', -17.775540, -63.193950),
    ('demo-libros-circular', 'Biblioteca Central UAGRM, mesa de intercambio', 'Biblioteca Central UAGRM', -17.775020, -63.195980),
    ('demo-craft-campus', 'Facultad de Arquitectura UAGRM, plaza de arte estudiantil', 'Facultad de Arquitectura UAGRM', -17.778640, -63.194990)
)
update public.locations l
set
  address_text = d.address_text,
  campus_zone = d.campus_zone,
  latitude = d.latitude,
  longitude = d.longitude,
  updated_at = now()
from public.businesses b
join demo_locations d on d.slug = b.slug
where l.business_id = b.id
  and b.slug like 'demo-%';

select
  'garemo_sprint_6b_demo_location_hotfix' as label,
  count(*) as demo_locations_total,
  count(*) filter (
    where l.latitude between -17.790000 and -17.760000
      and l.longitude between -63.210000 and -63.170000
  ) as demo_locations_in_santa_cruz_range,
  count(*) filter (
    where l.latitude between -16.999999 and -16.000000
      and l.longitude between -68.999999 and -68.000000
  ) as demo_locations_still_lapaz_range,
  min(l.latitude) as min_latitude,
  max(l.latitude) as max_latitude,
  min(l.longitude) as min_longitude,
  max(l.longitude) as max_longitude
from public.locations l
join public.businesses b on b.id = l.business_id
where b.slug like 'demo-%';

commit;
