import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { QueryNotificationInput, CreateNotificationInput } from '../schemas/notification.schema';

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

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New High-Priority Inquiry",
    message: "Atty. Fernando Zobel sent an inquiry regarding Ayala Alabang Estate.",
    type: "inquiry",
    related_record: "inq-101",
    timestamp: "15 minutes ago",
    is_read: false,
    role: "broker",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    title: "Agent Verification Request",
    message: "Marcus Aurelius Tan submitted PRC License and DHSUD accreditation for review.",
    type: "verification",
    related_record: "agent-3",
    timestamp: "1 hour ago",
    is_read: false,
    role: "broker",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    title: "Appointment Confirmed",
    message: "Dr. Beatrice Ramos-Tan confirmed reservation signing on September 9 at 2:30 PM.",
    type: "appointment",
    related_record: "apt-202",
    timestamp: "3 hours ago",
    is_read: false,
    role: "broker",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-4",
    title: "Sale Record Added",
    message: "Alexander Sterling finalized sale record for Aurelia Residences (₱145M).",
    type: "sale",
    related_record: "sale-304",
    timestamp: "Yesterday",
    is_read: true,
    role: "broker",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-5",
    title: "Property Publication Approved",
    message: "Forbes Park Modern Residence is now publicly available for client inquiries.",
    type: "property",
    related_record: "3",
    timestamp: "2 days ago",
    is_read: true,
    role: "broker",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  }
];

let inMemoryNotifications: NotificationItem[] = [...initialNotifications];

export class NotificationService {
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
          return data.map(item => ({
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
      results = results.filter(n => !n.is_read);
    } else if (query?.status === 'READ') {
      results = results.filter(n => n.is_read);
    }

    if (query?.type) {
      results = results.filter(n => n.type === query.type);
    }

    if (query?.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get unread notifications count
   */
  public static async getUnreadCount(role?: string): Promise<number> {
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

    return inMemoryNotifications.filter(n => !n.is_read).length;
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

    const index = inMemoryNotifications.findIndex(n => n.id === id);
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

    const previousUnread = inMemoryNotifications.filter(n => !n.is_read).length;
    inMemoryNotifications = inMemoryNotifications.map(n => ({ ...n, is_read: true }));

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

    if (isSupabaseConfigured) {
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
      } catch (err: any) {
        logger.warn('Supabase createNotification error:', err.message);
      }
    }

    inMemoryNotifications.unshift(newItem);
    return newItem;
  }
}

export default NotificationService;
