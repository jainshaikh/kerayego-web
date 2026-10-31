import { z } from 'zod';
import { cnicNumberSchema } from './cnic.schema';

export const createProviderSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(150, 'Business name must be under 150 characters'),
  businessDescription: z
    .string()
    .max(2000, 'Description must be under 2000 characters')
    .optional()
    .or(z.literal('')),
  contactPhone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal('')),
  // Optional in the API; required in this form (submit-for-review 400s without it).
  ownerCnicNumber: cnicNumberSchema,
});

export const updateProviderSchema = z.object({
  businessName: z.string().min(2).max(150).optional(),
  businessDescription: z.string().max(2000).optional().or(z.literal('')),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ownerCnicNumber: cnicNumberSchema,
});

export const showroomSchema = z.object({
  name: z.string().min(2, 'Showroom name is required').max(150),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(2, 'City is required').max(100),
  area: z.string().max(100).optional().or(z.literal('')),
  contactNumber: z.string().min(7, 'Contact number is required').max(20),
  whatsappNumber: z.string().max(20).optional().or(z.literal('')),
  mapLat: z.number().min(-90).max(90).optional(),
  mapLng: z.number().min(-180).max(180).optional(),
});

export type CreateProviderFormValues = z.infer<typeof createProviderSchema>;
export type UpdateProviderFormValues = z.infer<typeof updateProviderSchema>;
export type ShowroomFormValues = z.infer<typeof showroomSchema>;
