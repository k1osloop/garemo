-- Sprint 5B: Trust, Moderation, and Interactions Migration

-- 1. Add delivery columns to businesses
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS pickup_available boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS delivery_notes text;

-- 2. Add under_review to user_status enum
-- In Postgres, ADD VALUE cannot run inside a transaction block if it's an old version, but Supabase handles it if run directly.
ALTER TYPE public.user_status ADD VALUE IF NOT EXISTS 'under_review';

-- 3. Create reports table
DO $$ BEGIN
    CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.report_reason AS ENUM ('inappropriate', 'scam', 'false_info', 'prohibited', 'duplicate', 'closed', 'abusive', 'spam', 'misleading', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('business', 'product', 'review', 'user')),
  target_id uuid NOT NULL,
  reason public.report_reason NOT NULL,
  description text,
  status public.report_status DEFAULT 'open'::public.report_status NOT NULL,
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (reporter_id, target_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view and update all reports" ON public.reports;
CREATE POLICY "Admins can view and update all reports"
  ON public.reports FOR ALL
  USING (public.is_admin_user());

-- 4. Create messages (MVP chat) table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  business_id uuid REFERENCES public.businesses(id) NOT NULL,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Senders can view their messages" ON public.messages;
CREATE POLICY "Senders can view their messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Owners can view messages for their business" ON public.messages;
CREATE POLICY "Owners can view messages for their business"
  ON public.messages FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update (mark as read) their business messages" ON public.messages;
CREATE POLICY "Owners can update (mark as read) their business messages"
  ON public.messages FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- 5. RPC for submit_report with automatic under_review logic
CREATE OR REPLACE FUNCTION public.submit_report(
  p_target_type text,
  p_target_id uuid,
  p_reason public.report_reason,
  p_description text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_report_id uuid;
  v_report_count int;
  v_target_user_id uuid;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert report
  INSERT INTO public.reports (reporter_id, target_type, target_id, reason, description)
  VALUES (auth.uid(), p_target_type, p_target_id, p_reason, p_description)
  RETURNING id INTO v_report_id;

  -- Logic to suspend user if 3 open reports
  -- Find the user ID depending on the target type
  IF p_target_type = 'business' THEN
    SELECT owner_id INTO v_target_user_id FROM public.businesses WHERE id = p_target_id;
  ELSIF p_target_type = 'product' THEN
    SELECT b.owner_id INTO v_target_user_id FROM public.products p JOIN public.businesses b ON p.business_id = b.id WHERE p.id = p_target_id;
  ELSIF p_target_type = 'review' THEN
    SELECT user_id INTO v_target_user_id FROM public.business_reviews WHERE id = p_target_id;
  ELSIF p_target_type = 'user' THEN
    v_target_user_id := p_target_id;
  END IF;

  IF v_target_user_id IS NOT NULL THEN
    -- Prevent self-reporting to trigger suspensions maliciously
    IF v_target_user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot report your own entities';
    END IF;

    -- Count open reports for this user (across all their assets) from DISTINCT users
    SELECT COUNT(DISTINCT r.reporter_id) INTO v_report_count
    FROM public.reports r
    WHERE r.status = 'open' 
      AND r.reporter_id != v_target_user_id -- safety check
      AND (
        (r.target_type = 'user' AND r.target_id = v_target_user_id) OR
        (r.target_type = 'business' AND r.target_id IN (SELECT id FROM public.businesses WHERE owner_id = v_target_user_id)) OR
        (r.target_type = 'product' AND r.target_id IN (SELECT p.id FROM public.products p JOIN public.businesses b ON p.business_id = b.id WHERE b.owner_id = v_target_user_id)) OR
        (r.target_type = 'review' AND r.target_id IN (SELECT id FROM public.business_reviews WHERE user_id = v_target_user_id))
      );

    -- If 3 distinct users reported, change status to under_review
    IF v_report_count >= 3 THEN
      UPDATE public.users_profile SET status = 'under_review' WHERE id = v_target_user_id AND status = 'active';
      -- Set business status to pending_review or hidden (using pending_review to trigger admin re-evaluation)
      UPDATE public.businesses SET status = 'pending_review' WHERE owner_id = v_target_user_id AND status = 'active';
    END IF;
  END IF;

  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC for resolving/dismissing report
CREATE OR REPLACE FUNCTION public.admin_resolve_report(
  p_report_id uuid,
  p_status public.report_status,
  p_admin_notes text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.reports
  SET status = p_status,
      admin_notes = p_admin_notes,
      updated_at = now()
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
