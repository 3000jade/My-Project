-- ==============================================================================
-- MIGRATION: Listing Schema Cleanup & Categorized Photo Gallery Support
-- Removes Master Subdivision Project linkage and redundant legacy columns from
-- public.properties, rebuilds idx_properties_fts, and adds gallery_category to
-- public.property_media.
-- ==============================================================================

-- 1. Backfill canonical columns before dropping legacy duplicates
UPDATE public.properties
SET
  bedrooms_total = COALESCE(bedrooms_total, beds, 1),
  bathrooms_total_integer = COALESCE(bathrooms_total_integer, baths, 1),
  living_area = COALESCE(living_area, sqft),
  state_or_province = COALESCE(state_or_province, state)
WHERE bedrooms_total IS NULL
   OR bathrooms_total_integer IS NULL
   OR living_area IS NULL
   OR state_or_province IS NULL;

-- 2. Rebuild Full-Text Search index without unparsed_address
DROP INDEX IF EXISTS public.idx_properties_fts;
CREATE INDEX IF NOT EXISTS idx_properties_fts ON public.properties USING gin (
  to_tsvector(
    'english'::regconfig,
    (
      (
        (
          (
            COALESCE(title, ''::TEXT) || ' '::TEXT || COALESCE(address, ''::TEXT)
          ) || ' '::TEXT || COALESCE(city, ''::TEXT)
        ) || ' '::TEXT || COALESCE(subdivision_name, ''::VARCHAR)::TEXT
      ) || ' '::TEXT || COALESCE(public_remarks, ''::TEXT)
    )
  )
);

-- 3. Drop Master Subdivision Project foreign keys & indexes from properties
DROP INDEX IF EXISTS public.idx_properties_subdivision_project_id;
DROP INDEX IF EXISTS public.idx_properties_subdivision_lot_id;

ALTER TABLE public.properties
  DROP COLUMN IF EXISTS subdivision_project_id,
  DROP COLUMN IF EXISTS subdivision_lot_id;

-- 4. Drop unnecessary / duplicate legacy columns from properties
ALTER TABLE public.properties
  DROP COLUMN IF EXISTS tagline,
  DROP COLUMN IF EXISTS formatted_price,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS unparsed_address,
  DROP COLUMN IF EXISTS beds,
  DROP COLUMN IF EXISTS baths,
  DROP COLUMN IF EXISTS sqft,
  DROP COLUMN IF EXISTS bathrooms_full,
  DROP COLUMN IF EXISTS bathrooms_half,
  DROP COLUMN IF EXISTS parking_covered,
  DROP COLUMN IF EXISTS parking_open,
  DROP COLUMN IF EXISTS architectural_style,
  DROP COLUMN IF EXISTS living_area_units,
  DROP COLUMN IF EXISTS lot_size_units,
  DROP COLUMN IF EXISTS association_fee_frequency;

-- 5. Add gallery_category to public.property_media for categorized image holders
ALTER TABLE public.property_media
  ADD COLUMN IF NOT EXISTS gallery_category VARCHAR(32);

ALTER TABLE public.property_media
  DROP CONSTRAINT IF EXISTS property_media_gallery_category_check;

ALTER TABLE public.property_media
  ADD CONSTRAINT property_media_gallery_category_check
  CHECK (
    gallery_category IS NULL OR
    (char_length(trim(gallery_category)) BETWEEN 1 AND 32)
  );

CREATE INDEX IF NOT EXISTS idx_property_media_gallery_category
  ON public.property_media(property_id, gallery_category);
