-- Garemo Sprint 6A demo data seed.
-- DEMO ONLY. Run manually in Supabase SQL Editor after production migrations are applied.
-- This script is idempotent for rows owned by slugs that start with demo-.
-- It does not create Supabase Auth users and does not touch auth.users.
-- Demo coordinates are located around the UAGRM campus in Santa Cruz de la Sierra.
-- Do not use La Paz/El Alto coordinates for Garemo demo data.

begin;

do $$
begin
  if not exists (
    select 1
    from public.users_profile
    where role in ('owner', 'admin')
      and status = 'active'
  ) then
    raise exception 'DEMO_SEED_REQUIRES_EXISTING_ACTIVE_OWNER_OR_ADMIN_PROFILE';
  end if;
end $$;

create temp table demo_business_seed (
  slug text primary key,
  name text not null,
  category_slug text not null,
  description text not null,
  status public.business_status not null,
  is_verified boolean not null,
  price_range text not null,
  status_message text not null,
  opens_at time not null,
  closes_at time not null,
  delivery_available boolean not null,
  pickup_available boolean not null,
  delivery_notes text,
  address_text text not null,
  campus_zone text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  whatsapp_number text not null,
  instagram_url text
) on commit drop;

insert into demo_business_seed values
  ('demo-cafe-central-u', 'Cafe Central U', 'comida-bebidas', 'Cafe universitario con desayunos, jugos naturales y almuerzos rapidos cerca del campus.', 'approved', true, 'Bs 8-35', 'Promocion de cafe + sandwich hasta las 11:00.', '07:30', '19:30', true, true, 'Delivery dentro y cerca del campus.', 'Biblioteca Central UAGRM, bloque de ingreso', 'Biblioteca Central UAGRM', -17.775120, -63.195420, '59170010001', 'https://instagram.com/cafe.central.u'),
  ('demo-burger-patio', 'Burger Patio', 'comida-bebidas', 'Hamburguesas artesanales, papas y combos pensados para pausas entre clases.', 'approved', true, 'Bs 18-45', 'Combo estudiante activo durante la tarde.', '11:00', '21:00', true, true, 'Recojo en patio o entrega en puertas principales.', 'Comedor Universitario UAGRM, patio principal', 'Comedor Universitario UAGRM', -17.776050, -63.194760, '59170010002', 'https://instagram.com/burger.patio'),
  ('demo-snack-lab', 'Snack Lab', 'snacks-dulces', 'Snacks, dulces importados, galletas y bebidas frias para estudiantes.', 'approved', false, 'Bs 3-22', 'Reposicion diaria de snacks populares.', '08:00', '20:00', false, true, null, 'FICCT - UAGRM, pasillo de laboratorios', 'FICCT - UAGRM', -17.774650, -63.197180, '59170010003', 'https://instagram.com/snack.lab'),
  ('demo-postres-de-la-u', 'Postres de la U', 'snacks-dulces', 'Brownies, tortas por porcion y postres caseros por encargo corto.', 'pending_review', false, 'Bs 6-28', 'Nuevo emprendimiento en revision.', '09:30', '18:00', true, true, 'Entrega coordinada por WhatsApp.', 'Modulo 236 UAGRM, entrada lateral', 'Modulo 236 UAGRM', -17.773920, -63.196340, '59170010004', null),
  ('demo-print-fast', 'Print Fast Campus', 'fotocopias-impresiones', 'Impresiones, fotocopias, anillados y escaneos para trabajos universitarios.', 'approved', true, 'Bs 1-25', 'Impresiones listas en menos de 20 minutos.', '07:00', '20:00', false, true, null, 'Modulo de servicios UAGRM, local 2', 'Servicios UAGRM', -17.776720, -63.196010, '59170010005', 'https://instagram.com/printfast.campus'),
  ('demo-copias-nocturnas', 'Copias Nocturnas', 'fotocopias-impresiones', 'Servicio de impresion nocturna con recojo temprano para entregas urgentes.', 'approved', false, 'Bs 1-30', 'Pedidos hasta las 22:00 para recojo temprano.', '18:00', '23:00', true, true, 'Delivery cerca de residencias estudiantiles.', 'Zona universitaria Santa Cruz, residencias cercanas', 'Zona universitaria Santa Cruz', -17.778180, -63.198330, '59170010006', null),
  ('demo-outfit-campus', 'Outfit Campus', 'ropa-accesorios', 'Poleras, gorras, tote bags y accesorios con estilo universitario.', 'approved', true, 'Bs 25-120', 'Descuento por compra grupal.', '10:00', '19:00', true, true, 'Entrega por puntos de encuentro dentro del campus.', 'Plaza del Estudiante UAGRM, stand movil', 'Plaza del Estudiante UAGRM', -17.775780, -63.193640, '59170010007', 'https://instagram.com/outfit.campus'),
  ('demo-accesorios-killa', 'Accesorios Killa', 'ropa-accesorios', 'Collares, pulseras, llaveros y accesorios hechos a mano.', 'pending_review', false, 'Bs 10-60', 'Catalogo nuevo en revision por Garemo.', '09:00', '17:30', false, true, null, 'Entrada principal UAGRM, hall de ingreso', 'Entrada principal UAGRM', -17.774040, -63.192980, '59170010008', null),
  ('demo-tech-rescate', 'Tech Rescate', 'tecnologia-reparacion', 'Diagnostico rapido, cambio de accesorios y soporte para laptops y celulares.', 'approved', true, 'Bs 20-180', 'Revision express sin costo si reparas con nosotros.', '09:00', '20:00', false, true, null, 'Facultad Politecnica UAGRM, aula tecnica', 'Facultad Politecnica UAGRM', -17.777040, -63.197690, '59170010009', 'https://instagram.com/tech.rescate'),
  ('demo-auriculares-zone', 'Auriculares Zone', 'tecnologia-reparacion', 'Venta de audifonos, cargadores, cables y accesorios tecnologicos basicos.', 'approved', true, 'Bs 15-150', 'Auriculares con descuento esta semana.', '08:30', '19:00', true, true, 'Entrega en biblioteca o patio.', 'Biblioteca Central UAGRM, primer piso', 'Biblioteca Central UAGRM', -17.775260, -63.195780, '59170010010', 'https://instagram.com/auriculares.zone'),
  ('demo-tutorias-alfa', 'Tutorias Alfa', 'servicios-academicos', 'Apoyo en matematicas, estadistica y programacion para parciales y practicas.', 'approved', true, 'Bs 30-90', 'Cupos disponibles para grupos de 3 personas.', '08:00', '21:00', false, false, null, 'Facultad de Ciencias Economicas UAGRM, sala de estudio', 'Facultad de Ciencias Economicas UAGRM', -17.773480, -63.194180, '59170010011', null),
  ('demo-resumenes-pro', 'Resumenes Pro', 'servicios-academicos', 'Resumenes, mapas conceptuales y preparacion para exposiciones universitarias.', 'approved', false, 'Bs 20-70', 'Entrega digital el mismo dia segun disponibilidad.', '10:00', '22:00', true, false, 'Entrega digital por enlace y coordinacion por WhatsApp.', 'Facultad de Humanidades UAGRM, punto de encuentro', 'Facultad de Humanidades UAGRM', -17.772860, -63.193520, '59170010012', null),
  ('demo-delivery-campus-run', 'Campus Run Delivery', 'delivery', 'Mandados, recojo de comida y entrega de materiales dentro del campus.', 'approved', true, 'Bs 5-25', 'Tiempo promedio dentro del campus: 15 minutos.', '08:00', '21:30', true, false, 'Solo zonas universitarias y alrededores cercanos.', 'Entrada principal UAGRM, porteria de referencia', 'Entrada principal UAGRM', -17.774420, -63.192610, '59170010013', 'https://instagram.com/campus.run'),
  ('demo-beauty-break', 'Beauty Break', 'belleza-cuidado-personal', 'Manicure express, peinados simples y cuidado personal por reserva.', 'approved', true, 'Bs 20-90', 'Agenda disponible para viernes y sabado.', '10:00', '18:30', false, true, null, 'Zona universitaria Santa Cruz, local compartido cerca de UAGRM', 'Zona universitaria Santa Cruz', -17.779120, -63.190980, '59170010014', 'https://instagram.com/beauty.break'),
  ('demo-barber-u', 'Barber U', 'belleza-cuidado-personal', 'Cortes rapidos, perfilado y arreglo de barba para estudiantes.', 'pending_review', false, 'Bs 25-60', 'Pendiente de verificacion manual.', '09:00', '20:00', false, true, null, 'Facultad de Derecho UAGRM, calle lateral', 'Facultad de Derecho UAGRM', -17.777880, -63.191820, '59170010015', null),
  ('demo-digital-estudio', 'Digital Estudio', 'servicios-digitales', 'Diseno de piezas graficas, CV, portafolios y presentaciones para estudiantes.', 'approved', true, 'Bs 30-160', 'Pack CV + LinkedIn con entrega en 48 horas.', '09:00', '19:00', true, false, 'Entrega digital y revision por videollamada.', 'FICCT - UAGRM, sala cowork estudiantil', 'FICCT - UAGRM', -17.774980, -63.197850, '59170010016', 'https://instagram.com/digital.estudio'),
  ('demo-streaming-legal', 'Servicios Digitales Campus', 'servicios-digitales', 'Asesoria de herramientas digitales, configuracion de cuentas propias y soporte basico.', 'pending_review', false, 'Bs 15-80', 'Servicio digital en revision por moderacion.', '10:00', '18:00', true, false, 'No se permite reventa de cuentas ni practicas no autorizadas.', 'Zona universitaria Santa Cruz, atencion digital con referencia UAGRM', 'Zona universitaria Santa Cruz', -17.780150, -63.189870, '59170010017', null),
  ('demo-foto-express', 'Foto Express U', 'otros', 'Fotografia para eventos, fotos carnet y cobertura de actividades universitarias.', 'approved', true, 'Bs 15-250', 'Fotos carnet listas el mismo dia.', '09:00', '18:00', false, true, null, 'Plaza del Estudiante UAGRM, jardin central', 'Plaza del Estudiante UAGRM', -17.775540, -63.193950, '59170010018', 'https://instagram.com/foto.express.u'),
  ('demo-libros-circular', 'Libros Circular', 'otros', 'Compra, venta e intercambio de libros usados y apuntes fisicos.', 'approved', false, 'Bs 10-120', 'Semana de intercambio de libros activa.', '08:30', '17:30', false, true, null, 'Biblioteca Central UAGRM, mesa de intercambio', 'Biblioteca Central UAGRM', -17.775020, -63.195980, '59170010019', null),
  ('demo-craft-campus', 'Craft Campus', 'otros', 'Regalos personalizados, stickers, tazas y detalles para fechas especiales.', 'approved', true, 'Bs 8-95', 'Pedidos personalizados con 24 horas de anticipacion.', '09:30', '19:30', true, true, 'Entrega dentro del campus por punto de encuentro.', 'Facultad de Arquitectura UAGRM, plaza de arte estudiantil', 'Facultad de Arquitectura UAGRM', -17.778640, -63.194990, '59170010020', 'https://instagram.com/craft.campus');

