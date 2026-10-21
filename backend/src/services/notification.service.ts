import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { AuditService } from './audit.service';
import type { QueryNotificationInput, CreateNotificationInput } from '../schemas/notification.schema';
import type { NotificationJobRecord, NotificationDeliveryAttempt } from '../../../shared/types/inquiry';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'inquiry' | 'verification' | 'appointment' | 'sale' | 'property';
  related_record?: string;
  timestamp: string;
  is_read: boolean;
  role?: string;
  user_id?: string;
  created_at: string;
}

export interface UserNotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface EnqueueInquiryNotificationInput {
  eventKey: string;
  eventType: string;
  inquiryId?: string;
  recipientId: string;
  recipientRole?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  channels: Array<'system' | 'email' | 'whatsapp'>;
  isEscalationOrRequired?: boolean;
  suppressExternalIfViewing?: boolean;
  simulateFailure?: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New High-Priority Inquiry',
    message: 'Atty. Fernando Zobel sent an inquiry regarding Ayala Alabang Estate.',
    type: 'inquiry',
    related_record: 'inq-101',
    timestamp: '15 minutes ago',
    is_read: false,
    role: 'broker',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Agent Verification Request',
    message: 'Marcus Aurelius Tan submitted PRC License and DHSUD accreditation for review.',
    type: 'verification',
    related_record: 'agent-3',
    timestamp: '1 hour ago',
    is_read: false,
    role: 'broker',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Appointment Confirmed',
    message: 'Dr. Beatrice Ramos-Tan confirmed reservation signing on September 9 at 2:30 PM.',
    type: 'appointment',
    related_record: 'apt-202',
    timestamp: '3 hours ago',
    is_read: false,
    role: 'broker',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Sale Record Added',
    message: 'Alexander Sterling finalized sale record for Aurelia Residences (₱145M).',
    type: 'sale',
    related_record: 'sale-304',
    timestamp: 'Yesterday',
    is_read: true,
    role: 'broker',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-5',
    title: 'Property Publication Approved',
    message: 'Forbes Park Modern Residence is now publicly available for client inquiries.',
    type: 'property',
    related_record: '3',
    timestamp: '2 days ago',
    is_read: true,
    role: 'broker',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

let inMemoryNotifications: NotificationItem[] = [...initialNotifications];
let inMemoryJobs = new Map<string, NotificationJobRecord>();
let inMemoryPreferences = new Map<string, UserNotificationPreferences>();
let activeConversationViews = new Map<string, number>(); // key: `${userId}:${inquiryId}` -> timestampMs
let remoteNotificationsTableAvailable = true;

const STATUS_PRECEDENCE: Record<string, number> = {
  queued: 1,
  suppressed: 1,
  failed: 2,
  sent: 3,
  delivered: 4,
  read: 5,
};

export class NotificationService {
  public static resetJobsForTesting(): void {
    inMemoryNotifications = [...initialNotifications];
    inMemoryJobs.clear();
    inMemoryPreferences.clear();
    activeConversationViews.clear();
  }

  public static setActiveConversationView(userId: string, inquiryId: string, nowMs: number = Date.now()): void {
    activeConversationViews.set(`${userId}:${inquiryId}`, nowMs);
  }

  public static isViewingConversation(userId: string, inquiryId?: string, nowMs: number = Date.now()): boolean {
    if (!inquiryId) return false;
    const lastSeen = activeConversationViews.get(`${userId}:${inquiryId}`);
    if (!lastSeen) return false;
    return nowMs - lastSeen <= 30 * 1000;
  }

  public static getPreferences(userId: string): UserNotificationPreferences {
    return (
      inMemoryPreferences.get(userId) || {
        userId,
        emailEnabled: true,
        whatsappEnabled: true,
        quietHoursStart: '20:00',
        quietHoursEnd: '08:00',
        timezone: 'Asia/Manila',
      }
    );
  }

  public static updatePreferences(
    userId: string,
    partial: Partial<Omit<UserNotificationPreferences, 'userId'>>
  ): UserNotificationPreferences {
    const current = this.getPreferences(userId);
    const updated: UserNotificationPreferences = {
      ...current,
      ...partial,
      userId,
    };
    inMemoryPreferences.set(userId, updated);
    return updated;
  }

