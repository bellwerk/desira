-- ============================================================================
-- Migration 009: Restrict anon RLS to public visibility only
-- 
-- Security Fix: Previously, anon could enumerate all unlisted lists and items
-- without needing the share token. This migration restricts anon access to
-- only truly public lists. Unlisted lists are accessed via the share page
-- which uses the admin client with token validation.
-- ============================================================================

-- ============================================================================
-- 1. LISTS: Restrict anon to public-only (not unlisted)
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view unlisted lists" ON public.lists;

-- Create restricted policy: anon can only see public lists
CREATE POLICY "Public can view public lists"
  ON public.lists
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- ============================================================================
-- 2. ITEMS: Restrict anon to items from public lists only (not unlisted)
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view items from public/unlisted lists" ON public.items;

-- Create restricted policy: anon can only see items from public lists
CREATE POLICY "Public can view items from public lists"
  ON public.items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = items.list_id
        AND l.visibility = 'public'
    )
  );

-- ============================================================================
-- Note: Unlisted and private lists are now only accessible via:
-- - Authenticated members (for private lists)
-- - Admin/service-role client in the share page (for unlisted lists with valid token)
-- ============================================================================
