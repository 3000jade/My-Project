-- ==============================================================================
-- Migration: Create public.user_sessions for Multi-Device Session Authority & Persistence
-- Human Shelter Realty / CP_kerby Platform
-- Addresses: SF-01 (Token Confidentiality), SF-02 (Shared Authority), SF-03 (Activity Isolation),
--            SF-04 (Per-Session Heartbeats), SF-05 (Hardened RLS), SF-06 (Strict Revocation Contract)
-- ==============================================================================

-- 1. Create public.user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY, -- Maps to Supabase JWT session_id (or deterministic UUID)
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'agent', 'broker', 'admin')),
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of active Bearer access token
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  idle_expires_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT CHECK (revoke_reason IS NULL OR revoke_reason IN (
    'user_logout',
    'user_manual_revoke',
    'password_reset',
    'inactivity_timeout',
    'absolute_timeout',
    'all_device_revocation',
    'account_disabled',
    'admin_action'
  )),
  last_heartbeat_at TIMESTAMPTZ,
  user_agent TEXT DEFAULT 'Unknown Device',
  ip_address TEXT DEFAULT 'Unavailable',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance, lookup, and heartbeat indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
  ON public.user_sessions(user_id, revoked_at, idle_expires_at, absolute_expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash
  ON public.user_sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_user_sessions_heartbeat
  ON public.user_sessions(last_heartbeat_at);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3.1 Service Role has full administrative authority for backend APIs
DROP POLICY IF EXISTS "Service role manages all user sessions" ON public.user_sessions;
CREATE POLICY "Service role manages all user sessions"
  ON public.user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.2 Authenticated users can only read their own sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3.3 Strict Permission Lockdown (SF-05):
-- Prohibit direct client-side INSERT, UPDATE, DELETE to prevent tampering with deadlines or un-revocation
REVOKE INSERT, UPDATE, DELETE ON public.user_sessions FROM authenticated, anon, public;

-- 4. Secure Stored Function for client-authorized revocation (optional direct RPC)
CREATE OR REPLACE FUNCTION public.revoke_user_session(
  p_session_id UUID,
  p_reason TEXT DEFAULT 'user_manual_revoke'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Validate permitted revocation reasons
  IF p_reason NOT IN (
    'user_logout',
    'user_manual_revoke',
    'password_reset',
    'inactivity_timeout',
    'absolute_timeout',
    'all_device_revocation',
    'account_disabled',
    'admin_action'
  ) THEN
    RAISE EXCEPTION 'Invalid revocation reason: %', p_reason;
  END IF;

  -- Monotonically revoke only the caller's active session
  UPDATE public.user_sessions
  SET
    revoked_at = timezone('utc'::text, now()),
    revoke_reason = p_reason,
    updated_at = timezone('utc'::text, now())
  WHERE
    id = p_session_id
    AND user_id = auth.uid()
    AND revoked_at IS NULL;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_user_session(UUID, TEXT) TO authenticated;

COMMENT ON TABLE public.user_sessions IS 'Authoritative cross-device session tracking table. Raw tokens are never stored; indexed via SHA-256 token_hash. Survives server restarts and multi-instance deployments.';
