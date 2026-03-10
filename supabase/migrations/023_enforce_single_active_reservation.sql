-- ============================================================================
-- Enforce a single active reservation lock per item
-- ============================================================================
-- Active lock rows are any reservation rows where status != 'canceled'.
-- This includes both 'reserved' and new terminal lock states like 'purchased'.

WITH ranked AS (
  SELECT
    r.id,
    ROW_NUMBER() OVER (
      PARTITION BY r.item_id
      ORDER BY
        CASE WHEN r.status = 'purchased' THEN 0 ELSE 1 END,
        r.created_at DESC NULLS LAST,
        r.id DESC
    ) AS rn
  FROM public.reservations r
  WHERE r.status <> 'canceled'
)
UPDATE public.reservations r
SET
  status = 'canceled',
  canceled_at = COALESCE(r.canceled_at, now())
FROM ranked
WHERE r.id = ranked.id
  AND ranked.rn > 1
  AND r.status <> 'canceled';

CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_active_per_item_idx
  ON public.reservations (item_id)
  WHERE status <> 'canceled';
