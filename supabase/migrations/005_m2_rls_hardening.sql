-- ============================================================================
-- M2 RLS Hardening: Private lists + self-gifting prevention + mutual exclusivity
-- ============================================================================

-- ============================================================================
-- 1. LISTS: Allow members to read private lists they belong to
-- ============================================================================

-- Drop existing member policy if any
DROP POLICY IF EXISTS "Members can view lists they belong to" ON public.lists;

-- Members (accepted) can read lists they belong to (including private)
CREATE POLICY "Members can view lists they belong to"
  ON public.lists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = lists.id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- ============================================================================
-- 2. ITEMS: Complete RLS policies
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Members can view items" ON public.items;
DROP POLICY IF EXISTS "Public can view items from public/unlisted lists" ON public.items;
DROP POLICY IF EXISTS "Members can create items" ON public.items;
DROP POLICY IF EXISTS "Members can update items" ON public.items;
DROP POLICY IF EXISTS "Members can delete items" ON public.items;

-- SELECT: Members can view items from lists they belong to
CREATE POLICY "Members can view items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- SELECT: Public (anon) can view items from public/unlisted lists
CREATE POLICY "Public can view items from public/unlisted lists"
  ON public.items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = items.list_id
        AND l.visibility IN ('unlisted', 'public')
    )
  );

-- INSERT: Only members can create items on lists they belong to
CREATE POLICY "Members can create items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- UPDATE: Only members can update items on lists they belong to
CREATE POLICY "Members can update items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- DELETE: Only members can delete items from lists they belong to
CREATE POLICY "Members can delete items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT ON public.items TO anon;

-- ============================================================================
-- 3. RESERVATIONS: Block if contributions exist (constraint + trigger)
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if item has any succeeded contributions
CREATE OR REPLACE FUNCTION public.item_has_contributions(p_item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contributions
    WHERE item_id = p_item_id
      AND payment_status = 'succeeded'
  );
$$;

-- Helper function: Check if item is reserved
CREATE OR REPLACE FUNCTION public.item_is_reserved(p_item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reservations
    WHERE item_id = p_item_id
      AND status = 'reserved'
  );
$$;

-- Trigger function: Block reservation INSERT if contributions exist
CREATE OR REPLACE FUNCTION public.check_reservation_allowed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check on INSERT when status is 'reserved'
  IF NEW.status = 'reserved' THEN
    IF public.item_has_contributions(NEW.item_id) THEN
      RAISE EXCEPTION 'Cannot reserve: item already has contributions'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_reservation_before_insert ON public.reservations;
CREATE TRIGGER check_reservation_before_insert
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.check_reservation_allowed();

-- ============================================================================
-- 4. CONTRIBUTIONS: Block if item is reserved (constraint + trigger)
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Trigger function: Block contribution INSERT if item is reserved
CREATE OR REPLACE FUNCTION public.check_contribution_allowed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.item_is_reserved(NEW.item_id) THEN
    RAISE EXCEPTION 'Cannot contribute: item is reserved'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_contribution_before_insert ON public.contributions;
CREATE TRIGGER check_contribution_before_insert
  BEFORE INSERT ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.check_contribution_allowed();

-- ============================================================================
-- 5. RESERVATIONS RLS: Public views (already have views, add RLS for table)
-- ============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reservations flag only" ON public.reservations;
DROP POLICY IF EXISTS "Members can view reservations detail" ON public.reservations;

-- SELECT: Anyone can see basic reservation status via the public view
-- (The public_reservation_flags view handles this, but we need base table access)
-- Public can see reservations but only via the view (which hides identity)
-- For the base table, only allow service role / admin queries

-- For authenticated members of the list, they can see reservations (limited columns)
CREATE POLICY "Members can view reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = reservations.item_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- INSERT: Only via admin/server (handled by supabaseAdmin in API routes)
-- No direct insert policy for authenticated users (guests reserve via API)

-- UPDATE: Only via admin/server (cancel tokens validated in API)

-- ============================================================================
-- 6. CONTRIBUTIONS RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view contributions" ON public.contributions;

-- SELECT: Members can view contributions to items on their lists
CREATE POLICY "Members can view contributions"
  ON public.contributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = contributions.item_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- INSERT/UPDATE: Only via admin/server (Stripe webhook)

-- ============================================================================
-- 7. Helper function: Check if user is list owner (for self-gifting prevention)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_item_list_owner(p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items i
    JOIN public.lists l ON l.id = i.list_id
    WHERE i.id = p_item_id
      AND l.owner_id = p_user_id
  );
$$;

-- Alternative: Check via list_members with owner role
CREATE OR REPLACE FUNCTION public.is_item_list_owner_via_members(p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items i
    JOIN public.list_members lm ON lm.list_id = i.list_id
    WHERE i.id = p_item_id
      AND lm.user_id = p_user_id
      AND lm.role = 'owner'
      AND lm.status = 'accepted'
  );
$$;

-- ============================================================================
-- Grant execute on helper functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.item_has_contributions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.item_is_reserved(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_item_list_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_item_list_owner_via_members(UUID, UUID) TO authenticated;










