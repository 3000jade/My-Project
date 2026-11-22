-- Drop unused columns from public.properties to match the cleaned 5-step Create Listing form
-- 1. Drop FTS index before dropping columns it references (unparsed_address, subdivision_name)
DROP INDEX IF EXISTS public.idx_properties_fts;

-- 2. Drop the 12 unused columns from public.properties
ALTER TABLE public.properties
  DROP COLUMN IF EXISTS tagline,
  DROP COLUMN IF EXISTS subdivision_name,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS stories_total,
  DROP COLUMN IF EXISTS year_built,
  DROP COLUMN IF EXISTS architectural_style,
  DROP COLUMN IF EXISTS bathrooms_full,
  DROP COLUMN IF EXISTS bathrooms_half,
  DROP COLUMN IF EXISTS parking_covered,
  DROP COLUMN IF EXISTS parking_open,
  DROP COLUMN IF EXISTS unparsed_address,
  DROP COLUMN IF EXISTS association_fee_frequency;

-- 3. Rebuild Full-Text Search index using active location & text columns
CREATE INDEX IF NOT EXISTS idx_properties_fts ON public.properties USING gin (
  to_tsvector(
    'english'::regconfig,
    COALESCE(title, ''::text) || ' ' ||
    COALESCE(address, ''::text) || ' ' ||
    COALESCE(city, ''::text) || ' ' ||
    COALESCE(barangay, ''::text) || ' ' ||
    COALESCE(public_remarks, ''::text)
  )
);

-- 4. Keep apply_property_edit_request aligned with surviving public.properties columns
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
  SELECT role INTO v_broker_role FROM public.profiles WHERE id = p_broker_id;
  IF v_broker_role NOT IN ('broker', 'admin') THEN
    RAISE EXCEPTION 'Access Denied: Only brokers and administrators can approve edit requests.';
  END IF;

  SELECT * INTO v_req FROM public.property_edit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request % not found.', p_request_id;
  END IF;

  IF v_req.request_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Cannot approve request: status is already %.', v_req.request_status;
  END IF;

  SELECT * INTO v_prop FROM public.properties WHERE id = v_req.property_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target property % does not exist.', v_req.property_id;
  END IF;

  v_previous := to_jsonb(v_prop);

  UPDATE public.properties
  SET
    title = COALESCE((v_req.proposed_changes->>'title'), title),
    price = COALESCE((v_req.proposed_changes->>'price')::NUMERIC(15, 2), price),
    formatted_price = COALESCE((v_req.proposed_changes->>'formatted_price'), formatted_price),
    property_type = COALESCE((v_req.proposed_changes->>'property_type'), property_type),
    property_sub_type = COALESCE((v_req.proposed_changes->>'property_sub_type'), property_sub_type),
    property_condition = COALESCE((v_req.proposed_changes->>'property_condition'), property_condition),
    transaction_type = COALESCE((v_req.proposed_changes->>'transaction_type'), transaction_type),
    address = COALESCE((v_req.proposed_changes->>'address'), address),
    building_name = COALESCE((v_req.proposed_changes->>'building_name'), building_name),
    city = COALESCE((v_req.proposed_changes->>'city'), city),
    state_or_province = COALESCE((v_req.proposed_changes->>'state_or_province'), state_or_province),
    region = COALESCE((v_req.proposed_changes->>'region'), region),
    barangay = COALESCE((v_req.proposed_changes->>'barangay'), barangay),
    latitude = COALESCE((v_req.proposed_changes->>'latitude')::DOUBLE PRECISION, latitude),
    longitude = COALESCE((v_req.proposed_changes->>'longitude')::DOUBLE PRECISION, longitude),
    beds = COALESCE((v_req.proposed_changes->>'beds')::INTEGER, beds),
    baths = COALESCE((v_req.proposed_changes->>'baths')::INTEGER, baths),
    bedrooms_total = COALESCE((v_req.proposed_changes->>'bedrooms_total')::SMALLINT, bedrooms_total),
    bathrooms_total_integer = COALESCE((v_req.proposed_changes->>'bathrooms_total_integer')::SMALLINT, bathrooms_total_integer),
    sqft = COALESCE((v_req.proposed_changes->>'sqft')::NUMERIC(10, 2), sqft),
    living_area = COALESCE((v_req.proposed_changes->>'living_area')::NUMERIC(10, 2), living_area),
    living_area_units = COALESCE((v_req.proposed_changes->>'living_area_units'), living_area_units),
    lot_size_area = COALESCE((v_req.proposed_changes->>'lot_size_area')::NUMERIC(12, 2), lot_size_area),
    lot_size_units = COALESCE((v_req.proposed_changes->>'lot_size_units'), lot_size_units),
    parking_total = COALESCE((v_req.proposed_changes->>'parking_total')::SMALLINT, parking_total),
    public_remarks = COALESCE((v_req.proposed_changes->>'public_remarks'), public_remarks),
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

  UPDATE public.property_edit_requests
  SET
    request_status = 'APPROVED',
    reviewed_by = p_broker_id,
    reviewed_at = timezone('utc'::text, now()),
    review_notes = p_review_notes,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  FOR v_key, v_val IN SELECT * FROM jsonb_each(v_req.proposed_changes)
  LOOP
    v_changed_keys := array_append(v_changed_keys, v_key);
  END LOOP;

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
    'Your proposed modifications to the property listing have been approved and published to live.',
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
