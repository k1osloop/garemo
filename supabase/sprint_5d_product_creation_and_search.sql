-- Garemo Sprint 5D Migration
-- 1. become_owner RPC
-- 2. search_businesses RPC

-- ==========================================
-- 1. become_owner RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.become_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_role public.user_role;
  v_current_status public.user_status;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role, status INTO v_current_role, v_current_status
  FROM public.users_profile
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_current_status IN ('disabled', 'under_review') THEN
    RAISE EXCEPTION 'User cannot change role due to account status';
  END IF;

  IF v_current_role = 'owner' THEN
    -- Idempotent: already owner
    RETURN;
  END IF;

  IF v_current_role = 'admin' THEN
    -- Admin should not be downgraded to owner via this endpoint
    RAISE EXCEPTION 'Admins cannot change role via this endpoint';
  END IF;

  IF v_current_role = 'buyer' THEN
    UPDATE public.users_profile
    SET role = 'owner', updated_at = now()
    WHERE id = v_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.become_owner IS
  'Safely elevates a buyer to owner role. Enforces security and idempotency.';

-- ==========================================
-- 2. search_businesses RPC
-- ==========================================
-- This function allows searching for businesses by name, description, category,
-- or by the name/description of their associated products.
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
  WHERE b.status = 'active'
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
  'Searches active businesses matching the query in business name/description or product name/description.';
