import type { Market } from '../../types/api.types';
import type { FleetVehicle, FleetVehicleBase, FleetVehicleStatus } from '../../types/fleet.types';
import { getCurrencyCode } from '../utils/currency';

// What the business can do with its cars, ported from the KerayeGo Partner
// app's features/fleet/fleetRules.ts and mirrored from kerayego-backend
// vehicles.service.ts (the backend still checks every one of these itself):
// - create(): business APPROVED with at least one showroom, else 403
// - update(): any status but ARCHIVED or SUSPENDED, else 403; a live car stays
//   live and the change shows at once; a REJECTED car becomes DRAFT. A live
//   car's plate is locked (403 PLATE_LOCKED) unless it has none.
// - submitForReview(): DRAFT only, with at least one photo, else 400
// - archive(): anything but ARCHIVED (409); no way back
// - photos: the same statuses as update()
// Editing (details, prices, photos) is open to the business admin and a
// manager (can('editFleet')); adding, submitting and archiving to the
// business admin only (can('manageFleet')).

export type AddCarBlocker = 'no-business' | 'no-showroom' | 'not-approved';

export interface AddCarBlockerInfo {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

export const ADD_CAR_BLOCKERS: Record<AddCarBlocker, AddCarBlockerInfo> = {
  'no-business': {
    title: 'Set up your business first',
    description: 'Add your business details before listing cars.',
    actionLabel: 'Set up business',
    href: '/provider/profile',
  },
  'no-showroom': {
    title: 'Add your showroom first',
    description:
      "A showroom is needed before you can add cars: every car is listed at your showroom's address.",
    actionLabel: 'Add showroom',
    href: '/provider/profile',
  },
  'not-approved': {
    title: 'Waiting for approval',
    description: 'KerayeGo needs to approve your business before you can add cars.',
    actionLabel: 'See business status',
    href: '/provider/dashboard',
  },
};

/** Everything that stops this business adding a car (empty when it can). `business` is GET /providers/me. */
export function addCarBlockers(
  business: { verificationStatus: string; showrooms: readonly unknown[] } | null | undefined,
): AddCarBlocker[] {
  if (!business) return ['no-business'];
  const blockers: AddCarBlocker[] = [];
  if (business.showrooms.length === 0) blockers.push('no-showroom');
  if (business.verificationStatus !== 'APPROVED') blockers.push('not-approved');
  return blockers;
}

/** Whether PATCH /vehicles/:id accepts changes to a car in this status. */
export function canEditVehicle(status: FleetVehicleStatus): boolean {
  return status !== 'ARCHIVED' && status !== 'SUSPENDED';
}

/** The plate can no longer be changed by the business: the car is live and has one. */
export function isPlateLocked(status: FleetVehicleStatus, plateNumber: string | null | undefined): boolean {
  return status === 'APPROVED' && !!plateNumber;
}

export function canArchiveVehicle(status: FleetVehicleStatus): boolean {
  return status !== 'ARCHIVED';
}

export function canManageVehiclePhotos(status: FleetVehicleStatus): boolean {
  return canEditVehicle(status);
}

/** Why "Submit" can't be pressed yet, or null when it can. Unsaved edits would be lost. */
export function submitBlocker(vehicle: Pick<FleetVehicle, 'status' | 'images'>, hasUnsavedChanges: boolean): string | null {
  if (vehicle.status === 'REJECTED') return 'Save your changes first — that moves the car back to draft.';
  if (vehicle.status !== 'DRAFT') return null;
  if (vehicle.images.length === 0) return 'Add at least one photo before submitting.';
  if (hasUnsavedChanges) return 'Save your changes before submitting.';
  return null;
}

/** Whether the Submit button shows at all (DRAFT, or REJECTED to explain the way back). */
export function showsSubmit(status: FleetVehicleStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

export const VEHICLE_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
  SUSPENDED: 'Suspended',
};

/** What a status means for the business, shown under the status badge. */
export function vehicleStatusExplanation(status: FleetVehicleStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Not visible to customers yet. Add photos, then submit — cars from an approved business go live straight away.';
    case 'PENDING_REVIEW':
      return 'KerayeGo is checking this car. You can still correct its details below.';
    case 'APPROVED':
      return 'Live — customers can find and book this car. Changes you save below show straight away; bookings already made keep their price.';
    case 'REJECTED':
      return 'Not approved. Fix the details below and save — the car goes back to draft — then submit it again.';
    case 'ARCHIVED':
      return 'Archived — hidden from customers. An archived car can’t be listed again; add it as a new car instead.';
    case 'SUSPENDED':
      return 'Suspended by admin. Please contact support.';
  }
}

/** What happened after a successful submit, from the status it came back with. */
export function submitResultMessage(status: FleetVehicleStatus): string {
  return status === 'APPROVED'
    ? 'Your car is live. Customers can now find and book it.'
    : 'Submitted. KerayeGo will review your car and let you know.';
}

/**
 * The currency a car's prices are in: its showroom's country (detail), else
 * the business's showroom with its showroomId (list row), else the first one.
 */
export function vehicleCurrency(
  vehicle: Pick<FleetVehicleBase, 'showroomId'> & { showroom?: { country: Market } | null },
  showrooms: readonly { id: string; country: Market }[] | undefined,
): string {
  const country =
    vehicle.showroom?.country ??
    showrooms?.find((showroom) => showroom.id === vehicle.showroomId)?.country ??
    showrooms?.[0]?.country;
  return getCurrencyCode(country);
}
