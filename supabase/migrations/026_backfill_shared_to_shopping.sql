-- ============================================================================
-- Backfill legacy recipient_type values: shared -> shopping
-- ============================================================================
-- Runs after 016_add_shopping_recipient_type.sql so the enum value 'shopping'
-- is already committed and safe to use.

UPDATE public.lists
SET recipient_type = 'shopping'::recipient_type
WHERE recipient_type::text = 'shared';
