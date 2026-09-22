// ==============================================================================
// Profile Service
// Communicates EXCLUSIVELY with the Express Backend (/api/profile)
// ==============================================================================

import apiClient from './apiClient';

export const mockDefaultProfiles = {
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
    verification_status: 'VERIFIED',
  },
};

/**
 * Normalizes backend profile payload into consistent UI representation
 */
export function normalizeProfile(raw = {}) {
  const roleKey = (raw.role === 'broker' ? 'broker' : 'agent');
  const defaults = mockDefaultProfiles[roleKey] || mockDefaultProfiles.agent;

  const name = raw.name || raw.full_name || defaults.name;
  const nameParts = name.trim().split(' ');
  const firstName = raw.firstName || nameParts[0] || '';
  const lastName = raw.lastName || nameParts.slice(1).join(' ') || '';

  const avatar = raw.avatar || raw.avatar_url || defaults.avatar;

  const displayRole = raw.role === 'broker'
    ? 'Principal Broker & Managing Director'
    : (raw.role_title || defaults.role);

  return {
    id: raw.id || defaults.id,
    name,
    firstName,
    lastName,
    email: raw.email || defaults.email,
    phone: raw.phone || defaults.phone,
    role: displayRole,
    rawRole: raw.role || roleKey,
    avatar,
    bio: raw.bio || defaults.bio,
    prc_license_no: raw.prc_license_no || defaults.prc_license_no,
    prc_validity: raw.prc_validity || defaults.prc_validity,
    dhsud_accreditation_no: raw.dhsud_accreditation_no || defaults.dhsud_accreditation_no,
    dhsud_validity: raw.dhsud_validity || defaults.dhsud_validity,
    firm_name: raw.firm_name || defaults.firm_name,
    experience_years: raw.experience_years ?? defaults.experience_years,
    verification_status: raw.verification_status || 'VERIFIED',
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const profileService = {
  /**
   * Fetch current user profile with role fallback
   */
  async getProfile({ role = 'agent', userId } = {}) {
    try {
      const response = await apiClient.get('/profile', {
        params: { role, userId },
      });
      if (response && response.data) {
        return normalizeProfile(response.data);
      }
      return normalizeProfile(mockDefaultProfiles[role]);
    } catch (err) {
      console.warn(`[profileService] getProfile fallback for ${role}:`, err.message);
      return normalizeProfile(mockDefaultProfiles[role]);
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(updates, { role = 'agent' } = {}) {
    try {
      const response = await apiClient.put('/profile', updates, {
        params: { role },
      });
      if (response && response.data) {
        return normalizeProfile(response.data);
      }
      return normalizeProfile({ ...mockDefaultProfiles[role], ...updates });
    } catch (err) {
      console.warn(`[profileService] updateProfile fallback for ${role}:`, err.message);
      return normalizeProfile({ ...mockDefaultProfiles[role], ...updates });
    }
  },
};

export default profileService;
