-- ============================================================================
-- RLS Performance Fix: Wrap auth.uid() in subquery for single evaluation
-- ============================================================================
-- Supabase recommends using (select auth.uid()) instead of auth.uid() directly
-- to avoid re-evaluating the function for each row scanned.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- 1. LIST_MEMBERS policies
-- ============================================================================

-- Drop and recreate: Members can view list memberships
DROP POLICY IF EXISTS "Members can view list memberships" ON public.list_members;
CREATE POLICY "Members can view list memberships"
  ON public.list_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- Drop and recreate: Users can view own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON public.list_members;
CREATE POLICY "Users can view own memberships"
  ON public.list_members
  FOR SELECT
  USING (
    user_id = (select auth.uid()) 
    OR invited_by = (select auth.uid())
  );

-- Drop and recreate: Owners can invite members
DROP POLICY IF EXISTS "Owners can invite members" ON public.list_members;
CREATE POLICY "Owners can invite members"
  ON public.list_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.role = 'owner'
        AND lm.status = 'accepted'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_members.list_id
        AND l.owner_id = (select auth.uid())
    )
  );

-- Drop and recreate: Users can update own membership
DROP POLICY IF EXISTS "Users can update own membership" ON public.list_members;
CREATE POLICY "Users can update own membership"
  ON public.list_members
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Drop and recreate: Owners can update memberships
DROP POLICY IF EXISTS "Owners can update memberships" ON public.list_members;
CREATE POLICY "Owners can update memberships"
  ON public.list_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.role = 'owner'
        AND lm.status = 'accepted'
    )
  );

-- Drop and recreate: Owners can remove members
DROP POLICY IF EXISTS "Owners can remove members" ON public.list_members;
CREATE POLICY "Owners can remove members"
  ON public.list_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.role = 'owner'
        AND lm.status = 'accepted'
    )
  );

-- Drop and recreate: Users can leave lists
DROP POLICY IF EXISTS "Users can leave lists" ON public.list_members;
CREATE POLICY "Users can leave lists"
  ON public.list_members
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 2. LISTS policies
-- ============================================================================

-- Drop and recreate: Members can view lists they belong to
DROP POLICY IF EXISTS "Members can view lists they belong to" ON public.lists;
CREATE POLICY "Members can view lists they belong to"
  ON public.lists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = lists.id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- ============================================================================
-- 3. ITEMS policies
-- ============================================================================

-- Drop and recreate: Members can view items
DROP POLICY IF EXISTS "Members can view items" ON public.items;
CREATE POLICY "Members can view items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- Drop and recreate: Members can create items
DROP POLICY IF EXISTS "Members can create items" ON public.items;
CREATE POLICY "Members can create items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- Drop and recreate: Members can update items
DROP POLICY IF EXISTS "Members can update items" ON public.items;
CREATE POLICY "Members can update items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- Drop and recreate: Members can delete items
DROP POLICY IF EXISTS "Members can delete items" ON public.items;
CREATE POLICY "Members can delete items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- ============================================================================
-- 4. RESERVATIONS policies
-- ============================================================================

-- Drop and recreate: Members can view reservations
DROP POLICY IF EXISTS "Members can view reservations" ON public.reservations;
CREATE POLICY "Members can view reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = reservations.item_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );

-- ============================================================================
-- 5. CONTRIBUTIONS policies
-- ============================================================================

-- Drop and recreate: Members can view contributions
DROP POLICY IF EXISTS "Members can view contributions" ON public.contributions;
CREATE POLICY "Members can view contributions"
  ON public.contributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = contributions.item_id
        AND lm.user_id = (select auth.uid())
        AND lm.status = 'accepted'
    )
  );
