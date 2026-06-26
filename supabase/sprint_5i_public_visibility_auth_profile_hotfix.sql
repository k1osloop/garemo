-- Garemo Sprint 5I Hotfix Migration
-- 1. search_businesses RPC: include 'active', 'approved', 'pending_review'

-- ==========================================
-- 1. search_businesses RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.search_businesses(
  p_query text DEFAULT '',
  p_category_slug text DEFAULT NULL
)
RETURNS SETOF public.businesses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT b.*
  FROM public.businesses b
  LEFT JOIN public.categories c ON c.id = b.category_id
  LEFT JOIN public.products p ON p.business_id = b.id
  WHERE b.status IN ('active', 'approved', 'pending_review')
    AND (
      p_category_slug IS NULL 
      OR c.slug = p_category_slug
    )
    AND (
      p_query = ''
      OR p_query IS NULL
      OR b.name ILIKE '%' || p_query || '%'
      OR b.description ILIKE '%' || p_query || '%'
      OR p.name ILIKE '%' || p_query || '%'
      OR p.description ILIKE '%' || p_query || '%'
    )
  ORDER BY b.name ASC;
$$;

COMMENT ON FUNCTION public.search_businesses IS
  'Searches active, approved, and pending_review businesses matching the query in business name/description or product name/description.';

-- ==========================================
-- 2. is_public_business Function
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_public_business(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.categories c ON c.id = b.category_id
    WHERE b.id = target_business_id
      AND b.status IN ('active', 'approved', 'pending_review')
      AND c.is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_public_business(uuid) IS
  'Returns true when a business status is active, approved, or pending_review and its category is active. Used by public read RLS policies.';
