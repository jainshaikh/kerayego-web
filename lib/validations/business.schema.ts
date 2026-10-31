import { z } from 'zod';
import { Market } from '../../types/enums';
import { CNIC_PATTERN } from './cnic.schema';

// The business profile and showroom forms on /provider/profile — the same
// rules as kerayego-partner features/business/businessForm.ts and
// features/showrooms/showroom.schema.ts. Lengths mirror kerayego-backend
// CreateProviderDto / UpdateProviderDto / CreateShowroomDto. Values are trimmed
// first: the backend checks lengths before trimming and trims before saving.

export const BUSINESS_NAME_MAX = 150;
export const BUSINESS_DESCRIPTION_MAX = 2000;
export const CNIC_EXAMPLE = '35202-1234567-1';
export const CNIC_MAX_LENGTH = 15;

export const businessDetailsSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, 'Business name is required')
    .min(2, 'Business name must be at least 2 characters')
    .max(BUSINESS_NAME_MAX, `Business name must be under ${BUSINESS_NAME_MAX} characters`),
  businessDescription: z
    .string()
    .trim()
    .max(BUSINESS_DESCRIPTION_MAX, `Description must be under ${BUSINESS_DESCRIPTION_MAX} characters`),
  // Optional in the API for older app builds, required here: the backend
  // refuses submit-for-review without it. Only KerayeGo sees it.
  ownerCnicNumber: z
    .string()
    .trim()
    .min(1, "Owner's CNIC number is required")
    .regex(CNIC_PATTERN, `Enter the 13 digits of the owner's CNIC, e.g. ${CNIC_EXAMPLE}`),
});

export type BusinessDetailsFormValues = z.infer<typeof businessDetailsSchema>;

/** The CNIC as the backend stores it, 12345-1234567-1 (the schema has checked it's 13 digits). */
export function cnicPayload(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 13
    ? `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
    : value.trim();
}

// ─── Showroom ───────────────────────────────────────────────────────────────

export const SHOWROOM_LIMITS = {
  name: 150,
  address: 500,
  city: 100,
  area: 100,
  /** contactNumber and whatsappNumber (@MaxLength(20)). */
  phone: 20,
} as const;

// The backend only checks a phone number's length. This keeps out what can't
// be dialled: digits with spaces, dashes or brackets, an optional leading +,
// and 7–15 digits.
const PHONE_CHARACTERS = /^\+?[\d\s()-]+$/;

/** Why a (trimmed) phone number can't be saved, or null. */
export function phoneNumberProblem(value: string): string | null {
  const phone = value.trim();
  if (phone.length > SHOWROOM_LIMITS.phone) return `Use ${SHOWROOM_LIMITS.phone} characters or fewer`;
  if (!PHONE_CHARACTERS.test(phone)) return 'Use digits only, with an optional + at the start';
  const digits = phone.replace(/\D/g, '').length;
  if (digits < 7) return 'This phone number is too short';
  if (digits > 15) return 'This phone number has too many digits';
  return null;
}

export const showroomFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Showroom name is required')
    .max(SHOWROOM_LIMITS.name, `Use ${SHOWROOM_LIMITS.name} characters or fewer`),
  address: z
    .string()
    .trim()
    .min(5, 'Address is required')
    .max(SHOWROOM_LIMITS.address, `Use ${SHOWROOM_LIMITS.address} characters or fewer`),
  city: z
    .string()
    .trim()
    .min(2, 'City is required')
    .max(SHOWROOM_LIMITS.city, `Use ${SHOWROOM_LIMITS.city} characters or fewer`),
  area: z.string().trim().max(SHOWROOM_LIMITS.area, `Use ${SHOWROOM_LIMITS.area} characters or fewer`),
  contactNumber: z
    .string()
    .trim()
    .min(1, 'Contact number is required')
    .superRefine((value, ctx) => {
      const problem = phoneNumberProblem(value);
      if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    }),
  whatsappNumber: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === '') return;
      const problem = phoneNumberProblem(value);
      if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    }),
  country: z.nativeEnum(Market),
  mapLat: z.number().min(-90).max(90).optional(),
  mapLng: z.number().min(-180).max(180).optional(),
});

export type ShowroomFormValues = z.infer<typeof showroomFormSchema>;
