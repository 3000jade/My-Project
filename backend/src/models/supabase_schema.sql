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
-- 2. PROPERTIES TABLE (Matches shared/types/property.ts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  price NUMERIC(15, 2) NOT NULL,
  formatted_price TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  beds INTEGER NOT NULL DEFAULT 1,
  baths INTEGER NOT NULL DEFAULT 1,
  sqft NUMERIC(10, 2) NOT NULL,
  property_type TEXT NOT NULL,
  year_built INTEGER,
  architectural_style TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties Policies
DROP POLICY IF EXISTS "Properties are publicly viewable by anyone." ON public.properties;
CREATE POLICY "Properties are publicly viewable by anyone."
  ON public.properties FOR SELECT
  USING (true);

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



