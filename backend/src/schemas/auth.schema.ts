import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email or username is required.')
    .trim()
    .toLowerCase()
    .transform((val) => {
      if (val === 'agent') return 'agent@pt.com';
      if (val === 'broker') return 'broker@pt.com';
      if (val === 'admin') return 'admin@pt.com';
      if (val === 'client') return 'client@pt.com';
      return val;
    })
    .pipe(z.string().email('Invalid email address format.')),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address format.')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.')
    .trim()
    .optional(),
  role: z.literal('client').optional().default('client'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, 'Google ID token is required.'),
  role: z.enum(['agent', 'broker', 'client']).optional().default('client'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const registerAgentSchema = z.object({
  token: z.string().min(16, 'Valid invitation token is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  fullName: z.string().min(2, 'Full name is required.').max(100).trim(),
  phone: z.string().min(7, 'Valid contact number is required.').max(20).trim(),
  prcLicenseNo: z.string().min(5, 'PRC license number is required.').trim(),
  prcValidity: z.string().min(4, 'PRC validity date is required.'),
  dhsudAccreditationNo: z.string().min(5, 'DHSUD accreditation number is required.').trim(),
  dhsudValidity: z.string().min(4, 'DHSUD validity date is required.'),
  documents: z
    .array(
      z.object({
        name: z.string(),
        fileId: z.string().optional(),
        webViewLink: z.string().optional(),
        mimeType: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;

export const registerInitiateSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address format.')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.')
    .trim(),
  phone: z.string().max(20).optional(),
  role: z.literal('client').optional().default('client'),
});

export type RegisterInitiateInput = z.infer<typeof registerInitiateSchema>;

export const registerVerifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address format.')
    .trim()
    .toLowerCase(),
  otp: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'Verification code must contain digits only.'),
  password: z.string().min(8).optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.literal('client').optional().default('client'),
});

export type RegisterVerifyOtpInput = z.infer<typeof registerVerifyOtpSchema>;

export const registerResendOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address format.')
    .trim()
    .toLowerCase(),
});

export type RegisterResendOtpInput = z.infer<typeof registerResendOtpSchema>;