create temp table demo_product_seed (
  business_slug text not null,
  name text not null,
  description text,
  price numeric(10,2),
  offer_price numeric(10,2),
  image_url text,
  is_available boolean not null,
  stock_label text
) on commit drop;

insert into demo_product_seed values
  ('demo-cafe-central-u', 'Cafe americano', 'Cafe caliente para empezar la clase.', 8, null, 'https://placehold.co/800x600/png?text=Cafe+americano', true, 'Disponible hoy'),
  ('demo-cafe-central-u', 'Sandwich mixto', 'Pan tostado con jamon, queso y vegetales.', 18, 15, 'https://placehold.co/800x600/png?text=Sandwich+mixto', true, 'Oferta hasta mediodia'),
  ('demo-cafe-central-u', 'Jugo natural', 'Jugo de temporada preparado al momento.', 10, null, 'https://placehold.co/800x600/png?text=Jugo+natural', true, 'Stock medio'),
  ('demo-burger-patio', 'Burger clasica', 'Carne, queso, vegetales y salsa de la casa.', 28, 24, 'https://placehold.co/800x600/png?text=Burger+clasica', true, '12 disponibles'),
  ('demo-burger-patio', 'Papas grandes', 'Papas crocantes para compartir.', 16, null, 'https://placehold.co/800x600/png?text=Papas+grandes', true, 'Disponible'),
  ('demo-burger-patio', 'Combo estudiante', 'Burger clasica, papas y bebida.', 42, 35, 'https://placehold.co/800x600/png?text=Combo+estudiante', true, 'Promo del dia'),
  ('demo-snack-lab', 'Galletas importadas', 'Paquete surtido para recreo.', 12, null, 'https://placehold.co/800x600/png?text=Galletas', true, 'Stock alto'),
  ('demo-snack-lab', 'Bebida fria', 'Gaseosa o jugo embotellado.', 8, null, 'https://placehold.co/800x600/png?text=Bebida+fria', true, 'Disponible'),
  ('demo-snack-lab', 'Box dulce', 'Mix de chocolates y caramelos.', 20, 18, 'https://placehold.co/800x600/png?text=Box+dulce', true, 'Ultimos 6'),
  ('demo-postres-de-la-u', 'Brownie', 'Brownie casero con chocolate.', 9, null, 'https://placehold.co/800x600/png?text=Brownie', true, 'Porciones limitadas'),
  ('demo-postres-de-la-u', 'Cheesecake porcion', 'Porcion fria de cheesecake.', 16, 14, 'https://placehold.co/800x600/png?text=Cheesecake', true, 'Reserva por WhatsApp'),
  ('demo-postres-de-la-u', 'Torta mini', 'Torta pequena para regalo.', 28, null, 'https://placehold.co/800x600/png?text=Torta+mini', true, 'Bajo pedido'),
  ('demo-print-fast', 'Impresion B/N', 'Impresion blanco y negro por hoja.', 1, null, 'https://placehold.co/800x600/png?text=Impresion+BN', true, 'Disponible'),
  ('demo-print-fast', 'Anillado simple', 'Anillado para trabajos y apuntes.', 12, null, 'https://placehold.co/800x600/png?text=Anillado', true, 'Disponible'),
  ('demo-print-fast', 'Impresion color', 'Impresion a color por hoja.', 3, null, 'https://placehold.co/800x600/png?text=Color', true, 'Disponible'),
  ('demo-copias-nocturnas', 'Pack tarea urgente', 'Impresion nocturna y recojo temprano.', 18, null, 'https://placehold.co/800x600/png?text=Tarea+urgente', true, 'Servicio nocturno'),
  ('demo-copias-nocturnas', 'Escaneo PDF', 'Escaneo y envio digital.', 5, null, 'https://placehold.co/800x600/png?text=Escaneo+PDF', true, 'Disponible'),
  ('demo-copias-nocturnas', 'Separadores color', 'Separadores para carpetas y anillados.', 10, 8, 'https://placehold.co/800x600/png?text=Separadores', true, 'Oferta'),
  ('demo-outfit-campus', 'Polera campus', 'Polera basica con estampado universitario.', 55, 49, 'https://placehold.co/800x600/png?text=Polera+campus', true, 'Tallas S-M-L'),
  ('demo-outfit-campus', 'Tote bag', 'Bolso de tela para libros y laptop.', 38, null, 'https://placehold.co/800x600/png?text=Tote+bag', true, 'Disponible'),
  ('demo-outfit-campus', 'Gorra bordada', 'Gorra con bordado personalizado.', 65, null, 'https://placehold.co/800x600/png?text=Gorra', true, 'Bajo pedido'),
  ('demo-accesorios-killa', 'Pulsera tejida', 'Pulsera hecha a mano.', 14, null, 'https://placehold.co/800x600/png?text=Pulsera', true, 'Colores surtidos'),
  ('demo-accesorios-killa', 'Llavero inicial', 'Llavero personalizado con inicial.', 18, 15, 'https://placehold.co/800x600/png?text=Llavero', true, 'Oferta'),
  ('demo-accesorios-killa', 'Collar luna', 'Collar plateado estilo luna.', 35, null, 'https://placehold.co/800x600/png?text=Collar', true, 'Disponible'),
  ('demo-tech-rescate', 'Diagnostico laptop', 'Revision inicial de fallas comunes.', 25, null, 'https://placehold.co/800x600/png?text=Diagnostico', true, 'Cupos hoy'),
  ('demo-tech-rescate', 'Cambio teclado', 'Repuesto y mano de obra segun modelo.', 160, null, 'https://placehold.co/800x600/png?text=Teclado', true, 'Cotizacion'),
  ('demo-tech-rescate', 'Limpieza interna', 'Mantenimiento preventivo basico.', 90, 75, 'https://placehold.co/800x600/png?text=Limpieza', true, 'Promo semanal'),
  ('demo-auriculares-zone', 'Auriculares bluetooth', 'Audifonos inalambricos para clases y musica.', 120, 99, 'https://placehold.co/800x600/png?text=Auriculares', true, 'Oferta'),
  ('demo-auriculares-zone', 'Cable tipo C', 'Cable de carga reforzado.', 25, null, 'https://placehold.co/800x600/png?text=Cable+tipo+C', true, 'Stock alto'),
  ('demo-auriculares-zone', 'Cargador rapido', 'Cargador compacto de carga rapida.', 85, null, 'https://placehold.co/800x600/png?text=Cargador', true, 'Disponible'),
  ('demo-tutorias-alfa', 'Tutoria matematica', 'Sesion de 60 minutos para parciales.', 45, null, 'https://placehold.co/800x600/png?text=Tutoria+mate', true, 'Cupos limitados'),
  ('demo-tutorias-alfa', 'Tutoria programacion', 'Apoyo en ejercicios de programacion.', 55, 50, 'https://placehold.co/800x600/png?text=Programacion', true, 'Promo grupo'),
  ('demo-tutorias-alfa', 'Resolucion guiada', 'Acompanamiento para practicas.', 35, null, 'https://placehold.co/800x600/png?text=Practicas', true, 'Disponible'),
  ('demo-resumenes-pro', 'Resumen materia', 'Resumen digital de unidad o tema.', 25, null, 'https://placehold.co/800x600/png?text=Resumen', true, 'Entrega digital'),
  ('demo-resumenes-pro', 'Mapa conceptual', 'Mapa visual para estudiar rapido.', 22, null, 'https://placehold.co/800x600/png?text=Mapa+conceptual', true, 'Disponible'),
  ('demo-resumenes-pro', 'Slides exposicion', 'Presentacion base para exposicion.', 65, 55, 'https://placehold.co/800x600/png?text=Slides', true, '48 horas'),
  ('demo-delivery-campus-run', 'Entrega campus', 'Traslado dentro del campus.', 8, null, 'https://placehold.co/800x600/png?text=Entrega+campus', true, 'Activo'),
  ('demo-delivery-campus-run', 'Mandado rapido', 'Recojo o compra pequena cerca de la U.', 15, null, 'https://placehold.co/800x600/png?text=Mandado', true, 'Disponible'),
  ('demo-delivery-campus-run', 'Entrega material', 'Entrega de apuntes o trabajos impresos.', 10, null, 'https://placehold.co/800x600/png?text=Material', true, 'Disponible'),
  ('demo-beauty-break', 'Manicure express', 'Manicure rapida por reserva.', 35, 30, 'https://placehold.co/800x600/png?text=Manicure', true, 'Cupos viernes'),
  ('demo-beauty-break', 'Peinado simple', 'Peinado para exposicion o evento.', 45, null, 'https://placehold.co/800x600/png?text=Peinado', true, 'Reserva'),
  ('demo-beauty-break', 'Kit cuidado', 'Kit basico de cuidado personal.', 28, null, 'https://placehold.co/800x600/png?text=Kit+cuidado', true, 'Disponible'),
  ('demo-barber-u', 'Corte estudiante', 'Corte rapido para estudiantes.', 35, 30, 'https://placehold.co/800x600/png?text=Corte', true, 'En revision'),
  ('demo-barber-u', 'Perfilado barba', 'Perfilado y arreglo basico.', 25, null, 'https://placehold.co/800x600/png?text=Barba', true, 'En revision'),
  ('demo-barber-u', 'Combo corte barba', 'Corte y perfilado combinado.', 55, null, 'https://placehold.co/800x600/png?text=Combo+barber', true, 'En revision'),
  ('demo-digital-estudio', 'Diseno CV', 'CV moderno listo para enviar.', 45, null, 'https://placehold.co/800x600/png?text=CV', true, '48 horas'),
  ('demo-digital-estudio', 'Post redes', 'Pieza grafica para promocion.', 35, 30, 'https://placehold.co/800x600/png?text=Post+redes', true, 'Oferta'),
  ('demo-digital-estudio', 'Portafolio PDF', 'Portafolio digital simple.', 120, null, 'https://placehold.co/800x600/png?text=Portafolio', true, 'Bajo pedido'),
  ('demo-streaming-legal', 'Configuracion segura', 'Asesoria para configurar cuentas propias.', 25, null, 'https://placehold.co/800x600/png?text=Configuracion', true, 'En revision'),
  ('demo-streaming-legal', 'Soporte digital', 'Ayuda basica de herramientas digitales.', 35, null, 'https://placehold.co/800x600/png?text=Soporte', true, 'En revision'),
  ('demo-streaming-legal', 'Organizacion cloud', 'Orden de archivos y respaldos personales.', 45, 40, 'https://placehold.co/800x600/png?text=Cloud', true, 'En revision'),
  ('demo-foto-express', 'Foto carnet', 'Sesion rapida y entrega digital.', 20, null, 'https://placehold.co/800x600/png?text=Foto+carnet', true, 'Disponible'),
  ('demo-foto-express', 'Cobertura evento', 'Fotos para actividad universitaria.', 180, null, 'https://placehold.co/800x600/png?text=Evento', true, 'Reserva'),
  ('demo-foto-express', 'Mini sesion', 'Fotos personales en campus.', 80, 70, 'https://placehold.co/800x600/png?text=Mini+sesion', true, 'Promo'),
  ('demo-libros-circular', 'Libro usado', 'Libro universitario en buen estado.', 45, null, 'https://placehold.co/800x600/png?text=Libro+usado', true, 'Stock variable'),
  ('demo-libros-circular', 'Pack apuntes', 'Apuntes organizados por materia.', 20, null, 'https://placehold.co/800x600/png?text=Apuntes', true, 'Disponible'),
  ('demo-libros-circular', 'Intercambio', 'Gestion de intercambio de libro por libro.', 10, null, 'https://placehold.co/800x600/png?text=Intercambio', true, 'Activo'),
  ('demo-craft-campus', 'Sticker pack', 'Stickers personalizados para laptop.', 18, 15, 'https://placehold.co/800x600/png?text=Stickers', true, 'Oferta'),
  ('demo-craft-campus', 'Taza personalizada', 'Taza con diseno a pedido.', 45, null, 'https://placehold.co/800x600/png?text=Taza', true, '24 horas'),
  ('demo-craft-campus', 'Regalo express', 'Detalle personalizado para cumpleanos.', 60, null, 'https://placehold.co/800x600/png?text=Regalo', true, 'Disponible');

