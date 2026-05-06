-- Ensure public profile handles remain unambiguous for /@username routes.
-- Existing profile data may predate handle validation, so normalize and repair
-- duplicates before adding the case-insensitive uniqueness guard.
WITH normalized AS (
  SELECT
    id,
    TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(NULLIF(BTRIM(handle), ''), 'user')), '[^a-z0-9]+', '-', 'g')) AS handle_slug
  FROM public.profiles
),
resolved AS (
  SELECT
    id,
    CASE
      WHEN handle_slug = '' THEN 'user-' || LEFT(REPLACE(id::TEXT, '-', ''), 8)
      ELSE handle_slug
    END AS safe_handle
  FROM normalized
)
UPDATE public.profiles AS profiles
SET handle = resolved.safe_handle
FROM resolved
WHERE profiles.id = resolved.id
  AND profiles.handle IS DISTINCT FROM resolved.safe_handle;

WITH ranked AS (
  SELECT
    id,
    handle,
    ROW_NUMBER() OVER (PARTITION BY LOWER(handle) ORDER BY created_at ASC NULLS LAST, id ASC) AS duplicate_rank
  FROM public.profiles
),
deduped AS (
  SELECT
    id,
    handle || '-' || LEFT(REPLACE(id::TEXT, '-', ''), 8) AS repaired_handle
  FROM ranked
  WHERE duplicate_rank > 1
)
UPDATE public.profiles AS profiles
SET handle = deduped.repaired_handle
FROM deduped
WHERE profiles.id = deduped.id;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_unique_lower_idx
  ON public.profiles (LOWER(handle));
