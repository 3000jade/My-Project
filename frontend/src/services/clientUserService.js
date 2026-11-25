import apiClient from './apiClient';
import propertyService from './propertyService';
import profileService from './profileService';
import { mockProperties } from '../mockData/mockProperties';
import { mockInquiries } from '../mockData/mockInquiries';

const CLIENT_STORAGE_KEYS = {
  SAVED_PROPERTIES: 'cp_client_saved_properties_mock',
  INQUIRIES: 'cp_client_inquiries_mock',
};

function mapClientNotifications(serverProfile) {
  const prefs = serverProfile?.notificationPreferences || serverProfile?.notification_preferences || {};
  return {
    ...serverProfile,
    emailNotifications: prefs.email ?? true,
    smsNotifications: prefs.sms ?? true,
    priceDropAlerts: prefs.priceDrops ?? true,
  };
}

function safeGetStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[clientUserService] LocalStorage write failed:', e);
  }
}

export const clientUserService = {
  /**
   * Get current client profile directly from backend
   */
  async getClientProfile() {
    const serverProfile = await profileService.getProfile({ role: 'client' });
    return mapClientNotifications(serverProfile);
  },

  /**
   * Update client profile directly on backend
   */
  async updateClientProfile(updates) {
    const payload = {};
    if (updates.name !== undefined) {
      payload.name = updates.name;
      payload.fullName = updates.name;
    }
    if (updates.first_name !== undefined) payload.first_name = updates.first_name;
    if (updates.middle_name !== undefined) payload.middle_name = updates.middle_name;
    if (updates.last_name !== undefined) payload.last_name = updates.last_name;
    if (updates.display_name !== undefined) payload.display_name = updates.display_name;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.preferredLocation !== undefined) payload.preferred_location = updates.preferredLocation;
    if (updates.investmentBudget !== undefined) payload.investment_budget = updates.investmentBudget;
    if (
      updates.emailNotifications !== undefined ||
      updates.smsNotifications !== undefined ||
      updates.priceDropAlerts !== undefined
    ) {
      payload.notification_preferences = {
        email: Boolean(updates.emailNotifications),
        sms: Boolean(updates.smsNotifications),
        priceDrops: Boolean(updates.priceDropAlerts),
      };
    }

    const updated = await profileService.updateProfile(payload, { role: 'client' });
    return mapClientNotifications(updated);
  },

  /**
   * Change Password
   */
  async changePassword(currentPassword, newPassword) {
    if (!currentPassword) {
      throw new Error('Current password is required.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Get client saved properties
   */
  async getSavedProperties() {
    const storedIds = safeGetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, null);
    if (Array.isArray(storedIds)) {
      if (storedIds.length === 0) return [];
      try {
        const items = await Promise.all(
          storedIds.map(id => propertyService.getPropertyById(id).catch(() => null))
        );
        const resolved = items.filter(Boolean);
        if (resolved.length > 0) return resolved;
        return mockProperties.filter(p => storedIds.includes(String(p.id)));
      } catch {
        return mockProperties.filter(p => storedIds.includes(String(p.id)));
      }
    }

    // Default: seed with first 4 luxury properties
    const defaultList = mockProperties.slice(0, 4);
    safeSetStorage(
      CLIENT_STORAGE_KEYS.SAVED_PROPERTIES,
      defaultList.map((p) => String(p.id))
    );
    return defaultList;
  },

  /**
   * Save a property
   */
  async saveProperty(propertyId) {
    const idStr = String(propertyId);
    let storedIds = safeGetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, []);
    if (!storedIds.includes(idStr)) {
      storedIds = [idStr, ...storedIds];
      safeSetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, storedIds);
    }
    return this.getSavedProperties();
  },

  /**
   * Remove a saved property
   */
  async removeSavedProperty(propertyId) {
    const idStr = String(propertyId);
    let storedIds = safeGetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, []);
    storedIds = storedIds.filter((id) => id !== idStr);
    safeSetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, storedIds);
    return this.getSavedProperties();
  },

  /**
   * Get client submitted inquiries
   */
  async getClientInquiries() {
    let hasAuthToken = false;
    try {
      hasAuthToken = Boolean(localStorage.getItem('cp_auth_token'));
    } catch {
      hasAuthToken = false;
    }

    try {
      const { inquiryService } = await import('./inquiryService');
      const liveList = await inquiryService.getMyInquiries();
      if (Array.isArray(liveList) && (liveList.length > 0 || hasAuthToken)) {
        return liveList;
      }
    } catch {
      // fallback for unauthenticated/offline mock mode
    }

    const stored = safeGetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, null);
    if (Array.isArray(stored)) {
      return stored;
    }

    // Default inquiries customized for the client
    const initial = mockInquiries.slice(0, 3).map((inq, idx) => ({
      ...inq,
      client_name: 'Sophia Isabella Laurel',
      client_email: 'client@pt.com',
      client_phone: '+63 917 555 8899',
      status: idx === 0 ? 'NEW' : idx === 1 ? 'ASSIGNED' : 'SCHEDULED',
      created_at: inq.created_at || '2026-10-10 14:30',
      messages: Array.isArray(inq.messages) ? inq.messages : [
        {
          id: `msg-init-${idx}`,
          sender: 'client',
          sender_name: 'Sophia Isabella Laurel',
          timestamp: 'Yesterday',
          content: inq.message || inq.inquiry_text || 'Interested in this property listing.',
          message: inq.message || inq.inquiry_text || 'Interested in this property listing.',
        }
      ],
      messageHistory: Array.isArray(inq.messageHistory) ? inq.messageHistory : [],
    }));

    safeSetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, initial);
    return initial;
  },

  /**
   * Append a client message or reply to an inquiry thread
   */
  async addInquiryMessage(inquiryId, messageText) {
    try {
      const { inquiryService } = await import('./inquiryService');
      if (inquiryService?.addMessage) {
        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const reply = await inquiryService.addMessage(inquiryId, messageText, requestId);
        if (reply) {
          const inquiries = await this.getClientInquiries();
          const target = inquiries.find((i) => String(i.id) === String(inquiryId));
          if (target) {
            target.messages = [...(target.messages || []), reply];
            target.last_message = messageText;
            safeSetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, inquiries);
            return target;
          }
        }
      }
    } catch {
      // offline fallback
    }

    // Local state fallback
    const list = await this.getClientInquiries();
    const target = list.find((i) => String(i.id) === String(inquiryId));
    if (!target) {
      throw new Error(`Inquiry ${inquiryId} not found.`);
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'client',
      sender_name: 'Sophia Isabella Laurel',
      timestamp: 'Just now',
      content: messageText,
      message: messageText,
    };

    target.messages = [...(target.messages || []), newMessage];
    target.messageHistory = [...(target.messageHistory || []), newMessage];
    target.last_message = messageText;

    safeSetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, list);
    return target;
  },
};

export default clientUserService;