-- Remove previous demo child rows before re-inserting deterministic demo data.
delete from public.whatsapp_clicks wc
where wc.business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.reports r
where r.business_id in (select id from public.businesses where slug like 'demo-%')
   or r.description like 'DEMO:%'
   or r.details like 'DEMO:%';

delete from public.business_reviews br
where br.business_id in (select id from public.businesses where slug like 'demo-%')
   or br.comment like 'DEMO:%';

delete from public.products p
where p.business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.schedules s
where s.business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.business_images bi
where bi.business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.contact_info ci
where ci.business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.locations l
where l.business_id in (select id from public.businesses where slug like 'demo-%');

with demo_owner as (
  select id
  from public.users_profile
  where role = 'owner'
    and status = 'active'
  order by created_at nulls last, id
  limit 1
), fallback_owner as (
  select id
  from demo_owner
  union all
  select id
  from public.users_profile
  where role = 'admin'
    and status = 'active'
    and not exists (select 1 from demo_owner)
  order by id
  limit 1
)
insert into public.businesses (
  owner_id,
  category_id,
  name,
  slug,
  description,
  status,
  price_range,
  is_verified,
  status_message,
  opens_at,
  closes_at,
  delivery_available,
  pickup_available,
  delivery_notes,
  reviewed_at,
  review_notes,
  created_at,
  updated_at
)
select
  o.id,
  c.id,
  s.name,
  s.slug,
  s.description,
  s.status,
  s.price_range,
  s.is_verified,
  s.status_message,
  s.opens_at,
  s.closes_at,
  s.delivery_available,
  s.pickup_available,
  s.delivery_notes,
  case when s.status in ('approved', 'active') then now() else null end,
  case when s.status = 'pending_review' then 'DEMO: pendiente para mostrar flujo admin.' else null end,
  now(),
  now()
