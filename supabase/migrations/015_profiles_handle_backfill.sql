-- ============================================================================
-- Align profiles schema with production handle requirement
-- - Adds handle column if missing
-- - Backfills missing handles
-- - Enforces NOT NULL on handle
-- - Updates signup trigger to populate handle
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS handle TEXT;

WITH prepared AS (
  SELECT
    p.id,
    CASE
      WHEN LENGTH(
        TRIM(BOTH '-' FROM REGEXP_REPLACE(
          LOWER(COALESCE(NULLIF(p.display_name, ''), SPLIT_PART(COALESCE(au.email, ''), '@', 1), 'user')),
          '[^a-z0-9]+',
          '-',
          'g'
        ))
      ) > 0
      THEN TRIM(BOTH '-' FROM REGEXP_REPLACE(
        LOWER(COALESCE(NULLIF(p.display_name, ''), SPLIT_PART(COALESCE(au.email, ''), '@', 1), 'user')),
        '[^a-z0-9]+',
        '-',
        'g'
      ))
      ELSE 'user'
    END AS base_handle
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
)
UPDATE public.profiles p
SET handle = prepared.base_handle || '-' || LEFT(REPLACE(p.id::TEXT, '-', ''), 8)
FROM prepared
WHERE p.id = prepared.id
  AND (p.handle IS NULL OR BTRIM(p.handle) = '');

ALTER TABLE public.profiles
ALTER COLUMN handle SET NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_handle_idx
  ON public.profiles (handle);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  base_name TEXT;
  slug TEXT;
BEGIN
  base_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
    'user'
  );

  slug := TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(base_name), '[^a-z0-9]+', '-', 'g'));
  IF slug IS NULL OR slug = '' THEN
    slug := 'user';
  END IF;

  INSERT INTO public.profiles (id, display_name, handle)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''), 'User'),
    slug || '-' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8)
  );

  RETURN NEW;
END;
$$;
