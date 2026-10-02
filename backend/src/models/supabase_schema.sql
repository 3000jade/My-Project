-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform - Complete Master Schema
-- Classification: Production PostgreSQL DDL with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (Mirrors and extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'broker', 'agent', 'client')),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all profile columns exist non-destructively
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'agent',
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Automatic profile creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 2. PROPERTIES TABLE (RESO Data Dictionary 2.0 Enhanced)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_key VARCHAR(64) UNIQUE NOT NULL DEFAULT ('KEY-' || gen_random_uuid()),
  listing_id VARCHAR(32) UNIQUE NOT NULL DEFAULT ('MLS-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  title TEXT NOT NULL,
  tagline TEXT,
  standard_status VARCHAR(32) NOT NULL DEFAULT 'Draft' 
    CHECK (standard_status IN ('Draft', 'Pending Approval', 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Canceled', 'Expired')),
  property_type TEXT NOT NULL,
  transaction_type VARCHAR(32) DEFAULT 'For Sale' CHECK (transaction_type IN ('For Sale', 'For Rent')),
  property_condition VARCHAR(32),
  property_sub_type VARCHAR(64) DEFAULT 'Residential Condominium',
  price NUMERIC(15, 2) NOT NULL,
  formatted_price TEXT,
  list_price_currency VARCHAR(3) DEFAULT 'PHP' CHECK (list_price_currency IN ('PHP', 'USD', 'EUR', 'GBP', 'SGD', 'JPY')),
  original_list_price NUMERIC(15, 2),
  association_fee NUMERIC(12, 2) DEFAULT 0.00,
  association_fee_frequency VARCHAR(20) DEFAULT 'Monthly',
  tax_annual_amount NUMERIC(12, 2),
  address TEXT NOT NULL,
  unparsed_address TEXT,
  subdivision_name VARCHAR(128),
  city TEXT NOT NULL,
  state TEXT,
  state_or_province VARCHAR(64),
  postal_code VARCHAR(20) DEFAULT '1000',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  beds INTEGER NOT NULL DEFAULT 1,
  baths INTEGER NOT NULL DEFAULT 1,
  bedrooms_total SMALLINT DEFAULT 1,
  bathrooms_total_integer SMALLINT DEFAULT 1,
  bathrooms_full SMALLINT DEFAULT 1,
  bathrooms_half SMALLINT DEFAULT 0,
  stories_total SMALLINT DEFAULT 1,
  sqft NUMERIC(10, 2) NOT NULL,
  living_area NUMERIC(10, 2),
  living_area_units VARCHAR(20) DEFAULT 'Square Meters',
  lot_size_area NUMERIC(12, 2),
  lot_size_units VARCHAR(20) DEFAULT 'Square Meters',
  year_built INTEGER,
  architectural_style TEXT,
  features TEXT[] DEFAULT '{}',
  interior_features TEXT[] DEFAULT '{}',
  exterior_features TEXT[] DEFAULT '{}',
  parking_total SMALLINT DEFAULT 0,
  parking_covered SMALLINT DEFAULT 0,
  parking_open SMALLINT DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  public_remarks TEXT,
  custom_reso_attributes JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
  is_featured BOOLEAN DEFAULT FALSE,
  list_agent_key UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all RESO 2.0 columns exist non-destructively if the table already existed
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_key VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS listing_id VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS standard_status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(32) DEFAULT 'For Sale',
  ADD COLUMN IF NOT EXISTS property_condition VARCHAR(32),
  ADD COLUMN IF NOT EXISTS property_sub_type VARCHAR(64) DEFAULT 'Residential Condominium',
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
  ADD COLUMN IF NOT EXISTS parking_covered SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parking_open SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unparsed_address TEXT,
  ADD COLUMN IF NOT EXISTS subdivision_name VARCHAR(128),
  ADD COLUMN IF NOT EXISTS state_or_province VARCHAR(64),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) DEFAULT '1000',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS public_remarks TEXT,
  ADD COLUMN IF NOT EXISTS custom_reso_attributes JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS list_agent_key UUID REFERENCES public.profiles(id);

-- Backfill legacy records if standard_status or listing_key is null or unpopulated
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
  state_or_province = COALESCE(state_or_province, state, 'Metro Manila')
WHERE listing_key IS NULL OR standard_status IS NULL OR standard_status = 'Draft';

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;


-- Properties Policies
DROP POLICY IF EXISTS "Properties are publicly viewable by anyone." ON public.properties;
CREATE POLICY "Properties are publicly viewable by anyone."
  ON public.properties FOR SELECT
  USING (
    standard_status = 'Active' OR 
    (auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR 
      list_agent_key = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    ))
  );

DROP POLICY IF EXISTS "Authenticated users can insert new properties." ON public.properties;
CREATE POLICY "Authenticated users can insert new properties."
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Property creators or admins can update properties." ON public.properties;
CREATE POLICY "Property creators or admins can update properties."
  ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker')
  ));