from demo_business_seed s
join public.categories c on c.slug = s.category_slug
cross join fallback_owner o
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  price_range = excluded.price_range,
  is_verified = excluded.is_verified,
  status_message = excluded.status_message,
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  delivery_available = excluded.delivery_available,
  pickup_available = excluded.pickup_available,
  delivery_notes = excluded.delivery_notes,
  reviewed_at = excluded.reviewed_at,
  review_notes = excluded.review_notes,
  updated_at = now();

insert into public.locations (
  business_id,
  address_text,
  campus_zone,
  latitude,
  longitude,
  created_at,
  updated_at
)
select
  b.id,
  s.address_text,
  s.campus_zone,
  s.latitude,
  s.longitude,
  now(),
  now()
from demo_business_seed s
join public.businesses b on b.slug = s.slug
on conflict (business_id) do update set
  address_text = excluded.address_text,
  campus_zone = excluded.campus_zone,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  updated_at = now();

insert into public.contact_info (
  business_id,
  whatsapp_number,
  instagram_url,
  created_at,
  updated_at
)
select
  b.id,
  s.whatsapp_number,
  s.instagram_url,
  now(),
  now()
from demo_business_seed s
join public.businesses b on b.slug = s.slug
on conflict (business_id) do update set
  whatsapp_number = excluded.whatsapp_number,
  instagram_url = excluded.instagram_url,
  updated_at = now();

