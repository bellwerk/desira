-- ============================================================================
-- Add 'shopping' to recipient_type enum
-- ============================================================================
-- NOTE:
-- PostgreSQL cannot safely use a newly-added enum value in the same transaction.
-- The data backfill from 'shared' -> 'shopping' is intentionally done in a
-- follow-up migration file so it runs after this migration commits.

-- Add 'shopping' to recipient_type enum if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'shopping'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'recipient_type')
  ) THEN
    ALTER TYPE recipient_type ADD VALUE 'shopping';
  END IF;
END
$$;
