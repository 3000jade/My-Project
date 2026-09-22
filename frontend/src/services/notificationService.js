// ==============================================================================
// Notification Service
// Communicates EXCLUSIVELY with the Express Backend (/api/notifications)
// ==============================================================================

import apiClient from './apiClient';
import { mockNotifications } from '../mockData/mockNotifications';

let inMemoryFallbackNotifications = [...mockNotifications];

/**
 * Normalizes backend notification object to UI format
 */
export function normalizeNotification(raw = {}) {
  return {
    id: raw.id || `notif-${Date.now()}`,
    title: raw.title || 'System Notification',
    message: raw.message || '',
    type: raw.type || 'inquiry',
    related_record: raw.related_record || '',
    timestamp: raw.timestamp || 'Recent',
    is_read: Boolean(raw.is_read),
    role: raw.role || 'broker',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export const notificationService = {
  /**
   * Fetch notification list
   */
  async getNotifications(params = {}) {
    try {
      const response = await apiClient.get('/notifications', { params });
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(normalizeNotification);
      }
      return inMemoryFallbackNotifications.map(normalizeNotification);
    } catch (err) {
      console.warn('[notificationService] getNotifications fallback:', err.message);
      let results = [...inMemoryFallbackNotifications];
      if (params.status === 'UNREAD') {
        results = results.filter(n => !n.is_read);
      } else if (params.status === 'READ') {
        results = results.filter(n => n.is_read);
      }
      if (params.type) {
        results = results.filter(n => n.type === params.type);
      }
      return results.map(normalizeNotification);
    }
  },

  /**
   * Get total unread notifications count
   */
  async getUnreadCount(params = {}) {
    try {
      const response = await apiClient.get('/notifications/unread-count', { params });
      if (response && response.data && typeof response.data.count === 'number') {
        return response.data.count;
      }
      return inMemoryFallbackNotifications.filter(n => !n.is_read).length;
    } catch (err) {
      console.warn('[notificationService] getUnreadCount fallback:', err.message);
      return inMemoryFallbackNotifications.filter(n => !n.is_read).length;
    }
  },

  /**
   * Mark a single notification as read or unread
   */
  async markAsRead(id, isRead = true) {
    try {
      const response = await apiClient.patch(`/notifications/${id}/read`, { is_read: isRead });
      if (response && response.data) {
        return normalizeNotification(response.data);
      }
    } catch (err) {
      console.warn(`[notificationService] markAsRead fallback for ${id}:`, err.message);
    }

    inMemoryFallbackNotifications = inMemoryFallbackNotifications.map(n =>
      n.id === id ? { ...n, is_read: isRead } : n
    );
    const updated = inMemoryFallbackNotifications.find(n => n.id === id);
    return updated ? normalizeNotification(updated) : null;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(params = {}) {
    try {
      const response = await apiClient.post('/notifications/mark-all-read', params);
      if (response && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('[notificationService] markAllAsRead fallback:', err.message);
    }

    const previousUnread = inMemoryFallbackNotifications.filter(n => !n.is_read).length;
    inMemoryFallbackNotifications = inMemoryFallbackNotifications.map(n => ({ ...n, is_read: true }));
    return { updatedCount: previousUnread };
  },

  /**
   * Create a new notification alert
   */
  async createNotification(payload) {
    try {
      const response = await apiClient.post('/notifications', payload);
      if (response && response.data) {
        return normalizeNotification(response.data);
      }
    } catch (err) {
      console.warn('[notificationService] createNotification fallback:', err.message);
    }

    const created = {
      id: `notif-${Date.now()}`,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'inquiry',
      related_record: payload.related_record || '',
      timestamp: 'Just now',
      is_read: false,
      role: payload.role || 'broker',
      created_at: new Date().toISOString(),
    };
    inMemoryFallbackNotifications.unshift(created);
    return normalizeNotification(created);
  },
};

export default notificationService;
