// ==============================================================================
// Shared Agent Contracts and Types
// ==============================================================================

export type AgentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type InvitationStatus = 'pending' | 'used' | 'revoked' | 'expired';

export type AgentRestrictedOperation =
  | 'create_listing'
  | 'edit_listing'
  | 'publish_listing'
  | 'receive_lead';

export interface DocumentAttachment {
  id?: string;
  name: string;
  fileId?: string;
  webViewLink?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
}

export interface AgentCompletenessInfo {
  completedRequired: number;
  totalRequired: number;
  percent: number;
  missingFields: string[];
  isComplete: boolean;
}

export interface AgentProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  prc_license_no: string;
  prc_validity: string;
  dhsud_accreditation_no: string;
  dhsud_validity: string;
  verification_status: AgentVerificationStatus;
  license_status?: 'VALID' | 'FOR_REVIEW' | 'EXPIRED';
  rejection_remarks?: string;
  suspension_reason?: string;
  suspension_notes?: string;
  suspended_by?: string;
  suspended_at?: string;
  verified_by?: string;
  verified_at?: string;
  supporting_documents?: DocumentAttachment[];
  experience_years: number;
  bio: string;
  assigned_properties_count: number;
  active_inquiries_count: number;
  upcoming_appointments_count: number;
  recorded_sales_count: number;
  total_sales_value: number;
  last_activity?: string;
  completeness?: AgentCompletenessInfo;
}

export interface AgentInvitationDTO {
  id: string;
  email: string;
  token?: string;
  token_digest?: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  broker_agency?: string;
  message?: string;
  delivery_status?: string;
  created_at: string;
  updated_at: string;
}
