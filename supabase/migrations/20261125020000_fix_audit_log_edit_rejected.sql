-- Allow EDIT_REJECTED in property_audit_log.action_type so reject_property_edit_request succeeds
ALTER TABLE public.property_audit_log
  DROP CONSTRAINT IF EXISTS property_audit_log_action_type_check;

ALTER TABLE public.property_audit_log
  ADD CONSTRAINT property_audit_log_action_type_check
  CHECK (action_type IN ('CREATED', 'EDIT_APPROVED', 'EDIT_REJECTED', 'DIRECT_UPDATE', 'STATUS_CHANGE', 'MEDIA_UPDATE', 'DELETED'));
