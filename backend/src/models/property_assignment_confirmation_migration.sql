-- ==============================================================================
-- Property Listing Agent Assignment & Confirmation Migration
-- Enforces that listings must be confirmed by the assigned agent before going live.
-- ==============================================================================

-- 1. Add assignment lifecycle columns to public.properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS assignment_status VARCHAR(30) DEFAULT 'PENDING_CONFIRMATION',
  ADD COLUMN IF NOT EXISTS assignment_declined_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS agent_confirmed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create indexes on assignment_status and assigned_by for rapid dashboard and public query filtering
CREATE INDEX IF NOT EXISTS idx_properties_assignment_status 
  ON public.properties(assignment_status);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_by 
  ON public.properties(assigned_by);

-- 3. Add constraint to enforce valid assignment statuses
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS chk_property_assignment_status;

ALTER TABLE public.properties
  ADD CONSTRAINT chk_property_assignment_status 
  CHECK (assignment_status IN ('UNASSIGNED', 'PENDING_CONFIRMATION', 'ACCEPTED', 'REJECTED'));

-- 4. Retrofit existing active properties to ACCEPTED so existing data remains visible
UPDATE public.properties 
SET assignment_status = 'ACCEPTED' 
WHERE assignment_status IS NULL 
   OR (standard_status = 'Active' AND assignment_status = 'PENDING_CONFIRMATION');
