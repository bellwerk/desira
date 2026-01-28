-- ============================================================================
-- Fix infinite recursion in list_members RLS policies
-- ============================================================================
-- The problem: SELECT policies on list_members query list_members,
-- which triggers the same policy, causing infinite recursion.
--
-- Solution: Use the SECURITY DEFINER helper functions (is_list_member, 
-- is_list_owner) which bypass RLS, instead of inline EXISTS subqueries.
-- ============================================================================

-- ============================================================================
-- 1. LIST_MEMBERS policies - fix recursion
-- ============================================================================

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Members can view list memberships" ON public.list_members;

-- Recreate using the helper function (bypasses RLS via SECURITY DEFINER)
CREATE POLICY "Members can view list memberships"
  ON public.list_members
  FOR SELECT
  USING (
    public.is_list_member(list_id, (select auth.uid()))
  );

-- "Users can view own memberships" is fine - it doesn't query list_members

-- Fix "Owners can invite members" - uses EXISTS on list_members which causes recursion
DROP POLICY IF EXISTS "Owners can invite members" ON public.list_members;
CREATE POLICY "Owners can invite members"
  ON public.list_members
  FOR INSERT
  WITH CHECK (
    -- Use helper function instead of EXISTS on list_members
    public.is_list_owner(list_id, (select auth.uid()))
    OR
    -- Also allow if user is the list owner (for initial owner record via trigger)
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_members.list_id
        AND l.owner_id = (select auth.uid())
    )
  );

-- Fix "Owners can update memberships" - uses EXISTS on list_members
DROP POLICY IF EXISTS "Owners can update memberships" ON public.list_members;
CREATE POLICY "Owners can update memberships"
  ON public.list_members
  FOR UPDATE
  USING (
    public.is_list_owner(list_id, (select auth.uid()))
  );

-- Fix "Owners can remove members" - uses EXISTS on list_members
DROP POLICY IF EXISTS "Owners can remove members" ON public.list_members;
CREATE POLICY "Owners can remove members"
  ON public.list_members
  FOR DELETE
  USING (
    public.is_list_owner(list_id, (select auth.uid()))
  );

-- "Users can update own membership" and "Users can leave lists" are fine - 
-- they check user_id directly, no recursion