  /**
   * Enqueue and dispatch multi-channel notification jobs with deduplication (NOT-01, NOT-02)
   */
  public static async enqueueInquiryEvent(
    input: EnqueueInquiryNotificationInput
  ): Promise<{ jobs: NotificationJobRecord[]; deduplicatedCount: number }> {
    const jobs: NotificationJobRecord[] = [];
    let deduplicatedCount = 0;
    const prefs = this.getPreferences(input.recipientId);
    const isViewing =
      Boolean(input.suppressExternalIfViewing) &&
      this.isViewingConversation(input.recipientId, input.inquiryId);

    for (const channel of input.channels) {
      const dedupeKey = `${input.eventKey}:${input.recipientId}:${channel}`;
      const existing = inMemoryJobs.get(dedupeKey);
      if (existing) {
        deduplicatedCount++;
        jobs.push(existing);
        continue;
      }

      // Check preferences & active-view suppression for external channels
      let suppressed = false;
      if (channel === 'email') {
        if ((!prefs.emailEnabled && !input.isEscalationOrRequired) || isViewing) {
          suppressed = true;
        }
      } else if (channel === 'whatsapp') {
        if ((!prefs.whatsappEnabled && !input.isEscalationOrRequired) || isViewing) {
          suppressed = true;
        }
      }

      const nowIso = new Date().toISOString();
      const jobId = `njob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const contact =
        channel === 'email'
          ? input.recipientEmail
          : channel === 'whatsapp'
          ? input.recipientPhone
          : input.recipientId;

      const job: NotificationJobRecord = {
        id: jobId,
        dedupeKey,
        eventType: input.eventType,
        inquiryId: input.inquiryId,
        recipientId: input.recipientId,
        recipientRole: input.recipientRole,
        recipientContact: contact,
        channel,
        status: suppressed ? 'suppressed' : 'queued',
        attemptCount: 0,
        maxAttempts: 3,
        payload: {
          title: input.title,
          message: input.message,
        },
        attempts: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (!suppressed) {
        await this.executeJobAttempt(job, Boolean(input.simulateFailure));
      }

      inMemoryJobs.set(dedupeKey, job);
      jobs.push(job);
    }

    return { jobs, deduplicatedCount };
  }

  private static async executeJobAttempt(
    job: NotificationJobRecord,
    simulateFailure: boolean = false
  ): Promise<void> {
    job.attemptCount += 1;
    const attemptNow = new Date().toISOString();

    if (simulateFailure) {
      const sanitizedError = 'Provider transport timeout (sanitized)';
      job.status = 'failed';
      job.lastError = sanitizedError;
      job.nextRetryAt =
        job.attemptCount < job.maxAttempts
          ? new Date(Date.now() + job.attemptCount * 60 * 1000).toISOString()
          : undefined;
      job.attempts.push({
        id: `att-${Date.now()}-${job.attemptCount}`,
        jobId: job.id,
        attemptNumber: job.attemptCount,
        status: 'failed',
        sanitizedError,
        createdAt: attemptNow,
      });

      await AuditService.recordEvent({
        eventType: 'notification.failed',
        actorType: 'system',
        inquiryId: job.inquiryId,
        targetType: 'notification_job',
        targetId: job.id,
        outcome: 'failure',
        reason: sanitizedError,
        newValues: { channel: job.channel, attemptCount: job.attemptCount },
      });

      // Repeated failure triggers an actionable system alert for staff
      if (job.attemptCount >= job.maxAttempts) {
        await this.createNotification({
          title: 'Notification Delivery Failure Alert',
          message: `Repeated delivery failure on ${job.channel} for inquiry ${job.inquiryId || 'N/A'}.`,
          type: 'inquiry',
          related_record: job.inquiryId,
          role: 'broker',
        });
      }
      return;
    }

    if (job.channel === 'system') {
      const notif = await this.createNotification({
        title: job.payload.title,
        message: job.payload.message,
        type: 'inquiry',
        related_record: job.inquiryId,
        role: (job.recipientRole as any) || 'broker',
        user_id: job.recipientId,
      });
      job.providerRef = notif.id;
      job.status = 'delivered';
      job.attempts.push({
        id: `att-${Date.now()}-${job.attemptCount}`,
        jobId: job.id,
        attemptNumber: job.attemptCount,
        status: 'delivered',
        providerRef: notif.id,
        createdAt: attemptNow,
      });
    } else {
      const providerRef = `${job.channel}.ref.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
      job.providerRef = providerRef;
      job.status = 'sent';
      job.attempts.push({
        id: `att-${Date.now()}-${job.attemptCount}`,
        jobId: job.id,
        attemptNumber: job.attemptCount,
        status: 'sent',
        providerRef,
        createdAt: attemptNow,
      });
    }

    job.updatedAt = attemptNow;
  }

  /**
   * Process verified provider delivery callbacks safely (handles duplicate/out-of-order updates)
   */
  public static async processProviderCallback(
    provider: 'email' | 'whatsapp',
    callback: {
      providerRef: string;
      status: 'sent' | 'delivered' | 'failed';
      signatureValid: boolean;
      errorMessage?: string;
    }
  ): Promise<NotificationJobRecord | null> {
    if (!callback.signatureValid) {
      throw new Error(`Invalid webhook signature for provider ${provider}`);
    }

    let matchedJob: NotificationJobRecord | undefined;
    for (const job of inMemoryJobs.values()) {
      if (job.providerRef === callback.providerRef) {
        matchedJob = job;
        break;
      }
    }

    if (!matchedJob) return null;

    const currentRank = STATUS_PRECEDENCE[matchedJob.status] || 0;
    const incomingRank = STATUS_PRECEDENCE[callback.status] || 0;

    // Ignore duplicate or out-of-order downgrade (e.g. 'sent' arriving after 'delivered')
    if (incomingRank > currentRank || callback.status === 'failed') {
      matchedJob.status = callback.status;
      matchedJob.updatedAt = new Date().toISOString();
      if (callback.errorMessage) {
        matchedJob.lastError = callback.errorMessage.slice(0, 200);
      }
    }

    return matchedJob;
  }

