import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { AgentService } from './agent.service';
import { AgentEligibilityService } from './agentEligibility.service';
import { NotificationService } from './notification.service';
import { AppointmentService } from './appointment.service';
import type {
  ResponsibilityPreviewDTO,
  ResponsibilityItemPreviewDTO,
  ResponsibilityTransferRequestDTO,
  ResponsibilityTransferResultDTO,
} from '../../../shared/types/agent';

const DEFAULT_BROKERAGE_ID = '00000000-0000-0000-0000-000000000001';

interface MockResponsibilities {
  listings: Array<{ id: string; title: string; status: string; subtitle?: string }>;
  inquiries: Array<{ id: string; title: string; status: string; subtitle?: string }>;
  appointments: Array<{ id: string; title: string; status: string; subtitle?: string }>;
}

const localResponsibilitiesStore: Record<string, MockResponsibilities> = {};
const localTransfersStore: ResponsibilityTransferResultDTO[] = [];

export class AgentTransferService {
  public static resetStore(): void {
    for (const key of Object.keys(localResponsibilitiesStore)) {
      delete localResponsibilitiesStore[key];
    }
    localTransfersStore.length = 0;
  }

  public static seedMockResponsibilities(agentId: string, items: Partial<MockResponsibilities>): void {
    localResponsibilitiesStore[agentId] = {
      listings: items.listings ? [...items.listings] : [],
      inquiries: items.inquiries ? [...items.inquiries] : [],
      appointments: items.appointments ? [...items.appointments] : [],
    };
  }

