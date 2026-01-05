-- ============================================================================
-- M7 MVP Hardening: Audit Events Table
-- ============================================================================
-- Simple audit log for tracking key actions. Helps with debugging,
-- customer support, and security reviews.
-- ============================================================================

-- Create audit_events table
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  event_type TEXT NOT NULL,  -- e.g., 'reservation.created', 'contribution.succeeded'
  
  -- Who did it (nullable for anonymous/guest actions)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user',  -- 'user', 'guest', 'system', 'webhook'
  
  -- What it relates to
  resource_type TEXT,  -- 'list', 'item', 'reservation', 'contribution'
  resource_id UUID,
  
  -- Additional context (flexible JSON for any extra data)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- IP address (for security audits, hashed or truncated in practice)
  ip_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON public.audit_events(event_type);

-- Index for querying by resource
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON public.audit_events(resource_type, resource_id);

-- Index for querying by actor
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON public.audit_events(actor_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);

-- RLS: Only service role can insert (API routes use supabaseAdmin)
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- No public read access; admins query via service role
-- Members can't see audit logs directly (admin-only via dashboard/tooling)

-- ============================================================================
-- Event Types Reference (for consistency):
-- ============================================================================
-- list.created          - New list created
-- list.updated          - List settings changed
-- list.deleted          - List deleted
-- item.created          - Item added to list
-- item.updated          - Item edited
-- item.deleted          - Item removed
-- reservation.created   - Item reserved
-- reservation.canceled  - Reservation canceled
-- contribution.created  - Contribution started (checkout initiated)
-- contribution.succeeded - Payment succeeded (via webhook)
-- contribution.failed   - Payment failed (via webhook)
-- invite.created        - Invite link generated
-- invite.accepted       - Invite accepted
-- auth.login            - User logged in
-- auth.logout           - User logged out
-- ============================================================================

COMMENT ON TABLE public.audit_events IS 'Audit log for tracking key user and system actions';