  /**
   * Cancel pending/queued notification jobs when an inquiry is reassigned away from a recipient
   */
  public static cancelPendingJobsForInquiryRecipient(inquiryId: string, previousRecipientId: string): number {
    let count = 0;
    for (const job of inMemoryJobs.values()) {
      if (
        job.inquiryId === inquiryId &&
        job.recipientId === previousRecipientId &&
        (job.status === 'queued' || job.nextRetryAt)
      ) {
        job.status = 'suppressed';
        job.nextRetryAt = undefined;
        count++;
      }
    }
    return count;
  }

  public static listJobsForInquiry(inquiryId: string): NotificationJobRecord[] {
    return Array.from(inMemoryJobs.values()).filter((j) => j.inquiryId === inquiryId);
  }

  /**
   * List notifications with status and type filtering
   */
  public static async listNotifications(query?: QueryNotificationInput): Promise<NotificationItem[]> {
    if (isSupabaseConfigured) {
      try {
        let builder = supabaseAdmin
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (query?.status === 'UNREAD') {
          builder = builder.eq('is_read', false);
        } else if (query?.status === 'READ') {
          builder = builder.eq('is_read', true);
        }

        if (query?.type) {
          builder = builder.eq('type', query.type);
        }

        if (query?.limit) {
          builder = builder.limit(query.limit);
        }

        const { data, error } = await builder;

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type,
            related_record: item.related_record,
            timestamp: item.timestamp || 'Recent',
            is_read: Boolean(item.is_read),
            role: item.role,
            user_id: item.user_id,
            created_at: item.created_at,
          }));
        }
      } catch (err: any) {
        logger.warn('Supabase notifications query failed, using in-memory store:', err.message);
      }
    }

    let results = [...inMemoryNotifications];

    if (query?.status === 'UNREAD') {
      results = results.filter((n) => !n.is_read);
    } else if (query?.status === 'READ') {
      results = results.filter((n) => n.is_read);
    }

    if (query?.type) {
      results = results.filter((n) => n.type === query.type);
    }

    if (query?.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get unread notifications count
   */
  public static async getUnreadCount(_role?: string): Promise<number> {
    if (isSupabaseConfigured) {
      try {
        const { count, error } = await supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);

        if (!error && typeof count === 'number') {
          return count;
        }
      } catch (err: any) {
        logger.warn('Supabase unread count error, using memory:', err.message);
      }
    }

    return inMemoryNotifications.filter((n) => !n.is_read).length;
  }

  /**
   * Toggle or set read status on single notification
   */
  public static async markAsRead(id: string, is_read: boolean = true): Promise<NotificationItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .update({ is_read })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            message: data.message,
            type: data.type,
            related_record: data.related_record,
            timestamp: data.timestamp || 'Just now',
            is_read: Boolean(data.is_read),
            role: data.role,
            created_at: data.created_at,
          };
        }
      } catch (err: any) {
        logger.warn('Supabase markAsRead error:', err.message);
      }
    }

    const index = inMemoryNotifications.findIndex((n) => n.id === id);
    if (index === -1) {
      return null;
    }

    inMemoryNotifications[index] = {
      ...inMemoryNotifications[index],
      is_read,
    };

    return inMemoryNotifications[index];
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead(): Promise<{ updatedCount: number }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false);

        if (error) {
          logger.warn('Supabase markAllAsRead error:', error.message);
        }
      } catch (err: any) {
        logger.warn('Supabase markAllAsRead exception:', err.message);
      }
    }

    const previousUnread = inMemoryNotifications.filter((n) => !n.is_read).length;
    inMemoryNotifications = inMemoryNotifications.map((n) => ({ ...n, is_read: true }));

    return { updatedCount: previousUnread };
  }

  /**
   * Create a new notification event
   */
  public static async createNotification(payload: CreateNotificationInput): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'inquiry',
      related_record: payload.related_record,
      timestamp: 'Just now',
      is_read: false,
      role: payload.role || 'broker',
      user_id: payload.user_id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && remoteNotificationsTableAvailable) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .insert([newItem])
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            message: data.message,
            type: data.type,
            related_record: data.related_record,
            timestamp: data.timestamp || 'Just now',
            is_read: Boolean(data.is_read),
            role: data.role,
            created_at: data.created_at,
          };
        }
        if (error) {
          remoteNotificationsTableAvailable = false;
        }
      } catch (err: any) {
        remoteNotificationsTableAvailable = false;
        logger.warn('Supabase createNotification error:', err.message);
      }
    }

    inMemoryNotifications.unshift(newItem);
    return newItem;
  }
}

export default NotificationService;
