import { mockProperties } from '../mockData/mockProperties';
import { mockInquiries } from '../mockData/mockInquiries';

const CLIENT_STORAGE_KEYS = {
  PROFILE: 'cp_client_profile_mock',
  SAVED_PROPERTIES: 'cp_client_saved_properties_mock',
  INQUIRIES: 'cp_client_inquiries_mock',
};

const DEFAULT_CLIENT_PROFILE = {
  id: 'client-001',
  firstName: 'Sophia Isabella',
  lastName: 'Laurel',
  name: 'Sophia Isabella Laurel',
  email: 'client@pt.com',
  phone: '+63 917 555 8899',
  role: 'Registered Client',
  rawRole: 'client',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Private investor exploring high-yield prime estates and modern architectural condominiums in Bonifacio Global City and Ayala Alabang.',
  preferredLocation: 'Bonifacio Global City, Taguig',
  preferredCurrency: 'PHP',
  investmentBudget: '₱50,000,000 - ₱120,000,000',
  memberSince: 'March 2026',
  emailNotifications: true,
  smsNotifications: true,
  priceDropAlerts: true,
};

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
   * Get current client profile
   */
  async getClientProfile() {
    return safeGetStorage(CLIENT_STORAGE_KEYS.PROFILE, DEFAULT_CLIENT_PROFILE);
  },

  /**
   * Update client profile
   */
  async updateClientProfile(updates) {
    const current = await this.getClientProfile();
    const firstName = updates.firstName !== undefined ? updates.firstName : current.firstName;
    const lastName = updates.lastName !== undefined ? updates.lastName : current.lastName;
    const name = [firstName, lastName].filter(Boolean).join(' ') || current.name;

    const merged = {
      ...current,
      ...updates,
      firstName,
      lastName,
      name,
    };

    safeSetStorage(CLIENT_STORAGE_KEYS.PROFILE, merged);
    return merged;
  },

  /**
   * Mock Change Password
   */
  async changePassword(currentPassword, newPassword) {
    if (!currentPassword) {
      throw new Error('Current password is required.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    return { success: true, message: 'Password successfully updated.' };
  },

  /**
   * Get client saved properties
   */
  async getSavedProperties() {
    const storedIds = safeGetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, null);
    if (Array.isArray(storedIds)) {
      return mockProperties.filter((p) => storedIds.includes(String(p.id)));
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
    return mockProperties.filter((p) => storedIds.includes(String(p.id)));
  },

  /**
   * Remove a saved property
   */
  async removeSavedProperty(propertyId) {
    const idStr = String(propertyId);
    let storedIds = safeGetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, []);
    storedIds = storedIds.filter((id) => id !== idStr);
    safeSetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, storedIds);
    return mockProperties.filter((p) => storedIds.includes(String(p.id)));
  },

  /**
   * Get client submitted inquiries
   */
  async getClientInquiries() {
    try {
      const { inquiryService } = await import('./inquiryService');
      const liveList = await inquiryService.getMyInquiries();
      if (Array.isArray(liveList) && liveList.length > 0) {
        return liveList;
      }
    } catch (err) {
      console.warn('[clientUserService] Live inquiry fetch failed, using stored inquiries:', err);
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
      const reply = await inquiryService.addMessage(inquiryId, messageText);
      if (reply) {
        const inquiries = await this.getClientInquiries();
        const target = inquiries.find((i) => String(i.id) === String(inquiryId));
        if (target) {
          target.messages = [...(target.messages || []), reply];
          target.last_message = messageText;
          return target;
        }
      }
    } catch (err) {
      console.warn('[clientUserService] Live addMessage failed, storing locally:', err);
    }

    const inquiries = await this.getClientInquiries();
    const target = inquiries.find((i) => String(i.id) === String(inquiryId));
    if (!target) {
      throw new Error(`Inquiry ${inquiryId} not found.`);
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'client',
      sender_name: 'Sophia Isabella Laurel',
      timestamp: 'Just now',
      content: messageText,
    };

    target.messages = [...(target.messages || []), newMessage];
    target.last_message = messageText;

    safeSetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, inquiries);
    return target;
  },
};

export default clientUserService;
