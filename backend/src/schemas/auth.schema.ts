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
  role: z.enum(['agent', 'broker', 'client']).optional().default('agent'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
