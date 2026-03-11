-- Ensure the owner "mark received" flow writes a valid enum value.
-- Some environments still have item_status without 'received'.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'item_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'item_status'
      AND e.enumlabel = 'received'
  ) THEN
    ALTER TYPE public.item_status ADD VALUE 'received';
  END IF;
END
$$;
