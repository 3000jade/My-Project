-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: Agent Management v2 (Multi-Brokerage, Teams, 3D Lifecycle, Availability, Transfers)
-- ==============================================================================

-- 1. Create public.brokerages
CREATE TABLE IF NOT EXISTS public.brokerages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  prc_broker_license_no TEXT,
  owner_broker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  fallback_queue_email TEXT DEFAULT 'concierge@humanshelter.ph',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed default primary brokerage
INSERT INTO public.brokerages (id, name, slug, prc_broker_license_no, fallback_queue_email, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Human Shelter Realty',
  'human-shelter-realty',
  'PRC-BRK-0001024',
  'concierge@humanshelter.ph',
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create public.teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lead_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (brokerage_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_brokerage ON public.teams(brokerage_id);

-- Seed default teams for Human Shelter Realty
INSERT INTO public.teams (id, brokerage_id, name, description)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Executive Advisory Division',
    'Ultra-luxury penthouses, private estates, and institutional portfolios'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Residential Portfolio Team',
    'Prime residential condominiums and urban sanctuary residences'
  )
ON CONFLICT (brokerage_id, name) DO NOTHING;

-- 3. Extend public.profiles with synced brokerage, team, 3D lifecycle, and governance columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brokerage_id UUID REFERENCES public.brokerages(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('invited', 'active', 'suspended', 'departed')),
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'complete' CHECK (onboarding_status IN ('incomplete', 'pending_review', 'complete', 'rejected')),
  ADD COLUMN IF NOT EXISTS routing_availability TEXT NOT NULL DEFAULT 'available' CHECK (routing_availability IN ('available', 'paused', 'scheduled_unavailable')),
  ADD COLUMN IF NOT EXISTS can_create_listings BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_tier TEXT DEFAULT 'Standard Consultant',
  ADD COLUMN IF NOT EXISTS commission_tier TEXT DEFAULT 'Standard Split (70/30)',
  ADD COLUMN IF NOT EXISTS location_branch TEXT DEFAULT 'Metro Manila — Makati HQ',
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS departed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS departed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS departure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_brokerage_role ON public.profiles(brokerage_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles(team_id);

-- Backfill existing profiles' 3D status based on verification_status
UPDATE public.profiles
SET
  brokerage_id = COALESCE(brokerage_id, '00000000-0000-0000-0000-000000000001'),
  membership_status = CASE
    WHEN verification_status = 'SUSPENDED' THEN 'suspended'
    ELSE 'active'
  END,
  onboarding_status = CASE
    WHEN verification_status = 'VERIFIED' THEN 'complete'
    WHEN verification_status = 'REJECTED' THEN 'rejected'
    WHEN prc_license_no IS NOT NULL AND dhsud_accreditation_no IS NOT NULL THEN 'pending_review'
    ELSE 'incomplete'
  END,
  routing_availability = CASE
    WHEN verification_status = 'VERIFIED' THEN COALESCE(routing_availability, 'available')
    ELSE 'paused'
  END
WHERE role IN ('agent', 'broker', 'admin');

-- 4. Create public.brokerage_memberships (separating identity from brokerage membership)
CREATE TABLE IF NOT EXISTS public.brokerage_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('invited', 'active', 'suspended', 'departed')),
  onboarding_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (onboarding_status IN ('incomplete', 'pending_review', 'complete', 'rejected')),
  routing_availability TEXT NOT NULL DEFAULT 'paused' CHECK (routing_availability IN ('available', 'paused', 'scheduled_unavailable')),
  can_create_listings BOOLEAN NOT NULL DEFAULT false,
  access_tier TEXT DEFAULT 'Standard Consultant',
  commission_tier TEXT DEFAULT 'Standard Split (70/30)',
  location_branch TEXT DEFAULT 'Metro Manila — Makati HQ',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  internal_notes TEXT,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_remarks TEXT,
  suspended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  suspension_notes TEXT,
  departed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  departed_at TIMESTAMPTZ,
  departure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enforce at most ONE non-departed brokerage membership per agent across the platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_brokerage_memberships_one_active
  ON public.brokerage_memberships (agent_id)
  WHERE membership_status IN ('invited', 'active', 'suspended');

CREATE INDEX IF NOT EXISTS idx_brokerage_memberships_brokerage
  ON public.brokerage_memberships (brokerage_id, membership_status);

-- Backfill existing agents into public.brokerage_memberships
INSERT INTO public.brokerage_memberships (
  brokerage_id,
  agent_id,
  team_id,
  membership_status,
  onboarding_status,
  routing_availability,
  can_create_listings,
  access_tier,
  commission_tier,
  location_branch,
  emergency_contact_name,
  emergency_contact_phone,
  internal_notes,
  verified_by,
  verified_at,
  rejection_remarks,
  suspended_by,
  suspended_at,
  suspension_reason,
  suspension_notes
)
SELECT
  COALESCE(p.brokerage_id, '00000000-0000-0000-0000-000000000001'),
  p.id,
  p.team_id,
  p.membership_status,
  p.onboarding_status,
  p.routing_availability,
  COALESCE(p.can_create_listings, false),
  COALESCE(p.access_tier, 'Standard Consultant'),
  COALESCE(p.commission_tier, 'Standard Split (70/30)'),
  COALESCE(p.location_branch, 'Metro Manila — Makati HQ'),
  p.emergency_contact_name,
  p.emergency_contact_phone,
  p.internal_notes,
  p.verified_by,
  p.verified_at,
  p.rejection_remarks,
  p.suspended_by,
  p.suspended_at,
  p.suspension_reason,
  p.suspension_notes
FROM public.profiles p
WHERE p.role = 'agent'
  AND NOT EXISTS (
    SELECT 1 FROM public.brokerage_memberships bm
    WHERE bm.agent_id = p.id
      AND bm.membership_status IN ('invited', 'active', 'suspended')
  );

-- 5. Sync trigger: keep public.profiles synchronized with public.brokerage_memberships
CREATE OR REPLACE FUNCTION public.sync_membership_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification_status TEXT;
BEGIN
  IF NEW.membership_status IN ('suspended', 'departed') THEN
    v_verification_status := 'SUSPENDED';
  ELSIF NEW.onboarding_status = 'rejected' THEN
    v_verification_status := 'REJECTED';
  ELSIF NEW.membership_status = 'active' AND NEW.onboarding_status = 'complete' THEN
    v_verification_status := 'VERIFIED';
  ELSE
    v_verification_status := 'PENDING';
  END IF;

  UPDATE public.profiles
  SET
    brokerage_id = NEW.brokerage_id,
    team_id = NEW.team_id,
    membership_status = NEW.membership_status,
    onboarding_status = NEW.onboarding_status,
    routing_availability = CASE
      WHEN NEW.membership_status = 'active' AND NEW.onboarding_status = 'complete' THEN NEW.routing_availability
      ELSE 'paused'
    END,
    verification_status = v_verification_status,
    can_create_listings = NEW.can_create_listings,
    access_tier = NEW.access_tier,
    commission_tier = NEW.commission_tier,
    location_branch = NEW.location_branch,
    emergency_contact_name = NEW.emergency_contact_name,
    emergency_contact_phone = NEW.emergency_contact_phone,
    internal_notes = NEW.internal_notes,
    rejection_remarks = NEW.rejection_remarks,
    suspension_reason = NEW.suspension_reason,
    suspension_notes = NEW.suspension_notes,
    suspended_by = NEW.suspended_by,
    suspended_at = NEW.suspended_at,
    verified_by = NEW.verified_by,
    verified_at = NEW.verified_at,
    departed_by = NEW.departed_by,
    departed_at = NEW.departed_at,
    departure_reason = NEW.departure_reason,
    updated_at = timezone('utc', now())
  WHERE id = NEW.agent_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_membership_to_profile ON public.brokerage_memberships;
CREATE TRIGGER trg_sync_membership_to_profile
  AFTER INSERT OR UPDATE ON public.brokerage_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_membership_to_profile();

-- 6. Column-level privilege guard trigger on public.profiles (prevents self-escalation via PostgREST)
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_jwt_role TEXT;
BEGIN
  v_jwt_role := COALESCE(current_setting('request.jwt.claim.role', true), '');

  -- Allow service_role or postgres direct database administration
  IF v_jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());

  IF v_caller_role NOT IN ('admin', 'broker') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.membership_status IS DISTINCT FROM OLD.membership_status
       OR NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status
       OR NEW.brokerage_id IS DISTINCT FROM OLD.brokerage_id
       OR NEW.can_create_listings IS DISTINCT FROM OLD.can_create_listings
       OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
       OR NEW.suspended_by IS DISTINCT FROM OLD.suspended_by
    THEN
      RAISE EXCEPTION 'Forbidden: Agents cannot self-escalate role, brokerage membership, or verification status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_columns();

