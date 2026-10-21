-- ==============================================================================
-- COMMUNICATION, NOTIFICATION, AUDIT, AI SUMMARY & SESSION HANDLING MIGRATION
-- Human Shelter Realty / CP_kerby Platform
-- ==============================================================================

-- 1. Create public.inquiry_chat_sessions (Communication Episodes)
CREATE TABLE IF NOT EXISTS public.inquiry_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ongoing', 'ended', 'timed_out', 'escalated')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  end_reason TEXT
);

-- 2. Upgrade public.inquiries with Business & Operational Statuses, SLA, Provenance & Snapshots
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS reference_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS business_status TEXT NOT NULL DEFAULT 'active' CHECK (business_status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS operational_status TEXT NOT NULL DEFAULT 'awaiting_agent' CHECK (operational_status IN ('unassigned', 'awaiting_agent', 'awaiting_client', 'overdue', 'none')),
  ADD COLUMN IF NOT EXISTS inactive_outcome TEXT CHECK (inactive_outcome IN ('resolved', 'withdrawn', 'closed', 'duplicate', 'no_longer_pursued', 'purchased', 'not_interested', 'unresponsive', 'other')),
  ADD COLUMN IF NOT EXISTS inactive_reason TEXT,
  ADD COLUMN IF NOT EXISTS reactivation_reason TEXT,
  ADD COLUMN IF NOT EXISTS contact_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_reply_channel TEXT DEFAULT 'email' CHECK (preferred_reply_channel IN ('email', 'phone', 'whatsapp', 'chat')),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'guest_form',
  ADD COLUMN IF NOT EXISTS brokerage_id TEXT NOT NULL DEFAULT 'human-shelter-main',
  ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_human_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_snapshot JSONB;

-- 3. Upgrade public.inquiry_messages with Request-ID Idempotency, Delivery State, Read Receipts & Redaction
ALTER TABLE public.inquiry_messages
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.inquiry_chat_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'saved' CHECK (delivery_status IN ('sending', 'saved', 'delivered', 'read', 'failed')),
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 4. Create public.inquiry_follow_up_tasks
CREATE TABLE IF NOT EXISTS public.inquiry_follow_up_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create public.inquiry_ai_summaries (Structured 6-Section Report & Version History)
CREATE TABLE IF NOT EXISTS public.inquiry_ai_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.inquiry_chat_sessions(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  generation_status TEXT NOT NULL CHECK (generation_status IN ('pending', 'generating', 'ready', 'failed', 'outdated')),
  review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'reviewed', 'corrected', 'approved')),
  covered_from_message_id TEXT,
  covered_to_message_id TEXT,
  covered_message_count INTEGER NOT NULL DEFAULT 0,
  model_version TEXT NOT NULL,
  template_version TEXT NOT NULL DEFAULT 'v1.0',
  sections JSONB NOT NULL,
  staff_corrections JSONB,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  error_message TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Create public.audit_events (Protected Immutable Event Store)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'guest', 'system', 'integration')),
  actor_role TEXT,
  brokerage_id TEXT NOT NULL DEFAULT 'human-shelter-main',
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  reason TEXT,
  correlation_id TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create public.notification_jobs, public.notification_delivery_attempts, public.notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dedupe_key TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  recipient_id TEXT NOT NULL,
  recipient_contact TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('system', 'email', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'suppressed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  provider_ref TEXT,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notification_delivery_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.notification_jobs(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
  provider_ref TEXT,
  sanitized_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TEXT DEFAULT '20:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Create public.auth_sessions (Server-Enforced Idle & Absolute Session Tracking)
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  idle_expires_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_business_status ON public.inquiries(business_status, operational_status);
CREATE INDEX IF NOT EXISTS idx_inquiries_brokerage ON public.inquiries(brokerage_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_request_id ON public.inquiry_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_sessions_inquiry_id ON public.inquiry_chat_sessions(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_tasks_inquiry_id ON public.inquiry_follow_up_tasks(inquiry_id, status);
CREATE INDEX IF NOT EXISTS idx_inquiry_summaries_inquiry_id ON public.inquiry_ai_summaries(inquiry_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_inquiry_id ON public.audit_events(inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_brokerage ON public.audit_events(brokerage_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_recipient ON public.notification_jobs(recipient_id, status);

-- 10. Row Level Security
ALTER TABLE public.inquiry_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for audit_events (Broker/Admin read only; append-only via service)
DROP POLICY IF EXISTS "Brokers and admins can view audit events." ON public.audit_events;
CREATE POLICY "Brokers and admins can view audit events."
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  );

-- Policies for inquiry_ai_summaries (Assigned agent, broker, admin only)
DROP POLICY IF EXISTS "Authorized staff can view AI summaries." ON public.inquiry_ai_summaries;
CREATE POLICY "Authorized staff can view AI summaries."
  ON public.inquiry_ai_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id AND (
        i.assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'admin'))
      )
    )
  );
