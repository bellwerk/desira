-- ============================================================================
-- Add hashed anonymous device token tracking for reservations
-- ============================================================================
-- We only persist a SHA-256 hash of the browser device token.
-- Raw device tokens must never be stored in the database.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS device_token_hash TEXT;

CREATE INDEX IF NOT EXISTS reservations_device_token_hash_idx
  ON public.reservations (device_token_hash);

