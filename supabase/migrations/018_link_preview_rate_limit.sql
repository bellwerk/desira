-- ============================================================================
-- M7 Hardening: DB-backed rate limiting for link preview fetches
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires_at
  ON public.rate_limit_buckets (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION public.take_rate_limit(
  p_scope TEXT,
  p_key_hash TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
  v_request_count INTEGER;
BEGIN
  IF p_scope IS NULL OR p_scope = '' THEN
    RAISE EXCEPTION 'scope is required';
  END IF;

  IF p_key_hash IS NULL OR p_key_hash = '' THEN
    RAISE EXCEPTION 'key hash is required';
  END IF;

  IF p_max_requests < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'max requests and window seconds must be positive';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  -- Clean up expired entries for the same scope/key to avoid locking the entire table per request.
  DELETE FROM public.rate_limit_buckets
  WHERE scope = p_scope
    AND key_hash = p_key_hash
    AND expires_at <= v_now;

  INSERT INTO public.rate_limit_buckets (
    scope,
    key_hash,
    window_start,
    request_count,
    expires_at,
    updated_at
  )
  VALUES (
    p_scope,
    p_key_hash,
    v_window_start,
    1,
    v_reset_at + interval '1 hour',
    v_now
  )
  ON CONFLICT (scope, key_hash, window_start) DO UPDATE
  SET
    request_count = public.rate_limit_buckets.request_count + 1,
    expires_at = GREATEST(public.rate_limit_buckets.expires_at, v_reset_at + interval '1 hour'),
    updated_at = v_now
  WHERE public.rate_limit_buckets.request_count < p_max_requests
  RETURNING public.rate_limit_buckets.request_count
  INTO v_request_count;

  IF v_request_count IS NULL THEN
    SELECT request_count
    INTO v_request_count
    FROM public.rate_limit_buckets
    WHERE scope = p_scope
      AND key_hash = p_key_hash
      AND window_start = v_window_start;

    RETURN QUERY
    SELECT
      FALSE,
      0,
      v_reset_at,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_reset_at - v_now)))::INTEGER);
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    TRUE,
    GREATEST(p_max_requests - v_request_count, 0),
    v_reset_at,
    0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.take_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.take_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

COMMENT ON TABLE public.rate_limit_buckets IS
  'Fixed-window rate limit counters for server-side abuse protection.';
