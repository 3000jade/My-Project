-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- RESO Data Dictionary 2.0 In-Place Schema Migration Script
-- Classification: Production PostgreSQL DDL with PostGIS & RLS
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension could not be enabled; spatial queries will fall back to lat/long columns.';
END $$;

-- ==============================================================================
-- 2. ENHANCE CORE PROPERTIES TABLE NON-DESTRUCTIVELY
-- ==============================================================================
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_key VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS listing_id VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS standard_status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS property_sub_type VARCHAR(64),
  ADD COLUMN IF NOT EXISTS list_price_currency VARCHAR(3) DEFAULT 'PHP',
  ADD COLUMN IF NOT EXISTS original_list_price NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS association_fee NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS association_fee_frequency VARCHAR(20) DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS tax_annual_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS living_area NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS living_area_units VARCHAR(20) DEFAULT 'Square Meters',
  ADD COLUMN IF NOT EXISTS lot_size_area NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS lot_size_units VARCHAR(20) DEFAULT 'Square Meters',
  ADD COLUMN IF NOT EXISTS bedrooms_total SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms_total_integer SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms_full SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms_half SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stories_total SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS interior_features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exterior_features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parking_total SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unparsed_address TEXT,
  ADD COLUMN IF NOT EXISTS subdivision_name VARCHAR(128),
  ADD COLUMN IF NOT EXISTS state_or_province VARCHAR(64),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS public_remarks TEXT,
  ADD COLUMN IF NOT EXISTS custom_reso_attributes JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS list_agent_key UUID REFERENCES public.profiles(id);

-- Check Constraints for RESO Standard Statuses and Currencies
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS chk_properties_standard_status;
ALTER TABLE public.properties ADD CONSTRAINT chk_properties_standard_status 
  CHECK (standard_status IN ('Draft', 'Pending Approval', 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Canceled', 'Expired'));

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS chk_properties_currency;
ALTER TABLE public.properties ADD CONSTRAINT chk_properties_currency 
  CHECK (list_price_currency IN ('PHP', 'USD', 'EUR', 'GBP', 'SGD', 'JPY'));

-- Add PostGIS Spatial Geometry Column if PostGIS is installed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    ALTER TABLE public.properties
      ADD COLUMN IF NOT EXISTS coordinates_geom GEOGRAPHY(Point, 4326)
      GENERATED ALWAYS AS (
        CASE 
          WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
          THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography 
          ELSE NULL 
        END
      ) STORED;

    CREATE INDEX IF NOT EXISTS idx_properties_coordinates_geom 
      ON public.properties USING GIST (coordinates_geom);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping coordinates_geom generated column due to extension constraints.';
END $$;

-- Backfill legacy records to populate standard RESO columns
UPDATE public.properties
SET 
  listing_key = COALESCE(listing_key, 'KEY-' || id::text),
  listing_id = COALESCE(listing_id, 'MLS-' || upper(substr(md5(id::text), 1, 8))),
  standard_status = CASE 
    WHEN status = 'available' THEN 'Active'
    WHEN status = 'pending' THEN 'Pending'
    WHEN status = 'sold' THEN 'Closed'
    ELSE 'Active'
  END,
  living_area = COALESCE(living_area, sqft),
  bedrooms_total = COALESCE(bedrooms_total, beds, 1),
  bathrooms_total_integer = COALESCE(bathrooms_total_integer, baths, 1),
  unparsed_address = COALESCE(unparsed_address, address),
  state_or_province = COALESCE(state_or_province, state, 'Metro Manila'),
  postal_code = COALESCE(postal_code, '1000')
WHERE listing_key IS NULL OR unparsed_address IS NULL;

-- ==============================================================================
-- 3. CONFIDENTIAL / BROKER-ONLY DATA ISOLATION (Strict RLS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.property_confidential (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  private_remarks TEXT,
  showing_instructions TEXT,
  lockbox_type VARCHAR(64),
  lockbox_location TEXT,
  lockbox_code TEXT,
  buyer_agency_compensation VARCHAR(64),
  seller_direct_phone VARCHAR(32),
  seller_direct_email VARCHAR(128),
  expiration_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.property_confidential ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all public access to confidential property data" ON public.property_confidential;
CREATE POLICY "Deny all public access to confidential property data"
  ON public.property_confidential FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );

DROP POLICY IF EXISTS "Agents, brokers, and admins can manage confidential property data" ON public.property_confidential;
CREATE POLICY "Agents, brokers, and admins can manage confidential property data"
  ON public.property_confidential FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );

-- ==============================================================================
-- 4. ORDERED PROPERTY MEDIA ASSETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.property_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  media_key VARCHAR(64) UNIQUE NOT NULL DEFAULT ('MED-' || gen_random_uuid()),
  media_url TEXT NOT NULL,
  media_category VARCHAR(32) NOT NULL DEFAULT 'Photo' 
    CHECK (media_category IN ('Photo', 'FloorPlan', 'Video', 'VirtualTour', 'Document')),
  order_index INTEGER NOT NULL DEFAULT 0,
  short_description VARCHAR(255),
  mime_type VARCHAR(64) DEFAULT 'image/jpeg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_property_media_lookup 
  ON public.property_media(property_id, order_index ASC);

ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Media is viewable by everyone." ON public.property_media;
CREATE POLICY "Media is viewable by everyone."
  ON public.property_media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Agents, brokers, and admins can manage media." ON public.property_media;
CREATE POLICY "Agents, brokers, and admins can manage media."
  ON public.property_media FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );

-- Backfill property_media from existing properties.images arrays
INSERT INTO public.property_media (property_id, media_key, media_url, media_category, order_index)
SELECT 
  p.id,
  ('MED-' || p.id || '-' || (img.ord - 1)) as media_key,
  img.url as media_url,
  'Photo' as media_category,
  (img.ord - 1) as order_index
FROM public.properties p
CROSS JOIN LATERAL unnest(p.images) WITH ORDINALITY AS img(url, ord)
ON CONFLICT (media_key) DO NOTHING;

-- Trigger to keep properties.images array in sync when property_media changes
CREATE OR REPLACE FUNCTION public.sync_property_media_to_images()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.property_id, OLD.property_id);
  UPDATE public.properties
  SET images = ARRAY(
    SELECT media_url 
    FROM public.property_media 
    WHERE property_id = target_id
      AND media_category = 'Photo'
    ORDER BY order_index ASC
  )
  WHERE id = target_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_property_media ON public.property_media;
