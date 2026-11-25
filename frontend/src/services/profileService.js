// ==============================================================================
// Profile Service
// Communicates EXCLUSIVELY with the Express Backend (/api/profile)
// ==============================================================================

import apiClient from './apiClient';

export const mockDefaultProfiles = {
  client: {
    id: 'user-client-1',
    name: 'Sophia Isabella Laurel',
    firstName: 'Sophia',
    lastName: 'Laurel',
    email: 'client@pt.com',
    phone: '+63 917 555 8899',
    role: 'Registered Client',
    rawRole: 'client',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Private investor exploring high-yield prime estates and modern architectural condominiums in Bonifacio Global City and Ayala Alabang.',
    preferredLocation: 'Bonifacio Global City, Taguig',
    investmentBudget: '₱50,000,000 - ₱120,000,000',
    ui_preferences: { font_size: 'standard' },
    verification_status: 'VERIFIED',
  },
  broker: {
    id: 'user-broker-1',
    name: 'Alexander Sterling',
    firstName: 'Alexander',
    lastName: 'Sterling',
    email: 'broker@pt.com',
    phone: '+63 918 555 0244',
    role: 'Principal Broker & Managing Director',
    rawRole: 'broker',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    bio: 'Principal Broker & Managing Director overseeing firm listings, regulatory accreditations, and institutional portfolio acquisitions.',
    prc_license_no: 'PRC-REB-0019582',
    prc_validity: '2028-03-20',
    dhsud_accreditation_no: 'DHSUD-NCR-AA-2022-0941',
    dhsud_validity: '2027-04-30',
    firm_name: 'Precision Trust Realty Operations Inc.',
    experience_years: 12,
    ui_preferences: { font_size: 'standard' },
    verification_status: 'VERIFIED',
  },
  agent: {
    id: 'user-agent-1',
    name: 'Elena Rossi',
    firstName: 'Elena',
    lastName: 'Rossi',
    email: 'agent@pt.com',
    phone: '+63 917 555 0192',
    role: 'Senior Real Estate Consultant',
    rawRole: 'agent',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    bio: 'Senior Luxury Property Consultant specializing in exclusive enclaves across Makati, Bonifacio Global City, and Ayala Alabang. Consistent top producer with high client satisfaction.',
    prc_license_no: 'PRC-REB-0028491',
    prc_validity: '2027-08-15',
    dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
    dhsud_validity: '2026-12-31',
    firm_name: 'Precision Trust Realty Operations Inc.',
    experience_years: 6,
    ui_preferences: { font_size: 'standard' },
    verification_status: 'VERIFIED',
  },
};

/**
 * Normalizes backend profile payload into consistent UI representation
 */
export function normalizeProfile(raw = {}) {
  const effectiveRole = raw.rawRole || (['broker', 'agent', 'client', 'admin'].includes(raw.role) ? raw.role : null) || 'agent';

  const name = raw.name ?? raw.full_name ?? '';
  const nameParts = String(name).trim().split(/\s+/).filter(Boolean);
  const firstName = raw.firstName ?? nameParts[0] ?? '';
  const lastName = raw.lastName ?? nameParts.slice(1).join(' ') ?? '';

  const avatar = raw.avatar ?? raw.avatar_url ?? '';

  const displayRole = (effectiveRole === 'broker' || raw.role === 'broker')
    ? 'Principal Broker & Managing Director'
    : (effectiveRole === 'client' || raw.role === 'client')
    ? 'Registered Client'
    : (raw.role_title || 'Senior Real Estate Consultant');

  return {
    id: raw.id ?? '',
    name,
    firstName,
    lastName,
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    role: displayRole,
    rawRole: raw.role || effectiveRole,
    avatar,
    bio: raw.bio ?? '',
    date_of_birth: raw.date_of_birth ?? '',
    gender: raw.gender ?? '',
    emergency_contact_name: raw.emergency_contact_name ?? '',
    emergency_contact_phone: raw.emergency_contact_phone ?? '',
    preferredLocation: raw.preferredLocation ?? raw.preferred_location ?? '',
    investmentBudget: raw.investmentBudget ?? raw.investment_budget ?? '',
    notificationPreferences: raw.notificationPreferences ?? raw.notification_preferences ?? { email: true, sms: true, priceDrops: true },
    ui_preferences: raw.ui_preferences ?? raw.uiPreferences ?? { font_size: 'standard' },
    prc_license_no: raw.prc_license_no ?? '',
    prc_validity: raw.prc_validity ?? '',
    dhsud_accreditation_no: raw.dhsud_accreditation_no ?? '',
    dhsud_validity: raw.dhsud_validity ?? '',
    firm_name: raw.firm_name ?? '',
    experience_years: raw.experience_years ?? 0,
    verification_status: raw.verification_status || 'PENDING',
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const profileService = {
  /**
   * Fetch current user profile
   */
  async getProfile({ role = 'agent', userId } = {}) {
    const response = await apiClient.get('/profile', {
      params: { role, userId },
    });
    if (response && response.data) {
      return normalizeProfile(response.data);
    }
    throw new Error('Failed to load profile from server.');
  },

  /**
   * Update current user profile
   */
  async updateProfile(updates, { role = 'agent' } = {}) {
    const response = await apiClient.put('/profile', updates, {
      params: { role },
    });
    if (response && response.data) {
      return normalizeProfile(response.data);
    }
    throw new Error('Failed to save profile changes.');
  },
};

export default profileService;
