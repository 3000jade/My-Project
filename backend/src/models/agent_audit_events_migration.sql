-- Migration: Create agent_audit_events for immutable status transition tracking
CREATE TABLE IF NOT EXISTS public.agent_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  prior_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for querying agent history
CREATE INDEX IF NOT EXISTS idx_agent_audit_events_target ON public.agent_audit_events(target_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_audit_events ENABLE ROW LEVEL SECURITY;

-- Allow service_role full control
DROP POLICY IF EXISTS "Service role manages audit events" ON public.agent_audit_events;
CREATE POLICY "Service role manages audit events"
  ON public.agent_audit_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated brokers and admins to view audit events
DROP POLICY IF EXISTS "Brokers and Admins view audit events" ON public.agent_audit_events;
CREATE POLICY "Brokers and Admins view audit events"
  ON public.agent_audit_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('broker', 'admin')
    )
  );

-- Immutability: prevent UPDATE and DELETE by ordinary users
REVOKE UPDATE, DELETE ON public.agent_audit_events FROM authenticated, anon, public;