insert into public.schedules (
  business_id,
  day_of_week,
  opens_at,
  closes_at,
  is_closed,
  created_at,
  updated_at
)
select
  b.id,
  d.day_of_week,
  case when d.day_of_week in (0, 6) then null else s.opens_at end,
  case when d.day_of_week in (0, 6) then null else s.closes_at end,
  d.day_of_week in (0, 6),
  now(),
  now()
from demo_business_seed s
join public.businesses b on b.slug = s.slug
cross join generate_series(0, 6) as d(day_of_week)
on conflict (business_id, day_of_week) do update set
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  is_closed = excluded.is_closed,
  updated_at = now();

insert into public.products (
  business_id,
  name,
  description,
  price,
  offer_price,
  image_url,
  is_available,
  stock_label,
  created_at,
  updated_at
)
select
  b.id,
  p.name,
  p.description,
  p.price,
  p.offer_price,
  p.image_url,
  p.is_available,
  p.stock_label,
  now(),
  now()
from demo_product_seed p
join public.businesses b on b.slug = p.business_slug
on conflict (business_id, name) do update set
  description = excluded.description,
  price = excluded.price,
  offer_price = excluded.offer_price,
  image_url = excluded.image_url,
  is_available = excluded.is_available,
  stock_label = excluded.stock_label,
  updated_at = now();

