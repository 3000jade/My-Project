-- ==============================================================================
-- CP_kerby Luxury Architectural Real Estate Platform
-- Migration: Property Edit Approval Workflow & Audit Trail
-- Classification: Production PostgreSQL DDL (Additive & Non-Destructive)
-- ==============================================================================

BEGIN;

-- 1. STAGED PROPERTY EDIT REQUESTS TABLE
-- Stores proposed listing modifications by assigned agents awaiting broker review
CREATE TABLE IF NOT EXISTS public.property_edit_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' 
    CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONFLICT')),
  proposed_changes JSONB NOT NULL,
  original_snapshot JSONB NOT NULL,
  base_version INTEGER NOT NULL DEFAULT 1,
  agent_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Concurrency Control: Exactly ONE pending edit request per property at any given time
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_pending_request_per_property 
  ON public.property_edit_requests(property_id) 
  WHERE request_status = 'PENDING';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_property_edit_requests_property_id 
  ON public.property_edit_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_property_edit_requests_agent_id 
  ON public.property_edit_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_edit_requests_status 
  ON public.property_edit_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_property_edit_requests_created_at 
  ON public.property_edit_requests(created_at DESC);


-- 2. IMMUTABLE PROPERTY AUDIT LOG TABLE
-- Maintains tamper-proof change history for all listing mutations and lifecycle decisions
CREATE TABLE IF NOT EXISTS public.property_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.property_edit_requests(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(32) NOT NULL 
    CHECK (action_type IN ('CREATED', 'EDIT_APPROVED', 'DIRECT_UPDATE', 'STATUS_CHANGE', 'MEDIA_UPDATE', 'DELETED')),
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  previous_data JSONB NOT NULL,
  new_data JSONB NOT NULL,
  audit_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_property_audit_log_property_id 
  ON public.property_audit_log(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_audit_log_actor_id 
  ON public.property_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_property_audit_log_action_type 
  ON public.property_audit_log(action_type);


-- 3. STORED PROCEDURE: ATOMIC PROPOSAL APPROVAL
-- Applies whitelisted business modifications to public.properties, transitions status to APPROVED,
-- records change diff to property_audit_log, and notifies agent in a single transaction.
CREATE OR REPLACE FUNCTION public.apply_property_edit_request(
  p_request_id UUID,
  p_broker_id UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_broker_role TEXT;
  v_req RECORD;
  v_prop RECORD;
  v_previous JSONB;
  v_new JSONB;
  v_changed_keys TEXT[] := '{}';
  v_key TEXT;
  v_val JSONB;
BEGIN
  -- Verify caller role is broker or admin
  SELECT role INTO v_broker_role FROM public.profiles WHERE id = p_broker_id;
  IF v_broker_role NOT IN ('broker', 'admin') THEN
    RAISE EXCEPTION 'Access Denied: Only brokers and administrators can approve edit requests.';
  END IF;

  -- Lock and retrieve edit request row
  SELECT * INTO v_req FROM public.property_edit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request % not found.', p_request_id;
  END IF;

  IF v_req.request_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Cannot approve request: status is already %.', v_req.request_status;
  END IF;

  -- Lock target property row
  SELECT * INTO v_prop FROM public.properties WHERE id = v_req.property_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target property % does not exist.', v_req.property_id;
  END IF;

  v_previous := to_jsonb(v_prop);

  -- Apply whitelisted business fields only (Protected system fields id, created_by, created_at remain untouched)
  UPDATE public.properties
  SET
    title = COALESCE((v_req.proposed_changes->>'title'), title),
    tagline = COALESCE((v_req.proposed_changes->>'tagline'), tagline),
    price = COALESCE((v_req.proposed_changes->>'price')::NUMERIC(15, 2), price),
    formatted_price = COALESCE((v_req.proposed_changes->>'formatted_price'), formatted_price),
    property_type_id = COALESCE((v_req.proposed_changes->>'property_type_id')::BIGINT, property_type_id),
    property_sub_type = COALESCE((v_req.proposed_changes->>'property_sub_type'), property_sub_type),
    property_condition = COALESCE((v_req.proposed_changes->>'property_condition'), property_condition),
    transaction_type = COALESCE((v_req.proposed_changes->>'transaction_type'), transaction_type),
    address = COALESCE((v_req.proposed_changes->>'address'), address),
    unparsed_address = COALESCE((v_req.proposed_changes->>'unparsed_address'), unparsed_address),
    subdivision_name = COALESCE((v_req.proposed_changes->>'subdivision_name'), subdivision_name),
    city = COALESCE((v_req.proposed_changes->>'city'), city),
    state = COALESCE((v_req.proposed_changes->>'state'), state),
    state_or_province = COALESCE((v_req.proposed_changes->>'state_or_province'), state_or_province),
    postal_code = COALESCE((v_req.proposed_changes->>'postal_code'), postal_code),
    latitude = COALESCE((v_req.proposed_changes->>'latitude')::DOUBLE PRECISION, latitude),
    longitude = COALESCE((v_req.proposed_changes->>'longitude')::DOUBLE PRECISION, longitude),
    beds = COALESCE((v_req.proposed_changes->>'beds')::INTEGER, beds),
    baths = COALESCE((v_req.proposed_changes->>'baths')::INTEGER, baths),
    bedrooms_total = COALESCE((v_req.proposed_changes->>'bedrooms_total')::SMALLINT, bedrooms_total),
    bathrooms_total_integer = COALESCE((v_req.proposed_changes->>'bathrooms_total_integer')::SMALLINT, bathrooms_total_integer),
    bathrooms_full = COALESCE((v_req.proposed_changes->>'bathrooms_full')::SMALLINT, bathrooms_full),
    bathrooms_half = COALESCE((v_req.proposed_changes->>'bathrooms_half')::SMALLINT, bathrooms_half),
    sqft = COALESCE((v_req.proposed_changes->>'sqft')::NUMERIC(10, 2), sqft),
    living_area = COALESCE((v_req.proposed_changes->>'living_area')::NUMERIC(10, 2), living_area),
    living_area_units = COALESCE((v_req.proposed_changes->>'living_area_units'), living_area_units),
    lot_size_area = COALESCE((v_req.proposed_changes->>'lot_size_area')::NUMERIC(12, 2), lot_size_area),
    lot_size_units = COALESCE((v_req.proposed_changes->>'lot_size_units'), lot_size_units),
    year_built = COALESCE((v_req.proposed_changes->>'year_built')::INTEGER, year_built),
    stories_total = COALESCE((v_req.proposed_changes->>'stories_total')::SMALLINT, stories_total),
    parking_total = COALESCE((v_req.proposed_changes->>'parking_total')::SMALLINT, parking_total),
    parking_covered = COALESCE((v_req.proposed_changes->>'parking_covered')::SMALLINT, parking_covered),
    parking_open = COALESCE((v_req.proposed_changes->>'parking_open')::SMALLINT, parking_open),
    architectural_style = COALESCE((v_req.proposed_changes->>'architectural_style'), architectural_style),
    public_remarks = COALESCE((v_req.proposed_changes->>'public_remarks'), public_remarks),
    association_fee_frequency = COALESCE((v_req.proposed_changes->>'association_fee_frequency'), association_fee_frequency),
    is_featured = COALESCE((v_req.proposed_changes->>'is_featured')::BOOLEAN, is_featured),
    standard_status = COALESCE((v_req.proposed_changes->>'standard_status'), standard_status),
    status = CASE 
      WHEN (v_req.proposed_changes->>'standard_status') = 'Active' THEN 'available'
      WHEN (v_req.proposed_changes->>'standard_status') = 'Closed' THEN 'sold'
      WHEN (v_req.proposed_changes->>'standard_status') IN ('Pending', 'Active Under Contract') THEN 'pending'
      ELSE status
    END,
    custom_reso_attributes = CASE 
      WHEN v_req.proposed_changes ? 'custom_reso_attributes' 
      THEN (v_req.proposed_changes->'custom_reso_attributes')
      ELSE custom_reso_attributes 
    END,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_req.property_id
  RETURNING to_jsonb(public.properties.*) INTO v_new;

  -- Transition edit request status to APPROVED
  UPDATE public.property_edit_requests
  SET 
    request_status = 'APPROVED',
    reviewed_by = p_broker_id,
    reviewed_at = timezone('utc'::text, now()),
    review_notes = p_review_notes,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  -- Aggregate modified keys
  FOR v_key, v_val IN SELECT * FROM jsonb_each(v_req.proposed_changes)
  LOOP
    v_changed_keys := array_append(v_changed_keys, v_key);
  END LOOP;

  -- Record audit log entry
  INSERT INTO public.property_audit_log (
    property_id,
    request_id,
    actor_id,
    action_type,
    changed_fields,
    previous_data,
    new_data,
    audit_notes
  ) VALUES (
    v_req.property_id,
    p_request_id,
    p_broker_id,
    'EDIT_APPROVED',
    v_changed_keys,
    v_previous,
    v_new,
    COALESCE(p_review_notes, v_req.agent_notes)
  );

  -- Dispatch in-app notification to agent
  INSERT INTO public.notifications (
    id,
    title,
    message,
    type,
    related_record,
    role,
    user_id
  ) VALUES (
    'notif-' || gen_random_uuid()::text,
    'Listing Edit Approved',
    'Your proposed modifications to property listing have been approved and published.',
    'property',
    v_req.property_id::text,
    'agent',
    v_req.agent_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'property_id', v_req.property_id,
    'status', 'APPROVED',
    'applied_at', now()
  );
END;
$$;


-- 4. STORED PROCEDURE: PROPOSAL REJECTION
-- Transitions status to REJECTED with mandatory remarks, logs audit event, and leaves live listing intact.
CREATE OR REPLACE FUNCTION public.reject_property_edit_request(
  p_request_id UUID,
  p_broker_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_broker_role TEXT;
  v_req RECORD;
BEGIN
  -- Verify caller role is broker or admin
  SELECT role INTO v_broker_role FROM public.profiles WHERE id = p_broker_id;
  IF v_broker_role NOT IN ('broker', 'admin') THEN
    RAISE EXCEPTION 'Access Denied: Only brokers and administrators can reject edit requests.';
  END IF;

  IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required.';
  END IF;

  -- Lock and retrieve edit request row
  SELECT * INTO v_req FROM public.property_edit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request % not found.', p_request_id;
  END IF;

  IF v_req.request_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Cannot reject request: status is already %.', v_req.request_status;
  END IF;

  -- Transition edit request status to REJECTED
  UPDATE public.property_edit_requests
  SET 
    request_status = 'REJECTED',
    reviewed_by = p_broker_id,
    reviewed_at = timezone('utc'::text, now()),
    review_notes = p_rejection_reason,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  -- Record audit log entry
  INSERT INTO public.property_audit_log (
    property_id,
    request_id,
    actor_id,
    action_type,
    changed_fields,
    previous_data,
    new_data,
    audit_notes
  ) VALUES (
    v_req.property_id,
    p_request_id,
    p_broker_id,
    'EDIT_REJECTED',
    '{}',
    v_req.original_snapshot,
    v_req.proposed_changes,
    p_rejection_reason
  );

  -- Dispatch in-app notification to agent with rejection remarks
  INSERT INTO public.notifications (
    id,
    title,
    message,
    type,
    related_record,
    role,
    user_id
  ) VALUES (
    'notif-' || gen_random_uuid()::text,
    'Listing Edit Declined',
    'Your proposed changes were declined: ' || p_rejection_reason,
    'property',
    v_req.property_id::text,
    'agent',
    v_req.agent_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'REJECTED',
    'rejected_at', now()
  );
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Hardens public.properties, public.property_edit_requests, and public.property_audit_log

-- 5.1 Hardened Policies for public.properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Properties are publicly viewable by anyone." ON public.properties;
CREATE POLICY "Properties are publicly viewable by anyone."
  ON public.properties FOR SELECT
  USING (
    standard_status = 'Active' OR 
    (auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR 
      list_agent_key = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    ))
  );

DROP POLICY IF EXISTS "Authenticated users can insert new properties." ON public.properties;
DROP POLICY IF EXISTS "Only brokers and admins can insert properties" ON public.properties;
CREATE POLICY "Only brokers and admins can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

DROP POLICY IF EXISTS "Property creators or admins can update properties." ON public.properties;
DROP POLICY IF EXISTS "Only brokers and admins can update properties" ON public.properties;
CREATE POLICY "Only brokers and admins can update properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

DROP POLICY IF EXISTS "Property creators or admins can delete properties." ON public.properties;
DROP POLICY IF EXISTS "Only brokers and admins can delete properties" ON public.properties;
CREATE POLICY "Only brokers and admins can delete properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'broker')
    )
  );

-- 5.2 Policies for public.property_edit_requests
ALTER TABLE public.property_edit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Edit requests readable by assigned agent and brokers" ON public.property_edit_requests;
CREATE POLICY "Edit requests readable by assigned agent and brokers"
  ON public.property_edit_requests FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
  );

DROP POLICY IF EXISTS "Agents can submit edit requests for assigned properties only" ON public.property_edit_requests;
CREATE POLICY "Agents can submit edit requests for assigned properties only"
  ON public.property_edit_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = agent_id AND
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND list_agent_key = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can cancel pending; brokers can review" ON public.property_edit_requests;
CREATE POLICY "Agents can cancel pending; brokers can review"
  ON public.property_edit_requests FOR UPDATE
  TO authenticated
  USING (
    (agent_id = auth.uid() AND request_status = 'PENDING') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker'))
  );

DROP POLICY IF EXISTS "Only admins can delete edit requests" ON public.property_edit_requests;
CREATE POLICY "Only admins can delete edit requests"
  ON public.property_edit_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5.3 Policies for public.property_audit_log
ALTER TABLE public.property_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs viewable by authorized roles" ON public.property_audit_log;
CREATE POLICY "Audit logs viewable by authorized roles"
  ON public.property_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'broker')) OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND list_agent_key = auth.uid())
  );

COMMIT;