-- 7. Create public.agent_availability_schedules
CREATE TABLE IF NOT EXISTS public.agent_availability_schedules (
  agent_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  brokerage_id UUID REFERENCES public.brokerages(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  routing_availability TEXT NOT NULL DEFAULT 'available' CHECK (routing_availability IN ('available', 'paused', 'scheduled_unavailable')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  weekly_schedule JSONB NOT NULL DEFAULT '{
    "monday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "saturday": {"enabled": true, "start": "10:00", "end": "16:00"},
    "sunday": {"enabled": false, "start": "10:00", "end": "16:00"}
  }'::jsonb,
  blackout_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_active_inquiries INTEGER NOT NULL DEFAULT 25 CHECK (max_active_inquiries >= 1),
  auto_pause_on_capacity BOOLEAN NOT NULL DEFAULT true,
  away_message TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed availability schedules for existing agents
INSERT INTO public.agent_availability_schedules (agent_id, brokerage_id, routing_availability)
SELECT p.id, COALESCE(p.brokerage_id, '00000000-0000-0000-0000-000000000001'), p.routing_availability
FROM public.profiles p
WHERE p.role = 'agent'
ON CONFLICT (agent_id) DO NOTHING;

-- 8. Create public.agent_responsibility_transfers
CREATE TABLE IF NOT EXISTS public.agent_responsibility_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id UUID NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  source_agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual_transfer' CHECK (trigger_type IN ('suspension', 'departure', 'manual_transfer')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'partial_failure', 'failed')),
  idempotency_key TEXT UNIQUE,
  summary_counts JSONB NOT NULL DEFAULT '{"listings": 0, "inquiries": 0, "appointments": 0, "failed": 0}'::jsonb,
  transferred_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_responsibility_transfers_source ON public.agent_responsibility_transfers(source_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responsibility_transfers_brokerage ON public.agent_responsibility_transfers(brokerage_id, created_at DESC);

-- 9. Extend public.agent_invitations and public.agent_audit_events with brokerage_id / team_id
ALTER TABLE public.agent_invitations
  ADD COLUMN IF NOT EXISTS brokerage_id UUID REFERENCES public.brokerages(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.agent_audit_events
  ADD COLUMN IF NOT EXISTS brokerage_id UUID REFERENCES public.brokerages(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'STATUS_TRANSITION';

-- Allow inquiry_assignment_audit.assigned_to to be nullable when an inquiry is routed to the Brokerage Unassigned Queue
ALTER TABLE public.inquiry_assignment_audit
  ALTER COLUMN assigned_to DROP NOT NULL;

-- 10. Enable RLS & Configure Policies
ALTER TABLE public.brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokerage_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_responsibility_transfers ENABLE ROW LEVEL SECURITY;

-- Brokerages: readable by all authenticated & anon (for public agent attribution)
DROP POLICY IF EXISTS "Brokerages are viewable by everyone" ON public.brokerages;
CREATE POLICY "Brokerages are viewable by everyone"
  ON public.brokerages FOR SELECT
  USING (true);

-- Teams: readable by everyone; manageable by brokers in same brokerage or admins
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brokers and Admins manage teams" ON public.teams;
CREATE POLICY "Brokers and Admins manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = teams.brokerage_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = teams.brokerage_id))
    )
  );

-- Brokerage Memberships: agents see own; brokers see own brokerage; admins see all
DROP POLICY IF EXISTS "View brokerage memberships" ON public.brokerage_memberships;
CREATE POLICY "View brokerage memberships"
  ON public.brokerage_memberships FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = brokerage_memberships.brokerage_id))
    )
  );

