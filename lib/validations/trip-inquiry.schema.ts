import { z } from 'zod';

export const createTripInquirySchema = z.object({
  tripId: z.string().min(1),
  requestedSeats: z.number({ invalid_type_error: 'Enter how many seats you need' }).int().min(1).max(20),
  pickupStopId: z.string().min(1, 'Choose a pickup point'),
  dropoffStopId: z.string().min(1, 'Choose a drop-off point'),
  pickupNote: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});

export type CreateTripInquiryFormValues = z.infer<typeof createTripInquirySchema>;
