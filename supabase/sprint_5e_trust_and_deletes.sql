-- Garemo Sprint 5E Migration
-- 1. Grant delete permission on public.products for authenticated owners

BEGIN;

-- Allow owners to delete their own products
GRANT DELETE ON public.products TO authenticated;

DROP POLICY IF EXISTS "owner_delete_products" ON public.products;
CREATE POLICY "owner_delete_products"
ON public.products
FOR DELETE
TO authenticated
USING (public.owns_business(business_id));

COMMIT;
