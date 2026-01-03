-- ============================================================================
-- Lists table RLS policies
-- Allows authenticated users to create/read/update/delete their own lists
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP existing policies if they exist (to make this idempotent)
-- ============================================================================
DROP POLICY IF EXISTS "Users can create own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can view own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can update own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can delete own lists" ON public.lists;
DROP POLICY IF EXISTS "Public can view unlisted lists" ON public.lists;

-- ============================================================================
-- INSERT: Authenticated users can create lists where they are the owner
-- ============================================================================
CREATE POLICY "Users can create own lists"
  ON public.lists
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- SELECT: Users can view lists they own
-- ============================================================================
CREATE POLICY "Users can view own lists"
  ON public.lists
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- SELECT: Public can view unlisted/public lists via share_token
-- (This allows the public list page to work without auth)
-- ============================================================================
CREATE POLICY "Public can view unlisted lists"
  ON public.lists
  FOR SELECT
  TO anon
  USING (visibility IN ('unlisted', 'public'));

-- ============================================================================
-- UPDATE: Users can update their own lists
-- ============================================================================
CREATE POLICY "Users can update own lists"
  ON public.lists
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- DELETE: Users can delete their own lists
-- ============================================================================
CREATE POLICY "Users can delete own lists"
  ON public.lists
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lists TO authenticated;
GRANT SELECT ON public.lists TO anon;