DROP POLICY IF EXISTS "Property creators or admins can delete properties." ON public.properties;
CREATE POLICY "Property creators or admins can delete properties."
  ON public.properties FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker')
  ));

-- ==============================================================================
-- 2A. PROPERTY CONFIDENTIAL (RESO PrivateRemarks & Broker Security Isolation)
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
-- 2B. PROPERTY MEDIA TABLE (RESO Media Resource)
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

-- Trigger to synchronize property_media with properties.images
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
-- 2C. PROPERTY ROOMS TABLE (Standard Residential Ledger)
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
-- 2D. BROKER APPROVAL STATUS LIFECYCLE ENFORCEMENT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_property_status_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
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
-- 3. INQUIRIES TABLE (Lead Capture & Private Tours)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  preferred_date DATE,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'tour', 'offer')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Inquiries Policies
DROP POLICY IF EXISTS "Anyone can submit an inquiry." ON public.inquiries;
CREATE POLICY "Anyone can submit an inquiry."
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Agents, brokers, and admins can view inquiries." ON public.inquiries;
CREATE POLICY "Agents, brokers, and admins can view inquiries."
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
  ));

DROP POLICY IF EXISTS "Agents, brokers, and admins can update inquiries." ON public.inquiries;
CREATE POLICY "Agents, brokers, and admins can update inquiries."
  ON public.inquiries FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
  ));


-- ==============================================================================
-- 4. APPOINTMENTS TABLE (Private Showings & Calendar)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  appointment_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments Policies
DROP POLICY IF EXISTS "Authenticated users can view assigned appointments." ON public.appointments;
CREATE POLICY "Authenticated users can view assigned appointments."
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  );

DROP POLICY IF EXISTS "Anyone can request an appointment." ON public.appointments;
CREATE POLICY "Anyone can request an appointment."
  ON public.appointments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Agents, brokers, and admins can update appointments." ON public.appointments;
CREATE POLICY "Agents, brokers, and admins can update appointments."
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  );


-- ==============================================================================
-- 5. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_client_search ON public.properties(standard_status, city, price, property_type);
CREATE INDEX IF NOT EXISTS idx_properties_fts ON public.properties USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(unparsed_address, '') || ' ' || 
    COALESCE(city, '') || ' ' || 
    COALESCE(subdivision_name, '') || ' ' || 
    COALESCE(public_remarks, '')
  )
);
CREATE INDEX IF NOT EXISTS idx_properties_custom_reso ON public.properties USING GIN (custom_reso_attributes);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON public.inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON public.appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON public.appointments(appointment_time);