with reviewers as (
  select
    up.id,
    row_number() over (order by case up.role when 'buyer' then 1 when 'admin' then 2 else 3 end, up.created_at nulls last, up.id) as rn,
    count(*) over () as reviewer_count
  from public.users_profile up
  where up.status = 'active'
), review_targets as (
  select
    b.id as business_id,
    b.owner_id,
    row_number() over (order by b.name) as business_number
  from public.businesses b
  where b.slug like 'demo-%'
), review_seed as (
  select
    rt.business_id,
    r.id as user_id,
    ((rt.business_number + gs.slot) % 5) + 1 as rating,
    'DEMO: experiencia positiva de validacion con atencion rapida y datos claros.' as comment
  from review_targets rt
  cross join generate_series(1, 3) as gs(slot)
  join reviewers r
    on r.rn = ((rt.business_number + gs.slot - 2) % greatest(r.reviewer_count, 1)) + 1
  where r.id <> rt.owner_id
)
insert into public.business_reviews (
  business_id,
  user_id,
  rating,
  comment,
  status,
  created_at,
  updated_at
)
select
  business_id,
  user_id,
  rating,
  comment,
  'visible',
  now() - (rating || ' days')::interval,
  now()
from review_seed
on conflict (business_id, user_id) do update set
  rating = excluded.rating,
  comment = excluded.comment,
  status = excluded.status,
  updated_at = now();

