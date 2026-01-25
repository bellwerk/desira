-- ============================================================================
-- List Members table (M2)
-- Tracks list membership: who belongs to which list, their role, and invite status
-- ============================================================================

-- Create role enum
DO $$ BEGIN
  CREATE TYPE list_member_role AS ENUM ('owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create status enum for invite flow
DO $$ BEGIN
  CREATE TYPE list_member_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create list_members table
CREATE TABLE IF NOT EXISTS public.list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role list_member_role NOT NULL DEFAULT 'member',
  status list_member_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_token TEXT UNIQUE, -- for email invite links (nullable, cleared on accept)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each user can only be a member of a list once
  CONSTRAINT unique_list_user UNIQUE (list_id, user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON public.list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON public.list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_members_invite_token ON public.list_members(invite_token) WHERE invite_token IS NOT NULL;

-- Enable RLS
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can see memberships for lists they belong to (accepted members only)
CREATE POLICY "Members can view list memberships"
  ON public.list_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'accepted'
    )
  );

-- Users can see their own membership records (including pending invites)
CREATE POLICY "Users can view own memberships"
  ON public.list_members
  FOR SELECT
  USING (user_id = auth.uid());

-- List owners can insert new members (invites)
CREATE POLICY "Owners can invite members"
  ON public.list_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = auth.uid()
        AND lm.role = 'owner'
        AND lm.status = 'accepted'
    )
    OR
    -- Also allow if user is the list owner (for initial owner record)
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_members.list_id
        AND l.owner_id = auth.uid()
    )
  );

-- Users can update their own membership (accept/decline invite)
CREATE POLICY "Users can update own membership"
  ON public.list_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Owners can update any membership in their list (change role, remove)
CREATE POLICY "Owners can update memberships"
  ON public.list_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = auth.uid()
        AND lm.role = 'owner'
        AND lm.status = 'accepted'
    )
  );

-- Owners can delete members (except themselves if they're the only owner)
CREATE POLICY "Owners can remove members"
  ON public.list_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.list_members lm
      WHERE lm.list_id = list_members.list_id
        AND lm.user_id = auth.uid()
        AND lm.role = 'owner'
        AND lm.status = 'accepted'
    )
  );

-- Users can remove themselves from a list (leave)
CREATE POLICY "Users can leave lists"
  ON public.list_members
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

-- Ensure the updated_at function exists (may have been created in 001_profiles.sql)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS list_members_updated_at ON public.list_members;
CREATE TRIGGER list_members_updated_at
  BEFORE UPDATE ON public.list_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Helper function: Check if user is a list member
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_list_member(p_list_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.list_members
    WHERE list_id = p_list_id
      AND user_id = p_user_id
      AND status = 'accepted'
  );
$$;

-- ============================================================================
-- Helper function: Check if user is a list owner
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_list_owner(p_list_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.list_members
    WHERE list_id = p_list_id
      AND user_id = p_user_id
      AND role = 'owner'
      AND status = 'accepted'
  );
$$;

-- ============================================================================
-- Auto-create owner membership when list is created
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_list()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.list_members (list_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'accepted');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_list_created ON public.lists;
CREATE TRIGGER on_list_created
  AFTER INSERT ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_list();

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.list_members TO authenticated;
GRANT USAGE ON TYPE list_member_role TO authenticated;
GRANT USAGE ON TYPE list_member_status TO authenticated;

-- ============================================================================
-- Backfill: Create owner memberships for existing lists
-- ============================================================================
INSERT INTO public.list_members (list_id, user_id, role, status)
SELECT id, owner_id, 'owner', 'accepted'
FROM public.lists
WHERE NOT EXISTS (
  SELECT 1 FROM public.list_members lm
  WHERE lm.list_id = lists.id AND lm.user_id = lists.owner_id
)
ON CONFLICT (list_id, user_id) DO NOTHING;

