-- Garemo Sprint 5H Migration
-- 1. Alter Enums (add 'approved', 'under_review' to business_status if not exist)
-- 2. Update existing 'active' businesses to 'approved'
-- 3. search_businesses RPC to include 'pending_review' and 'approved'
-- 4. admin_resolve_report RPC

-- ==========================================
-- 1. Alter Enums
-- ==========================================
-- Note: Supabase doesn't allow ALTER TYPE ... ADD VALUE inside a transaction block easily for some versions,
-- but typically we can just run it. We will commit before and after to be safe in SQL Editor.
COMMIT;
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'under_review';
BEGIN;

-- ==========================================
-- 2. Update existing 'active' to 'approved'
-- ==========================================
UPDATE public.businesses
SET status = 'approved'
WHERE status = 'active';

-- ==========================================
-- 3. search_businesses RPC
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
  WHERE b.status IN ('approved', 'pending_review')
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
  'Searches approved and pending_review businesses matching the query in business name/description or product name/description.';


-- ==========================================
-- 4. admin_resolve_report RPC
-- ==========================================
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(
  p_report_id uuid,
  p_next_status public.report_status,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Check admin role
  SELECT role INTO v_role
  FROM public.users_profile
  WHERE id = auth.uid();

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can resolve reports';
  END IF;

  UPDATE public.reports
  SET 
    status = p_next_status,
    admin_notes = p_notes,
    resolved_at = CASE WHEN p_next_status IN ('resolved', 'dismissed') THEN now() ELSE null END,
    updated_at = now()
  WHERE id = p_report_id;
END;
$$;

COMMENT ON FUNCTION public.admin_resolve_report IS
  'Allows admins to update report status (reviewing, resolved, dismissed).';