CREATE TRIGGER trg_sync_property_media
  AFTER INSERT OR UPDATE OR DELETE ON public.property_media
  FOR EACH ROW EXECUTE FUNCTION public.sync_property_media_to_images();

-- ==============================================================================
-- 5. STANDARD RESIDENTIAL ROOM LEDGER TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.property_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type VARCHAR(64) NOT NULL 
    CHECK (room_type IN ('Primary Bedroom', 'Bedroom', 'Bathroom', 'Living Room', 'Dining Room', 'Kitchen', 'Home Office', 'Balcony', 'Laundry')),
  room_level VARCHAR(32) DEFAULT 'Main'
    CHECK (room_level IN ('Main', 'Second', 'Third', 'Basement', 'Penthouse', 'Upper', 'Lower')),
  room_length NUMERIC(6, 2),
  room_width NUMERIC(6, 2),
  room_dimensions_units VARCHAR(16) DEFAULT 'Meters'
    CHECK (room_dimensions_units IN ('Meters', 'Feet')),
  room_features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_property_rooms_property_id 
  ON public.property_rooms(property_id);

ALTER TABLE public.property_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rooms are viewable by everyone." ON public.property_rooms;
CREATE POLICY "Rooms are viewable by everyone."
  ON public.property_rooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Agents, brokers, and admins can manage rooms." ON public.property_rooms;
CREATE POLICY "Agents, brokers, and admins can manage rooms."
  ON public.property_rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );

-- ==============================================================================
-- 6. BROKER APPROVAL & STATUS LIFECYCLE ENFORCEMENT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_property_status_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Determine role of acting user
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

  -- If transitioning to 'Active' from any other status, require broker or admin role
  IF NEW.standard_status = 'Active' AND (OLD.standard_status IS DISTINCT FROM 'Active') THEN
    IF user_role IS NOT NULL AND user_role NOT IN ('broker', 'admin') THEN
      RAISE EXCEPTION 'Only brokers and administrators can approve and activate property listings.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_property_status ON public.properties;
CREATE TRIGGER trg_enforce_property_status
  BEFORE UPDATE OF standard_status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_status_lifecycle();

-- ==============================================================================
-- 7. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_properties_client_search 
  ON public.properties(standard_status, city, price, property_type);

CREATE INDEX IF NOT EXISTS idx_properties_fts ON public.properties USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(unparsed_address, '') || ' ' || 
    COALESCE(city, '') || ' ' || 
    COALESCE(subdivision_name, '') || ' ' || 
    COALESCE(public_remarks, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_properties_custom_reso 
  ON public.properties USING GIN (custom_reso_attributes);
