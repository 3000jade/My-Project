-- ==============================================================================
-- CP_kerby: Optimal Subdivision Database Schema & Property Linkage
-- Standard: PostgreSQL 15+ / Supabase Data API Grants & Row-Level Security
-- ==============================================================================

-- 1. Master Subdivision Projects Table
CREATE TABLE IF NOT EXISTS public.subdivision_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  developer_name VARCHAR(255),
  location_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  province_state VARCHAR(100),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Planning', 'Active', 'SoldOut', 'Archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Child Cadastral Lots & Geodesic Boundaries
CREATE TABLE IF NOT EXISTS public.subdivision_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.subdivision_projects(id) ON DELETE CASCADE,
  block_number VARCHAR(50) NOT NULL DEFAULT '1',
  lot_number VARCHAR(50) NOT NULL,
  boundary_type VARCHAR(50) NOT NULL DEFAULT 'SaleableLot' CHECK (boundary_type IN ('SaleableLot', 'Road', 'Park', 'Facility', 'Waterway', 'Other')),
  availability_status VARCHAR(30) NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Reserved', 'Sold', 'Unavailable')),
  verified_area_sqm NUMERIC(10,2) NOT NULL,
  price NUMERIC(15,2),
  description TEXT,
  boundary JSONB, -- GeoJSON Polygon coordinates in WGS84 EPSG:4326
  centroid JSONB, -- { "lat": 14.xxx, "lng": 121.xxx }
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_subdivision_project_block_lot UNIQUE (project_id, block_number, lot_number)
);

-- 3. Link Properties Table with Foreign Keys
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS subdivision_project_id UUID REFERENCES public.subdivision_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subdivision_lot_id UUID REFERENCES public.subdivision_lots(id) ON DELETE SET NULL;

-- 4. High-Performance Foreign Key & Filtering Indexes (Supabase Best Practice)
CREATE INDEX IF NOT EXISTS idx_subdivision_projects_city ON public.subdivision_projects(city);
CREATE INDEX IF NOT EXISTS idx_subdivision_projects_status ON public.subdivision_projects(status);
CREATE INDEX IF NOT EXISTS idx_subdivision_lots_project_id ON public.subdivision_lots(project_id);
CREATE INDEX IF NOT EXISTS idx_subdivision_lots_available ON public.subdivision_lots(project_id) WHERE availability_status = 'Available';
CREATE INDEX IF NOT EXISTS idx_properties_subdivision_project_id ON public.properties(subdivision_project_id);
CREATE INDEX IF NOT EXISTS idx_properties_subdivision_lot_id ON public.properties(subdivision_lot_id);

-- 5. Data API Access & Grants (Supabase Data API Best Practice)
GRANT SELECT ON public.subdivision_projects TO anon, authenticated;
GRANT SELECT ON public.subdivision_lots TO anon, authenticated;
GRANT ALL ON public.subdivision_projects TO authenticated, service_role;
GRANT ALL ON public.subdivision_lots TO authenticated, service_role;

-- 6. Row-Level Security (RLS) Configuration
ALTER TABLE public.subdivision_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdivision_lots ENABLE ROW LEVEL SECURITY;

-- Public can view active projects and lots
DROP POLICY IF EXISTS "Public can view active subdivision projects" ON public.subdivision_projects;
CREATE POLICY "Public can view active subdivision projects"
  ON public.subdivision_projects FOR SELECT
  USING (status != 'Archived');

DROP POLICY IF EXISTS "Public can view subdivision lots" ON public.subdivision_lots;
CREATE POLICY "Public can view subdivision lots"
  ON public.subdivision_lots FOR SELECT
  USING (true);

-- Authorized editors (broker/admin/service_role) can insert/update/delete
DROP POLICY IF EXISTS "Brokers and Admins can manage subdivision projects" ON public.subdivision_projects;
CREATE POLICY "Brokers and Admins can manage subdivision projects"
  ON public.subdivision_projects FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('broker', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('broker', 'admin'));

DROP POLICY IF EXISTS "Brokers and Admins can manage subdivision lots" ON public.subdivision_lots;
CREATE POLICY "Brokers and Admins can manage subdivision lots"
  ON public.subdivision_lots FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('broker', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('broker', 'admin'));
