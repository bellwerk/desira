-- ============================================================================
-- Allow nullable user_id for pending invites
-- When an invite is generated, user_id is NULL (unknown invitee)
-- When accepted, user_id is set to the accepting user
-- ============================================================================

-- Drop existing foreign key and NOT NULL constraint
ALTER TABLE public.list_members 
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint that includes user_id
ALTER TABLE public.list_members 
  DROP CONSTRAINT IF EXISTS unique_list_user;

-- Add a partial unique constraint: only one accepted membership per user per list
CREATE UNIQUE INDEX IF NOT EXISTS unique_accepted_list_user 
  ON public.list_members(list_id, user_id) 
  WHERE user_id IS NOT NULL AND status = 'accepted';

-- Add a unique constraint on invite_token (already exists from migration 002, but ensure it)
-- This is already created in 002, but let's ensure it's there
CREATE UNIQUE INDEX IF NOT EXISTS idx_list_members_invite_token_unique
  ON public.list_members(invite_token)
  WHERE invite_token IS NOT NULL;

-- Add check constraint: accepted members must have a user_id
ALTER TABLE public.list_members
  DROP CONSTRAINT IF EXISTS check_accepted_has_user;
  
ALTER TABLE public.list_members
  ADD CONSTRAINT check_accepted_has_user
  CHECK (status != 'accepted' OR user_id IS NOT NULL);

-- Update RLS policy to handle null user_id for pending invites
-- Owners can still see pending invites they created (via invited_by)
DROP POLICY IF EXISTS "Users can view own memberships" ON public.list_members;

CREATE POLICY "Users can view own memberships"
  ON public.list_members
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR invited_by = auth.uid()
  );

-- Allow users to update memberships where user_id is null (accepting invite)
DROP POLICY IF EXISTS "Users can update own membership" ON public.list_members;

CREATE POLICY "Users can update own membership"
  ON public.list_members
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR (user_id IS NULL AND status = 'pending')
  )
  WITH CHECK (
    user_id = auth.uid()
  );






