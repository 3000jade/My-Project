// ==============================================================================
// Shared Agent Contracts and Types
// ==============================================================================

export type AgentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'departed';

export type OnboardingStatus = 'incomplete' | 'pending_review' | 'complete' | 'rejected';

export type RoutingAvailability = 'available' | 'paused' | 'scheduled_unavailable';

export type InvitationStatus = 'pending' | 'claiming' | 'accepted' | 'used' | 'revoked' | 'expired';

export type AgentRestrictedOperation =
  | 'create_listing'
  | 'edit_listing'
  | 'publish_listing'
  | 'receive_lead'
  | 'assign_listing';

export interface DocumentAttachment {
  id?: string;
  name: string;
  kind?: 'prc' | 'dhsud' | 'government_id' | 'other';
  fileId?: string;
  webViewLink?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
}

export interface OnboardingChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  required: boolean;
  detail?: string;
}

export interface AgentCompletenessInfo {
  completedRequired: number;
  totalRequired: number;
  percent: number;
  missingFields: string[];
  isComplete: boolean;
  checklist?: OnboardingChecklistItem[];
}

export type LicenseStatus = 'VALID' | 'FOR_REVIEW' | 'EXPIRED' | 'UNKNOWN' | 'NOT_PROVIDED';

export interface AgentTeamDTO {
  id: string;
  brokerage_id: string;
  name: string;
  description?: string | null;
  lead_agent_id?: string | null;
  lead_agent_name?: string | null;
  member_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyScheduleWindow {
  enabled: boolean;
  start: string;
  end: string;
}

export interface BlackoutDateWindow {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface AgentAvailabilityScheduleDTO {
  agent_id: string;
  brokerage_id?: string | null;
  routing_availability: RoutingAvailability;
  timezone: string;
  weekly_schedule: Record<string, DailyScheduleWindow>;
  blackout_dates: BlackoutDateWindow[];
  max_active_inquiries: number;
  auto_pause_on_capacity: boolean;
  away_message?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

export interface AgentProfileDTO {
  id: string;
  name: string;
  role?: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  brokerage_id?: string | null;
  brokerage_name?: string | null;
  team_id?: string | null;
  team_name?: string | null;
  membership_status?: MembershipStatus;
  onboarding_status?: OnboardingStatus;
  routing_availability?: RoutingAvailability;
  can_create_listings?: boolean;
  access_tier?: string | null;
  commission_tier?: string | null;
  location_branch?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  internal_notes?: string | null;
  prc_license_no?: string | null;
  prc_validity?: string | null;
  dhsud_accreditation_no?: string | null;
  dhsud_validity?: string | null;
  verification_status: AgentVerificationStatus;
  license_status?: LicenseStatus;
  rejection_remarks?: string | null;
  suspension_reason?: string | null;
  suspension_notes?: string | null;
  suspended_by?: string | null;
  suspended_at?: string | null;
  departed_by?: string | null;
  departed_at?: string | null;
  departure_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  supporting_documents?: DocumentAttachment[];
  experience_years?: number | null;
  bio?: string | null;
  assigned_properties_count: number;
  active_inquiries_count: number;
  upcoming_appointments_count: number;
  recorded_sales_count: number;
  total_sales_value: number;
  last_activity?: string;
  created_at?: string | null;
  completeness?: AgentCompletenessInfo;
  availability_schedule?: AgentAvailabilityScheduleDTO;
}

/**
 * Approved Public Agent Profile exposed to Clients (strips all internal & compliance fields)
 */
export interface PublicAgentProfileDTO {
  id: string;
  name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  experience_years?: number | null;
  license_status: 'VALID';
  prc_verified: boolean;
  dhsud_verified: boolean;
  brokerage_id?: string | null;
  brokerage_name: string;
  team_name?: string | null;
  routing_availability?: RoutingAvailability;
  assigned_properties_count: number;
  assigned_properties?: Array<{
    id: string;
    title: string;
    city: string;
    price: number;
    formatted_price?: string | null;
    status: string;
  }>;
}

export interface ResponsibilityPreviewItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  entityType: 'listing' | 'inquiry' | 'appointment';
  createdAt?: string;
}

export interface ResponsibilityPreviewDTO {
  agent_id: string;
  agent_name: string;
  brokerage_id: string;
  counts: {
    listings: number;
    inquiries: number;
    appointments: number;
    total: number;
  };
  listings: ResponsibilityPreviewItem[];
  inquiries: ResponsibilityPreviewItem[];
  appointments: ResponsibilityPreviewItem[];
  eligible_target_agents: Array<{
    id: string;
    name: string;
    email: string;
    team_name?: string | null;
    routing_availability: RoutingAvailability;
    active_inquiries_count: number;
    assigned_properties_count: number;
  }>;
}

export interface ResponsibilityTransferRequestDTO {
  targetAgentId?: string | null; // null or undefined = Brokerage Unassigned Queue
  scopes?: Array<'listings' | 'inquiries' | 'appointments'>;
  listingIds?: string[];
  inquiryIds?: string[];
  appointmentIds?: string[];
  triggerType?: 'suspension' | 'departure' | 'manual_transfer';
  idempotencyKey?: string;
  notes?: string;
}

export interface TransferredItemResult {
  entityType: 'listing' | 'inquiry' | 'appointment';
  entityId: string;
  title?: string;
  fromAgentId: string;
  toAgentId: string | null;
  status: 'transferred' | 'queued_unassigned' | 'failed';
  error?: string;
}

export interface ResponsibilityTransferResultDTO {
  id: string;
  brokerage_id: string;
  source_agent_id: string;
  target_agent_id: string | null;
  initiated_by: string;
  trigger_type: 'suspension' | 'departure' | 'manual_transfer';
  status: 'in_progress' | 'completed' | 'partial_failure' | 'failed';
  idempotency_key?: string | null;
  summary_counts: {
    listings: number;
    inquiries: number;
    appointments: number;
    failed: number;
  };
  transferred_items: TransferredItemResult[];
  notes?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface AgentAuditEventDTO {
  id: string;
  actor_id: string;
  actor_name?: string;
  target_id: string;
  target_name?: string;
  brokerage_id?: string | null;
  event_type?: string;
  prior_status: string;
  new_status: string;
  reason?: string | null;
  changed_fields?: Record<string, any>;
  created_at: string;
}

/**
 * Full Agent Invitation record (used internally or for single-use creation response)
 */
export interface AgentInvitationDTO {
  id: string;
  email: string;
  token?: string;
  token_digest?: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by?: string | null;
  brokerage_id?: string | null;
  team_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string;
  broker_agency?: string | null;
  message?: string | null;
  delivery_status?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Public/List Agent Invitation item (strictly excludes raw token and token_digest)
 */
export interface AgentInvitationSummaryDTO {
  id: string;
  email: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by?: string | null;
  brokerage_id?: string | null;
  team_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string;
  broker_agency?: string | null;
  message?: string | null;
  delivery_status?: string;
  created_at: string;
  updated_at: string;
}
