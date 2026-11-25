import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { UpdateProfileInput } from '../schemas/profile.schema';

export interface UserProfileData {
  id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  phone: string;
  role: 'admin' | 'broker' | 'agent' | 'client';
  avatar: string;
  avatar_url?: string;
  bio: string;
  prc_license_no: string;
  prc_validity: string;
  dhsud_accreditation_no: string;
  dhsud_validity: string;
  firm_name: string;
  experience_years: number;
  date_of_birth?: string | null;
  gender?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  preferred_location?: string;
  investment_budget?: string;
  notification_preferences?: Record<string, boolean>;
  ui_preferences?: Record<string, any>;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  updated_at?: string;
}

const defaultProfiles: Record<string, UserProfileData> = {
  client: {
    id: 'user-client-1',
    name: 'Sophia Isabella Laurel',
    email: 'client@pt.com',
    phone: '+63 917 555 8899',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Private investor exploring high-yield prime estates and modern architectural condominiums.',
    prc_license_no: '',
    prc_validity: '',
    dhsud_accreditation_no: '',
    dhsud_validity: '',
    firm_name: '',
    experience_years: 0,
    preferred_location: 'Bonifacio Global City, Taguig',
    investment_budget: '₱50,000,000 - ₱120,000,000',
    notification_preferences: { email: true, sms: true, priceDrops: true },
    ui_preferences: { font_size: 'standard' },
    verification_status: 'VERIFIED',
    updated_at: new Date().toISOString(),
  },
  broker: {
    id: 'user-broker-1',
    name: 'Alexander Sterling',
    email: 'broker@pt.com',
    phone: '+63 918 555 0244',
    role: 'broker',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    bio: 'Principal Broker & Managing Director overseeing firm listings, regulatory accreditations, and institutional portfolio acquisitions.',
    prc_license_no: 'PRC-REB-0019582',
    prc_validity: '2028-03-20',
    dhsud_accreditation_no: 'DHSUD-NCR-AA-2022-0941',
    dhsud_validity: '2027-04-30',
    firm_name: 'Precision Trust Realty Operations Inc.',
    experience_years: 12,
    ui_preferences: { font_size: 'standard' },
    verification_status: 'VERIFIED',
    updated_at: new Date().toISOString(),
  },
  agent: {
    id: 'user-agent-1',
    name: 'Elena Rossi',
    email: 'agent@pt.com',
    phone: '+63 917 555 0192',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    bio: 'Senior Luxury Property Consultant specializing in exclusive enclaves across Makati, Bonifacio Global City, and Ayala Alabang. Consistent top producer with high client satisfaction.',
    prc_license_no: 'PRC-REB-0028491',
    prc_validity: '2027-08-15',
    dhsud_accreditation_no: 'DHSUD-NCR-AA-2023-0182',
    dhsud_validity: '2026-12-31',
    firm_name: 'Precision Trust Realty Operations Inc.',
    experience_years: 6,
    ui_preferences: { font_size: 'standard' },
    verification_status: 'VERIFIED',
    updated_at: new Date().toISOString(),
  },
};

let inMemoryProfiles: Map<string, UserProfileData> = new Map([
  ['user-broker-1', { ...defaultProfiles.broker }],
  ['user-agent-1', { ...defaultProfiles.agent }],
  ['user-client-1', { ...defaultProfiles.client }],
  ['broker@pt.com', { ...defaultProfiles.broker }],
  ['agent@pt.com', { ...defaultProfiles.agent }],
  ['client@pt.com', { ...defaultProfiles.client }],
]);

