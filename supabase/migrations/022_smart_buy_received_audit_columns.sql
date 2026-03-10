-- ============================================================================
-- Smart Buy received-state audit columns
-- ============================================================================

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_by_owner_id UUID;

CREATE INDEX IF NOT EXISTS items_received_at_idx
  ON public.items (received_at);

