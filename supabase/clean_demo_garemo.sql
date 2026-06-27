-- Garemo Sprint 6A demo data cleanup.
-- DEMO ONLY. Removes only rows linked to businesses whose slug starts with demo-.
-- Run manually in Supabase SQL Editor when the presentation dataset must be reset.

begin;

delete from public.whatsapp_clicks
where business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.reports
where business_id in (select id from public.businesses where slug like 'demo-%')
   or description like 'DEMO:%'
   or details like 'DEMO:%';

delete from public.business_reviews
where business_id in (select id from public.businesses where slug like 'demo-%')
   or comment like 'DEMO:%';

delete from public.products
where business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.schedules
where business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.business_images
where business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.contact_info
where business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.locations
where business_id in (select id from public.businesses where slug like 'demo-%');

delete from public.businesses
where slug like 'demo-%';

select
  'garemo_demo_cleanup_summary' as label,
  (select count(*) from public.businesses where slug like 'demo-%') as remaining_demo_businesses,
  (select count(*) from public.products p join public.businesses b on b.id = p.business_id where b.slug like 'demo-%') as remaining_demo_products,
  (select count(*) from public.business_reviews br join public.businesses b on b.id = br.business_id where b.slug like 'demo-%') as remaining_demo_reviews,
  (select count(*) from public.reports r join public.businesses b on b.id = r.business_id where b.slug like 'demo-%') as remaining_demo_reports;

commit;
