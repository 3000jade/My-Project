import { UserRole } from './auth';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  priceDrops: boolean;
}

export type ProfileVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface UserProfileDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  preferredLocation?: string;
  investmentBudget?: string;
  prcLicenseNo?: string;
  prcValidity?: string;
  dhsudAccreditationNo?: string;
  dhsudValidity?: string;
  firmName?: string;
  experienceYears?: number;
  verificationStatus: ProfileVerificationStatus;
  notificationPreferences?: NotificationPreferences;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  preferredLocation?: string;
  preferred_location?: string;
  investmentBudget?: string;
  investment_budget?: string;
  prcLicenseNo?: string;
  prc_license_no?: string;
  prcValidity?: string;
  prc_validity?: string;
  dhsudAccreditationNo?: string;
  dhsud_accreditation_no?: string;
  dhsudValidity?: string;
  dhsud_validity?: string;
  firmName?: string;
  firm_name?: string;
  experienceYears?: number;
  experience_years?: number;
  notificationPreferences?: Partial<NotificationPreferences>;
  notification_preferences?: Partial<NotificationPreferences>;
}
