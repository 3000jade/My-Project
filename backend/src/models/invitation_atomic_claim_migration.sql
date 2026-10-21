-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: Agent Invitations Atomic Claim & Token Digest
-- ==============================================================================

-- 1. Extend agent_invitations with token_digest and atomic claim tracking
ALTER TABLE public.agent_invitations
  ADD COLUMN IF NOT EXISTS token_digest VARCHAR(64),
  ADD COLUMN IF NOT EXISTS registration_attempt_id TEXT,
  ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'sent';

-- Widen status constraint to support claiming, revoked, used, and accepted
ALTER TABLE public.agent_invitations DROP CONSTRAINT IF EXISTS agent_invitations_status_check;
ALTER TABLE public.agent_invitations ADD CONSTRAINT agent_invitations_status_check
  CHECK (status IN ('pending', 'claiming', 'accepted', 'used', 'expired', 'revoked'));

-- Compute digests for existing plain tokens using built-in sha256(bytea)
UPDATE public.agent_invitations
SET token_digest = encode(sha256(convert_to(token, 'UTF8')), 'hex')
WHERE token_digest IS NULL AND token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_invitations_token_digest ON public.agent_invitations(token_digest);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_attempt ON public.agent_invitations(registration_attempt_id);

-- 2. Atomic claim function for race-free invitation consumption
CREATE OR REPLACE FUNCTION public.claim_agent_invitation(
  p_token_digest VARCHAR(64),
  p_attempt_id TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.agent_invitations
  SET registration_attempt_id = p_attempt_id,
      claim_expires_at = now() + interval '10 minutes',
      updated_at = now()
  WHERE (token_digest = p_token_digest OR token = p_token_digest)
    AND status = 'pending'
    AND expires_at > now()
    AND (registration_attempt_id IS NULL OR claim_expires_at < now())
  RETURNING agent_invitations.id, agent_invitations.email, agent_invitations.role, agent_invitations.full_name;
END;
$$;
