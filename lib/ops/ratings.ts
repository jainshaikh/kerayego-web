import { z } from 'zod';
import type { CreateReviewPayload, EligibleForReview } from '../api/reviews.api';
import { apiErrorInfo } from './apiError';

// The business's Ratings (/provider/ratings) and the booking detail's "Rate
// this customer" card, ported from the KerayeGo Partner app's
// features/ratings/ratingsLogic.ts, ratingPrompt.ts and rateCustomer.schema.ts.

/** A completed rental whose customer can still be rated (GET /reviews/my/eligible → bookingsAsProvider). */
export interface RateableBooking {
  /** The booking request's id — the review's contextId. */
  id: string;
  /** A completed booking doesn't change afterwards, so this is when it completed. */
  updatedAt: string;
  user: { id: string; name: string };
  vehicle?: { title: string };
}

export type RatingsTab = 'cars' | 'customers';

export interface RateCustomerFormValues {
  /** 0 until a star is picked. */
  rating: number;
  comment: string;
}

/** ReviewEntryDto: comment @MaxLength(1000). */
export const RATING_COMMENT_MAX_LENGTH = 1000;
const PICK_STARS = 'Pick a star to rate this customer';

export const rateCustomerSchema = z.object({
  rating: z.number().int(PICK_STARS).min(1, PICK_STARS).max(5, PICK_STARS),
  comment: z
    .string()
    .max(RATING_COMMENT_MAX_LENGTH, `Keep your comment to ${RATING_COMMENT_MAX_LENGTH} characters or fewer`),
});

export const RATE_CUSTOMER_DEFAULTS: RateCustomerFormValues = { rating: 0, comment: '' };

/**
 * The POST /reviews body for the business rating a completed rental's
 * customer — the only subject it may rate: { USER, the customer } (stored
 * private, isPublic false). The comment is trimmed and left out when blank.
 */
export function buildCustomerRatingPayload(
  booking: Pick<RateableBooking, 'id' | 'user'>,
  values: RateCustomerFormValues,
): CreateReviewPayload {
  const comment = values.comment.trim();
  return {
    context: 'BOOKING_REQUEST',
    contextId: booking.id,
    entries: [{ subjectType: 'USER', subjectId: booking.user.id, rating: values.rating, ...(comment ? { comment } : {}) }],
  };
}

/** The business-side rentals still to rate, most recently completed first. */
export function customersToRate(eligible: Pick<EligibleForReview, 'bookingsAsProvider'>): RateableBooking[] {
  return (eligible.bookingsAsProvider ?? [])
    .filter((b): b is typeof b & { user: { id: string; name: string } } => !!b.user)
    .map((b) => ({ id: b.id, updatedAt: b.updatedAt ?? '', user: b.user, ...(b.vehicle ? { vehicle: { title: b.vehicle.title } } : {}) }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** The still-unrated rental with this id on the business side, or null. */
export function findPendingCustomerRating(
  eligible: Pick<EligibleForReview, 'bookingsAsProvider'> | null | undefined,
  bookingId: string,
): RateableBooking | null {
  if (!eligible) return null;
  return customersToRate(eligible).find((b) => b.id === bookingId) ?? null;
}

/** ?tab= → which part of the page to show (cars by default). */
export function parseRatingsTab(value: string | null | undefined): RatingsTab {
  return value === 'customers' ? 'customers' : 'cars';
}

const STAR_LABELS: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent' };

export function starLabel(rating: number): string {
  return STAR_LABELS[rating] ?? '';
}

/** "Gale Motors · 2023 Corolla", or "… · rental completed 27 Oct 2026". */
export function rateCustomerSubtitle(booking: RateableBooking, completedOn: string): string {
  return booking.vehicle?.title
    ? `${booking.user.name} · ${booking.vehicle.title}`
    : `${booking.user.name} · rental completed ${completedOn}`;
}

/** Rating twice answers 409 "You have already rated this" (e.g. rated meanwhile in the app). */
export function isAlreadyRatedError(error: unknown): boolean {
  return apiErrorInfo(error).kind === 'conflict';
}
