-- Drop previous 15-arg overload before adding p_furnishing, p_parking, and p_banks
DROP FUNCTION IF EXISTS public.search_public_properties_v2(
  text, text, text, text, numeric, numeric, text, integer,
  double precision, double precision, double precision, double precision,
  text, integer, integer
);

CREATE OR REPLACE FUNCTION public.search_public_properties_v2(
    p_search text DEFAULT NULL::text,
    p_transaction_type text DEFAULT NULL::text,
    p_property_type text DEFAULT NULL::text,
    p_district text DEFAULT NULL::text,
    p_min_price numeric DEFAULT NULL::numeric,
    p_max_price numeric DEFAULT NULL::numeric,
    p_beds text DEFAULT NULL::text,
    p_baths integer DEFAULT NULL::integer,
    p_north double precision DEFAULT NULL::double precision,
    p_south double precision DEFAULT NULL::double precision,
    p_east double precision DEFAULT NULL::double precision,
    p_west double precision DEFAULT NULL::double precision,
    p_sort_by text DEFAULT 'newest'::text,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_furnishing text DEFAULT NULL::text,
    p_parking integer DEFAULT NULL::integer,
    p_banks text[] DEFAULT NULL::text[]
  ) RETURNS TABLE(row_data jsonb, total_count bigint) LANGUAGE sql STABLE
SET search_path TO 'public',
  'extensions' AS $function$ WITH params AS (
    SELECT NULLIF(trim(p_search), '') AS q
  ),
  matched AS (
    SELECT p.*,
      CASE
        WHEN params.q IS NULL THEN 0::double precision
        ELSE (
          ts_rank_cd(
            to_tsvector(
              'english',
              concat_ws(
                ' ',
                p.title,
                p.address,
                p.unparsed_address,
                p.city,
                p.barangay,
                p.subdivision_name,
                p.building_name,
                p.developer_name,
                p.property_type,
                p.public_remarks
              )
            ),
            websearch_to_tsquery('english', params.q)
          ) * 2.0 + word_similarity(
            params.q,
            concat_ws(
              ' ',
              p.title,
              p.address,
              p.city,
              p.barangay,
              p.subdivision_name,
              p.building_name,
              p.developer_name
            )
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
          concat_ws(
            ' ',
            p.title,
            p.address,
            p.unparsed_address,
            p.city,
            p.barangay,
            p.subdivision_name,
            p.building_name,
            p.developer_name,
            p.property_type,
            p.public_remarks
          )
        ) @@ websearch_to_tsquery('english', params.q)
        OR concat_ws(
          ' ',
          p.title,
          p.address,
          p.unparsed_address,
          p.city,
          p.barangay,
          p.subdivision_name,
          p.building_name,
          p.developer_name,
          p.property_type
        ) ILIKE '%' || params.q || '%'
        OR word_similarity(
          params.q,
          concat_ws(
            ' ',
            p.title,
            p.address,
            p.city,
            p.barangay,
            p.subdivision_name,
            p.building_name,
            p.developer_name
          )
        ) >= 0.3
      )
      AND (
        NULLIF(trim(p_transaction_type), '') IS NULL
        OR LOWER(trim(p_transaction_type)) = 'all'
        OR (
          LOWER(trim(p_transaction_type)) IN ('pre-selling', 'preselling')
          AND (
            COALESCE(p.property_condition, p.custom_reso_attributes->>'propertyStatus', '') ILIKE '%presell%'
            OR COALESCE(p.property_condition, p.custom_reso_attributes->>'propertyStatus', '') ILIKE '%pre-sell%'
            OR COALESCE(p.property_condition, p.custom_reso_attributes->>'propertyStatus', '') ILIKE '%under construction%'
          )
        )
        OR (
          LOWER(trim(p_transaction_type)) NOT IN ('pre-selling', 'preselling')
          AND LOWER(COALESCE(p.transaction_type, 'For Sale')) ILIKE '%' || LOWER(trim(p_transaction_type)) || '%'
        )
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
            AND concat_ws(
              ' ',
              p.city,
              p.address,
              p.unparsed_address,
              p.barangay,
              p.subdivision_name,
              p.building_name
            ) ILIKE '%' || trim(d.part) || '%'
        )
      )
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (
        NULLIF(trim(p_beds), '') IS NULL
        OR LOWER(trim(p_beds)) = 'any'
        OR (
          LOWER(trim(p_beds)) = 'studio'
          AND COALESCE(p.bedrooms_total, p.beds, 0) <= 1
        )
        OR (
          trim(p_beds) ~ '^[0-9]+\+$'
          AND COALESCE(p.bedrooms_total, p.beds, 0) >= regexp_replace(trim(p_beds), '\+$', '')::integer
        )
        OR (
          trim(p_beds) ~ '^[0-9]+$'
          AND COALESCE(p.bedrooms_total, p.beds, 0) = trim(p_beds)::integer
        )
      )
      AND (
        p_baths IS NULL
        OR COALESCE(p.bathrooms_total_integer, p.baths, 0) >= p_baths
      )
      AND (
        NULLIF(trim(p_furnishing), '') IS NULL
        OR LOWER(trim(p_furnishing)) = 'any'
        OR LOWER(COALESCE(p.furnishing, p.custom_reso_attributes->>'furnishing', '')) = LOWER(trim(p_furnishing))
      )
      AND (
        p_parking IS NULL
        OR COALESCE(p.parking_total, 0) >= p_parking
      )
      AND (
        p_banks IS NULL
        OR cardinality(p_banks) = 0
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(p.custom_reso_attributes->'partneredBanks', '[]'::jsonb)) AS b(elem)
          WHERE LOWER(COALESCE(b.elem->>'bankName', b.elem #>> '{}', '')) = ANY(
            SELECT LOWER(trim(req_bank)) FROM unnest(p_banks) AS req_bank
          )
        )
      )
      AND (
        p_north IS NULL
        OR p_south IS NULL
        OR p_east IS NULL
        OR p_west IS NULL
        OR (
          p.latitude BETWEEN p_south AND p_north
          AND p.longitude BETWEEN p_west AND p_east
        )
      )
  )
SELECT to_jsonb(m.*) - 'search_rank' AS row_data,
  COUNT(*) OVER() AS total_count
FROM matched m
ORDER BY CASE
    WHEN p_sort_by = 'price_asc' THEN m.price
  END ASC NULLS LAST,
  CASE
    WHEN p_sort_by = 'price_desc' THEN m.price
  END DESC NULLS LAST,
  CASE
    WHEN p_sort_by = 'relevance' THEN m.search_rank
  END DESC NULLS LAST,
  m.created_at DESC
LIMIT GREATEST(1, LEAST(250, COALESCE(p_limit, 50))) OFFSET GREATEST(0, COALESCE(p_offset, 0));
$function$;

GRANT EXECUTE ON FUNCTION public.search_public_properties_v2(
  text, text, text, text, numeric, numeric, text, integer,
  double precision, double precision, double precision, double precision,
  text, integer, integer, text, integer, text[]
) TO anon, authenticated, service_role;
