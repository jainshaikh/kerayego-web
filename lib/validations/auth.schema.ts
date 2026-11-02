import { z } from 'zod';
import { Role } from '../../types/enums';

// Sign-in and sign-up use a 6-digit code emailed by the backend
// (POST /auth/code/request → POST /auth/code/verify). There are no passwords.

const emailSchema = z.string().trim().email('Please enter a valid email address');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  // The backend normalises and validates the number (400 / 409 PHONE_TAKEN).
  phone: z.string().trim().min(1, 'Mobile number is required').max(20),
  role: z.enum([Role.USER, Role.PROVIDER]).default(Role.USER),
});

export const requestCodeSchema = z.object({
  email: emailSchema,
});

export const verifyCodeSchema = z.object({
  // The backend ignores spaces too.
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type RequestCodeFormValues = z.infer<typeof requestCodeSchema>;
export type VerifyCodeFormValues = z.input<typeof verifyCodeSchema>;
