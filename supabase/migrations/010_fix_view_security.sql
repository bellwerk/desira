-- ============================================================================
-- Fix SECURITY DEFINER on views
-- 
-- Issue: Views defined with SECURITY DEFINER run with the permissions of the
-- view owner, bypassing RLS policies of the querying user.
--
-- Fix: Recreate views with SECURITY INVOKER (default in PostgreSQL 15+) to
-- ensure RLS policies are enforced for the calling user.
-- ============================================================================

-- ============================================================================
-- 1. public_reservation_flags view
-- Purpose: Expose only item_id + is_reserved flag without revealing identity
-- 
-- This view returns one row per item_id that has an active reservation,
-- hiding who made the reservation (reserver name/email/cancel token).
-- ============================================================================

DROP VIEW IF EXISTS public.public_reservation_flags;

CREATE VIEW public.public_reservation_flags
WITH (security_invoker = true)
AS
SELECT DISTINCT
  item_id,
  TRUE AS is_reserved
FROM public.reservations
WHERE status = 'reserved';

-- Grant access to the view
GRANT SELECT ON public.public_reservation_flags TO anon;
GRANT SELECT ON public.public_reservation_flags TO authenticated;

-- ============================================================================
-- 2. public_contribution_totals view (if exists)
-- Purpose: Expose only item_id + funded_amount_cents aggregate
-- ============================================================================

DROP VIEW IF EXISTS public.public_contribution_totals;

CREATE VIEW public.public_contribution_totals
WITH (security_invoker = true)
AS
SELECT 
  item_id,
  COALESCE(SUM(amount_cents), 0)::bigint AS funded_amount_cents
FROM public.contributions
WHERE payment_status = 'succeeded'
GROUP BY item_id;

-- Grant access to the view
GRANT SELECT ON public.public_contribution_totals TO anon;
GRANT SELECT ON public.public_contribution_totals TO authenticated;
