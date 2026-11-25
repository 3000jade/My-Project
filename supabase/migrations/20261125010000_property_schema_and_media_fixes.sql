-- Property Schema & Media Alignment Fixes
-- Safe, non-breaking migration: drops broken legacy trigger, promotes 5 searchable
-- columns onto public.properties, adds gallery_category & RLS on property_images,
-- repairs apply_property_edit_request(), and refreshes full-text search.
-- 1. Remove broken trigger & function that referenced deleted properties.images column
DROP TRIGGER IF EXISTS trg_sync_property_media ON public.property_media;
DROP FUNCTION IF EXISTS public.sync_property_media_to_images();
-- 2. Add 5 promoted searchable columns to public.properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_category text DEFAULT 'Residential',
  ADD COLUMN IF NOT EXISTS furnishing text,
  ADD COLUMN IF NOT EXISTS association_fee numeric(12, 2),
  ADD COLUMN IF NOT EXISTS map_pin_privacy text DEFAULT 'Exact Location',
  ADD COLUMN IF NOT EXISTS developer_name text;
-- Backfill promoted columns from custom_reso_attributes where present
UPDATE public.properties
SET property_category = COALESCE(
    NULLIF(
      trim(custom_reso_attributes->>'propertyCategory'),
      ''
    ),
    NULLIF(trim(property_category), ''),
    'Residential'
  ),
  furnishing = COALESCE(
    furnishing,
    NULLIF(trim(custom_reso_attributes->>'furnishing'), '')
  ),
  association_fee = COALESCE(
    association_fee,
    CASE
      WHEN NULLIF(
        trim(
          COALESCE(
            custom_reso_attributes->>'associationFee',
            custom_reso_attributes->'pricing'->>'associationFee'
          )
        ),
        ''
      ) ~ '^[0-9]+(\.[0-9]+)?$' THEN NULLIF(
        trim(
          COALESCE(
            custom_reso_attributes->>'associationFee',
            custom_reso_attributes->'pricing'->>'associationFee'
          )
        ),
        ''
      )::numeric(12, 2)
      ELSE NULL
    END
  ),
  map_pin_privacy = COALESCE(
    NULLIF(
      trim(custom_reso_attributes->>'mapPinPrivacy'),
      ''
    ),
    NULLIF(trim(map_pin_privacy), ''),
    'Exact Location'
  ),
  developer_name = COALESCE(
    developer_name,
    NULLIF(
      trim(
        custom_reso_attributes->'credentials'->>'developer'
      ),
      ''
    )
  );