export class ProfileService {
  /**
   * Get user profile by userId or by role
   */
  public static async getProfile(userId?: string, role?: string): Promise<UserProfileData> {
    const rawRole = (role || 'agent').toLowerCase();
    const targetRole = (['broker', 'agent', 'client', 'admin'].includes(rawRole)
      ? rawRole
      : 'agent') as 'broker' | 'agent' | 'client' | 'admin';
    const fallbackProfile = defaultProfiles[targetRole] || defaultProfiles.agent;

    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          const fullName = data.full_name ?? '';
          const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
          return {
            id: data.id,
            name: data.display_name || fullName,
            first_name: data.first_name ?? parts[0] ?? '',
            middle_name: data.middle_name ?? '',
            last_name: data.last_name ?? (parts.length > 1 ? parts.slice(1).join(' ') : ''),
            display_name: data.display_name ?? fullName,
            email: data.email ?? '',
            phone: data.phone ?? '',
            role: (data.role as any) || targetRole,
            avatar: data.avatar_url ?? '',
            avatar_url: data.avatar_url ?? '',
            bio: data.bio ?? '',
            prc_license_no: data.prc_license_no ?? '',
            prc_validity: data.prc_validity ?? '',
            dhsud_accreditation_no: data.dhsud_accreditation_no ?? '',
            dhsud_validity: data.dhsud_validity ?? '',
            firm_name: data.firm_name ?? '',
            experience_years: data.experience_years ?? 0,
            date_of_birth: data.date_of_birth ?? null,
            gender: data.gender ?? null,
            emergency_contact_name: data.emergency_contact_name ?? null,
            emergency_contact_phone: data.emergency_contact_phone ?? null,
            preferred_location: data.preferred_location ?? '',
            investment_budget: data.investment_budget ?? '',
            notification_preferences: data.notification_preferences || { email: true, sms: true, priceDrops: true },
            ui_preferences: data.ui_preferences || { font_size: 'standard' },
            verification_status: data.verification_status || 'PENDING',
            updated_at: data.updated_at,
          };
        }
        if (error) {
          logger.warn('Supabase getProfile error:', error.message);
          throw new Error(`Failed to load profile from Supabase: ${error.message}`);
        }
      } catch (err: any) {
        logger.warn('Supabase getProfile failed:', err.message);
        throw err;
      }
    }

    // In-memory fallback (local/test mode when Supabase is not configured)
    if (!isSupabaseConfigured && userId && inMemoryProfiles.has(userId)) {
      return { ...inMemoryProfiles.get(userId)! };
    }

    return { ...fallbackProfile };
  }

  /**
   * Update profile fields
   */
  public static async updateProfile(
    userId: string,
    updates: UpdateProfileInput,
    role?: string,
    isAdmin = false
  ): Promise<UserProfileData> {
    const rawRole = (role || 'agent').toLowerCase();
    const targetRole = (['broker', 'agent', 'client', 'admin'].includes(rawRole)
      ? rawRole
      : 'agent') as 'broker' | 'agent' | 'client' | 'admin';
    const current = await this.getProfile(userId, role);

    const firstName = updates.first_name ?? current.first_name ?? '';
    const middleName = updates.middle_name ?? current.middle_name ?? '';
    const lastName = updates.last_name ?? current.last_name ?? '';
    const composedName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    const displayName = updates.display_name ?? updates.fullName ?? updates.name ?? (composedName || current.display_name || current.name);
    const updatedName = displayName;
    const updatedAvatar = updates.avatar_url ?? updates.avatar ?? current.avatar;
    const updatedLocation = updates.preferred_location ?? updates.preferredLocation ?? current.preferred_location;
    const updatedBudget = updates.investment_budget ?? updates.investmentBudget ?? current.investment_budget;
    const updatedNotifications = updates.notification_preferences ?? updates.notificationPreferences ?? current.notification_preferences;
    const updatedUiPreferences = updates.ui_preferences ?? updates.uiPreferences ?? (
      updates.font_size_preference
        ? { ...(current.ui_preferences || {}), font_size: updates.font_size_preference }
        : current.ui_preferences || { font_size: 'standard' }
    );

    // Anti-tampering guard: only admin can alter role/verification_status;
    // only brokers/admins can directly edit regulatory license fields via /api/profile
    const finalRole = isAdmin && updates.role ? updates.role : current.role;
    const finalVerificationStatus = isAdmin && updates.verification_status ? updates.verification_status : current.verification_status;
    const canEditRegulatoryFields = isAdmin || targetRole === 'broker';

    const updatedData: UserProfileData = {
      ...current,
      name: updatedName,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      display_name: displayName,
      phone: updates.phone ?? current.phone,
      bio: updates.bio ?? current.bio,
      experience_years: updates.experience_years ?? current.experience_years,
      date_of_birth: updates.date_of_birth !== undefined ? updates.date_of_birth : current.date_of_birth ?? null,
      gender: updates.gender !== undefined ? updates.gender : current.gender ?? null,
      emergency_contact_name:
        updates.emergency_contact_name !== undefined
          ? updates.emergency_contact_name
          : current.emergency_contact_name ?? null,
      emergency_contact_phone:
        updates.emergency_contact_phone !== undefined
          ? updates.emergency_contact_phone
          : current.emergency_contact_phone ?? null,
      firm_name: canEditRegulatoryFields ? (updates.firm_name ?? current.firm_name) : current.firm_name,
      prc_license_no: canEditRegulatoryFields ? (updates.prc_license_no ?? current.prc_license_no) : current.prc_license_no,
      prc_validity: canEditRegulatoryFields ? (updates.prc_validity ?? current.prc_validity) : current.prc_validity,
      dhsud_accreditation_no: canEditRegulatoryFields
        ? (updates.dhsud_accreditation_no ?? current.dhsud_accreditation_no)
        : current.dhsud_accreditation_no,
      dhsud_validity: canEditRegulatoryFields ? (updates.dhsud_validity ?? current.dhsud_validity) : current.dhsud_validity,
      role: finalRole,
      verification_status: finalVerificationStatus,
      avatar: updatedAvatar,
      avatar_url: updatedAvatar,
      preferred_location: updatedLocation,
      investment_budget: updatedBudget,
      notification_preferences: updatedNotifications,
      ui_preferences: updatedUiPreferences,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && userId) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: updatedData.name,
          first_name: updatedData.first_name ?? '',
          middle_name: updatedData.middle_name ?? '',
          last_name: updatedData.last_name ?? '',
          display_name: updatedData.display_name ?? updatedData.name,
          phone: updatedData.phone,
          avatar_url: updatedData.avatar,
          bio: updatedData.bio,
          preferred_location: updatedData.preferred_location,
          investment_budget: updatedData.investment_budget,
          firm_name: updatedData.firm_name,
          prc_license_no: updatedData.prc_license_no,
          prc_validity: updatedData.prc_validity,
          dhsud_accreditation_no: updatedData.dhsud_accreditation_no,
          dhsud_validity: updatedData.dhsud_validity,
          experience_years: updatedData.experience_years,
          date_of_birth: updatedData.date_of_birth ?? null,
          gender: updatedData.gender ?? null,
          emergency_contact_name: updatedData.emergency_contact_name ?? null,
          emergency_contact_phone: updatedData.emergency_contact_phone ?? null,
          notification_preferences: updatedData.notification_preferences,
          ui_preferences: updatedData.ui_preferences,
          updated_at: updatedData.updated_at,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Supabase updateProfile error:', error.message);
        throw new Error(`Failed to persist profile update: ${error.message}`);
      }
      if (data?.updated_at) {
        updatedData.updated_at = data.updated_at;
      }
      return updatedData;
    }

    // Local/test mode without Supabase: store only for this userId (never mutate defaultProfiles)
    if (userId) {
      inMemoryProfiles.set(userId, updatedData);
    }

    return updatedData;
  }
}

export default ProfileService;
