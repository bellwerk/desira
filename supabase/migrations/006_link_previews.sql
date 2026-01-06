-- ============================================================================
-- M3: Link Previews — cache URL metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The canonical/normalized URL (unique key for lookups)
  normalized_url TEXT NOT NULL UNIQUE,
  
  -- Extracted metadata
  title TEXT,
  description TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Price (best-effort from JSON-LD or OG tags)
  price_amount NUMERIC(12, 2),
  price_currency TEXT,
  
  -- Fetch status
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error')),
  http_status INTEGER,
  error_code TEXT,
  
  -- Raw metadata for debugging (optional)
  raw_og JSONB,
  raw_jsonld JSONB,
  
  -- Timestamps
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by normalized_url
CREATE INDEX IF NOT EXISTS idx_link_previews_normalized_url ON public.link_previews (normalized_url);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_link_previews_expires_at ON public.link_previews (expires_at);

-- No RLS on link_previews — it's a public cache accessed server-side only
-- Grant access to service role (used by supabaseAdmin)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.link_previews TO service_role;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_link_preview_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_link_preview_updated_at ON public.link_previews;
CREATE TRIGGER set_link_preview_updated_at
  BEFORE UPDATE ON public.link_previews
  FOR EACH ROW EXECUTE FUNCTION public.update_link_preview_timestamp();






