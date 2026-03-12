-- ============================================================================
-- List Members table (M2)
-- Tracks list membership: who belongs to which list, their role, and invite status
-- ============================================================================

-- ============================================================================
-- Core schema bootstrap (forward-fix)
-- Some environments were missing foundational M0/M1 tables. Define them
-- idempotently here so later M2+ migrations can run in CI/local from scratch.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.recipient_type AS ENUM ('person', 'group');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.item_status AS ENUM ('active', 'funded', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('reserved', 'purchased', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contribution_payment_status AS ENUM ('pending', 'succeeded', 'failed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Shared updated_at trigger helper used by lists/items/reservations/contributions/payment_accounts.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  recipient_type public.recipient_type NOT NULL DEFAULT 'person',
  visibility TEXT NOT NULL DEFAULT 'unlisted' CHECK (visibility IN ('private', 'unlisted', 'public')),
  occasion TEXT,
  event_date DATE,
  share_token TEXT NOT NULL UNIQUE DEFAULT REPLACE(REPLACE(REPLACE(ENCODE(gen_random_bytes(12), 'base64'), '+', '-'), '/', '_'), '=', ''),
  allow_reservations BOOLEAN NOT NULL DEFAULT TRUE,
  allow_contributions BOOLEAN NOT NULL DEFAULT TRUE,
  allow_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  currency TEXT NOT NULL DEFAULT 'CAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON public.lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_visibility ON public.lists(visibility);
CREATE INDEX IF NOT EXISTS idx_lists_share_token ON public.lists(share_token);

DROP TRIGGER IF EXISTS lists_updated_at ON public.lists;
CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  product_url TEXT,
  image_url TEXT,
  merchant TEXT,
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  target_amount_cents INTEGER CHECK (target_amount_cents IS NULL OR target_amount_cents >= 0),
  note_public TEXT,
  note_private TEXT,
  status public.item_status NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 1 CHECK (sort_order >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_list_id ON public.items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_list_sort_order ON public.items(list_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);

DROP TRIGGER IF EXISTS items_updated_at ON public.items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  status public.reservation_status NOT NULL DEFAULT 'reserved',
  cancel_token_hash TEXT,
  device_token_hash TEXT,
  reserved_at TIMESTAMPTZ,
  reserved_until TIMESTAMPTZ,
  reserved_by_token_hash TEXT,
  affiliate_click_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_item_id ON public.reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

DROP TRIGGER IF EXISTS reservations_updated_at ON public.reservations;
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency TEXT,
  contributor_name TEXT,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  payment_status public.contribution_payment_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_intent_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_item_id ON public.contributions(item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_payment_status ON public.contributions(payment_status);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON public.contributions(created_at DESC);

DROP TRIGGER IF EXISTS contributions_updated_at ON public.contributions;
CREATE TRIGGER contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payment_accounts (
  owner_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_account_id TEXT,
  charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_accounts_provider_account_id
  ON public.payment_accounts(provider_account_id)
  WHERE provider_account_id IS NOT NULL;

DROP TRIGGER IF EXISTS payment_accounts_updated_at ON public.payment_accounts;
CREATE TRIGGER payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO service_role;

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

