export type InquiryBusinessStatus = 'active' | 'inactive';

export type InquiryOperationalStatus =
  | 'unassigned'
  | 'awaiting_agent'
  | 'awaiting_client'
  | 'overdue'
  | 'none';

export type InquiryInactiveOutcome =
  | 'resolved'
  | 'withdrawn'
  | 'closed'
  | 'duplicate'
  | 'no_longer_pursued'
  | 'purchased'
  | 'not_interested'
  | 'unresponsive'
  | 'other';

export interface InquiryChatSession {
  id: string;
  inquiryId: string;
  clientId?: string;
  agentId?: string;
  status: 'waiting' | 'ongoing' | 'ended' | 'timed_out' | 'escalated';
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  endedBy?: string;
  endReason?: string;
}

export interface InquiryFollowUpTask {
  id: string;
  inquiryId: string;
  assignedTo: string;
  createdBy?: string;
  title: string;
  notes?: string;
  dueAt: string;
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  completedAt?: string;
  createdAt: string;
}

export interface AiFactCitation {
  value: string;
  sourceMessageIds: string[];
  basis: 'explicit' | 'inferred' | 'not_provided';
}

export interface InquiryAiSummarySections {
  clientIdentity: {
    accountName: string;
    accountEmail: string;
    accountPhone: string;
    contactVerified: boolean;
    conversationStatedDetails: AiFactCitation;
  };
  propertyRequirements: {
    relatedListing: string;
    preferredLocations: AiFactCitation;
    budget: AiFactCitation;
    preferences: AiFactCitation;
  };
  intentAndTimeline: {
    intent: AiFactCitation;
    urgency: AiFactCitation;
    timeline: AiFactCitation;
  };
  questionsAndConcerns: {
    mainQuestions: string[];
    answersProvided: string[];
    unresolvedItems: string[];
    sourceMessageIds: string[];
  };
  agreedNextSteps: {
    nextSteps: string;
    responsiblePerson: string;
    followUpDates: string;
    viewingRequests: string;
    sourceMessageIds: string[];
  };
  inquiryStatusSnapshot: {
    businessStatus: InquiryBusinessStatus;
    operationalStatus: InquiryOperationalStatus;
    workflowStatus: string;
    assignedAgentName: string;
    snapshotTimestamp: string;
  };
}

export interface InquiryAiSummary {
  id: string;
  inquiryId: string;
  sessionId?: string;
  version: number;
  generationStatus: 'pending' | 'generating' | 'ready' | 'failed' | 'outdated';
  reviewStatus: 'unreviewed' | 'reviewed' | 'corrected' | 'approved';
  coveredFromMessageId: string;
  coveredToMessageId: string;
  coveredMessageCount: number;
  modelVersion: string;
  templateVersion: string;
  sections: InquiryAiSummarySections;
  staffCorrections?: Record<string, any>;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  errorMessage?: string;
  promptInjectionBlocked?: boolean;
  clientShared?: boolean;
  generatedAt: string;
}

export interface AuditEventRecord {
  id: string;
  eventType: string;
  actorId?: string | null;
  actorName?: string;
  actorType: 'human' | 'guest' | 'system' | 'integration';
  actorRole?: string;
  brokerageId: string;
  inquiryId?: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure' | 'denied';
  reason?: string;
  correlationId: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface NotificationDeliveryAttempt {
  id: string;
  jobId: string;
  attemptNumber: number;
  status: 'sent' | 'delivered' | 'failed';
  providerRef?: string;
  sanitizedError?: string;
  createdAt: string;
}

export interface NotificationJobRecord {
  id: string;
  dedupeKey: string;
  eventType: string;
  inquiryId?: string;
  recipientId: string;
  recipientRole?: string;
  recipientContact?: string;
  channel: 'system' | 'email' | 'whatsapp';
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'suppressed';
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  providerRef?: string;
  lastError?: string;
  payload: Record<string, any>;
  attempts: NotificationDeliveryAttempt[];
  createdAt: string;
  updatedAt: string;
}

export type RevokeReason =
  | 'user_logout'
  | 'user_manual_revoke'
  | 'password_reset'
  | 'inactivity_timeout'
  | 'absolute_timeout'
  | 'all_device_revocation'
  | 'account_disabled'
  | 'admin_action';

export interface AuthSessionRecord {
  id: string; // Stable UUID session identifier (matches Supabase JWT session_id)
  tokenHash?: string; // SHA-256 hash of active Bearer token (no raw credentials stored at rest)
  token?: string; // Deprecated legacy in-memory reference during transition
  userId: string;
  role: string;
  createdAt: number;
  lastActiveAt: number;
  idleExpiresAt: number;
  absoluteExpiresAt: number;
  revokedAt?: number;
  revokeReason?: RevokeReason | string;
  lastHeartbeatAt?: number;
  userAgent?: string;
  ipAddress?: string;
  updatedAt?: number;
}
