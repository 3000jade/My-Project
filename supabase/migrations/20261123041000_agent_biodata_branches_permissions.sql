-- ==============================================================================
-- Migration: Agent Biodata, Branches Lookup, and Granular Permission Grants
-- ==============================================================================

-- 1. Add optional HR biodata columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Prefer not to say') OR gender IS NULL);

-- 2. Create public.branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (brokerage_id, name)
);

CREATE INDEX IF NOT EXISTS idx_branches_brokerage ON public.branches(brokerage_id, status);

-- Seed default branches for Human Shelter Realty
INSERT INTO public.branches (id, brokerage_id, name, city, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Metro Manila — Makati HQ',
    'Makati City',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    'BGC Taguig Office',
    'Taguig City',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'Alabang South Office',
    'Muntinlupa City',
    'active'
  )
ON CONFLICT (brokerage_id, name) DO NOTHING;

-- 3. Link branch_id on profiles and brokerage_memberships
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.brokerage_memberships
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_brokerage_memberships_branch ON public.brokerage_memberships(branch_id);

-- 4. Create public.agent_permission_grants table
CREATE TABLE IF NOT EXISTS public.agent_permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL CHECK (permission_key IN (
    'create_listings',
    'edit_listings',
    'manage_inquiries',
    'manage_appointments',
    'view_reports'
  )),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (brokerage_id, agent_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_permission_grants_agent ON public.agent_permission_grants(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_permission_grants_brokerage ON public.agent_permission_grants(brokerage_id);

-- 5. Enable RLS & Policies
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_permission_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Branches are viewable by authenticated users" ON public.branches;
CREATE POLICY "Branches are viewable by authenticated users"
  ON public.branches FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Brokers and Admins manage branches" ON public.branches;
CREATE POLICY "Brokers and Admins manage branches"
  ON public.branches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = branches.brokerage_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = branches.brokerage_id))
    )
  );

DROP POLICY IF EXISTS "View agent permission grants" ON public.agent_permission_grants;
CREATE POLICY "View agent permission grants"
  ON public.agent_permission_grants FOR SELECT
  TO authenticated
  USING (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_permission_grants.brokerage_id))
    )
  );

DROP POLICY IF EXISTS "Brokers and Admins manage agent permission grants" ON public.agent_permission_grants;
CREATE POLICY "Brokers and Admins manage agent permission grants"
  ON public.agent_permission_grants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_permission_grants.brokerage_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_permission_grants.brokerage_id))
    )
  );

GRANT SELECT ON public.branches TO authenticated, service_role;
GRANT ALL ON public.branches, public.agent_permission_grants TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
