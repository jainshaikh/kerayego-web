import type { BookingRequest, EligibleDriver } from '../../types/booking-requests.types';
import { apiErrorInfo } from './apiError';
import { formatDate } from './bookingDisplay';

// Driver assignment on a business's booking (plan A7, A38, A52), ported from
// the KerayeGo Partner app's features/booking-requests/driverAssignment.ts.
// UX only — PATCH /booking-requests/:id/driver enforces every rule itself.

type DriverFields = Pick<BookingRequest, 'status' | 'assignedDriverId' | 'assignedDriver' | 'driverJobStatus' | 'startedAt'>;

export interface AssignedDriverSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
}

/** The booking's driver as one flat shape (contract fields or today's driverProfile nesting), or null. */
export function assignedDriverSummary(booking: Pick<BookingRequest, 'assignedDriver'>): AssignedDriverSummary | null {
  const driver = booking.assignedDriver;
  if (!driver) return null;
  return {
    id: driver.id,
    name: driver.driverProfile?.fullName?.trim() || driver.name,
    avatarUrl: driver.avatarUrl ?? driver.driverProfile?.avatarUrl ?? null,
    phone: driver.phone?.trim() || null,
  };
}

/** Whether the booking has a driver who hasn't declined. */
export function hasDriver(booking: DriverFields): boolean {
  const id = booking.assignedDriverId ?? booking.assignedDriver?.id ?? null;
  return !!id && booking.driverJobStatus !== 'DECLINED';
}

/** The driver can be assigned, changed or removed only while ACCEPTED and not started (409 otherwise). */
export function canChangeDriver(booking: Pick<BookingRequest, 'status' | 'startedAt'>): boolean {
  return booking.status === 'ACCEPTED' && !booking.startedAt;
}

/** An accepted booking that hasn't started and has no driver (none picked, declined, or the driver left). */
export function needsDriver(booking: DriverFields): boolean {
  return canChangeDriver(booking) && !hasDriver(booking);
}

export type DriverAction = 'assign' | 'change' | 'remove';

/** The Driver card's buttons — none once the job has started, or without can('manageBookings'). */
export function driverActions(booking: DriverFields, canManageBookings: boolean): DriverAction[] {
  if (!canManageBookings || !canChangeDriver(booking)) return [];
  return hasDriver(booking) ? ['change', 'remove'] : ['assign'];
}

// ─── The picker ─────────────────────────────────────────────────────────────

export interface DriverPickerRow {
  driver: EligibleDriver;
  /** Eligible, and not already this booking's driver. */
  selectable: boolean;
  isCurrent: boolean;
}

const byName = (a: EligibleDriver, b: EligibleDriver) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

/** "Available" and "Can't take this booking", each by name. The current driver is shown but can't be picked again. */
export function driverPickerSections(
  drivers: readonly EligibleDriver[],
  currentDriverId?: string | null,
): { eligible: DriverPickerRow[]; ineligible: DriverPickerRow[] } {
  const toRow = (driver: EligibleDriver): DriverPickerRow => {
    const isCurrent = !!currentDriverId && driver.userId === currentDriverId;
    return { driver, isCurrent, selectable: driver.eligible && !isCurrent };
  };
  return {
    eligible: drivers.filter((d) => d.eligible).sort(byName).map(toRow),
    ineligible: drivers.filter((d) => !d.eligible).sort(byName).map(toRow),
  };
}

/** The reasons a driver can't be picked, as one line. */
export function ineligibleReasonText(driver: Pick<EligibleDriver, 'reasons'>): string {
  const reasons = driver.reasons.map((r) => r.trim()).filter(Boolean);
  return reasons.length ? reasons.join(' · ') : 'Can’t take this booking';
}

function parseCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** "Licence valid until 12 Mar 2027", "Licence expired 1 Jan 2026", or "No licence on file". */
export function licenceExpiryLabel(licenseExpiry: string | null | undefined, now: Date = new Date()): string {
  const date = licenseExpiry ? parseCalendarDate(licenseExpiry) : null;
  if (!date) return 'No licence on file';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date < today ? `Licence expired ${formatDate(date)}` : `Licence valid until ${formatDate(date)}`;
}

/** The message for a failed assign / change / remove; "Busy at that time" gets a hint. */
export function driverAssignmentErrorMessage(error: unknown): string {
  const info = apiErrorInfo(error);
  if (/busy/i.test(info.message) && (info.kind === 'conflict' || info.kind === 'validation')) {
    return 'This driver is busy at that time. Pick another driver.';
  }
  return info.message;
}
