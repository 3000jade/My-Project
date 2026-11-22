-- Smart public property search & common filters RPC (FTS + pg_trgm + common filters + map bounds)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

DROP FUNCTION IF EXISTS public.search_public_properties(
  text, text, text, text, numeric, numeric, text, integer, text, text, text[], text[],
  double precision, double precision, double precision, double precision, text, integer, integer
);

CREATE OR REPLACE FUNCTION public.search_public_properties_v2(
  p_search text DEFAULT NULL,
  p_transaction_type text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_beds text DEFAULT NULL,
  p_baths integer DEFAULT NULL,
  p_north double precision DEFAULT NULL,
  p_south double precision DEFAULT NULL,
  p_east double precision DEFAULT NULL,
  p_west double precision DEFAULT NULL,
  p_sort_by text DEFAULT 'newest',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  row_data jsonb,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH params AS (
    SELECT NULLIF(trim(p_search), '') AS q
  ),
  matched AS (
    SELECT
      p.*,
      CASE
        WHEN params.q IS NULL THEN 0::double precision
        ELSE (
          ts_rank_cd(
            to_tsvector(
              'english',
              concat_ws(' ', p.title, p.address, p.unparsed_address, p.city, p.barangay, p.subdivision_name, p.building_name, p.property_type, p.public_remarks)
            ),
            websearch_to_tsquery('english', params.q)
          ) * 2.0
          + word_similarity(
              params.q,
              concat_ws(' ', p.title, p.address, p.city, p.barangay, p.subdivision_name, p.building_name)
            )
        )
      END AS search_rank
    FROM public.properties p
    CROSS JOIN params
    WHERE p.standard_status = 'Active'
      AND (
        params.q IS NULL
        OR to_tsvector(
             'english',
             concat_ws(' ', p.title, p.address, p.unparsed_address, p.city, p.barangay, p.subdivision_name, p.building_name, p.property_type, p.public_remarks)
           ) @@ websearch_to_tsquery('english', params.q)
        OR concat_ws(' ', p.title, p.address, p.unparsed_address, p.city, p.barangay, p.subdivision_name, p.building_name, p.property_type) ILIKE '%' || params.q || '%'
        OR word_similarity(
             params.q,
             concat_ws(' ', p.title, p.address, p.city, p.barangay, p.subdivision_name, p.building_name)
           ) >= 0.3
      )
      AND (
        NULLIF(trim(p_transaction_type), '') IS NULL
        OR LOWER(trim(p_transaction_type)) = 'all'
        OR LOWER(COALESCE(p.transaction_type, 'For Sale')) ILIKE '%' || LOWER(trim(p_transaction_type)) || '%'
      )
      AND (
        NULLIF(trim(p_property_type), '') IS NULL
        OR LOWER(trim(p_property_type)) IN ('all', 'all types')
        OR COALESCE(p.property_type, '') ILIKE '%' || trim(p_property_type) || '%'
      )
      AND (
        NULLIF(trim(p_district), '') IS NULL
        OR LOWER(trim(p_district)) IN ('all', 'all metro manila')
        OR EXISTS (
          SELECT 1
          FROM unnest(string_to_array(p_district, '/')) AS d(part)
          WHERE NULLIF(trim(d.part), '') IS NOT NULL
            AND concat_ws(' ', p.city, p.address, p.unparsed_address, p.barangay, p.subdivision_name, p.building_name) ILIKE '%' || trim(d.part) || '%'
        )
      )
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (
        NULLIF(trim(p_beds), '') IS NULL
        OR LOWER(trim(p_beds)) = 'any'
        OR (LOWER(trim(p_beds)) = 'studio' AND COALESCE(p.bedrooms_total, p.beds, 0) <= 1)
        OR (trim(p_beds) IN ('4+', '5+') AND COALESCE(p.bedrooms_total, p.beds, 0) >= 4)
        OR (
          trim(p_beds) ~ '^[0-9]+$'
          AND COALESCE(p.bedrooms_total, p.beds, 0) = trim(p_beds)::integer
        )
      )
      AND (p_baths IS NULL OR COALESCE(p.bathrooms_total_integer, p.baths, 0) >= p_baths)
      AND (
        p_north IS NULL OR p_south IS NULL OR p_east IS NULL OR p_west IS NULL
        OR (
          p.latitude BETWEEN p_south AND p_north
          AND p.longitude BETWEEN p_west AND p_east
        )
      )
  )
  SELECT
    to_jsonb(m.*) - 'search_rank' AS row_data,
    COUNT(*) OVER() AS total_count
  FROM matched m
  ORDER BY
    CASE WHEN p_sort_by = 'price_asc' THEN m.price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN m.price END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'relevance' THEN m.search_rank END DESC NULLS LAST,
    m.created_at DESC
  LIMIT GREATEST(1, LEAST(250, COALESCE(p_limit, 50)))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.search_public_properties_v2(
  text, text, text, text, numeric, numeric, text, integer,
  double precision, double precision, double precision, double precision, text, integer, integer
) TO anon, authenticated;