-- Targeted B-tree indexes for promoted filterable columns
CREATE INDEX IF NOT EXISTS idx_properties_category_furnishing ON public.properties (property_category, furnishing);
CREATE INDEX IF NOT EXISTS idx_properties_developer_name ON public.properties (developer_name)
WHERE developer_name IS NOT NULL;
-- 3. Fix public.property_media & public.property_images
ALTER TABLE public.property_media
ADD COLUMN IF NOT EXISTS gallery_category text;
ALTER TABLE public.property_media
ALTER COLUMN media_key
SET DEFAULT ('media-' || gen_random_uuid()::text);
-- Missing RLS policies on public.property_images (table already has RLS enabled)
DROP POLICY IF EXISTS "Property images are viewable by everyone." ON public.property_images;
CREATE POLICY "Property images are viewable by everyone." ON public.property_images FOR
SELECT TO public USING (true);
DROP POLICY IF EXISTS "Agents, brokers, and admins can manage property images." ON public.property_images;
CREATE POLICY "Agents, brokers, and admins can manage property images." ON public.property_images FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (
        SELECT auth.uid()
      )
      AND profiles.role = ANY (
        ARRAY ['agent'::text, 'broker'::text, 'admin'::text]
      )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (
        SELECT auth.uid()
      )
      AND profiles.role = ANY (
        ARRAY ['agent'::text, 'broker'::text, 'admin'::text]
      )
  )
);
-- 4. Repair public.apply_property_edit_request() (remove deleted features columns, support promoted fields)
CREATE OR REPLACE FUNCTION public.apply_property_edit_request(
    p_request_id uuid,
    p_broker_id uuid,
    p_review_notes text DEFAULT NULL::text
  ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public',
  'pg_temp' AS $function$
DECLARE v_broker_role TEXT;
v_req RECORD;
v_prop RECORD;
v_previous JSONB;
v_new JSONB;
v_changed_keys TEXT [] := '{}';
v_key TEXT;
v_val JSONB;
v_merged_custom JSONB;
BEGIN -- 1. Verify caller role is broker or administrator
SELECT role INTO v_broker_role
FROM public.profiles
WHERE id = p_broker_id;
IF v_broker_role NOT IN ('broker', 'admin') THEN RAISE EXCEPTION 'Access Denied: Only brokers and administrators can approve edit requests.';
END IF;
-- 2. Lock and retrieve edit request row
SELECT * INTO v_req
FROM public.property_edit_requests
WHERE id = p_request_id FOR
UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Edit request % not found.',
p_request_id;
END IF;
IF v_req.request_status <> 'PENDING' THEN RAISE EXCEPTION 'Cannot approve request: status is already %.',
v_req.request_status;
END IF;
-- 3. Lock target property row
SELECT * INTO v_prop
FROM public.properties
WHERE id = v_req.property_id FOR
UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Target property % does not exist.',
v_req.property_id;
END IF;
v_previous := to_jsonb(v_prop);
-- Merge custom_reso_attributes and any feature arrays stored inside custom_reso_attributes
v_merged_custom := COALESCE(v_prop.custom_reso_attributes, '{}'::jsonb);
IF v_req.proposed_changes ? 'custom_reso_attributes'
AND jsonb_typeof(v_req.proposed_changes->'custom_reso_attributes') = 'object' THEN v_merged_custom := v_merged_custom || (v_req.proposed_changes->'custom_reso_attributes');
END IF;
IF v_req.proposed_changes ? 'features' THEN v_merged_custom := jsonb_set(
  v_merged_custom,
  '{features}',
  v_req.proposed_changes->'features',
  true
);
END IF;
IF v_req.proposed_changes ? 'interior_features' THEN v_merged_custom := jsonb_set(
  v_merged_custom,
  '{interiorFeatures}',
  v_req.proposed_changes->'interior_features',
  true
);
END IF;
IF v_req.proposed_changes ? 'exterior_features' THEN v_merged_custom := jsonb_set(
  v_merged_custom,
  '{exteriorFeatures}',
  v_req.proposed_changes->'exterior_features',
  true
);
END IF;
-- 4. Apply whitelisted business fields only
UPDATE public.properties
SET title = COALESCE((v_req.proposed_changes->>'title'), title),
  tagline = COALESCE((v_req.proposed_changes->>'tagline'), tagline),
  price = COALESCE(
    (v_req.proposed_changes->>'price')::NUMERIC(15, 2),
    price
  ),
  formatted_price = COALESCE(
    (v_req.proposed_changes->>'formatted_price'),
    formatted_price
  ),
  property_type = COALESCE(
    (v_req.proposed_changes->>'property_type'),
    property_type
  ),
  property_sub_type = COALESCE(
    (v_req.proposed_changes->>'property_sub_type'),
    property_sub_type
  ),
  property_condition = COALESCE(
    (v_req.proposed_changes->>'property_condition'),
    property_condition
  ),
  transaction_type = COALESCE(
    (v_req.proposed_changes->>'transaction_type'),
    transaction_type
  ),
  property_category = COALESCE(
    (v_req.proposed_changes->>'property_category'),
    property_category
  ),
  furnishing = COALESCE(
    (v_req.proposed_changes->>'furnishing'),
    furnishing
  ),
  association_fee = COALESCE(
    (v_req.proposed_changes->>'association_fee')::NUMERIC(12, 2),
    association_fee
  ),
  map_pin_privacy = COALESCE(
    (v_req.proposed_changes->>'map_pin_privacy'),
    map_pin_privacy
  ),
  developer_name = COALESCE(
    (v_req.proposed_changes->>'developer_name'),
    developer_name
  ),
  address = COALESCE((v_req.proposed_changes->>'address'), address),
  unparsed_address = COALESCE(
    (v_req.proposed_changes->>'unparsed_address'),
    unparsed_address
  ),
  subdivision_name = COALESCE(
    (v_req.proposed_changes->>'subdivision_name'),
    subdivision_name
  ),
  building_name = COALESCE(
    (v_req.proposed_changes->>'building_name'),
    building_name
  ),
  region = COALESCE((v_req.proposed_changes->>'region'), region),
  barangay = COALESCE((v_req.proposed_changes->>'barangay'), barangay),
  city = COALESCE((v_req.proposed_changes->>'city'), city),
  state_or_province = COALESCE(
    (v_req.proposed_changes->>'state_or_province'),
    state_or_province
  ),
  postal_code = COALESCE(
    (v_req.proposed_changes->>'postal_code'),
    postal_code
  ),
  latitude = COALESCE(
    (v_req.proposed_changes->>'latitude')::DOUBLE PRECISION,
    latitude
  ),
  longitude = COALESCE(
    (v_req.proposed_changes->>'longitude')::DOUBLE PRECISION,
    longitude
  ),
  beds = COALESCE((v_req.proposed_changes->>'beds')::INTEGER, beds),
  baths = COALESCE(
    (v_req.proposed_changes->>'baths')::INTEGER,
    baths
  ),
  bedrooms_total = COALESCE(
    (v_req.proposed_changes->>'bedrooms_total')::SMALLINT,
    bedrooms_total
  ),
  bathrooms_total_integer = COALESCE(
    (
      v_req.proposed_changes->>'bathrooms_total_integer'
    )::SMALLINT,
    bathrooms_total_integer
  ),
  sqft = COALESCE(
    (v_req.proposed_changes->>'sqft')::NUMERIC(10, 2),
    sqft
  ),
  living_area = COALESCE(
    (v_req.proposed_changes->>'living_area')::NUMERIC(10, 2),
    living_area
  ),
  living_area_units = COALESCE(
    (v_req.proposed_changes->>'living_area_units'),
    living_area_units
  ),
  lot_size_area = COALESCE(
    (v_req.proposed_changes->>'lot_size_area')::NUMERIC(12, 2),
    lot_size_area
  ),
  lot_size_units = COALESCE(
    (v_req.proposed_changes->>'lot_size_units'),
    lot_size_units
  ),
  year_built = COALESCE(
    (v_req.proposed_changes->>'year_built')::INTEGER,
    year_built
  ),
  parking_total = COALESCE(
    (v_req.proposed_changes->>'parking_total')::SMALLINT,
    parking_total
  ),
  architectural_style = COALESCE(
    (v_req.proposed_changes->>'architectural_style'),
    architectural_style
  ),
  public_remarks = COALESCE(
    (v_req.proposed_changes->>'public_remarks'),
    public_remarks
  ),
  standard_status = COALESCE(
    (v_req.proposed_changes->>'standard_status'),
    standard_status
  ),
  status = CASE
    WHEN (v_req.proposed_changes->>'standard_status') = 'Active' THEN 'available'
    WHEN (v_req.proposed_changes->>'standard_status') = 'Closed' THEN 'sold'
    WHEN (v_req.proposed_changes->>'standard_status') IN ('Pending', 'Active Under Contract') THEN 'pending'
    ELSE status
  END,
  custom_reso_attributes = v_merged_custom,
  updated_at = timezone('utc'::text, now())
WHERE id = v_req.property_id
RETURNING to_jsonb(public.properties.*) INTO v_new;
-- 5. Transition edit request status to APPROVED
UPDATE public.property_edit_requests
SET request_status = 'APPROVED',
  reviewed_by = p_broker_id,
  reviewed_at = timezone('utc'::text, now()),
  review_notes = p_review_notes,
  updated_at = timezone('utc'::text, now())
WHERE id = p_request_id;
-- 6. Collect modified field keys
FOR v_key,
v_val IN
SELECT *
FROM jsonb_each(v_req.proposed_changes) LOOP v_changed_keys := array_append(v_changed_keys, v_key);
END LOOP;
-- 7. Record change audit log entry
INSERT INTO public.property_audit_log (
    property_id,
    request_id,
    actor_id,
    action_type,
    changed_fields,
    previous_data,
    new_data,
    audit_notes
  )
VALUES (
    v_req.property_id,
    p_request_id,
    p_broker_id,
    'EDIT_APPROVED',
    v_changed_keys,
    v_previous,
    v_new,
    COALESCE(p_review_notes, v_req.agent_notes)
  );
-- 8. Dispatch notification to proposing agent
INSERT INTO public.notifications (
    id,
    title,
    message,
    type,
    related_record,
    role,
    user_id
  )
VALUES (
    'notif-' || gen_random_uuid()::text,
    'Listing Edit Approved',
    'Your proposed modifications to the property listing have been approved and published to live.',
    'property',
    v_req.property_id::text,
    'agent',
    v_req.agent_id
  );
RETURN jsonb_build_object(
  'success',
  true,
  'request_id',
  p_request_id,
  'property_id',
  v_req.property_id,
  'status',
  'APPROVED',
  'applied_at',
  now()
);
END;
$function$;
-- 5. Rebuild idx_properties_fts and update search_public_properties_v2 to cover developer_name
DROP INDEX IF EXISTS public.idx_properties_fts;
CREATE INDEX idx_properties_fts ON public.properties USING gin (
  to_tsvector(
    'english'::regconfig,
    COALESCE(title, '') || ' ' || COALESCE(address, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(barangay, '') || ' ' || COALESCE(building_name, '') || ' ' || COALESCE(developer_name, '') || ' ' || COALESCE(public_remarks, '')
  )
);
-- Drop unused legacy search_public_properties overloads (only search_public_properties_v2 is called)
DROP FUNCTION IF EXISTS public.search_public_properties(
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  integer,
  double precision,
  double precision,
  double precision,
  double precision,
  text,
  integer,
  integer
);
DROP FUNCTION IF EXISTS public.search_public_properties(
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  integer,
  text,
  text,
  text [],
  text [],
  double precision,
  double precision,
  double precision,
  double precision,
  text,
  integer,
  integer
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
    p_offset integer DEFAULT 0
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
      AND (
        p_min_price IS NULL
        OR p.price >= p_min_price
      )
      AND (
        p_max_price IS NULL
        OR p.price <= p_max_price
      )
      AND (
        NULLIF(trim(p_beds), '') IS NULL
        OR LOWER(trim(p_beds)) = 'any'
        OR (
          LOWER(trim(p_beds)) = 'studio'
          AND COALESCE(p.bedrooms_total, p.beds, 0) <= 1
        )
        OR (
          trim(p_beds) IN ('4+', '5+')
          AND COALESCE(p.bedrooms_total, p.beds, 0) >= 4
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