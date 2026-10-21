-- ============================================================================
-- Human Shelter Realty — Appointments & Calendar Scheduling v2 Migration
-- ============================================================================
-- Safely upgrades `public.appointments` while preserving all existing rows.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS brokerage_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS property_title TEXT,
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Manila',
  ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'Site Visit',
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
  ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activity_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Expand status check constraint to support no_show as well as lowercase/uppercase variants
DO $$
BEGIN
  ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
  ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_status_check
    CHECK (lower(status) IN ('requested', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Performance indexes for calendar range & conflict lookups
CREATE INDEX IF NOT EXISTS idx_appointments_agent_time
  ON public.appointments (agent_id, appointment_time);

CREATE INDEX IF NOT EXISTS idx_appointments_brokerage_status
  ON public.appointments (brokerage_id, status);