DROP POLICY IF EXISTS "Brokers and Admins manage memberships" ON public.brokerage_memberships;
CREATE POLICY "Brokers and Admins manage memberships"
  ON public.brokerage_memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = brokerage_memberships.brokerage_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = brokerage_memberships.brokerage_id))
    )
  );

-- Availability Schedules: agents manage own; brokers/admins manage within brokerage
DROP POLICY IF EXISTS "View availability schedules" ON public.agent_availability_schedules;
CREATE POLICY "View availability schedules"
  ON public.agent_availability_schedules FOR SELECT
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_availability_schedules.brokerage_id))
    )
  );

DROP POLICY IF EXISTS "Manage availability schedules" ON public.agent_availability_schedules;
CREATE POLICY "Manage availability schedules"
  ON public.agent_availability_schedules FOR ALL
  TO authenticated
  USING (
    agent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_availability_schedules.brokerage_id))
    )
  )
  WITH CHECK (
    agent_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_availability_schedules.brokerage_id))
    )
  );

-- Responsibility Transfers: viewable and manageable by brokers in same brokerage or admins
DROP POLICY IF EXISTS "Brokers and Admins manage transfers" ON public.agent_responsibility_transfers;
CREATE POLICY "Brokers and Admins manage transfers"
  ON public.agent_responsibility_transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_responsibility_transfers.brokerage_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR (p.role = 'broker' AND p.brokerage_id = agent_responsibility_transfers.brokerage_id))
    )
  );

-- Grant Data API permissions so PostgREST exposes the new tables cleanly
GRANT SELECT ON public.brokerages, public.teams TO anon, authenticated, service_role;
GRANT ALL ON public.brokerages, public.teams, public.brokerage_memberships, public.agent_availability_schedules, public.agent_responsibility_transfers, public.agent_credential_documents, public.agent_audit_events TO authenticated, service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
