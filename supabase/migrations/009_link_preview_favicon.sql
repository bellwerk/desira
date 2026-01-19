-- ============================================================================
-- M4: Add favicon column to link_previews
-- ============================================================================

ALTER TABLE public.link_previews
ADD COLUMN IF NOT EXISTS favicon TEXT;

-- Comment explaining the column
COMMENT ON COLUMN public.link_previews.favicon IS 'URL to the favicon extracted from the page or derived from domain';
