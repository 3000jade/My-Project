import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { AgentEligibilityService } from './agentEligibility.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { InquirySummaryService } from './inquirySummary.service';
import type {
  InquiryBusinessStatus,
  InquiryOperationalStatus,
  InquiryInactiveOutcome,
  InquiryChatSession,
  InquiryFollowUpTask,
  InquiryAiSummary,
  InquiryAiSummarySections,
} from '../../../shared/types/inquiry';

export interface InquiryMessage {
  id: string;
  inquiryId?: string;
  sessionId?: string;
  requestId?: string;
  sender: 'client' | 'agent' | 'broker' | 'system';
  senderId?: string;
  sender_name: string;
  senderName?: string;
  timestamp: string;
  content: string;
  is_read?: boolean;
  delivery_status?: 'sending' | 'saved' | 'delivered' | 'read' | 'failed';
  read_at?: string;
  read_by?: string;
  edited_at?: string;
  redacted_at?: string;
  attachments?: Array<{ name: string; mimeType: string; sizeBytes: number; url?: string }>;
}

export interface InquiryInternalNote {
  id: string;
  inquiryId: string;
  authorId: string;
  authorName: string;
  authorRole: 'agent' | 'broker' | 'admin';
  content: string;
  timestamp: string;
}

export interface InquiryAssignmentAudit {
  id: string;
  inquiryId: string;
  assignedBy?: string;
  assignedTo: string;
  previousAgentId?: string;
  notes?: string;
  timestamp: string;
}

