-- ============================================================================
-- Add 'shopping' to recipient_type enum and migrate existing shared lists
-- ============================================================================

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

-- Replace legacy 'shared' lists with 'shopping' so UI labels stay consistent.
UPDATE public.lists
SET recipient_type = 'shopping'
WHERE recipient_type = 'shared';
