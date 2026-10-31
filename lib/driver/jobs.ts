import { BusinessRole } from '../../types/enums';
import type {
  DriverAssignedJob,
  DriverEligibleReviews,
  DriverJobAnswer,
  DriverJobBookingStatus,
  DriverLinkedBusiness,
  MembershipStatus,
  RateableBooking,
} from '../../types/driver.types';

// Pure rules of the driver's Jobs and Businesses pages — ports of
// kerayego-partner's types/enums.ts metas, features/driver/driverBusinesses.ts
// and features/ratings/ratingPrompt.ts.

/** A job's booking status as the Partner app labels it (the web StatusBadge picks the tone). */
export const JOB_STATUS_LABELS: Record<DriverJobBookingStatus, string> = {
  PENDING: 'New',
  CONTACTED: 'Contacted',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

/** The driver's own answer, shown next to the status unless it is ACCEPTED. */
export const JOB_ANSWER_LABELS: Record<DriverJobAnswer, string> = {
  PENDING: 'Reply needed',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DECLINED: 'Declined',
};

/** Which buttons and notes a job shows. */
export function jobState(job: Pick<DriverAssignedJob, 'status' | 'driverJobStatus' | 'isOneWay'>) {
  const isPendingResponse = job.driverJobStatus === 'PENDING';
  const isAccepted = job.driverJobStatus === 'ACCEPTED';
  const isInProgress = job.status === 'IN_PROGRESS';
  const isCompleted = job.status === 'COMPLETED';
  return {
    isPendingResponse,
    isInProgress,
    isCompleted,
    /** Accepted and waiting to start — the app would show "Start job". */
    awaitingStart: isAccepted && job.status === 'ACCEPTED',
    /** Only a one-way job leaves the car away from home, with a return leg to fill. */
    canPostReturnTrip: isCompleted && job.isOneWay,
  };
}

/**
 * The still-unrated rental with this id in GET /reviews/my/eligible, or null.
 * A driver's own: bookingsAsDriver, then bookingsAsProvider (the backend
 * leaves a rental the owner drove for their own business out of
 * bookingsAsDriver; one rating covers both).
 */
export function findPendingCustomerRating(
  eligible: DriverEligibleReviews | null | undefined,
  bookingId: string,
): RateableBooking | null {
  if (!eligible) return null;
  const asDriver = (eligible.bookingsAsDriver ?? []).find((b) => b.id === bookingId);
  const asProvider = (eligible.bookingsAsProvider ?? []).find((b) => b.id === bookingId);
  return asDriver ?? asProvider ?? null;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

export function starLabel(rating: number): string {
  return STAR_LABELS[rating] ?? '';
}

/** kerayego-backend ReviewEntryDto: comment @MaxLength(1000). */
export const RATING_COMMENT_MAX_LENGTH = 1000;

// ─── Businesses ─────────────────────────────────────────────────────────────

export interface DriverBusinessGroups {
  /** Businesses this person drives for now. */
  active: DriverLinkedBusiness[];
  /** Invitations to drive, waiting for Accept or Decline. */
  invitations: DriverLinkedBusiness[];
}

/**
 * GET /driver/businesses returns every membership of the account (any role,
 * any status), so keep only driver ones; left (INACTIVE) and declined
 * memberships aren't shown.
 */
export function groupDriverBusinesses(memberships: readonly DriverLinkedBusiness[] | undefined): DriverBusinessGroups {
  const driving = (memberships ?? []).filter((m) => m.role === BusinessRole.DRIVER);
  return {
    active: driving.filter((m) => m.status === 'ACTIVE'),
    invitations: driving.filter((m) => m.status === 'INVITED'),
  };
}

/**
 * Invitations to be a business's manager. The workspaces response doesn't
 * count them, so the Businesses page shows them from GET /driver/businesses —
 * otherwise a manager invite could never be accepted.
 */
export function pendingManagerInvites(memberships: readonly DriverLinkedBusiness[] | undefined): DriverLinkedBusiness[] {
  return (memberships ?? []).filter((m) => m.role === BusinessRole.MANAGER && m.status === 'INVITED');
}
