-- Garemo Sprint 5F dashboard save hotfix.
-- Allows owners to update delivery fields added in Sprint 5B.
-- Does not disable RLS, does not open public writes, and keeps owner-only policies.

begin;

grant update (
  delivery_available,
  pickup_available,
  delivery_notes
) on public.businesses to authenticated;

grant insert (
  delivery_available,
  pickup_available,
  delivery_notes
) on public.businesses to authenticated;

comment on column public.businesses.delivery_available is
  'Owner-editable public delivery availability flag. RLS remains owner-only.';
comment on column public.businesses.pickup_available is
  'Owner-editable public pickup availability flag. RLS remains owner-only.';
comment on column public.businesses.delivery_notes is
  'Owner-editable delivery or pickup notes shown publicly when available.';

commit;
