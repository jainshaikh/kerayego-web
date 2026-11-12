import { z } from 'zod';
import type { BookingStatus, UpdateBookingStatusPayload } from '../../types/booking-requests.types';
import { apiErrorInfo } from './apiError';

// The confirm step for a business's status buttons, ported from the KerayeGo
// Partner app's features/booking-requests/statusAction.ts. Every move is
// final — the backend has no way back (BOOKING_TRANSITIONS) — so each asks first.

/** UpdateBookingStatusDto.note: MaxLength(500). */
export const NOTE_MAX_LENGTH = 500;

export const statusNoteSchema = z.object({
  note: z.string().trim().max(NOTE_MAX_LENGTH, `Keep the note to ${NOTE_MAX_LENGTH} characters or fewer`),
});

export type StatusNoteFormValues = z.infer<typeof statusNoteSchema>;

/** The PATCH body: a blank note is left out; a driver only with the move to ACCEPTED. */
export function statusUpdatePayload(
  newStatus: BookingStatus,
  note: string | undefined,
  assignedDriverId?: string | null,
): UpdateBookingStatusPayload {
  const trimmed = note?.trim();
  const payload: UpdateBookingStatusPayload = trimmed ? { newStatus, note: trimmed } : { newStatus };
  if (assignedDriverId && newStatus === 'ACCEPTED') payload.assignedDriverId = assignedDriverId;
  return payload;
}

export interface StatusActionCopy {
  title: string;
  explanation: string;
  confirmLabel: string;
  notePlaceholder: string;
  destructive: boolean;
}

export function statusActionCopy(status: BookingStatus): StatusActionCopy {
  switch (status) {
    case 'CONTACTED':
      return {
        title: 'Mark as contacted',
        explanation:
          'Use this once you have called or messaged the customer about this request. You can accept or decline it after that.',
        confirmLabel: 'Mark contacted',
        notePlaceholder: 'Any additional information for the customer…',
        destructive: false,
      };
    case 'ACCEPTED':
      return {
        title: 'Accept request',
        explanation:
          'Accept only after you have checked the customer’s documents. The car comes with your driver for the whole rental. After accepting you can still change the driver or cancel the booking until the driver starts the job.',
        confirmLabel: 'Accept',
        notePlaceholder: 'Pickup details or anything else the customer should know…',
        destructive: false,
      };
    case 'REJECTED':
      return {
        title: 'Decline request',
        explanation: 'The customer will see that their request was not accepted. This can’t be undone.',
        confirmLabel: 'Decline',
        notePlaceholder: 'Let them know why, or suggest an alternative…',
        destructive: true,
      };
    // Only before the driver starts the job (plan A71). There is no IN_PROGRESS
    // or COMPLETED case: only the driver starts and ends a rental.
    case 'CANCELLED':
      return {
        title: 'Cancel booking',
        explanation:
          'The customer and the assigned driver are told the booking is cancelled. Only possible before the driver starts the job. This can’t be undone.',
        confirmLabel: 'Cancel booking',
        notePlaceholder: 'Let the customer know why…',
        destructive: true,
      };
    default:
      return {
        title: 'Update request',
        explanation: 'This can’t be undone.',
        confirmLabel: 'Confirm',
        notePlaceholder: 'Any additional information for the customer…',
        destructive: false,
      };
  }
}

/** 409 on the move to ACCEPTED: the car has another accepted / in-progress booking at an overlapping time (A88). */
export const VEHICLE_ALREADY_BOOKED = 'VEHICLE_ALREADY_BOOKED';

/** The backend's refusal of the status move itself, not of the driver. */
const STATUS_MOVE_REFUSED = /cannot (change status|transition)|already exists/i;

/**
 * The message for a failed status change:
 * - accepting a car that's already booked at that time (409 VEHICLE_ALREADY_BOOKED,
 *   A88): the backend's words ("This car is already booked from … to …") and what to do;
 * - accepting with a driver who can't take it (400/409 about the driver): say so;
 * - 400 without field errors: the request changed meanwhile (usually the customer cancelled);
 * - 409: someone else changed the booking at the same moment — same as a 400.
 */
export function statusUpdateErrorMessage(error: unknown, options: { withDriver?: boolean } = {}): string {
  const info = apiErrorInfo(error);
  if (info.code === VEHICLE_ALREADY_BOOKED) {
    return `${info.message} Decline this request, or ask the customer about another time.`;
  }
  if (
    options.withDriver &&
    (info.kind === 'validation' || info.kind === 'conflict') &&
    !info.hasFieldErrors &&
    !STATUS_MOVE_REFUSED.test(info.message)
  ) {
    const reason = info.message
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(', ');
    return `This driver can’t take this booking (${reason}). Pick another driver or choose Assign later.`;
  }
  if ((info.kind === 'validation' && !info.hasFieldErrors) || info.kind === 'conflict') {
    return 'This request changed since you opened it. Its latest status is shown now.';
  }
  return info.message;
}
