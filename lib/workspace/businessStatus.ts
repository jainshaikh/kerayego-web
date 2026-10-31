import { ProviderStatus } from '../../types/enums';
import type { ProviderProfileWithMeta } from '../api/providers.api';

// What the business's approval status means for the person, and whether it
// can be submitted for review — mirroring the backend's own rules
// (kerayego-backend providers.service.ts submitForReview) so the page explains
// them before the person hits a 400. Same wording and rules as
// kerayego-partner/src/features/business/businessStatus.ts; keep them in step.

/**
 * The lowest completeness score POST /providers/me/submit-for-review accepts.
 * The score is the share of six checks passed, so 60% means four of them.
 */
export const SUBMIT_MIN_COMPLETENESS = 60;

type StatusFields = Pick<
  ProviderProfileWithMeta,
  'verificationStatus' | 'rejectionReason' | 'showrooms'
>;

/**
 * One or two sentences saying what the business's status means and what to do
 * next. A manager can't edit the profile or showrooms, so for them the next
 * step is the business admin's.
 */
export function statusExplanation(
  business: StatusFields,
  viewer: 'admin' | 'manager' = 'admin',
): string {
  if (viewer === 'manager') return managerStatusExplanation(business);
  switch (business.verificationStatus) {
    case ProviderStatus.PENDING:
      return 'Complete your profile and submit it for review.';
    case ProviderStatus.PENDING_REVIEW:
      return 'KerayeGo is reviewing your business. The result will show here.';
    case ProviderStatus.APPROVED:
      // The backend only lets an approved business add cars once it has a
      // showroom (vehicles.service.ts create).
      return business.showrooms.length > 0
        ? 'Your business is approved and your cars can be listed.'
        : 'Your business is approved. Add a showroom before you list your cars.';
    case ProviderStatus.REJECTED:
      return business.rejectionReason
        ? `Not approved: ${business.rejectionReason}`
        : 'Your business was not approved. Update your profile and submit it again.';
    case ProviderStatus.SUSPENDED:
      return 'Your business is suspended. Contact KerayeGo support.';
  }
}

function managerStatusExplanation(business: StatusFields): string {
  switch (business.verificationStatus) {
    case ProviderStatus.PENDING:
      return 'The business admin is completing the business profile for KerayeGo to review.';
    case ProviderStatus.PENDING_REVIEW:
      return 'KerayeGo is reviewing this business. The result will show here.';
    case ProviderStatus.APPROVED:
      return business.showrooms.length > 0
        ? 'This business is approved.'
        : 'This business is approved. The business admin needs to add a showroom before cars can be listed.';
    case ProviderStatus.REJECTED:
      return business.rejectionReason
        ? `Not approved: ${business.rejectionReason}. The business admin can update the profile and submit it again.`
        : 'This business was not approved. The business admin can update the profile and submit it again.';
    case ProviderStatus.SUSPENDED:
      return 'This business is suspended. The business admin can contact KerayeGo support.';
  }
}

export type SubmitForReviewState =
  /** Not offered: already under review or approved, or suspended. */
  | { kind: 'hidden' }
  /** Offered, but the backend would refuse it: `reasons` says why, in words for the person. */
  | { kind: 'blocked'; resubmit: boolean; reasons: string[] }
  /** The backend will accept it. */
  | { kind: 'ready'; resubmit: boolean };

/** The owner's CNIC, as a "still needed" item (it isn't one of the backend's completeness checks). */
export const OWNER_CNIC_ITEM = "Owner's CNIC number";

/** Whether the owner's CNIC is missing — the backend refuses submit-for-review then (400). */
export function isOwnerCnicMissing(
  business: Pick<ProviderProfileWithMeta, 'ownerCnicNumber'>,
): boolean {
  return !business.ownerCnicNumber?.trim();
}

/** Everything still needed before review: the backend's completeness items, plus the owner's CNIC when missing. */
export function stillNeededItems(
  business: Pick<ProviderProfileWithMeta, 'ownerCnicNumber' | 'completenessScore'>,
): string[] {
  const { missing } = business.completenessScore;
  return isOwnerCnicMissing(business) && !missing.includes(OWNER_CNIC_ITEM)
    ? [...missing, OWNER_CNIC_ITEM]
    : missing;
}

/**
 * Whether the business can be submitted for review now — the backend's
 * checks: not already PENDING_REVIEW or APPROVED, at least one showroom,
 * completeness ≥ 60%, and the owner's CNIC given.
 *
 * A SUSPENDED business is never offered it, although the backend doesn't
 * refuse one: submitting would take it out of suspension without KerayeGo
 * deciding so, and its status text says to contact support.
 */
export function submitForReviewState(
  business: Pick<
    ProviderProfileWithMeta,
    'verificationStatus' | 'showrooms' | 'ownerCnicNumber' | 'completenessScore'
  >,
): SubmitForReviewState {
  const status = business.verificationStatus;
  if (status !== ProviderStatus.PENDING && status !== ProviderStatus.REJECTED)
    return { kind: 'hidden' };

  const resubmit = status === ProviderStatus.REJECTED;
  const reasons: string[] = [];
  if (business.showrooms.length === 0) reasons.push('Add a showroom.');
  const { score } = business.completenessScore;
  if (score < SUBMIT_MIN_COMPLETENESS) {
    reasons.push(
      `Your profile is ${score}% complete; it needs at least ${SUBMIT_MIN_COMPLETENESS}%.`,
    );
  }
  if (isOwnerCnicMissing(business)) reasons.push("Add the owner's CNIC number.");

  return reasons.length > 0 ? { kind: 'blocked', resubmit, reasons } : { kind: 'ready', resubmit };
}