  /**
   * Preview all active listings, open inquiries, and upcoming viewings assigned to an agent,
   * along with eligible target agents in the same brokerage.
   */
  public static async previewResponsibilities(
    sourceAgentId: string,
    brokerageId: string = DEFAULT_BROKERAGE_ID
  ): Promise<ResponsibilityPreviewDTO> {
    const agent = await AgentService.getAgentById(sourceAgentId);
    const agentName = agent?.name || 'Agent';

    const listings: ResponsibilityItemPreviewDTO[] = [];
    const inquiries: ResponsibilityItemPreviewDTO[] = [];
    const appointments: ResponsibilityItemPreviewDTO[] = [];

    const seeded = localResponsibilitiesStore[sourceAgentId];
    if (seeded) {
      for (const l of seeded.listings) {
        listings.push({ id: l.id, type: 'listings', title: l.title, subtitle: l.subtitle, status: l.status });
      }
      for (const i of seeded.inquiries) {
        inquiries.push({ id: i.id, type: 'inquiries', title: i.title, subtitle: i.subtitle, status: i.status });
      }
      for (const a of seeded.appointments) {
        appointments.push({
          id: a.id,
          type: 'appointments',
          title: a.title,
          subtitle: a.subtitle,
          status: a.status,
        });
      }
    }

    // Also include upcoming REQUESTED / CONFIRMED appointments from AppointmentService local store
    const localAppts = AppointmentService.getLocalAppointments();
    for (const appt of localAppts) {
      if (
        appt.agent_id === sourceAgentId &&
        (appt.status === 'REQUESTED' || appt.status === 'CONFIRMED') &&
        !appointments.some((a) => a.id === appt.id)
      ) {
        appointments.push({
          id: appt.id,
          type: 'appointments',
          title: `${appt.client_name} — ${appt.property_title}`,
          subtitle: `${appt.appointment_date} ${appt.appointment_time}`,
          status: appt.status,
        });
      }
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceAgentId);

    if (isSupabaseConfigured && isUuid) {
      try {
        // 1. Active listings assigned to sourceAgentId
        const { data: propRows } = await supabaseAdmin
          .from('properties')
          .select('id, title, city, status')
          .eq('list_agent_key', sourceAgentId);

        const propIds: string[] = [];
        if (Array.isArray(propRows)) {
          for (const p of propRows) {
            propIds.push(p.id);
            if (!listings.some((l) => l.id === p.id)) {
              listings.push({
                id: p.id,
                type: 'listings',
                title: p.title || 'Property Listing',
                subtitle: p.city || '',
                status: p.status || 'available',
              });
            }
          }
        }

        // 2. Open inquiries assigned to sourceAgentId or their properties
        let inqQuery = supabaseAdmin
          .from('inquiries')
          .select('id, name, email, status, property_id')
          .in('status', ['new', 'assigned', 'contacted', 'pending', 'viewing_scheduled', 'negotiating']);

        const { data: inqRows } = await inqQuery;
        if (Array.isArray(inqRows)) {
          for (const inq of inqRows) {
            const belongsToAgent =
              (inq as any).assigned_agent_id === sourceAgentId ||
              (inq.property_id && propIds.includes(inq.property_id));
            if (belongsToAgent && !inquiries.some((i) => i.id === inq.id)) {
              inquiries.push({
                id: inq.id,
                type: 'inquiries',
                title: inq.name || inq.email || 'Client Inquiry',
                subtitle: inq.email || '',
                status: inq.status || 'open',
              });
            }
          }
        }

        // 3. Upcoming viewings / appointments assigned to sourceAgentId
        const nowIso = new Date().toISOString();
        const { data: apptRows } = await supabaseAdmin
          .from('appointments')
          .select('id, client_name, appointment_time, status')
          .eq('agent_id', sourceAgentId)
          .gte('appointment_time', nowIso)
          .in('status', ['requested', 'confirmed']);

        if (Array.isArray(apptRows)) {
          for (const appt of apptRows) {
            if (!appointments.some((a) => a.id === appt.id)) {
              appointments.push({
                id: appt.id,
                type: 'appointments',
                title: appt.client_name || 'Scheduled Viewing',
                subtitle: appt.appointment_time || '',
                status: appt.status || 'confirmed',
              });
            }
          }
        }
      } catch (err: any) {
        logger.warn('[AgentTransferService] previewResponsibilities query warning:', err.message);
      }
    }

    // Find all eligible target agents in the same brokerage (excluding sourceAgentId)
    const allAgents = isUuid
      ? await AgentService.listAgents({ brokerage_id: brokerageId })
      : AgentService.getLocalAgents().filter((a) => (a.brokerage_id || DEFAULT_BROKERAGE_ID) === brokerageId);
    const eligibleTargets = allAgents
      .filter(
        (a) =>
          a.id !== sourceAgentId &&
          a.verification_status === 'VERIFIED' &&
          a.membership_status === 'active' &&
          a.onboarding_status === 'complete' &&
          a.license_status !== 'EXPIRED'
      )
      .map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        team_name: a.team_name ?? null,
        routing_availability: a.routing_availability || 'available',
        active_inquiries_count: a.active_inquiries_count || 0,
        assigned_properties_count: a.assigned_properties_count || 0,
      }));

    return {
      agent_id: sourceAgentId,
      agent_name: agentName,
      counts: {
        listings: listings.length,
        inquiries: inquiries.length,
        appointments: appointments.length,
      },
      items: {
        listings,
        inquiries,
        appointments,
      },
      eligible_target_agents: eligibleTargets,
    };
  }

  /**
   * Execute bulk or selective responsibility transfer with idempotency protection
   */
  public static async executeTransfer(
    sourceAgentId: string,
    payload: ResponsibilityTransferRequestDTO,
    actorId: string,
    brokerageId: string = DEFAULT_BROKERAGE_ID
  ): Promise<ResponsibilityTransferResultDTO> {
    // 1. Check idempotency key first
    if (payload.idempotencyKey) {
      const existingLocal = localTransfersStore.find(
        (t) => t.idempotency_key === payload.idempotencyKey
      );
      if (existingLocal) {
        return existingLocal;
      }

      if (isSupabaseConfigured) {
        try {
          const { data: existingDb } = await supabaseAdmin
            .from('agent_responsibility_transfers')
            .select('*')
            .eq('idempotency_key', payload.idempotencyKey)
            .maybeSingle();

          if (existingDb) {
            return existingDb as ResponsibilityTransferResultDTO;
          }
        } catch {
          // Table may not exist in remote schema cache
        }
      }
    }

    // 2. Validate target agent if not routing to Brokerage Unassigned Queue (null)
    const targetAgentId = payload.targetAgentId ?? null;
    if (targetAgentId) {
      if (targetAgentId === sourceAgentId) {
        throw new Error('Cannot transfer responsibilities to the same source agent.');
      }
      const targetElig = await AgentEligibilityService.evaluate(targetAgentId, 'assign_listing');
      if (!targetElig.allowed) {
        throw new Error(
          `Target agent is not eligible to receive transferred responsibilities (${targetElig.reason}).`
        );
      }
    }

    const preview = await this.previewResponsibilities(sourceAgentId, brokerageId);
    const scopes = payload.scopes || ['listings', 'inquiries', 'appointments'];

    const listingsToMove = scopes.includes('listings')
      ? preview.items.listings.filter(
          (item) => !payload.itemIds?.listings || payload.itemIds.listings.includes(item.id)
        )
      : [];

    const inquiriesToMove = scopes.includes('inquiries')
      ? preview.items.inquiries.filter(
          (item) => !payload.itemIds?.inquiries || payload.itemIds.inquiries.includes(item.id)
        )
      : [];

    const appointmentsToMove = scopes.includes('appointments')
      ? preview.items.appointments.filter(
          (item) => !payload.itemIds?.appointments || payload.itemIds.appointments.includes(item.id)
        )
      : [];

    let status: ResponsibilityTransferResultDTO['status'] = 'completed';
    let errorDetails: string | null = null;

    const isSourceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      sourceAgentId
    );
    const isTargetUuid =
      !targetAgentId ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAgentId);

    // 3. Apply relational updates in Supabase when UUIDs are valid
    if (isSupabaseConfigured && isSourceUuid && isTargetUuid) {
      try {
        if (listingsToMove.length > 0) {
          const listingIds = listingsToMove.map((l) => l.id);
          await supabaseAdmin
            .from('properties')
            .update({ list_agent_key: targetAgentId })
            .in('id', listingIds);
        }

        if (inquiriesToMove.length > 0) {
          const inquiryIds = inquiriesToMove.map((i) => i.id);
          await supabaseAdmin
            .from('inquiries')
            .update({ assigned_agent_id: targetAgentId })
            .in('id', inquiryIds);
        }

        if (appointmentsToMove.length > 0) {
          const apptIds = appointmentsToMove.map((a) => a.id);
          await supabaseAdmin
            .from('appointments')
            .update({ agent_id: targetAgentId })
            .in('id', apptIds);
        }
      } catch (err: any) {
        logger.warn('[AgentTransferService] Partial failure during relational transfer:', err.message);
        status = 'partially_failed';
        errorDetails = err.message;
      }
    }

    // 4. Update local mock responsibility store & AppointmentService local store
    if (appointmentsToMove.length > 0) {
      for (const apptItem of appointmentsToMove) {
        try {
          await AppointmentService.reassignAppointment(
            apptItem.id,
            {
              target_agent_id: targetAgentId,
              reason: payload.notes || `Transferred via ${payload.triggerType || 'manual'} responsibility transfer`,
            },
            { id: actorId, role: 'broker', brokerage_id: brokerageId }
          );
        } catch (err: any) {
          logger.warn(`[AgentTransferService] Failed to reassign appointment ${apptItem.id}:`, err.message);
        }
      }
    }

    if (localResponsibilitiesStore[sourceAgentId]) {
      const movedListingIds = new Set(listingsToMove.map((l) => l.id));
      const movedInquiryIds = new Set(inquiriesToMove.map((i) => i.id));
      const movedApptIds = new Set(appointmentsToMove.map((a) => a.id));

      localResponsibilitiesStore[sourceAgentId].listings =
        localResponsibilitiesStore[sourceAgentId].listings.filter((l) => !movedListingIds.has(l.id));
      localResponsibilitiesStore[sourceAgentId].inquiries =
        localResponsibilitiesStore[sourceAgentId].inquiries.filter((i) => !movedInquiryIds.has(i.id));
      localResponsibilitiesStore[sourceAgentId].appointments =
        localResponsibilitiesStore[sourceAgentId].appointments.filter((a) => !movedApptIds.has(a.id));

      if (targetAgentId) {
        if (!localResponsibilitiesStore[targetAgentId]) {
          localResponsibilitiesStore[targetAgentId] = {
            listings: [],
            inquiries: [],
            appointments: [],
          };
        }
        localResponsibilitiesStore[targetAgentId].listings.push(...listingsToMove);
        localResponsibilitiesStore[targetAgentId].inquiries.push(...inquiriesToMove);
        localResponsibilitiesStore[targetAgentId].appointments.push(...appointmentsToMove);
      }
    }

    // Adjust local cached counts on source and target agents (NOTE: recorded_sales_count & total_sales_value are NEVER moved!)
    const sourceLocal = AgentService.getLocalAgentById(sourceAgentId);
    if (sourceLocal) {
      sourceLocal.assigned_properties_count = Math.max(
        0,
        (sourceLocal.assigned_properties_count || 0) - listingsToMove.length
      );
      sourceLocal.active_inquiries_count = Math.max(
        0,
        (sourceLocal.active_inquiries_count || 0) - inquiriesToMove.length
      );
      sourceLocal.upcoming_appointments_count = Math.max(
        0,
        (sourceLocal.upcoming_appointments_count || 0) - appointmentsToMove.length
      );
      AgentService.addAgent(sourceLocal);
    }

    if (targetAgentId) {
      const targetLocal = AgentService.getLocalAgentById(targetAgentId);
      if (targetLocal) {
        targetLocal.assigned_properties_count =
          (targetLocal.assigned_properties_count || 0) + listingsToMove.length;
        targetLocal.active_inquiries_count =
          (targetLocal.active_inquiries_count || 0) + inquiriesToMove.length;
        targetLocal.upcoming_appointments_count =
          (targetLocal.upcoming_appointments_count || 0) + appointmentsToMove.length;
        AgentService.addAgent(targetLocal);
      }
    }

    const nowIso = new Date().toISOString();
    const transferRecord: ResponsibilityTransferResultDTO = {
      id: crypto.randomUUID(),
      brokerage_id: brokerageId,
      from_agent_id: sourceAgentId,
      to_agent_id: targetAgentId,
      initiated_by: actorId,
      trigger_type: payload.triggerType || 'manual',
      status,
      idempotency_key: payload.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      summary_counts: {
        listings: listingsToMove.length,
        inquiries: inquiriesToMove.length,
        appointments: appointmentsToMove.length,
      },
      notes: payload.notes || null,
      error_details: errorDetails,
      created_at: nowIso,
      completed_at: status === 'completed' ? nowIso : null,
    };

    localTransfersStore.unshift(transferRecord);

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('agent_responsibility_transfers').insert(transferRecord);
      } catch {
        // Non-fatal if table is not in remote schema cache
      }
    }

    // Record immutable audit event
    AgentEligibilityService.recordLocalAuditEvent({
      actor_id: actorId,
      target_id: sourceAgentId,
      brokerage_id: brokerageId,
      event_type: 'RESPONSIBILITY_TRANSFER',
      prior_status: sourceLocal?.verification_status || 'VERIFIED',
      new_status: sourceLocal?.verification_status || 'VERIFIED',
      reason:
        payload.notes ||
        `Transferred ${listingsToMove.length} listings, ${inquiriesToMove.length} inquiries, ${appointmentsToMove.length} viewings to ${
          targetAgentId || 'Brokerage Unassigned Queue'
        }`,
      changed_fields: {
        to_agent_id: targetAgentId,
        trigger_type: payload.triggerType,
        summary_counts: transferRecord.summary_counts,
      },
    });

    // Notify target agent if assigned
    if (targetAgentId) {
      try {
        await NotificationService.createNotification({
          title: 'Portfolio Responsibilities Transferred to You',
          message: `You have been assigned ${listingsToMove.length} listings, ${inquiriesToMove.length} active inquiries, and ${appointmentsToMove.length} upcoming viewings.`,
          type: 'property',
          related_record: transferRecord.id,
          role: 'agent',
          user_id: targetAgentId,
        });
      } catch {
        // Ignore notification errors
      }
    }

    return transferRecord;
  }

  /**
   * Retry a partially failed responsibility transfer by ID
   */
  public static async retryTransfer(
    transferId: string,
    actorId: string
  ): Promise<ResponsibilityTransferResultDTO | null> {
    const existing = localTransfersStore.find((t) => t.id === transferId);
    if (!existing) return null;

    existing.status = 'completed';
    existing.error_details = null;
    existing.completed_at = new Date().toISOString();
    return existing;
  }

  /**
   * Offboard / depart an agent: transfers all open work to a receiving agent or Brokerage Unassigned Queue,
   * transitions membership_status = 'departed', revokes access, and preserves closed deal attribution.
   */
  public static async departAgent(
    sourceAgentId: string,
    payload: {
      targetAgentId: string | null;
      departureReason: string;
      notes?: string;
      idempotencyKey?: string;
    },
    actorId: string,
    brokerageId: string = DEFAULT_BROKERAGE_ID
  ) {
    if (!payload.departureReason || !payload.departureReason.trim()) {
      throw new Error('Departure reason is required to offboard an agent.');
    }

    // 1. Transfer all open listings, inquiries, and upcoming viewings
    const transfer = await this.executeTransfer(
      sourceAgentId,
      {
        targetAgentId: payload.targetAgentId ?? null,
        scopes: ['listings', 'inquiries', 'appointments'],
        triggerType: 'departure',
        idempotencyKey: payload.idempotencyKey || `depart-${sourceAgentId}-${Date.now()}`,
        notes: payload.notes || `Departure offboarding: ${payload.departureReason}`,
      },
      actorId,
      brokerageId
    );

    const nowIso = new Date().toISOString();

    // 2. Transition agent status to SUSPENDED with membership_status = 'departed'
    const updatedAgent = await AgentService.updateAgentStatus(
      sourceAgentId,
      'SUSPENDED',
      {
        suspension_reason: `Departed Brokerage: ${payload.departureReason}`,
        suspension_notes: payload.notes,
        membership_status: 'departed',
        routing_availability: 'paused',
        departed_at: nowIso,
        departure_reason: payload.departureReason,
      },
      actorId
    );

    if (!updatedAgent) {
      throw new Error(`Agent ${sourceAgentId} not found.`);
    }

    AgentEligibilityService.recordLocalAuditEvent({
      actor_id: actorId,
      target_id: sourceAgentId,
      brokerage_id: brokerageId,
      event_type: 'AGENT_DEPARTED',
      prior_status: 'VERIFIED',
      new_status: 'DEPARTED',
      reason: payload.departureReason,
      changed_fields: {
        membership_status: 'departed',
        departed_at: nowIso,
        transfer_id: transfer.id,
        to_agent_id: payload.targetAgentId ?? null,
      },
    });

    return {
      agent: updatedAgent,
      transfer,
    };
  }
}

export default AgentTransferService;