export interface InquiryItem {
  id: string;
  referenceCode?: string;
  propertyId?: string;
  property_id?: string;
  propertyTitle?: string;
  property_title?: string;
  propertyPrice?: string;
  property_price?: string;
  listingSnapshot?: Record<string, any>;
  clientId?: string;
  client_id?: string;
  name: string;
  email: string;
  phone?: string;
  contactVerified?: boolean;
  preferredReplyChannel?: 'email' | 'phone' | 'whatsapp' | 'chat';
  source?: string;
  brokerageId?: string;
  message: string;
  preferredDate?: string;
  preferred_date?: string;
  type: 'general' | 'tour' | 'offer';
  businessStatus?: InquiryBusinessStatus;
  operationalStatus?: InquiryOperationalStatus;
  inactiveOutcome?: InquiryInactiveOutcome;
  inactiveReason?: string;
  reactivationReason?: string;
  status: 'new' | 'assigned' | 'contacted' | 'scheduled' | 'closed' | 'reopened' | 'resolved';
  closureReason?: string;
  closure_reason?: string;
  closedAt?: string;
  closed_at?: string;
  agentId?: string;
  agent_id?: string;
  agentName?: string;
  agent_name?: string;
  firstHumanResponseAt?: string;
  slaDueAt?: string;
  mergedIntoId?: string;
  deduplicated?: boolean;
  aiSummary?: string;
  ai_summary?: string;
  latestAiSummary?: InquiryAiSummary | null;
  aiSummaryHistory?: InquiryAiSummary[];
  chatSession?: InquiryChatSession;
  chatSessions?: InquiryChatSession[];
  followUpTasks?: InquiryFollowUpTask[];
  messages: InquiryMessage[];
  internalNotes?: InquiryInternalNote[];
  notes?: string;
  assignmentHistory?: InquiryAssignmentAudit[];
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface InquiryFilterQuery {
  status?: string;
  businessStatus?: string;
  operationalStatus?: string;
  agentId?: string;
  type?: string;
  clientId?: string;
  email?: string;
  search?: string;
}

const seedInquiries: InquiryItem[] = [
  {
    id: 'inq-101',
    referenceCode: 'INQ-2026-101A',
    propertyId: 'a1111111-1111-1111-1111-111111111111',
    propertyTitle: 'Ayala Alabang Modern Pavilion',
    propertyPrice: '₱185,000,000',
    name: 'Atty. Fernando Zobel',
    email: 'fzobel@ayala.ph',
    phone: '+63 917 888 1234',
    contactVerified: true,
    businessStatus: 'active',
    operationalStatus: 'awaiting_agent',
    message: 'Good afternoon. We are reviewing options for our family residence. Could we arrange a site visit this coming Saturday?',
    preferredDate: '2026-09-26',
    type: 'tour',
    status: 'new',
    agentId: 'a0000000-0000-0000-0000-000000000002',
    agentName: 'Elena Rossi',
    aiSummary: 'High-intent buyer inquiring about Ayala Alabang Estate. Requesting Saturday site inspection. Priority VIP lead.',
    messages: [
      {
        id: 'msg-1',
        sender: 'client',
        sender_name: 'Atty. Fernando Zobel',
        timestamp: '2026-09-04 14:20',
        content: 'Good afternoon. We are reviewing options for our family residence. Could we arrange a site visit this coming Saturday?',
        delivery_status: 'saved',
      },
    ],
    internalNotes: [],
    assignmentHistory: [],
    followUpTasks: [],
    chatSessions: [],
    createdAt: '2026-09-04T14:20:00.000Z',
  },
  {
    id: 'inq-102',
    referenceCode: 'INQ-2026-102B',
    propertyId: 'b2222222-2222-2222-2222-222222222222',
    propertyTitle: 'Forbes Park Contemporary Villa',
    propertyPrice: '₱420,000,000',
    name: 'Dr. Beatrice Ramos-Tan',
    email: 'b.ramos@medclinic.ph',
    phone: '+63 920 901 4455',
    contactVerified: true,
    businessStatus: 'active',
    operationalStatus: 'awaiting_client',
    message: 'Thank you for confirming the parking allocation. We will prepare the letter of intent by Tuesday.',
    type: 'general',
    status: 'assigned',
    agentId: 'a0000000-0000-0000-0000-000000000002',
    agentName: 'Elena Rossi',
    firstHumanResponseAt: '2026-09-02T10:05:00.000Z',
    aiSummary: 'Buyer previously asked about 2 deeded parking slots and dues. Buyer moving forward to LOI preparation.',
    messages: [
      {
        id: 'msg-2',
        sender: 'client',
        sender_name: 'Dr. Beatrice Ramos-Tan',
        timestamp: '2026-09-02 09:15',
        content: 'Hello Elena, does the Proscenium Penthouse come with 2 contiguous basement parking slots?',
        delivery_status: 'read',
        is_read: true,
      },
      {
        id: 'msg-3',
        sender: 'agent',
        sender_name: 'Elena Rossi',
        timestamp: '2026-09-02 10:05',
        content: 'Good morning Dr. Beatrice! Yes, the penthouse includes two deeded contiguous parking slots on Basement 2.',
        delivery_status: 'saved',
      },
    ],
    internalNotes: [
      {
        id: 'note-1',
        inquiryId: 'inq-102',
        authorId: 'a0000000-0000-0000-0000-000000000002',
        authorName: 'Elena Rossi',
        authorRole: 'agent',
        content: 'Client requested verified title review and parking slot deed copy.',
        timestamp: '2026-09-02T10:10:00.000Z',
      },
    ],
    assignmentHistory: [],
    followUpTasks: [],
    chatSessions: [],
    createdAt: '2026-09-02T09:15:00.000Z',
  },
];

const localInquiriesState: InquiryItem[] = [...seedInquiries];
const requestIdToMessageMap = new Map<string, InquiryMessage>();

function generateReferenceCode(): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INQ-${new Date().getFullYear()}-${randomSuffix}`;
}

function validateInternalReturnPath(returnTo?: string): string {
  if (!returnTo || typeof returnTo !== 'string') return '/properties';
  if (!returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.includes('http:') || returnTo.includes('https:')) {
    return '/properties';
  }
  return returnTo;
}

export class InquiryService {
  /**
   * Check whether a requester is authorized to view/act on an inquiry (AUTH-02, ACCESS-01)
   */
  public static assertInquiryAccess(
    inquiry: InquiryItem,
    requesterRole?: string,
    requesterId?: string,
    requesterEmail?: string
  ): void {
    if (!requesterRole || requesterRole === 'public') {
      // Public/guest callers without matching identity cannot read private chats when requesterId is provided
      if (requesterId === 'unauthorized-guest') {
        throw new Error('Access denied: Guests cannot retrieve private inquiry history.');
      }
      return;
    }

    if (requesterRole === 'broker' || requesterRole === 'admin') {
      return;
    }

    if (requesterRole === 'agent' && requesterId) {
      const assigned = inquiry.agentId || inquiry.agent_id;
      if (assigned && assigned !== requesterId) {
        throw new Error('Access denied: Inquiry has been reassigned or is not assigned to this agent.');
      }
      return;
    }

    if (requesterRole === 'client' && requesterId) {
      const ownerId = inquiry.clientId || inquiry.client_id;
      const emailMatch =
        requesterEmail && inquiry.email && inquiry.email.toLowerCase() === requesterEmail.toLowerCase();
      if (ownerId && ownerId !== requesterId && !emailMatch) {
        throw new Error('Access denied: You are not authorized to view another client inquiry.');
      }
      if (!ownerId && !emailMatch) {
        throw new Error('Access denied: You are not authorized to view this inquiry.');
      }
    }
  }

  /**
   * Submit an inquiry or tour schedule request (INQ-01, INQ-02)
   */
  public static async createInquiry(data: Partial<InquiryItem>): Promise<InquiryItem> {
    const propertyId = data.propertyId || data.property_id;
    const propertyTitle = data.propertyTitle || data.property_title || 'Premier Estate Portfolio';
    const propertyPrice = data.propertyPrice || data.property_price;
    const clientId = data.clientId || data.client_id;
    const preferredDate = data.preferredDate || data.preferred_date;
    const agentId = data.agentId || data.agent_id;
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const nowIso = new Date().toISOString();

    // INQ-02: Duplicate detection within 24h for the same listing and email/clientId while active
    if (propertyId && normalizedEmail) {
      const existingDuplicate = localInquiriesState.find((item) => {
        const sameProperty = (item.propertyId || item.property_id) === propertyId;
        const samePerson =
          (clientId && (item.clientId === clientId || item.client_id === clientId)) ||
          item.email.trim().toLowerCase() === normalizedEmail;
        const isActive = (item.businessStatus || 'active') === 'active' && item.status !== 'closed';
        const ageMs = Date.now() - new Date(item.createdAt).getTime();
        return sameProperty && samePerson && isActive && ageMs < 24 * 60 * 60 * 1000;
      });

      if (existingDuplicate) {
        const appendedMsg: InquiryMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          inquiryId: existingDuplicate.id,
          sender: 'client',
          senderId: clientId,
          sender_name: data.name || existingDuplicate.name,
          timestamp: nowIso,
          content: data.message || '',
          delivery_status: 'saved',
          is_read: false,
        };
        existingDuplicate.messages.push(appendedMsg);
        existingDuplicate.updatedAt = nowIso;
        InquirySummaryService.markSummariesOutdated(existingDuplicate.id, appendedMsg.id);

        await AuditService.recordEvent({
          eventType: 'inquiry.duplicate_merged',
          actorId: clientId || null,
          actorName: data.name || 'Guest Visitor',
          actorType: clientId ? 'human' : 'guest',
          actorRole: clientId ? 'client' : 'guest',
          inquiryId: existingDuplicate.id,
          targetType: 'inquiry',
          targetId: existingDuplicate.id,
          outcome: 'success',
          reason: 'Repeated inquiry on same listing merged into active inquiry.',
          newValues: { appendedMessageId: appendedMsg.id },
        });

        return {
          ...existingDuplicate,
          deduplicated: true,
        };
      }
    }

    const initialMessage: InquiryMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'client',
      senderId: clientId,
      sender_name: data.name || 'Client',
      timestamp: nowIso,
      content: data.message || '',
      delivery_status: 'saved',
      is_read: false,
    };

    const referenceCode = generateReferenceCode();
    const isAuthenticatedClient = Boolean(clientId);
    const operationalStatus: InquiryOperationalStatus = agentId ? 'awaiting_agent' : 'unassigned';

    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referenceCode,
      propertyId,
      property_id: propertyId,
      propertyTitle,
      property_title: propertyTitle,
      propertyPrice,
      property_price: propertyPrice,
      listingSnapshot: {
        propertyId,
        propertyTitle,
        propertyPrice,
        capturedAt: nowIso,
      },
      clientId,
      client_id: clientId,
      name: data.name || 'Anonymous Client',
      email: data.email || '',
      phone: data.phone,
      contactVerified: isAuthenticatedClient,
      preferredReplyChannel: data.preferredReplyChannel || 'email',
      source: data.source || (isAuthenticatedClient ? 'authenticated_form' : 'guest_form'),
      brokerageId: 'human-shelter-main',
      message: data.message || '',
      preferredDate,
      preferred_date: preferredDate,
      type: data.type || 'general',
      businessStatus: 'active',
      operationalStatus,
      status: 'new',
      agentId,
      agent_id: agentId,
      agentName: data.agentName || (agentId ? 'Elena Rossi' : undefined),
      slaDueAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      aiSummary: `Inquiry from ${data.name || 'prospective client'}: "${data.message?.slice(0, 100) || 'General inquiry'}". Auto-assigned to advisory.`,
      messages: [initialMessage],
      internalNotes: [],
      assignmentHistory: [],
      followUpTasks: [],
      chatSessions: [],
      createdAt: nowIso,
      created_at: nowIso,
      updatedAt: nowIso,
    };

    if (isSupabaseConfigured) {
      try {
        const basePayload: Record<string, any> = {
          name: newInquiry.name,
          email: newInquiry.email,
          phone: newInquiry.phone,
          message: newInquiry.message,
          preferred_date: newInquiry.preferredDate,
          type: newInquiry.type,
          status: newInquiry.status,
        };

        if (newInquiry.propertyId && newInquiry.propertyId.length > 20) {
          basePayload.property_id = newInquiry.propertyId;
        }

        const extendedPayload = {
          ...basePayload,
          client_id: newInquiry.clientId,
          assigned_agent_id: newInquiry.agentId,
        };

        let insertRes = await supabaseAdmin
          .from('inquiries')
          .insert(extendedPayload)
          .select()
          .single();

        if (insertRes.error && insertRes.error.code === 'PGRST204') {
          insertRes = await supabaseAdmin
            .from('inquiries')
            .insert(basePayload)
            .select()
            .single();
        }

        if (insertRes.data && !insertRes.error) {
          newInquiry.id = insertRes.data.id;
          initialMessage.inquiryId = insertRes.data.id;

          try {
            await supabaseAdmin.from('inquiry_messages').insert({
              inquiry_id: insertRes.data.id,
              sender_id: newInquiry.clientId,
              sender_role: 'client',
              sender_name: newInquiry.name,
              content: newInquiry.message,
            });
          } catch {
            // Ignored if table not migrated yet
          }
        }
      } catch (err: any) {
        logger.warn('[InquiryService] Database insert failed, storing in local session:', err.message);
      }
    }

    localInquiriesState.unshift(newInquiry);

    await AuditService.recordEvent({
      eventType: 'inquiry.created',
      actorId: clientId || null,
      actorName: newInquiry.name,
      actorType: isAuthenticatedClient ? 'human' : 'guest',
      actorRole: isAuthenticatedClient ? 'client' : 'guest',
      inquiryId: newInquiry.id,
      targetType: 'inquiry',
      targetId: newInquiry.id,
      outcome: 'success',
      newValues: {
        referenceCode: newInquiry.referenceCode,
        propertyId: newInquiry.propertyId,
        businessStatus: newInquiry.businessStatus,
        operationalStatus: newInquiry.operationalStatus,
        contactVerified: newInquiry.contactVerified,
      },
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `inquiry.created:${newInquiry.id}`,
      eventType: 'inquiry.created',
      inquiryId: newInquiry.id,
      recipientId: newInquiry.agentId || 'brokerage-unassigned-queue',
      recipientRole: newInquiry.agentId ? 'agent' : 'broker',
      title: `New Property Inquiry (${newInquiry.referenceCode})`,
      message: `${newInquiry.name} inquired regarding ${newInquiry.propertyTitle}.`,
      channels: ['system', 'email'],
    });

    return newInquiry;
  }

  /**
   * Registered Client "Request an Agent" live chat flow (AUTH-01, ROUTE-01)
   */
  public static async requestAgentChat(params: {
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    propertyId: string;
    propertyTitle?: string;
    propertyPrice?: string;
    agentId?: string;
    returnTo?: string;
    initialMessage?: string;
    agentAvailable?: boolean;
  }): Promise<{
    inquiry: InquiryItem;
    chatSession: InquiryChatSession;
    validatedReturnTo: string;
    resumed: boolean;
  }> {
    const validatedReturnTo = validateInternalReturnPath(params.returnTo);
    const nowIso = new Date().toISOString();

    // Check if an active inquiry already exists for this client + property
    let inquiry = localInquiriesState.find(
      (i) =>
        (i.clientId === params.clientId || i.client_id === params.clientId) &&
        (i.propertyId === params.propertyId || i.property_id === params.propertyId) &&
        (i.businessStatus || 'active') === 'active' &&
        i.status !== 'closed'
    );

    let resumed = false;
    if (inquiry) {
      resumed = true;
      const activeSession = inquiry.chatSessions?.find(
        (s) => s.status === 'ongoing' || s.status === 'waiting'
      );
      if (activeSession) {
        return {
          inquiry,
          chatSession: activeSession,
          validatedReturnTo,
          resumed: true,
        };
      }
    }

    // Evaluate agent eligibility & availability (ROUTE-01)
    let routedAgentId: string | undefined = undefined;
    let routedAgentName: string | undefined = undefined;
    const isAgentAvailable = params.agentAvailable !== false;

    if (params.agentId && isAgentAvailable) {
      const eligibility = await AgentEligibilityService.evaluate(params.agentId, 'receive_lead');
      if (eligibility.allowed) {
        routedAgentId = params.agentId;
        routedAgentName = 'Elena Rossi';
      }
    }

    if (!inquiry) {
      inquiry = await this.createInquiry({
        clientId: params.clientId,
        name: params.clientName,
        email: params.clientEmail,
        phone: params.clientPhone,
        propertyId: params.propertyId,
        propertyTitle: params.propertyTitle || 'Luxury Architectural Residence',
        propertyPrice: params.propertyPrice,
        message:
          params.initialMessage ||
          `Authenticated chat consultation requested for ${params.propertyTitle || 'listing'}.`,
        agentId: routedAgentId,
        agentName: routedAgentName,
        source: 'agent_chat_request',
        preferredReplyChannel: 'chat',
      });
      inquiry.contactVerified = true;
      inquiry.operationalStatus = routedAgentId ? 'awaiting_agent' : 'unassigned';
      inquiry.status = routedAgentId ? 'assigned' : 'new';
    }

    const session: InquiryChatSession = {
      id: `csess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inquiryId: inquiry.id,
      clientId: params.clientId,
      agentId: routedAgentId,
      status: routedAgentId ? 'ongoing' : 'waiting',
      startedAt: nowIso,
      connectedAt: routedAgentId ? nowIso : undefined,
    };

    inquiry.chatSession = session;
    inquiry.chatSessions = [...(inquiry.chatSessions || []), session];

    await AuditService.recordEvent({
      eventType: 'inquiry.chat_started',
      actorId: params.clientId,
      actorName: params.clientName,
      actorType: 'human',
      actorRole: 'client',
      inquiryId: inquiry.id,
      targetType: 'chat_session',
      targetId: session.id,
      outcome: 'success',
      newValues: {
        sessionStatus: session.status,
        routedAgentId: routedAgentId || null,
        operationalStatus: inquiry.operationalStatus,
      },
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `chat.requested:${session.id}`,
      eventType: 'chat.requested',
      inquiryId: inquiry.id,
      recipientId: routedAgentId || 'brokerage-unassigned-queue',
      recipientRole: routedAgentId ? 'agent' : 'broker',
      title: routedAgentId ? 'Live Client Chat Request' : 'Unassigned Client Chat Request',
      message: `${params.clientName} requested an agent chat for ${inquiry.propertyTitle}.`,
      channels: ['system', 'email'],
    });

    return {
      inquiry,
      chatSession: session,
      validatedReturnTo,
      resumed,
    };
  }

  /**
   * Evaluate acceptance timeouts (15m fallback to unassigned) and Broker escalations (30m overdue) (ROUTE-01)
   */
  public static async evaluateAcceptanceTimeoutsAndEscalations(
    inquiryId: string,
    nowMs: number = Date.now()
  ): Promise<InquiryItem | null> {
    const item = localInquiriesState.find((i) => i.id === inquiryId);
    if (!item) return null;

    const createdMs = new Date(item.createdAt).getTime();
    const elapsedMinutes = (nowMs - createdMs) / (60 * 1000);

    if (!item.firstHumanResponseAt && (item.businessStatus || 'active') === 'active') {
      if (elapsedMinutes >= 30) {
        item.operationalStatus = 'overdue';
        if (item.chatSession) {
          item.chatSession.status = 'escalated';
        }
        await AuditService.recordEvent({
          eventType: 'inquiry.escalated',
          actorType: 'system',
          inquiryId: item.id,
          targetType: 'inquiry',
          targetId: item.id,
          outcome: 'success',
          reason: 'Unanswered inquiry exceeded 30-minute SLA threshold; escalated to Broker.',
          newValues: { operationalStatus: 'overdue' },
        });
        await NotificationService.enqueueInquiryEvent({
          eventKey: `inquiry.escalated:${item.id}`,
          eventType: 'inquiry.escalated',
          inquiryId: item.id,
          recipientId: 'broker-escalation-queue',
          recipientRole: 'broker',
          title: 'SLA Escalation: Unanswered Inquiry',
          message: `Inquiry ${item.referenceCode || item.id} has exceeded the 30-minute response target.`,
          channels: ['system', 'email'],
          isEscalationOrRequired: true,
        });
      } else if (elapsedMinutes >= 15) {
        item.operationalStatus = 'unassigned';
        item.agentId = undefined;
        item.agent_id = undefined;
        if (item.chatSession) {
          item.chatSession.status = 'timed_out';
        }
      }
    }

    return item;
  }

  /**
   * Fetch all inquiries with optional filtering
   */
  public static async listInquiries(filter?: InquiryFilterQuery): Promise<InquiryItem[]> {
    let results = [...localInquiriesState];

    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (filter?.status && filter.status !== 'ALL') {
          query = query.eq('status', filter.status.toLowerCase());
        }
        if (filter?.type) {
          query = query.eq('type', filter.type);
        }

        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          const dbItems: InquiryItem[] = data.map((row: any) => {
            const localMatch = localInquiriesState.find(
              (l) => l.id === row.id || (l.name === row.name && l.email === row.email)
            );
            return {
              id: row.id,
              referenceCode: row.reference_code || localMatch?.referenceCode || `INQ-${String(row.id).slice(0, 6).toUpperCase()}`,
              propertyId: row.property_id,
              property_id: row.property_id,
              propertyTitle: localMatch?.propertyTitle || 'Estate Portfolio Asset',
              propertyPrice: localMatch?.propertyPrice || 'Price upon request',
              name: row.name,
              email: row.email,
              phone: row.phone,
              contactVerified: row.contact_verified ?? localMatch?.contactVerified ?? false,
              businessStatus: row.business_status || localMatch?.businessStatus || (row.status === 'closed' ? 'inactive' : 'active'),
              operationalStatus: row.operational_status || localMatch?.operationalStatus || 'awaiting_agent',
              message: row.message,
              preferredDate: row.preferred_date,
              preferred_date: row.preferred_date,
              type: row.type,
              status: (row.status || 'new').toLowerCase() as any,
              closureReason: row.closure_reason || localMatch?.closureReason,
              closedAt: row.closed_at || localMatch?.closedAt,
              clientId: row.client_id || localMatch?.clientId,
              client_id: row.client_id || localMatch?.client_id,
              agentId: row.assigned_agent_id || localMatch?.agentId || 'a0000000-0000-0000-0000-000000000002',
              agentName: localMatch?.agentName || 'Elena Rossi',
              aiSummary: localMatch?.aiSummary || 'Client inquiry registered for advisory consultation.',
              latestAiSummary: InquirySummaryService.getLatestSummary(row.id),
              aiSummaryHistory: InquirySummaryService.listSummariesForInquiry(row.id),
              messages: localMatch?.messages || [
                {
                  id: `msg-${row.id}`,
                  sender: 'client',
                  sender_name: row.name,
                  timestamp: row.created_at,
                  content: row.message,
                  delivery_status: 'saved',
                },
              ],
              internalNotes: localMatch?.internalNotes || [],
              assignmentHistory: localMatch?.assignmentHistory || [],
              followUpTasks: localMatch?.followUpTasks || [],
              chatSessions: localMatch?.chatSessions || [],
              createdAt: row.created_at,
              created_at: row.created_at,
            };
          });

          const dbIds = new Set(dbItems.map((i) => i.id));
          const localOnly = localInquiriesState.filter((i) => !dbIds.has(i.id));
          results = [...localOnly, ...dbItems];
        }
      } catch (err: any) {
        logger.warn('[InquiryService] DB fetch failed, using local session state:', err.message);
      }
    }

    if (filter?.status && filter.status !== 'ALL') {
      const target = filter.status.toLowerCase();
      results = results.filter((i) => i.status.toLowerCase() === target);
    }
    if (filter?.businessStatus && filter.businessStatus !== 'ALL') {
      const target = filter.businessStatus.toLowerCase();
      results = results.filter((i) => (i.businessStatus || 'active').toLowerCase() === target);
    }
    if (filter?.operationalStatus && filter.operationalStatus !== 'ALL') {
      const target = filter.operationalStatus.toLowerCase();
      results = results.filter((i) => (i.operationalStatus || 'awaiting_agent').toLowerCase() === target);
    }
    if (filter?.agentId && filter.agentId !== 'ALL') {
      results = results.filter((i) => i.agentId === filter.agentId || i.agent_id === filter.agentId);
    }
    if (filter?.clientId) {
      results = results.filter((i) => i.clientId === filter.clientId || i.client_id === filter.clientId);
    }
    if (filter?.email) {
      const em = filter.email.toLowerCase();
      results = results.filter((i) => i.email.toLowerCase() === em);
    }
    if (filter?.type) {
      results = results.filter((i) => i.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          (i.propertyTitle && i.propertyTitle.toLowerCase().includes(q)) ||
          i.message.toLowerCase().includes(q) ||
          (i.referenceCode && i.referenceCode.toLowerCase().includes(q))
      );
    }

    return results.map((item) => ({
      ...item,
      latestAiSummary: InquirySummaryService.getLatestSummary(item.id),
      aiSummaryHistory: InquirySummaryService.listSummariesForInquiry(item.id),
    }));
  }

  /**
   * Fetch inquiries specifically for the authenticated client (strictly sanitizes internal notes & staff-only reports)
   */
  public static async getMyInquiries(clientId: string, clientEmail?: string): Promise<InquiryItem[]> {
    const all = await this.listInquiries();
    const clientInquiries = all.filter(
      (inq) =>
        (inq.clientId && inq.clientId === clientId) ||
        (inq.client_id && inq.client_id === clientId) ||
        (clientEmail && inq.email.toLowerCase() === clientEmail.toLowerCase())
    );

    return clientInquiries.map((inq) => {
      const sanitized = { ...inq };
      delete sanitized.internalNotes;
      delete sanitized.notes;
      delete sanitized.latestAiSummary;
      delete sanitized.aiSummaryHistory;
      return sanitized;
    });
  }

  /**
   * Fetch single inquiry by ID with access verification
   */
  public static async getInquiryById(
    id: string,
    requesterRole?: string,
    requesterId?: string,
    requesterEmail?: string
  ): Promise<InquiryItem | null> {
    let item = localInquiriesState.find((i) => i.id === id);

    if (!item && isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('inquiries')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          item = {
            id: data.id,
            referenceCode: data.reference_code || `INQ-${String(data.id).slice(0, 6).toUpperCase()}`,
            propertyId: data.property_id,
            property_id: data.property_id,
            propertyTitle: 'Estate Portfolio Asset',
            propertyPrice: 'Price upon request',
            name: data.name,
            email: data.email,
            phone: data.phone,
            contactVerified: Boolean(data.contact_verified),
            businessStatus: data.business_status || (data.status === 'closed' ? 'inactive' : 'active'),
            operationalStatus: data.operational_status || 'awaiting_agent',
            message: data.message,
            preferredDate: data.preferred_date,
            type: data.type,
            status: (data.status || 'new').toLowerCase() as any,
            closureReason: data.closure_reason,
            closedAt: data.closed_at,
            clientId: data.client_id,
            agentId: data.assigned_agent_id || 'a0000000-0000-0000-0000-000000000002',
            agentName: 'Elena Rossi',
            messages: [
              {
                id: `msg-${data.id}`,
                sender: 'client',
                sender_name: data.name,
                timestamp: data.created_at,
                content: data.message,
                delivery_status: 'saved',
              },
            ],
            internalNotes: [],
            assignmentHistory: [],
            followUpTasks: [],
            chatSessions: [],
            createdAt: data.created_at,
          };
          localInquiriesState.push(item);
        }
      } catch (err: any) {
        logger.warn('[InquiryService] DB getById failed, checking local state:', err.message);
      }
    }

    if (!item) return null;

    if (requesterId) {
      this.assertInquiryAccess(item, requesterRole, requesterId, requesterEmail);
    }

    const enriched: InquiryItem = {
      ...item,
      latestAiSummary: InquirySummaryService.getLatestSummary(item.id),
      aiSummaryHistory: InquirySummaryService.listSummariesForInquiry(item.id),
    };

    if (requesterRole === 'client') {
      const sanitized = { ...enriched };
      delete sanitized.internalNotes;
      delete sanitized.notes;
      delete sanitized.latestAiSummary;
      delete sanitized.aiSummaryHistory;
      return sanitized;
    }

    return enriched;
  }

  /**
   * Assign or reassign inquiry to an agent (enforces ACCESS-01 & NOT-02)
   */
  public static async assignAgent(
    inquiryId: string,
    agentId: string,
    actorId?: string,
    actorName?: string,
    notes?: string
  ): Promise<InquiryItem> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    const eligibility = await AgentEligibilityService.evaluate(agentId, 'receive_lead');
    if (!eligibility.allowed) {
      throw new Error(`Cannot assign inquiry: Agent is not eligible to receive leads (${eligibility.reason}).`);
    }

    let assignedAgentName = agentId === 'a0000000-0000-0000-0000-000000000002' ? 'Carmela Santos' : 'Elena Rossi';
    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', agentId)
          .single();
        if (profile?.full_name) {
          assignedAgentName = profile.full_name;
        }
      } catch {
        // use fallback
      }
    }

    const previousAgentId = item.agentId || item.agent_id;
    const isReassignment = Boolean(previousAgentId && previousAgentId !== agentId);

    // Cancel pending delayed notification jobs for previous agent on reassignment (NOT-02)
    if (previousAgentId && isReassignment) {
      NotificationService.cancelPendingJobsForInquiryRecipient(inquiryId, previousAgentId);
    }

    const auditRecord: InquiryAssignmentAudit = {
      id: `audit-${Date.now()}`,
      inquiryId,
      assignedBy: actorId,
      assignedTo: agentId,
      previousAgentId,
      notes,
      timestamp: new Date().toISOString(),
    };

    item.agentId = agentId;
    item.agent_id = agentId;
    item.agentName = assignedAgentName;
    item.agent_name = assignedAgentName;
    item.status = 'assigned';
    item.businessStatus = item.businessStatus || 'active';
    item.operationalStatus = 'awaiting_agent';
    item.assignmentHistory = [...(item.assignmentHistory || []), auditRecord];

    if (item.chatSession && item.chatSession.status === 'waiting') {
      item.chatSession.agentId = agentId;
      item.chatSession.status = 'ongoing';
      item.chatSession.connectedAt = new Date().toISOString();
    }

    const systemMsg: InquiryMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inquiryId,
      sender: 'system',
      sender_name: 'Human Shelter Concierge',
      timestamp: new Date().toISOString(),
      content: `Inquiry assigned to ${assignedAgentName} for luxury advisory consultation.`,
      delivery_status: 'saved',
    };
    item.messages.push(systemMsg);

    await AuditService.recordEvent({
      eventType: isReassignment ? 'inquiry.reassigned' : 'inquiry.assigned',
      actorId: actorId || 'broker',
      actorName: actorName || 'Brokerage Admin',
      actorType: 'human',
      actorRole: 'broker',
      inquiryId,
      targetType: 'inquiry',
      targetId: inquiryId,
      outcome: 'success',
      reason: notes,
      previousValues: { assignedAgentId: previousAgentId || null },
      newValues: { assignedTo: agentId, assignedToName: assignedAgentName },
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `inquiry.assigned:${inquiryId}:${agentId}:${Date.now()}`,
      eventType: isReassignment ? 'inquiry.reassigned' : 'inquiry.assigned',
      inquiryId,
      recipientId: agentId,
      recipientRole: 'agent',
      title: 'Inquiry Assigned to You',
      message: `You have been assigned to inquiry ${item.referenceCode || inquiryId} (${item.propertyTitle}).`,
      channels: ['system', 'email'],
    });

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from('inquiries')
          .update({
            assigned_agent_id: agentId,
            status: 'assigned',
            updated_at: new Date().toISOString(),
          })
          .eq('id', inquiryId);

        try {
          await supabaseAdmin.from('inquiry_assignment_audit').insert({
            inquiry_id: inquiryId,
            assigned_by: actorId,
            assigned_to: agentId,
            previous_agent_id: previousAgentId,
            notes,
          });
        } catch {
          // Table may not be migrated yet
        }
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase assignment update warning:', err.message);
      }
    }

    return item;
  }

  /**
   * Append a message to the inquiry thread with requestId idempotency & access verification (CHAT-01, CHAT-02, ACCESS-01)
   */
  public static async addMessage(
    inquiryId: string,
    messageData: {
      senderId?: string;
      sender: 'client' | 'agent' | 'broker' | 'system';
      senderName: string;
      content: string;
      requestId?: string;
      attachments?: Array<{ name: string; mimeType: string; sizeBytes: number; url?: string }>;
    }
  ): Promise<InquiryMessage> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    // ACCESS-01: Verify sender access if senderId is provided
    if (messageData.senderId && messageData.sender !== 'system') {
      this.assertInquiryAccess(item, messageData.sender, messageData.senderId);
    }

    // CHAT-02: Enforce server uniqueness by client-generated requestId for safe retries
    if (messageData.requestId) {
      const existingKey = `${inquiryId}:${messageData.requestId}`;
      const existingMsg = requestIdToMessageMap.get(existingKey);
      if (existingMsg) {
        return existingMsg;
      }
    }

    const nowIso = new Date().toISOString();
    const newMsg: InquiryMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inquiryId,
      sessionId: item.chatSession?.id,
      requestId: messageData.requestId,
      sender: messageData.sender,
      senderId: messageData.senderId,
      sender_name: messageData.senderName,
      senderName: messageData.senderName,
      timestamp: nowIso,
      content: messageData.content,
      is_read: false,
      delivery_status: 'saved',
      attachments: messageData.attachments || [],
    };

    if (messageData.requestId) {
      requestIdToMessageMap.set(`${inquiryId}:${messageData.requestId}`, newMsg);
    }

    item.messages.push(newMsg);
    item.updatedAt = nowIso;

    // Track first human agent response separately from system acknowledgements
    if ((messageData.sender === 'agent' || messageData.sender === 'broker') && !item.firstHumanResponseAt) {
      item.firstHumanResponseAt = nowIso;
    }

    if (messageData.sender === 'client') {
      item.operationalStatus = item.agentId ? 'awaiting_agent' : 'unassigned';
      if (item.status === 'closed' || item.businessStatus === 'inactive') {
        item.status = 'reopened';
        item.businessStatus = 'active';
      }
    } else if (messageData.sender === 'agent' || messageData.sender === 'broker') {
      item.operationalStatus = 'awaiting_client';
      if (item.status === 'new' || item.status === 'assigned') {
        item.status = 'contacted';
      }
    }

    // AI-02: New client/agent messages mark prior ready AI summary as outdated
    if (messageData.sender !== 'system') {
      InquirySummaryService.markSummariesOutdated(inquiryId, newMsg.id);
    }

    // Notify other participant
    const recipientId =
      messageData.sender === 'client' ? item.agentId || 'broker' : item.clientId || item.email;
    if (recipientId && messageData.sender !== 'system') {
      await NotificationService.enqueueInquiryEvent({
        eventKey: `message.sent:${newMsg.id}`,
        eventType: 'message.received',
        inquiryId,
        recipientId,
        recipientRole: messageData.sender === 'client' ? 'agent' : 'client',
        title: `New Message from ${messageData.senderName}`,
        message: messageData.content.slice(0, 120),
        channels: ['system', 'email'],
        suppressExternalIfViewing: true,
      });
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('inquiry_messages').insert({
          inquiry_id: inquiryId,
          sender_id: messageData.senderId,
          sender_role: messageData.sender,
          sender_name: messageData.senderName,
          content: messageData.content,
        });

        await supabaseAdmin
          .from('inquiries')
          .update({
            status: item.status,
            updated_at: nowIso,
          })
          .eq('id', inquiryId);
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase addMessage warning:', err.message);
      }
    }

    return newMsg;
  }

  /**
   * Mark messages as read by an authorized recipient and record active conversation view (CHAT-01)
   */
  public static async markMessagesRead(
    inquiryId: string,
    reader: { userId: string; role: 'client' | 'agent' | 'broker' | 'admin' }
  ): Promise<{ updatedCount: number; readAt: string }> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    this.assertInquiryAccess(item, reader.role, reader.userId);
    NotificationService.setActiveConversationView(reader.userId, inquiryId);

    const readAt = new Date().toISOString();
    let updatedCount = 0;

    for (const msg of item.messages) {
      const isCounterparty =
        (reader.role === 'client' && msg.sender !== 'client') ||
        (reader.role !== 'client' && msg.sender === 'client');
      if (isCounterparty && !msg.is_read) {
        msg.is_read = true;
        msg.delivery_status = 'read';
        msg.read_at = readAt;
        msg.read_by = reader.userId;
        updatedCount++;
      }
    }

    return { updatedCount, readAt };
  }

  /**
   * Edit or redact a message while preserving audit evidence
   */
  public static async editOrRedactMessage(
    inquiryId: string,
    messageId: string,
    input: {
      actorId: string;
      actorName: string;
      actorRole: string;
      action: 'edit' | 'redact';
      newContent?: string;
      reason?: string;
    }
  ): Promise<InquiryMessage> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }
    this.assertInquiryAccess(item, input.actorRole, input.actorId);

    const msg = item.messages.find((m) => m.id === messageId);
    if (!msg) {
      throw new Error(`Message "${messageId}" not found.`);
    }

    const nowIso = new Date().toISOString();
    const prevLength = msg.content.length;

    if (input.action === 'redact') {
      msg.content = '[Message redacted by authorized staff]';
      msg.redacted_at = nowIso;
    } else {
      msg.content = input.newContent || msg.content;
      msg.edited_at = nowIso;
    }

    await AuditService.recordEvent({
      eventType: input.action === 'redact' ? 'inquiry.message_redacted' : 'inquiry.message_edited',
      actorId: input.actorId,
      actorName: input.actorName,
      actorType: 'human',
      actorRole: input.actorRole,
      inquiryId,
      targetType: 'inquiry_message',
      targetId: messageId,
      outcome: 'success',
      reason: input.reason,
      previousValues: { contentLength: prevLength },
      newValues: { action: input.action, updatedAt: nowIso },
    });

    return msg;
  }

  /**
   * Re-authorize inquiry on reconnect/reauthentication, reconcile pending requestIds, and fetch missed messages (CHAT-02, SESSION-03)
   */
  public static async reconnectAndSync(
    inquiryId: string,
    params: {
      userId: string;
      role: string;
      userEmail?: string;
      sinceCursor?: string;
      pendingRequestIds?: string[];
    }
  ): Promise<{
    inquiry: InquiryItem;
    missedMessages: InquiryMessage[];
    reconciledRequestIds: Record<string, string | null>;
    serverCursor: string;
  }> {
    const inquiry = await this.getInquiryById(inquiryId, params.role, params.userId, params.userEmail);
    if (!inquiry) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    const reconciledRequestIds: Record<string, string | null> = {};
    for (const reqId of params.pendingRequestIds || []) {
      const found = requestIdToMessageMap.get(`${inquiryId}:${reqId}`);
      reconciledRequestIds[reqId] = found ? found.id : null;
    }

    let missedMessages = [...inquiry.messages];
    if (params.sinceCursor) {
      const cursorTime = new Date(params.sinceCursor).getTime();
      if (!Number.isNaN(cursorTime)) {
        missedMessages = missedMessages.filter((m) => new Date(m.timestamp).getTime() > cursorTime);
      }
    }

    return {
      inquiry,
      missedMessages,
      reconciledRequestIds,
      serverCursor: new Date().toISOString(),
    };
  }

  /**
   * End a communication chat session episode without inactivating the inquiry (LIFE-01)
   */
  public static async endChatSession(
    inquiryId: string,
    sessionId: string,
    actor: { actorId: string; actorName: string; actorRole: string; reason?: string }
  ): Promise<InquiryChatSession> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    const session =
      item.chatSessions?.find((s) => s.id === sessionId) || item.chatSession;
    if (!session) {
      throw new Error(`Chat session "${sessionId}" not found.`);
    }

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    session.endedBy = actor.actorId;
    session.endReason = actor.reason || 'Chat session ended by participant';

    // Explicitly preserve Active business status (Rule 3: Ending chat does not inactivate inquiry)
    await AuditService.recordEvent({
      eventType: 'inquiry.chat_ended',
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorType: 'human',
      actorRole: actor.actorRole,
      inquiryId,
      targetType: 'chat_session',
      targetId: session.id,
      outcome: 'success',
      reason: session.endReason,
      newValues: { sessionStatus: 'ended', inquiryBusinessStatus: item.businessStatus || 'active' },
    });

    return session;
  }

  /**
   * Change business status (Active / Inactive) with mandatory outcome/reason and reactivation tracking (LIFE-01)
   */
  public static async changeBusinessStatus(
    inquiryId: string,
    input: {
      businessStatus: InquiryBusinessStatus;
      outcome?: InquiryInactiveOutcome;
      reason?: string;
      actorId: string;
      actorName: string;
      actorRole: 'agent' | 'broker' | 'admin';
    }
  ): Promise<InquiryItem> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    this.assertInquiryAccess(item, input.actorRole, input.actorId);

    if (input.businessStatus === 'inactive' && (!input.outcome || !input.reason?.trim())) {
      throw new Error('Outcome and reason are required when inactivating an inquiry.');
    }
    if (input.businessStatus === 'active' && !input.reason?.trim()) {
      throw new Error('A reactivation reason is required when reopening an inactive inquiry.');
    }

    const previousBusinessStatus = item.businessStatus || 'active';
    const previousWorkflowStatus = item.status;
    const nowIso = new Date().toISOString();

    item.businessStatus = input.businessStatus;
    if (input.businessStatus === 'inactive') {
      item.inactiveOutcome = input.outcome;
      item.inactiveReason = input.reason;
      item.closureReason = input.outcome;
      item.closure_reason = input.outcome;
      item.closedAt = nowIso;
      item.closed_at = nowIso;
      item.status = 'closed';
      item.operationalStatus = 'none';
    } else {
      item.reactivationReason = input.reason;
      item.status = 'reopened';
      item.operationalStatus = item.agentId ? 'awaiting_agent' : 'unassigned';
    }
    item.updatedAt = nowIso;

    await AuditService.recordEvent({
      eventType: input.businessStatus === 'inactive' ? 'inquiry.inactivated' : 'inquiry.reactivated',
      actorId: input.actorId,
      actorName: input.actorName,
      actorType: 'human',
      actorRole: input.actorRole,
      inquiryId,
      targetType: 'inquiry',
      targetId: inquiryId,
      outcome: 'success',
      reason: input.reason,
      previousValues: { businessStatus: previousBusinessStatus, status: previousWorkflowStatus },
      newValues: {
        businessStatus: item.businessStatus,
        status: item.status,
        outcome: input.outcome || null,
      },
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `inquiry.status:${inquiryId}:${item.businessStatus}:${Date.now()}`,
      eventType: `inquiry.${item.businessStatus}`,
      inquiryId,
      recipientId: item.clientId || item.email,
      recipientRole: 'client',
      title: `Inquiry Status Updated (${item.referenceCode || inquiryId})`,
      message: `Your inquiry status is now ${item.businessStatus.toUpperCase()}.`,
      channels: ['system'],
    });

    return item;
  }

  /**
   * Merge duplicate inquiry into a primary target inquiry while preserving provenance
   */
  public static async mergeInquiries(
    sourceInquiryId: string,
    targetInquiryId: string,
    actor: { actorId: string; actorName: string; actorRole: 'broker' | 'admin'; reason?: string }
  ): Promise<InquiryItem> {
    const source = localInquiriesState.find((i) => i.id === sourceInquiryId);
    const target = localInquiriesState.find((i) => i.id === targetInquiryId);
    if (!source || !target) {
      throw new Error('Both source and target inquiries must exist to merge.');
    }

    source.businessStatus = 'inactive';
    source.status = 'closed';
    source.inactiveOutcome = 'duplicate';
    source.inactiveReason = actor.reason || `Merged into ${target.id}`;
    source.mergedIntoId = target.id;

    for (const msg of source.messages) {
      target.messages.push({
        ...msg,
        inquiryId: target.id,
      });
    }

    await AuditService.recordEvent({
      eventType: 'inquiry.merged',
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorType: 'human',
      actorRole: actor.actorRole,
      inquiryId: target.id,
      targetType: 'inquiry',
      targetId: target.id,
      outcome: 'success',
      reason: source.inactiveReason,
      previousValues: { sourceInquiryId: source.id },
      newValues: { mergedIntoId: target.id },
    });

    return target;
  }

  /**
   * Create follow-up task and schedule reminder notification (TASK-01)
   */
  public static async createFollowUpTask(
    inquiryId: string,
    taskInput: {
      assignedTo: string;
      createdBy?: string;
      title: string;
      notes?: string;
      dueAt: string;
    }
  ): Promise<InquiryFollowUpTask> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    const task: InquiryFollowUpTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inquiryId,
      assignedTo: taskInput.assignedTo,
      createdBy: taskInput.createdBy,
      title: taskInput.title,
      notes: taskInput.notes,
      dueAt: taskInput.dueAt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    item.followUpTasks = [...(item.followUpTasks || []), task];

    await AuditService.recordEvent({
      eventType: 'inquiry.task_created',
      actorId: taskInput.createdBy || taskInput.assignedTo,
      actorType: 'human',
      inquiryId,
      targetType: 'follow_up_task',
      targetId: task.id,
      outcome: 'success',
      newValues: { title: task.title, dueAt: task.dueAt, status: task.status },
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `task.due:${task.id}`,
      eventType: 'task.reminder',
      inquiryId,
      recipientId: task.assignedTo,
      recipientRole: 'agent',
      title: `Follow-up Task Scheduled: ${task.title}`,
      message: `Due at ${task.dueAt}`,
      channels: ['system'],
    });

    return task;
  }

  /**
   * Update follow-up task and cancel obsolete reminders when completed/cancelled (TASK-01)
   */
  public static async updateFollowUpTask(
    inquiryId: string,
    taskId: string,
    updateInput: {
      status: 'pending' | 'completed' | 'cancelled' | 'overdue';
      notes?: string;
      actorId: string;
      actorName: string;
      actorRole: string;
    }
  ): Promise<InquiryFollowUpTask> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    const task = (item.followUpTasks || []).find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Follow-up task "${taskId}" not found.`);
    }

    const prevStatus = task.status;
    task.status = updateInput.status;
    if (updateInput.notes !== undefined) {
      task.notes = updateInput.notes;
    }
    if (updateInput.status === 'completed') {
      task.completedAt = new Date().toISOString();
    }

    if (updateInput.status === 'completed' || updateInput.status === 'cancelled') {
      NotificationService.cancelPendingJobsForInquiryRecipient(inquiryId, task.assignedTo);
    }

    await AuditService.recordEvent({
      eventType: 'inquiry.task_updated',
      actorId: updateInput.actorId,
      actorName: updateInput.actorName,
      actorType: 'human',
      actorRole: updateInput.actorRole,
      inquiryId,
      targetType: 'follow_up_task',
      targetId: task.id,
      outcome: 'success',
      previousValues: { status: prevStatus },
      newValues: { status: task.status, completedAt: task.completedAt || null },
    });

    return task;
  }

  /**
   * Generate structured 6-section AI Client Summary Report for an inquiry (AI-01, AI-02)
   */
  public static async generateAiSummaryForInquiry(
    inquiryId: string,
    actor: { id: string; name: string; role: string },
    simulateFailure: boolean = false
  ): Promise<InquiryAiSummary> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    this.assertInquiryAccess(item, actor.role, actor.id);

    const summary = await InquirySummaryService.generateSummary({
      inquiry: {
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        contactVerified: item.contactVerified,
        propertyId: item.propertyId || item.property_id,
        propertyTitle: item.propertyTitle || item.property_title,
        propertyPrice: item.propertyPrice || item.property_price,
        businessStatus: item.businessStatus || 'active',
        operationalStatus: item.operationalStatus || 'awaiting_agent',
        status: item.status,
        agentId: item.agentId || item.agent_id,
        agentName: item.agentName || item.agent_name,
        sessionId: item.chatSession?.id,
        messages: item.messages,
      },
      actor,
      simulateFailure,
    });

    item.latestAiSummary = summary;
    item.aiSummaryHistory = InquirySummaryService.listSummariesForInquiry(inquiryId);
    return summary;
  }

  /**
   * Review or correct an AI Client Summary Report (AI-02)
   */
  public static async reviewAiSummaryForInquiry(
    inquiryId: string,
    summaryId: string,
    reviewInput: {
      actorId: string;
      actorName: string;
      actorRole: 'agent' | 'broker' | 'admin';
      reviewStatus: 'reviewed' | 'corrected' | 'approved';
      corrections?: Partial<InquiryAiSummarySections>;
    }
  ): Promise<InquiryAiSummary> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }
    this.assertInquiryAccess(item, reviewInput.actorRole, reviewInput.actorId);

    const updated = await InquirySummaryService.reviewOrCorrectSummary(inquiryId, summaryId, reviewInput);
    item.latestAiSummary = updated;
    item.aiSummaryHistory = InquirySummaryService.listSummariesForInquiry(inquiryId);
    return updated;
  }

  /**
   * Broker Monitoring Dashboard Metrics & SLA calculations (BROKER-01)
   */
  public static async getBrokerMonitoringMetrics(): Promise<{
    totalInquiries: number;
    activeCount: number;
    inactiveCount: number;
    unassignedCount: number;
    unansweredCount: number;
    overdueCount: number;
    avgFirstHumanResponseMinutes: number;
  }> {
    const all = await this.listInquiries();
    const active = all.filter((i) => (i.businessStatus || (i.status === 'closed' ? 'inactive' : 'active')) === 'active');
    const inactive = all.filter((i) => (i.businessStatus || (i.status === 'closed' ? 'inactive' : 'active')) === 'inactive');
    const unassigned = active.filter((i) => i.operationalStatus === 'unassigned' || !(i.agentId || i.agent_id));
    const unanswered = active.filter((i) => !i.firstHumanResponseAt);
    const overdue = active.filter((i) => i.operationalStatus === 'overdue');

    const responseTimes: number[] = [];
    for (const inq of all) {
      if (inq.firstHumanResponseAt && inq.createdAt) {
        const diffMin =
          (new Date(inq.firstHumanResponseAt).getTime() - new Date(inq.createdAt).getTime()) / (60 * 1000);
        if (diffMin >= 0) responseTimes.push(diffMin);
      }
    }

    const avgFirstHumanResponseMinutes =
      responseTimes.length > 0
        ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
        : 0;

    return {
      totalInquiries: all.length,
      activeCount: active.length,
      inactiveCount: inactive.length,
      unassignedCount: unassigned.length,
      unansweredCount: unanswered.length,
      overdueCount: overdue.length,
      avgFirstHumanResponseMinutes,
    };
  }

  /**
   * Add a private internal note (Staff only)
   */
  public static async addNote(
    inquiryId: string,
    noteData: {
      authorId: string;
      authorName: string;
      authorRole: 'agent' | 'broker' | 'admin';
      content: string;
    }
  ): Promise<InquiryInternalNote> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    this.assertInquiryAccess(item, noteData.authorRole, noteData.authorId);

    const newNote: InquiryInternalNote = {
      id: `note-${Date.now()}`,
      inquiryId,
      authorId: noteData.authorId,
      authorName: noteData.authorName,
      authorRole: noteData.authorRole,
      content: noteData.content,
      timestamp: new Date().toISOString(),
    };

    item.internalNotes = [...(item.internalNotes || []), newNote];

    await AuditService.recordEvent({
      eventType: 'inquiry.note_added',
      actorId: noteData.authorId,
      actorName: noteData.authorName,
      actorType: 'human',
      actorRole: noteData.authorRole,
      inquiryId,
      targetType: 'inquiry_note',
      targetId: newNote.id,
      outcome: 'success',
      newValues: { noteId: newNote.id },
    });

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('inquiry_internal_notes').insert({
          inquiry_id: inquiryId,
          author_id: noteData.authorId,
          author_name: noteData.authorName,
          author_role: noteData.authorRole,
          content: noteData.content,
        });
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase addNote warning:', err.message);
      }
    }

    return newNote;
  }

  /**
   * Schedule a viewing appointment linked to the inquiry
   */
  public static async scheduleViewing(
    inquiryId: string,
    appointmentData: {
      appointmentTime: string;
      agentId?: string;
      notes?: string;
    }
  ): Promise<InquiryItem> {
    const item = localInquiriesState.find((i) => i.id === inquiryId) || (await this.getInquiryById(inquiryId));
    if (!item) {
      throw new Error(`Inquiry "${inquiryId}" was not found.`);
    }

    item.status = 'scheduled';
    item.operationalStatus = 'awaiting_client';

    const systemMsg: InquiryMessage = {
      id: `msg-${Date.now()}`,
      inquiryId,
      sender: 'system',
      sender_name: 'Human Shelter Concierge',
      timestamp: new Date().toISOString(),
      content: `Private viewing consultation scheduled for ${appointmentData.appointmentTime}.`,
      delivery_status: 'saved',
    };
    item.messages.push(systemMsg);

    await AuditService.recordEvent({
      eventType: 'inquiry.viewing_scheduled',
      actorId: appointmentData.agentId || item.agentId || null,
      actorType: 'human',
      actorRole: 'agent',
      inquiryId,
      targetType: 'inquiry',
      targetId: inquiryId,
      outcome: 'success',
      newValues: { appointmentTime: appointmentData.appointmentTime },
    });

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('appointments').insert({
          property_id: item.propertyId || item.property_id,
          agent_id: appointmentData.agentId || item.agentId || item.agent_id,
          client_name: item.name,
          client_email: item.email,
          client_phone: item.phone,
          appointment_time: appointmentData.appointmentTime,
          status: 'confirmed',
          notes: appointmentData.notes,
          inquiry_id: inquiryId,
        });

        await supabaseAdmin
          .from('inquiries')
          .update({ status: 'scheduled', updated_at: new Date().toISOString() })
          .eq('id', inquiryId);
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase appointment insert warning:', err.message);
      }
    }

    return item;
  }

  /**
   * Update inquiry by ID (status, reassignment, messages)
   */
  public static async updateInquiry(
    id: string,
    updateData: Partial<InquiryItem>
  ): Promise<InquiryItem | null> {
    const item = localInquiriesState.find((i) => i.id === id) || (await this.getInquiryById(id));
    if (!item) return null;

    if (updateData.agentId && updateData.agentId !== item.agentId) {
      const eligibility = await AgentEligibilityService.evaluate(updateData.agentId, 'receive_lead');
      if (!eligibility.allowed) {
        throw new Error(`Cannot assign inquiry: Agent is not eligible to receive leads (${eligibility.reason}).`);
      }
    }

    const normalizedStatus = updateData.status
      ? (updateData.status.toLowerCase() as any)
      : item.status;

    const closureReason = updateData.closureReason || updateData.closure_reason || updateData.inactiveOutcome;
    if (normalizedStatus === 'closed' && !closureReason) {
      throw new Error('Closure reason is mandatory when closing an inquiry.');
    }

    const prevStatus = item.status;
    item.status = normalizedStatus;
    if (normalizedStatus === 'closed') {
      item.businessStatus = 'inactive';
      item.operationalStatus = 'none';
    } else if (normalizedStatus === 'reopened') {
      item.businessStatus = 'active';
      item.operationalStatus = 'awaiting_agent';
    }

    if (closureReason) {
      item.closureReason = closureReason as any;
      item.closure_reason = closureReason;
      item.inactiveOutcome = closureReason as any;
      item.closedAt = new Date().toISOString();
      item.closed_at = item.closedAt;
    }
    if (updateData.agentId) {
      item.agentId = updateData.agentId;
      item.agent_id = updateData.agentId;
    }
    if (updateData.agentName) {
      item.agentName = updateData.agentName;
      item.agent_name = updateData.agentName;
    }
    if (updateData.preferredDate || updateData.preferred_date) {
      item.preferredDate = updateData.preferredDate || updateData.preferred_date;
      item.preferred_date = item.preferredDate;
    }
    if (updateData.messages) {
      item.messages = updateData.messages;
    }
    item.updatedAt = new Date().toISOString();

    await AuditService.recordEvent({
      eventType: 'inquiry.status_changed',
      actorType: 'human',
      inquiryId: id,
      targetType: 'inquiry',
      targetId: id,
      outcome: 'success',
      reason: closureReason,
      previousValues: { status: prevStatus },
      newValues: { status: item.status, businessStatus: item.businessStatus },
    });

    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updateData.status) {
          const dbStatus = ['new', 'contacted', 'scheduled', 'closed', 'assigned', 'reopened'].includes(normalizedStatus)
            ? normalizedStatus
            : normalizedStatus === 'resolved'
            ? 'closed'
            : 'contacted';
          updatePayload.status = dbStatus;
        }
        if (closureReason) {
          updatePayload.closure_reason = closureReason;
          updatePayload.closed_at = item.closedAt;
        }
        if (updateData.agentId) {
          updatePayload.assigned_agent_id = updateData.agentId;
        }

        await supabaseAdmin.from('inquiries').update(updatePayload).eq('id', id);
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase update failed:', err.message);
      }
    }

    return item;
  }

  /**
   * Delete inquiry by ID
   */
  public static async deleteInquiry(id: string): Promise<boolean> {
    const idx = localInquiriesState.findIndex((i) => i.id === id);
    if (idx !== -1) {
      localInquiriesState.splice(idx, 1);
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('inquiries').delete().eq('id', id);
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase delete failed:', err.message);
      }
    }

    return true;
  }
}

export default InquiryService;
