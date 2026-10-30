-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: AI-Assisted Subdivision Map & Lot Lifecycle Engine
-- Module: 02-property-listing / Subdivisions
-- Requirements: FR-001 through FR-047
-- ==============================================================================

-- 1. Subdivision Projects Table (FR-001)
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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Subdivision Master Plan Documents & Graphics (FR-002, FR-003, FR-004, FR-005)
CREATE TABLE IF NOT EXISTS public.subdivision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.subdivision_projects(id) ON DELETE CASCADE,
  plan_title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size_bytes BIGINT,
  image_width INTEGER NOT NULL,
  image_height INTEGER NOT NULL,
  aspect_ratio NUMERIC(10,4),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Subdivision Lots & Spatial Polygon Vectors (FR-006 to FR-030)
CREATE TABLE IF NOT EXISTS public.subdivision_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.subdivision_projects(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subdivision_plans(id) ON DELETE CASCADE,
  block_number VARCHAR(50) NOT NULL,
  lot_number VARCHAR(50) NOT NULL,
  boundary_type VARCHAR(50) NOT NULL DEFAULT 'SaleableLot' CHECK (boundary_type IN ('SaleableLot', 'Road', 'Park', 'Facility', 'Waterway', 'Other')),
  availability_status VARCHAR(30) NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Reserved', 'Sold', 'Unavailable')),
  verified_area_sqm NUMERIC(10,2) NOT NULL,
  price NUMERIC(15,2) NULL,
  description TEXT NULL,
  coordinates JSONB NOT NULL, -- Array of {x, y} coordinate vertices
  is_verified BOOLEAN NOT NULL DEFAULT false, -- FR-016: AI generated boundaries remain unverified until user confirms
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_subdivision_block_lot UNIQUE (project_id, block_number, lot_number)
);

-- 4. Immutable Map Version Snapshots & Rollback Archive (FR-035, FR-036, FR-037)
CREATE TABLE IF NOT EXISTS public.subdivision_map_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.subdivision_projects(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subdivision_plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL, -- Full snapshot containing lots array, polygons, and metadata
  published_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  restored_from_version INTEGER NULL,
  notes TEXT NULL,
  CONSTRAINT uq_project_version UNIQUE (project_id, version_number)
);

-- 5. Foreign Key Linkage from Property Listings to Subdivision Master Lot Records
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS subdivision_project_id UUID REFERENCES public.subdivision_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subdivision_lot_id UUID REFERENCES public.subdivision_lots(id) ON DELETE SET NULL;

-- 6. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subdivision_plans_project_id ON public.subdivision_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_subdivision_lots_project_id ON public.subdivision_lots(project_id);
CREATE INDEX IF NOT EXISTS idx_subdivision_lots_plan_id ON public.subdivision_lots(plan_id);
CREATE INDEX IF NOT EXISTS idx_subdivision_lots_availability ON public.subdivision_lots(availability_status);
CREATE INDEX IF NOT EXISTS idx_subdivision_lots_boundary_type ON public.subdivision_lots(boundary_type);
CREATE INDEX IF NOT EXISTS idx_subdivision_map_versions_project ON public.subdivision_map_versions(project_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_properties_subdivision_project_id ON public.properties(subdivision_project_id);
CREATE INDEX IF NOT EXISTS idx_properties_subdivision_lot_id ON public.properties(subdivision_lot_id);

-- 7. Row-Level Security (RLS) Configuration (FR-044, FR-045)
ALTER TABLE public.subdivision_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdivision_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdivision_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdivision_map_versions ENABLE ROW LEVEL SECURITY;

-- Helper condition check for authorized editor (broker or admin)
-- Public / Visitors can read active projects and plans
DROP POLICY IF EXISTS "Public and users can view active subdivision projects" ON public.subdivision_projects;
CREATE POLICY "Public and users can view active subdivision projects"
  ON public.subdivision_projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brokers and Admins can manage subdivision projects" ON public.subdivision_projects;
CREATE POLICY "Brokers and Admins can manage subdivision projects"
  ON public.subdivision_projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  );

-- Plans RLS
DROP POLICY IF EXISTS "Public and users can view subdivision plans" ON public.subdivision_plans;
CREATE POLICY "Public and users can view subdivision plans"
  ON public.subdivision_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brokers and Admins can manage subdivision plans" ON public.subdivision_plans;
CREATE POLICY "Brokers and Admins can manage subdivision plans"
  ON public.subdivision_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  );

-- Lots RLS
DROP POLICY IF EXISTS "Public and authenticated users can view subdivision lots" ON public.subdivision_lots;
CREATE POLICY "Public and authenticated users can view subdivision lots"
  ON public.subdivision_lots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brokers and Admins can manage subdivision lots" ON public.subdivision_lots;
CREATE POLICY "Brokers and Admins can manage subdivision lots"
  ON public.subdivision_lots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  );

-- Map Versions RLS
DROP POLICY IF EXISTS "Public and users can view published map versions" ON public.subdivision_map_versions;
CREATE POLICY "Public and users can view published map versions"
  ON public.subdivision_map_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brokers and Admins can publish and manage map versions" ON public.subdivision_map_versions;
CREATE POLICY "Brokers and Admins can publish and manage map versions"
  ON public.subdivision_map_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('broker', 'admin')
    )
  );
