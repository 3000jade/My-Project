import propertyService from './propertyService';
import profileService from './profileService';

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
    try {
      const serverProfile = await profileService.getProfile({ role: 'client' });
      if (serverProfile) {
        const merged = { ...DEFAULT_CLIENT_PROFILE, ...serverProfile };
        safeSetStorage(CLIENT_STORAGE_KEYS.PROFILE, merged);
        return merged;
      }
    } catch {
      // Fallback to storage
    }
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

    try {
      await profileService.updateProfile({
        name,
        phone: merged.phone,
        bio: merged.bio,
        preferred_location: merged.preferredLocation,
        investment_budget: merged.investmentBudget,
        notification_preferences: {
          email: merged.emailNotifications,
          sms: merged.smsNotifications,
          priceDrops: merged.priceDropAlerts,
        },
      }, { role: 'client' });
    } catch {
      // Offline fallback
    }

    return merged;
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
    return { success: true, message: 'Password successfully updated.' };
  },

  /**
   * Get client saved properties
   */
  async getSavedProperties() {
    const storedIds = safeGetStorage(CLIENT_STORAGE_KEYS.SAVED_PROPERTIES, []);
    if (!Array.isArray(storedIds) || storedIds.length === 0) {
      return [];
    }

    try {
      const items = await Promise.all(
        storedIds.map(id => propertyService.getPropertyById(id).catch(() => null))
      );
      return items.filter(Boolean);
    } catch (err) {
      console.warn('[clientUserService] Failed to load saved properties from API:', err);
      return [];
    }
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
    try {
      const { inquiryService } = await import('./inquiryService');
      const liveList = await inquiryService.getMyInquiries();
      if (Array.isArray(liveList)) {
        return liveList;
      }
    } catch (err) {
      console.warn('[clientUserService] Live inquiry fetch error:', err);
    }

    const stored = safeGetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, []);
    return Array.isArray(stored) ? stored : [];
  },

  /**
   * Append a client message or reply to an inquiry thread
   */
  async addInquiryMessage(inquiryId, messageText) {
    try {
      const { inquiryService } = await import('./inquiryService');
      if (inquiryService?.addMessage) {
        return await inquiryService.addMessage(inquiryId, {
          senderRole: 'client',
          message: messageText,
        });
      }
    } catch (err) {
      console.warn('[clientUserService] Could not post message via API:', err);
    }

    // Local state fallback
    const list = await this.getClientInquiries();
    const updated = list.map((item) => {
      if (item.id === inquiryId) {
        const history = Array.isArray(item.messageHistory)
          ? item.messageHistory
          : Array.isArray(item.messages)
          ? item.messages
          : [];
        return {
          ...item,
          messageHistory: [
            ...history,
            {
              id: `msg-${Date.now()}`,
              sender: 'You',
              senderRole: 'client',
              message: messageText,
              timestamp: 'Just now',
            },
          ],
        };
      }
      return item;
    });

    safeSetStorage(CLIENT_STORAGE_KEYS.INQUIRIES, updated);
    return updated.find((inq) => inq.id === inquiryId) || null;
  },
};

export default clientUserService;