-- ==============================================================================
-- 6. ARCHITECTURAL PROPERTIES SEED DATA
-- ==============================================================================
INSERT INTO public.properties (
  id, title, tagline, price, formatted_price, address, city, state, latitude, longitude,
  beds, baths, sqft, property_type, year_built, architectural_style, features, images, status
) VALUES 
(
  'b1a2c3d4-0001-4000-8000-000000000001',
  'Ayala Alabang Estate',
  'Refined Brutalist Modernism & Open Living',
  185000000.00,
  '₱185,000,000',
  '123 Narra Street, Ayala Alabang',
  'Muntinlupa',
  'Metro Manila',
  14.426,
  121.031,
  5, 6, 850.00,
  'Estate',
  2024,
  'Brutalist Modernism',
  ARRAY['Private Cinema', 'Wine Cellar', 'Infinity Pool', 'Smart Home System', 'Rooftop Terrace', 'Spa Retreat'],
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'b1a2c3d4-0002-4000-8000-000000000002',
  'Forbes Park Contemporary Villa',
  'Timeless Architectural Heritage & Sculptural Courtyards',
  340000000.00,
  '₱340,000,000',
  '88 Cambridge Circle, Forbes Park',
  'Makati',
  'Metro Manila',
  14.549,
  121.038,
  6, 7, 1200.00,
  'Villa',
  2025,
  'Brutalist Minimalist',
  ARRAY['Lap Pool', 'Sculpture Garden', 'Helipad Access', 'Catering Kitchen', 'Subterranean Vault'],
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'b1a2c3d4-0003-4000-8000-000000000003',
  'Dasmarinas Village Sanctuary',
  'Organic Luxury & Meditative Zen Courtyards',
  295000000.00,
  '₱295,000,000',
  '42 Palm Avenue, Dasmarinas Village',
  'Makati',
  'Metro Manila',
  14.542,
  121.029,
  4, 5, 750.00,
  'Single Family',
  2023,
  'Japanese Contemporary',
  ARRAY['Internal Courtyard', 'Zen Koi Pond', 'Solar Microgrid', 'Sommelier Wine Vault'],
  ARRAY[
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'b1a2c3d4-0004-4000-8000-000000000004',
  'The Proscenium Penthouse',
  'Panoramic Skyward Living with Double-Height Glazing',
  85500000.00,
  '₱85,500,000',
  'Penthouse Level, The Proscenium, Rockwell Center',
  'Makati',
  'Metro Manila',
  14.565,
  121.037,
  3, 4, 280.00,
  'Penthouse',
  2024,
  'Modern High-Rise',
  ARRAY['Floor-to-Ceiling Glazing', 'Imported Travertine', 'Private Elevator', 'Wrap-around Balcony'],
  ARRAY[
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'b1a2c3d4-0005-4000-8000-000000000005',
  'Horizon Terraces Ridge Villa',
  'Volcanic Caldera Panoramas & Mountain Air',
  45000000.00,
  '₱45,000,000',
  'Calamba Road, Tagaytay Highlands',
  'Tagaytay',
  'Cavite',
  14.135,
  120.975,
  4, 4, 350.00,
  'Villa',
  2023,
  'Tropical Modernist',
  ARRAY['Caldera Views', 'Heated Plunge Pool', 'Fireplace Salon', 'Organic Herb Garden'],
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
),
(
  'b1a2c3d4-0006-4000-8000-000000000006',
  'Bonifacio Ridge Sky Residence',
  'Nordic Functionalism Overlooking Manila Golf Club',
  68000000.00,
  '₱68,000,000',
  '1st Avenue corner 30th Street, Bonifacio Global City',
  'Taguig',
  'Metro Manila',
  14.551,
  121.045,
  3, 3, 210.00,
  'Condominium',
  2025,
  'Nordic Minimalist',
  ARRAY['Golf Course Views', 'Acoustic Wall Paneling', 'Smart Climate Automation', 'Dual Parking'],
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'
  ],
  'available'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inquiry', 'verification', 'appointment', 'sale', 'property')),
  related_record TEXT,
  timestamp TEXT DEFAULT 'Recent',
  is_read BOOLEAN NOT NULL DEFAULT false,
  role TEXT DEFAULT 'broker',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications are viewable by authenticated users." ON public.notifications;
CREATE POLICY "Notifications are viewable by authenticated users."
  ON public.notifications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Notifications can be updated by authenticated users." ON public.notifications;
CREATE POLICY "Notifications can be updated by authenticated users."
  ON public.notifications FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Notifications can be inserted." ON public.notifications;
CREATE POLICY "Notifications can be inserted."
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- 7. SALES CONVEYANCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  property_title TEXT NOT NULL,
  property_location TEXT NOT NULL,
  client_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  sale_date TEXT NOT NULL,
  property_value NUMERIC(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales are viewable by authenticated users." ON public.sales;
CREATE POLICY "Sales are viewable by authenticated users."
  ON public.sales FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sales can be inserted by authenticated users." ON public.sales;
CREATE POLICY "Sales can be inserted by authenticated users."
  ON public.sales FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sales can be updated by authenticated users." ON public.sales;
CREATE POLICY "Sales can be updated by authenticated users."
  ON public.sales FOR UPDATE
  USING (true);



