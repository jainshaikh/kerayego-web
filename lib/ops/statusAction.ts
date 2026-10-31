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
          'Accept only after you have checked the customer’s documents. The car comes with your driver for the whole rental. Once accepted, only KerayeGo can change this request.',
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
    case 'IN_PROGRESS':
      return {
        title: 'Start rental trip',
        explanation: 'Mark this rental trip as underway with the assigned driver and customer.',
        confirmLabel: 'Start trip',
        notePlaceholder: 'Optional pickup confirmation notes…',
        destructive: false,
      };
    case 'COMPLETED':
      return {
        title: 'Complete rental trip',
        explanation: 'Mark this rental trip as completed and returned.',
        confirmLabel: 'Complete trip',
        notePlaceholder: 'Optional completion or return inspection notes…',
        destructive: false,
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

/** The backend's refusal of the status move itself, not of the driver. */
const STATUS_MOVE_REFUSED = /cannot (change status|transition)|already exists/i;

/**
 * The message for a failed status change:
 * - accepting with a driver who can't take it (400/409 about the driver): say so;
 * - 400 without field errors: the request changed meanwhile (usually the customer cancelled);
 * - 409: the backend keeps one request per customer, car and status.
 */
export function statusUpdateErrorMessage(error: unknown, options: { withDriver?: boolean } = {}): string {
  const info = apiErrorInfo(error);
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
  if (info.kind === 'validation' && !info.hasFieldErrors) {
    return 'This request changed since you opened it. Its latest status is shown now.';
  }
  if (info.kind === 'conflict') {
    return 'This customer already has an earlier request for this car with that status, so this one can’t be updated yet. Please contact KerayeGo support.';
  }
  return info.message;
}
