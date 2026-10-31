import { z } from 'zod';
import { cnicNumberSchema } from './cnic.schema';

const currentYear = new Date().getFullYear();

export const userVehicleSchema = z.object({
  make: z.string().min(2, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z
    .number({ invalid_type_error: 'Year must be a number' })
    .int()
    .min(1990)
    .max(currentYear + 2)
    .optional()
    .or(z.literal(0).transform(() => undefined)),
  color: z.string().max(30).optional().or(z.literal('')),
  plateNumber: z.string().min(2, 'Plate number is required').max(20),
  // Optional in the API (older app builds); required here.
  cnicNumber: cnicNumberSchema,
});

export type UserVehicleFormValues = z.infer<typeof userVehicleSchema>;
