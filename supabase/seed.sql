-- Garemo Sprint 0 baseline seed data.
-- Run after schema.sql.

insert into public.categories (name, slug, description, sort_order)
values
  ('Comida y bebidas', 'comida-bebidas', 'Almuerzos, bebidas y comida cerca del campus.', 10),
  ('Snacks y dulces', 'snacks-dulces', 'Snacks, postres, dulces y ventas rapidas entre clases.', 20),
  ('Fotocopias e impresiones', 'fotocopias-impresiones', 'Fotocopias, impresiones, anillados y materiales impresos.', 30),
  ('Ropa y accesorios', 'ropa-accesorios', 'Ropa, accesorios y productos personales.', 40),
  ('Tecnologia y reparacion', 'tecnologia-reparacion', 'Accesorios, soporte tecnico y reparacion de dispositivos.', 50),
  ('Servicios academicos', 'servicios-academicos', 'Tutorias, apoyo academico, trabajos y asesorias.', 60),
  ('Delivery', 'delivery', 'Opciones con entrega o reparto cerca del campus.', 70),
  ('Belleza y cuidado personal', 'belleza-cuidado-personal', 'Servicios y productos de belleza o cuidado personal.', 80),
  ('Otros', 'otros', 'Negocios y servicios que no encajan en las categorias iniciales.', 90)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
