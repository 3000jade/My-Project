-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: Agent Invitations & Credential Verification Schema
-- ==============================================================================

-- 1. Agent Invitations Table
CREATE TABLE IF NOT EXISTS public.agent_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'used', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'agent',
  broker_agency TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_agent_invitations_token ON public.agent_invitations(token);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_email ON public.agent_invitations(email);

ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;

-- Admins and Brokers can manage invitations
DROP POLICY IF EXISTS "Admins and brokers can manage invitations" ON public.agent_invitations;
CREATE POLICY "Admins and brokers can manage invitations"
  ON public.agent_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- Unauthenticated users can read unexpired, pending invitations by token for validation
DROP POLICY IF EXISTS "Public token validation for active invitations" ON public.agent_invitations;
CREATE POLICY "Public token validation for active invitations"
  ON public.agent_invitations FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > now());

-- 2. Non-Destructive Extension to Profiles Table for Agent Credentials & Audit
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prc_license_no TEXT,
  ADD COLUMN IF NOT EXISTS prc_validity DATE,
  ADD COLUMN IF NOT EXISTS dhsud_accreditation_no TEXT,
  ADD COLUMN IF NOT EXISTS dhsud_validity DATE,
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN IF NOT EXISTS supporting_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_remarks TEXT,
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_notes TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Preserve existing seeded agents as VERIFIED
UPDATE public.profiles
SET verification_status = 'VERIFIED'
WHERE role = 'agent' AND verification_status IS NULL;
