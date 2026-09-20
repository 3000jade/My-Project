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
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  updated_at?: string;
}

const defaultProfiles: Record<string, UserProfileData> = {
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
    verification_status: 'VERIFIED',
    updated_at: new Date().toISOString(),
  },
};

let inMemoryProfiles: Map<string, UserProfileData> = new Map([
  ['user-broker-1', { ...defaultProfiles.broker }],
  ['user-agent-1', { ...defaultProfiles.agent }],
  ['broker@pt.com', { ...defaultProfiles.broker }],
  ['agent@pt.com', { ...defaultProfiles.agent }],
]);

export class ProfileService {
  /**
   * Get user profile by userId or by role
   */
  public static async getProfile(userId?: string, role?: string): Promise<UserProfileData> {
    const targetRole = (role === 'broker' ? 'broker' : 'agent') as 'broker' | 'agent';

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
            name: data.full_name || defaultProfiles[targetRole].name,
            email: data.email || defaultProfiles[targetRole].email,
            phone: data.phone || defaultProfiles[targetRole].phone,
            role: (data.role as any) || targetRole,
            avatar: data.avatar_url || defaultProfiles[targetRole].avatar,
            avatar_url: data.avatar_url || defaultProfiles[targetRole].avatar,
            bio: data.bio || defaultProfiles[targetRole].bio,
            prc_license_no: data.prc_license_no || defaultProfiles[targetRole].prc_license_no,
            prc_validity: data.prc_validity || defaultProfiles[targetRole].prc_validity,
            dhsud_accreditation_no: data.dhsud_accreditation_no || defaultProfiles[targetRole].dhsud_accreditation_no,
            dhsud_validity: data.dhsud_validity || defaultProfiles[targetRole].dhsud_validity,
            firm_name: data.firm_name || defaultProfiles[targetRole].firm_name,
            experience_years: data.experience_years ?? defaultProfiles[targetRole].experience_years,
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

    return { ...defaultProfiles[targetRole] };
  }

  /**
   * Update profile fields
   */
  public static async updateProfile(
    userId: string,
    updates: UpdateProfileInput,
    role?: string
  ): Promise<UserProfileData> {
    const targetRole = (role === 'broker' ? 'broker' : 'agent') as 'broker' | 'agent';
    const current = await this.getProfile(userId, role);

    const updatedName = updates.fullName || updates.name || current.name;
    const updatedAvatar = updates.avatar_url || updates.avatar || current.avatar;

    const updatedData: UserProfileData = {
      ...current,
      ...updates,
      name: updatedName,
      avatar: updatedAvatar,
      avatar_url: updatedAvatar,
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
    // Also update defaultProfiles cache for role preview
    defaultProfiles[targetRole] = { ...updatedData };

    return updatedData;
  }
}

export default ProfileService;
