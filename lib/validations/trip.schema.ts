import { z } from 'zod';
import { karachiLocalToISOString } from '../utils/datetime';

// One stop in a trip's ordered pickup or drop-off sequence (A → B → C → D →
// E) — a rider still travels the whole route at the flat pricePerSeat;
// these are alternate meeting points at each end, not bookable legs.
export const tripStopSchema = z.object({
  label: z.string().min(3, 'Enter a location').max(300),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export type TripStopFormValue = z.infer<typeof tripStopSchema>;

export const tripSchema = z.object({
  userVehicleId: z.string().min(1, 'Select a vehicle'),
  originCity: z.string().min(2, 'Origin city is required').max(100),
  destinationCity: z.string().min(2, 'Destination city is required').max(100),
  pickupStops: z.array(tripStopSchema).min(1, 'Add at least one pickup point').max(10),
  // A rider's seat request must reference a real pickup AND dropoff TripStop id
  // (backend requires both) — a trip posted with zero dropoff stops would be
  // permanently unbookable, so this is enforced here too, not just pickup.
  dropoffStops: z.array(tripStopSchema).min(1, 'Add at least one drop-off point').max(10),
  departureAt: z
    .string()
    .min(1, 'Select a departure date & time')
    // Interpreted as Asia/Karachi (see karachiLocalToISOString) — matches what
    // TripForm actually submits, so this check can't disagree with the server.
    .refine((val) => new Date(karachiLocalToISOString(val)).getTime() > Date.now(), 'Departure must be in the future'),
  availableSeats: z
    .number({ invalid_type_error: 'Seats must be a number' })
    .int()
    .min(1, 'At least 1 seat')
    .max(20, 'Maximum 20 seats'),
  pricePerSeat: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(1, 'Price per seat is required'),
  contactNumber: z.string().min(6, 'Contact number is required').max(20),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type TripFormValues = z.infer<typeof tripSchema>;
