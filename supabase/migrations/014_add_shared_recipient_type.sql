-- ============================================================================
-- Add 'shared' to recipient_type enum
-- The lists table uses a PostgreSQL enum for recipient_type, but 'shared'
-- was missing. This adds it so collaborative lists can be created.
-- ============================================================================

-- Add 'shared' to the recipient_type enum if it doesn't already exist
DO $$
BEGIN
  -- Check if 'shared' is not already a value in the enum
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'shared'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'recipient_type')
  ) THEN
    ALTER TYPE recipient_type ADD VALUE 'shared';
  END IF;
END
$$;
