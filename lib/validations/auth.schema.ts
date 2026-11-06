import { z } from 'zod';
import { Role } from '../../types/enums';

// There are no passwords. Sign-in and sign-up start with the mobile number: a
// 6-digit WhatsApp code (POST /auth/phone/request → /auth/phone/verify), then —
// for a number with no account — the profile step (POST /auth/phone/register).
// The number step reuses sendPhoneCodeSchema (phone.schema.ts). Email stays a
// sign-in backup: a 6-digit emailed code (POST /auth/code/request → /code/verify).

const emailSchema = z.string().trim().email('Please enter a valid email address');

/** The sign-up profile step after a verified number (POST /auth/phone/register). */
export const phoneProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100, 'Name must be 100 characters or fewer'),
  email: emailSchema,
  role: z.enum([Role.USER, Role.PROVIDER]),
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

export type PhoneProfileFormValues = z.infer<typeof phoneProfileSchema>;
export type RequestCodeFormValues = z.infer<typeof requestCodeSchema>;
export type VerifyCodeFormValues = z.input<typeof verifyCodeSchema>;
