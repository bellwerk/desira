-- ============================================================================
-- Smart Buy lock logic updates
-- ============================================================================
-- Reservation lock should apply when:
-- - status = 'reserved' AND reservation is still active
-- - status = 'purchased'

CREATE OR REPLACE FUNCTION public.item_is_reserved(p_item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.item_id = p_item_id
      AND (
        (r.status = 'reserved' AND (r.reserved_until IS NULL OR r.reserved_until > now()))
        OR r.status = 'purchased'
      )
  );
$$;

DROP VIEW IF EXISTS public.public_reservation_flags;

CREATE VIEW public.public_reservation_flags
WITH (security_invoker = true)
AS
SELECT DISTINCT
  r.item_id,
  TRUE AS is_reserved
FROM public.reservations r
WHERE
  (r.status = 'reserved' AND (r.reserved_until IS NULL OR r.reserved_until > now()))
  OR r.status = 'purchased';

GRANT SELECT ON public.public_reservation_flags TO anon;
GRANT SELECT ON public.public_reservation_flags TO authenticated;

