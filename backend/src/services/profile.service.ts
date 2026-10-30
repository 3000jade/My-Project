import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { UpdateProfileInput } from '../schemas/profile.schema';

export interface UserProfileData {
  id: string;
  name: string;
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
          return {
            id: data.id,
            name: data.full_name || fallbackProfile.name,
            email: data.email || fallbackProfile.email,
            phone: data.phone || fallbackProfile.phone,
            role: (data.role as any) || targetRole,
            avatar: data.avatar_url || fallbackProfile.avatar,
            avatar_url: data.avatar_url || fallbackProfile.avatar,
            bio: data.bio || fallbackProfile.bio,
            prc_license_no: data.prc_license_no || fallbackProfile.prc_license_no,
            prc_validity: data.prc_validity || fallbackProfile.prc_validity,
            dhsud_accreditation_no: data.dhsud_accreditation_no || fallbackProfile.dhsud_accreditation_no,
            dhsud_validity: data.dhsud_validity || fallbackProfile.dhsud_validity,
            firm_name: data.firm_name || fallbackProfile.firm_name,
            experience_years: data.experience_years ?? fallbackProfile.experience_years,
            preferred_location: data.preferred_location || fallbackProfile.preferred_location,
            investment_budget: data.investment_budget || fallbackProfile.investment_budget,
            notification_preferences: data.notification_preferences || fallbackProfile.notification_preferences,
            ui_preferences: data.ui_preferences || fallbackProfile.ui_preferences || { font_size: 'standard' },
            verification_status: data.verification_status || 'VERIFIED',
            updated_at: data.updated_at,
          };
        }
      } catch (err: any) {
        logger.warn('Supabase getProfile failed, using fallback:', err.message);
      }
    }

    // In-memory fallback
    if (userId && inMemoryProfiles.has(userId)) {
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

    const updatedName = updates.fullName || updates.name || current.name;
    const updatedAvatar = updates.avatar_url || updates.avatar || current.avatar;
    const updatedLocation = updates.preferred_location || updates.preferredLocation || current.preferred_location;
    const updatedBudget = updates.investment_budget || updates.investmentBudget || current.investment_budget;
    const updatedNotifications = updates.notification_preferences || updates.notificationPreferences || current.notification_preferences;
    const updatedUiPreferences = updates.ui_preferences || updates.uiPreferences || (
      updates.font_size_preference 
        ? { ...(current.ui_preferences || {}), font_size: updates.font_size_preference }
        : current.ui_preferences || { font_size: 'standard' }
    );

    // Anti-tampering guard: only admin can alter role or verification_status
    const finalRole = isAdmin && updates.role ? updates.role : current.role;
    const finalVerificationStatus = isAdmin && updates.verification_status ? updates.verification_status : current.verification_status;

    const updatedData: UserProfileData = {
      ...current,
      ...updates,
      name: updatedName,
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
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: updatedData.name,
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
            notification_preferences: updatedData.notification_preferences,
            ui_preferences: updatedData.ui_preferences,
            updated_at: updatedData.updated_at,
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          logger.warn('Supabase updateProfile error, fallback to memory:', error.message);
        } else if (data) {
          updatedData.updated_at = data.updated_at;
        }
      } catch (err: any) {
        logger.warn('Supabase updateProfile exception:', err.message);
      }
    }

    inMemoryProfiles.set(userId, updatedData);
    if (updatedData.email) {
      inMemoryProfiles.set(updatedData.email, updatedData);
    }
    if (defaultProfiles[targetRole]) {
      defaultProfiles[targetRole] = { ...updatedData };
    }

    return updatedData;
  }
}

export default ProfileService;
