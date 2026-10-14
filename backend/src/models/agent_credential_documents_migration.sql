-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: Agent Credential Documents & Private Storage Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agent_credential_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('prc', 'dhsud', 'government_id', 'other')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.agent_invitations(id) ON DELETE CASCADE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_agent_credential_docs_owner ON public.agent_credential_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_credential_docs_invitation ON public.agent_credential_documents(invitation_id);

ALTER TABLE public.agent_credential_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers and Admins can view all agent credential documents
DROP POLICY IF EXISTS "Brokers and Admins can view all credentials" ON public.agent_credential_documents;
CREATE POLICY "Brokers and Admins can view all credentials"
  ON public.agent_credential_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- Policy: Agents can view only their own credential documents
DROP POLICY IF EXISTS "Agents can view their own credentials" ON public.agent_credential_documents;
CREATE POLICY "Agents can view their own credentials"
  ON public.agent_credential_documents FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );
