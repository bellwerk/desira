-- ============================================================================
-- Add 'personal' to recipient_type enum without rewriting legacy list types
-- ============================================================================

-- Add 'personal' to recipient_type enum if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'personal'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'recipient_type')
  ) THEN
    ALTER TYPE recipient_type ADD VALUE 'personal';
  END IF;
END
$$;

-- Do not remap existing 'shopping' / legacy collaborative lists here.
-- Migration 016 already canonicalized 'shared' -> 'shopping', and those rows
-- should retain their collaborative semantics.