insert into public.whatsapp_clicks (
  business_id,
  product_id,
  source,
  created_at
)
select
  b.id,
  null,
  'demo_seed',
  now() - (gs.click_index || ' hours')::interval
from public.businesses b
join demo_business_seed s on s.slug = b.slug
cross join lateral generate_series(1, case when s.status = 'pending_review' then 2 else 6 end) as gs(click_index);

with reporters as (
  select
    up.id,
    row_number() over (order by case up.role when 'buyer' then 1 when 'admin' then 2 else 3 end, up.created_at nulls last, up.id) as rn,
    count(*) over () as reporter_count
  from public.users_profile up
  where up.status = 'active'
), report_seed as (
  select 'demo-streaming-legal'::text as business_slug, 'business'::text as target_type, 'other'::public.report_reason as reason, 'DEMO: revisar descripcion para evitar servicios digitales no permitidos.'::text as description, 'open'::public.report_status as status, 1 as reporter_slot
  union all
  select 'demo-barber-u', 'business', 'wrong_info'::public.report_reason, 'DEMO: confirmar direccion y horario antes de publicar.', 'reviewing'::public.report_status, 2
  union all
  select 'demo-postres-de-la-u', 'business', 'closed'::public.report_reason, 'DEMO: validar disponibilidad real de productos del dia.', 'open'::public.report_status, 3
)
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
select
  r.id,
  b.id,
  rs.target_type,
  b.id,
  rs.reason,
  rs.description,
  rs.description,
  rs.status,
  now(),
  now()
from report_seed rs
join public.businesses b on b.slug = rs.business_slug
join reporters r on r.rn = ((rs.reporter_slot - 1) % greatest(r.reporter_count, 1)) + 1
where r.id <> b.owner_id
on conflict (reporter_id, target_type, target_id) where reporter_id is not null do update set
  reason = excluded.reason,
  details = excluded.details,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

select
  'garemo_demo_seed_summary' as label,
  (select count(*) from public.businesses where slug like 'demo-%') as demo_businesses,
  (select count(*) from public.businesses where slug like 'demo-%' and status in ('approved', 'active', 'pending_review')) as public_demo_businesses,
  (select count(*) from public.products p join public.businesses b on b.id = p.business_id where b.slug like 'demo-%') as demo_products,
  (select count(*) from public.business_reviews br join public.businesses b on b.id = br.business_id where b.slug like 'demo-%') as demo_reviews,
  (select count(*) from public.whatsapp_clicks wc join public.businesses b on b.id = wc.business_id where b.slug like 'demo-%') as demo_whatsapp_clicks,
  (select count(*) from public.reports r join public.businesses b on b.id = r.business_id where b.slug like 'demo-%') as demo_reports;

commit;
