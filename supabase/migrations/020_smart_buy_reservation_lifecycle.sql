-- ============================================================================
-- Smart Buy reservation lifecycle columns (24h reserve window)
-- ============================================================================
-- Reservation ownership is tracked via hashed device token only.
-- Raw device tokens must never be stored.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reserved_by_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_click_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS reservations_status_reserved_until_idx
  ON public.reservations (status, reserved_until);

CREATE INDEX IF NOT EXISTS reservations_reserved_by_token_hash_idx
  ON public.reservations (reserved_by_token_hash);

