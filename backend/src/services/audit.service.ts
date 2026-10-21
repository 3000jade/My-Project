import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { AuditEventRecord } from '../../../shared/types/inquiry';

export interface RecordAuditEventInput {
  eventType: string;
  actorId?: string | null;
  actorName?: string;
  actorType: 'human' | 'guest' | 'system' | 'integration';
  actorRole?: string;
  brokerageId?: string;
  inquiryId?: string;
  targetType: string;
  targetId: string;
  outcome: 'success' | 'failure' | 'denied';
  reason?: string;
  correlationId?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export interface ActivityTimelineItem {
  id: string;
  eventType: string;
  title: string;
  description: string;
  actorName: string;
  actorType: string;
  timestamp: string;
  internalReason?: string;
}

export interface AuditFilterQuery {
  inquiryId?: string;
  eventType?: string;
  actorId?: string;
  outcome?: string;
  brokerageId?: string;
  limit?: number;
}

const SENSITIVE_KEY_PATTERN = /password|token|secret|authorization|cookie|credential|raw_session/i;

function sanitizeObject(obj?: Record<string, any>): Record<string, any> | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = sanitizeObject(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

let inMemoryAuditStore: AuditEventRecord[] = [];
let remoteAuditTableAvailable = true;

export class AuditService {
  public static resetForTesting(): void {
    inMemoryAuditStore = [];
  }

  /**
   * Atomically record an immutable audit event with sensitive-field redaction (AUD-01)
   */
  public static async recordEvent(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    const isGuest = input.actorType === 'guest';
    const record: AuditEventRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType: input.eventType,
      actorId: isGuest ? null : input.actorId || null,
      actorName: input.actorName || (isGuest ? 'Guest Visitor' : input.actorType),
      actorType: input.actorType,
      actorRole: isGuest ? 'guest' : input.actorRole,
      brokerageId: input.brokerageId || 'human-shelter-main',
      inquiryId: input.inquiryId,
      targetType: input.targetType,
      targetId: input.targetId,
      outcome: input.outcome,
      reason: input.reason,
      correlationId: input.correlationId || `corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      previousValues: sanitizeObject(input.previousValues),
      newValues: sanitizeObject(input.newValues),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && remoteAuditTableAvailable) {
      try {
        const { error } = await supabaseAdmin.from('audit_events').insert({
          event_type: record.eventType,
          actor_id: record.actorId,
          actor_name: record.actorName,
          actor_type: record.actorType,
          actor_role: record.actorRole,
          brokerage_id: record.brokerageId,
          inquiry_id: record.inquiryId && record.inquiryId.length > 20 ? record.inquiryId : null,
          target_type: record.targetType,
          target_id: record.targetId,
          outcome: record.outcome,
          reason: record.reason,
          correlation_id: record.correlationId,
          previous_values: record.previousValues || null,
          new_values: record.newValues || null,
        });
        if (error) {
          remoteAuditTableAvailable = false;
        }
      } catch (err: any) {
        remoteAuditTableAvailable = false;
        logger.warn('[AuditService] Supabase insert fallback to protected memory store:', err.message);
      }
    }

    // Store frozen copy so callers cannot mutate audit evidence in place
    const frozen = Object.freeze({
      ...record,
      previousValues: record.previousValues ? Object.freeze({ ...record.previousValues }) : undefined,
      newValues: record.newValues ? Object.freeze({ ...record.newValues }) : undefined,
    });
    inMemoryAuditStore.unshift(frozen);
    return frozen;
  }

  /**
   * Enforce immutability: ordinary users or staff cannot alter existing audit records (AUD-02)
   */
  public static async attemptModifyAuditRecord(
    eventId: string,
    actor: { actorId?: string; actorName?: string; actorRole?: string }
  ): Promise<never> {
    await this.recordEvent({
      eventType: 'audit.tamper_denied',
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorType: 'human',
      actorRole: actor.actorRole,
      targetType: 'audit_event',
      targetId: eventId,
      outcome: 'denied',
      reason: 'Audit records are immutable and cannot be altered or deleted.',
    });
    throw new Error('Forbidden: Audit records are immutable; corrections must generate additional audit events.');
  }

  /**
   * Simplified Activity Timeline for inquiry participants (separates internal notes/reasons from clients)
   */
  public static async getInquiryActivityTimeline(
    inquiryId: string,
    viewerRole: string = 'client'
  ): Promise<ActivityTimelineItem[]> {
    const events = inMemoryAuditStore.filter((e) => e.inquiryId === inquiryId && e.outcome === 'success');
    const isStaff = ['agent', 'broker', 'admin'].includes(viewerRole);

    const CLIENT_HIDDEN_EVENTS = new Set([
      'inquiry.note_added',
      'inquiry.note_updated',
      'inquiry.ai_summary_generated',
      'inquiry.ai_summary_reviewed',
      'notification.failed',
      'notification.retried',
    ]);

    return events
      .filter((e) => isStaff || !CLIENT_HIDDEN_EVENTS.has(e.eventType))
      .map((e) => {
        let title = e.eventType.replace(/[._]/g, ' ');
        let description = `Recorded by ${e.actorName || e.actorType}`;

        if (e.eventType === 'inquiry.created') {
          title = 'Inquiry Submitted';
          description = `Inquiry opened by ${e.actorName || 'Client'}.`;
        } else if (e.eventType === 'inquiry.assigned' || e.eventType === 'inquiry.reassigned') {
          title = 'Advisor Assigned';
          description = `Assigned to ${e.newValues?.assignedToName || e.newValues?.assignedTo || 'Advisory Specialist'}.`;
        } else if (e.eventType === 'inquiry.status_changed') {
          title = 'Status Updated';
          description = `Status transitioned to ${e.newValues?.status || e.newValues?.businessStatus || 'updated'}.`;
        } else if (e.eventType === 'inquiry.note_added') {
          title = 'Internal Dossier Note Added';
          description = `Staff note recorded by ${e.actorName}.`;
        } else if (e.eventType === 'inquiry.viewing_scheduled') {
          title = 'Private Viewing Scheduled';
          description = `Viewing scheduled for ${e.newValues?.appointmentTime || 'requested date'}.`;
        }

        const item: ActivityTimelineItem = {
          id: e.id,
          eventType: e.eventType,
          title,
          description,
          actorName: e.actorName || 'System',
          actorType: e.actorType,
          timestamp: e.createdAt,
        };

        if (isStaff && e.reason) {
          item.internalReason = e.reason;
        }

        return item;
      });
  }

  /**
   * Broker / Admin protected audit viewer query
   */
  public static async listAuditEvents(
    filters: AuditFilterQuery,
    actor: { actorId?: string; actorRole?: string; brokerageId?: string }
  ): Promise<AuditEventRecord[]> {
    if (!actor.actorRole || !['broker', 'admin'].includes(actor.actorRole)) {
      await this.recordEvent({
        eventType: 'audit.access_denied',
        actorId: actor.actorId,
        actorType: 'human',
        actorRole: actor.actorRole,
        targetType: 'audit_store',
        targetId: 'all',
        outcome: 'denied',
        reason: 'Unauthorized role attempted to access protected audit store.',
      });
      throw new Error('Unauthorized: Only Brokers and Administrators may view protected audit records.');
    }

    let results = [...inMemoryAuditStore];

    if (filters.brokerageId) {
      results = results.filter((e) => e.brokerageId === filters.brokerageId);
    }
    if (filters.inquiryId) {
      results = results.filter((e) => e.inquiryId === filters.inquiryId);
    }
    if (filters.eventType) {
      results = results.filter((e) => e.eventType === filters.eventType);
    }
    if (filters.actorId) {
      results = results.filter((e) => e.actorId === filters.actorId);
    }
    if (filters.outcome) {
      results = results.filter((e) => e.outcome === filters.outcome);
    }
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Authorized audit log export for Brokers/Admins (AUD-02)
   */
  public static async exportAuditEvents(
    filters: AuditFilterQuery,
    actor: { actorId?: string; actorName?: string; actorRole?: string; brokerageId?: string }
  ): Promise<{ exportedAt: string; exportedBy: string; count: number; events: AuditEventRecord[] }> {
    if (!actor.actorRole || !['broker', 'admin'].includes(actor.actorRole)) {
      await this.recordEvent({
        eventType: 'audit.export_denied',
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorType: 'human',
        actorRole: actor.actorRole,
        targetType: 'audit_export',
        targetId: filters.inquiryId || 'brokerage',
        outcome: 'denied',
        reason: 'Unauthorized role attempted to export audit logs.',
      });
      throw new Error('Unauthorized: Only Brokers and Administrators can export audit evidence.');
    }

    const events = await this.listAuditEvents(filters, actor);

    await this.recordEvent({
      eventType: 'audit.exported',
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorType: 'human',
      actorRole: actor.actorRole,
      inquiryId: filters.inquiryId,
      targetType: 'audit_export',
      targetId: filters.inquiryId || 'brokerage',
      outcome: 'success',
      newValues: { exportedCount: events.length },
    });

    return {
      exportedAt: new Date().toISOString(),
      exportedBy: actor.actorName || actor.actorId || 'Broker',
      count: events.length,
      events,
    };
  }
}

export default AuditService;
