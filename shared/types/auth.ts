export type UserRole = 'client' | 'agent' | 'broker' | 'admin';

export type Permission = 
  | 'property:create'
  | 'property:edit'
  | 'property:delete'
  | 'property:view_private'
  | 'inquiries:manage'
  | 'reports:view'
  | 'users:manage'
  | string;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions?: Permission[];
  avatarUrl?: string;
  phone?: string;
  isVerified?: boolean;
  mfaEnabled?: boolean;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
  acceptedTerms: boolean;
}

export interface MfaVerificationPayload {
  code: string;
  challengeId?: string;
}
