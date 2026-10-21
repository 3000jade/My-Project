-- ==============================================================================
-- INQUIRIES MODULE PRODUCTION SCHEMA UPGRADE
-- Human Shelter Realty / CP_kerby Platform
-- ==============================================================================

-- 1. Upgrade public.inquiries table
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closure_reason TEXT CHECK (closure_reason IN ('purchased', 'not_interested', 'unresponsive', 'duplicate', 'other')),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Update status constraint to include full domain lifecycle
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_status_check 
  CHECK (status IN ('new', 'assigned', 'contacted', 'scheduled', 'closed', 'reopened'));

-- 2. Create public.inquiry_messages (Client & Agent Correspondence)
CREATE TABLE IF NOT EXISTS public.inquiry_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'agent', 'broker', 'system')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create public.inquiry_internal_notes (Agent & Broker Private Intelligence)
CREATE TABLE IF NOT EXISTS public.inquiry_internal_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('agent', 'broker', 'admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create public.inquiry_assignment_audit (Assignment & Reassignment Logs)
CREATE TABLE IF NOT EXISTS public.inquiry_assignment_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Link from public.appointments to public.inquiries
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_client_id ON public.inquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_agent_id ON public.inquiries(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry_id ON public.inquiry_messages(inquiry_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_inquiry_notes_inquiry_id ON public.inquiry_internal_notes(inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiry_audit_inquiry_id ON public.inquiry_assignment_audit(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_appointments_inquiry_id ON public.appointments(inquiry_id);

-- 7. Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_assignment_audit ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security Policies

-- public.inquiries policies
DROP POLICY IF EXISTS "Anyone can submit an inquiry." ON public.inquiries;
CREATE POLICY "Anyone can submit an inquiry."
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view relevant inquiries." ON public.inquiries;
CREATE POLICY "Users can view relevant inquiries."
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    assigned_agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  );

DROP POLICY IF EXISTS "Staff can update inquiries." ON public.inquiries;
CREATE POLICY "Staff can update inquiries."
  ON public.inquiries FOR UPDATE
  TO authenticated
  USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  );

-- public.inquiry_messages policies
DROP POLICY IF EXISTS "Stakeholders can view thread messages." ON public.inquiry_messages;
CREATE POLICY "Stakeholders can view thread messages."
  ON public.inquiry_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id AND (
        i.client_id = auth.uid() OR
        i.assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin'))
      )
    )
  );

DROP POLICY IF EXISTS "Stakeholders can post thread messages." ON public.inquiry_messages;
CREATE POLICY "Stakeholders can post thread messages."
  ON public.inquiry_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id AND (
        i.client_id = auth.uid() OR
        i.assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin'))
      )
    )
  );

-- public.inquiry_internal_notes policies (Strict: no client access)
DROP POLICY IF EXISTS "Agents and brokers can view internal notes." ON public.inquiry_internal_notes;
CREATE POLICY "Agents and brokers can view internal notes."
  ON public.inquiry_internal_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );

DROP POLICY IF EXISTS "Agents and brokers can create internal notes." ON public.inquiry_internal_notes;
CREATE POLICY "Agents and brokers can create internal notes."
  ON public.inquiry_internal_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );

-- public.inquiry_assignment_audit policies
DROP POLICY IF EXISTS "Staff can view assignment audit." ON public.inquiry_assignment_audit;
CREATE POLICY "Staff can view assignment audit."
  ON public.inquiry_assignment_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'broker', 'admin')
    )
  );
