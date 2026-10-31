import type { Market } from '../../types/api.types';
import type {
  BookingRequest,
  BookingStatus,
  DriverJobStatus,
  ProviderBookingCounts,
} from '../../types/booking-requests.types';
import type { RentalDurationType } from '../utils/rentalDuration';
import { DEFAULT_MARKET, MARKETS } from '../config/markets';
import { getCurrencyCode } from '../utils/currency';

// Pure display helpers for the business's Bookings pages (/provider/inquiries),
// ported from the KerayeGo Partner app's features/booking-requests/
// bookingDisplay.ts and the booking parts of its types/enums.ts. A rental is
// always with the business's driver — nothing here mentions self-drive.

// ─── Status labels ──────────────────────────────────────────────────────────

/**
 * Label per status. Every request on these pages is one the business
 * received, so PENDING reads "New". Pass `status` to <StatusBadge> for its
 * frozen colour and this as `label`.
 */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'New',
  CONTACTED: 'Contacted',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

/** The driver's answer as the business sees it; `badge` is the StatusBadge key that gives its colour. */
export const DRIVER_JOB_STATUS_META: Record<DriverJobStatus, { label: string; badge: string }> = {
  PENDING: { label: 'Waiting for driver', badge: 'PENDING' },
  ACCEPTED: { label: 'Accepted', badge: 'ACCEPTED' },
  DECLINED: { label: 'Declined', badge: 'REJECTED' },
};

// ─── Status buttons ─────────────────────────────────────────────────────────

/** A status move a business makes on a booking request, with its button text. */
export interface BusinessBookingAction {
  status: BookingStatus;
  label: string;
}

// The Partner app's BUSINESS_BOOKING_ACTIONS: each a move the backend's
// BOOKING_TRANSITIONS lets the business make. PENDING → CANCELLED is also
// allowed by the backend, but CANCELLED means the customer withdrew, so a
// business declines with REJECTED instead.
const BUSINESS_BOOKING_ACTIONS: Record<BookingStatus, BusinessBookingAction[]> = {
  PENDING: [
    { status: 'CONTACTED', label: 'Mark contacted' },
    { status: 'REJECTED', label: 'Decline' },
  ],
  CONTACTED: [
    { status: 'ACCEPTED', label: 'Accept' },
    { status: 'REJECTED', label: 'Decline' },
  ],
  ACCEPTED: [{ status: 'IN_PROGRESS', label: 'Start trip' }],
  IN_PROGRESS: [{ status: 'COMPLETED', label: 'Complete trip' }],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

/** The buttons a business gets on a request in this status (empty: nothing to do). */
export function businessBookingActions(status: BookingStatus): BusinessBookingAction[] {
  return BUSINESS_BOOKING_ACTIONS[status] ?? [];
}

// ─── Filter chips ───────────────────────────────────────────────────────────

/** A chip on the list: every request, one status, or "Needs a driver". */
export type BookingFilter = 'ALL' | 'NEEDS_DRIVER' | BookingStatus;

// "Needs a driver" sits right after All: accepted bookings nobody will drive
// yet are the business's most urgent work. Every status has a chip.
export const BOOKING_FILTERS: readonly BookingFilter[] = [
  'ALL',
  'NEEDS_DRIVER',
  'PENDING',
  'CONTACTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
];

const STATUSES = Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[];

/** The chip a URL asks for (?status=… or ?needsDriver=true); All otherwise. */
export function parseBookingFilter(status: string | null, needsDriver: string | null): BookingFilter {
  if (needsDriver === 'true') return 'NEEDS_DRIVER';
  return status && (STATUSES as string[]).includes(status) ? (status as BookingStatus) : 'ALL';
}

/** The URL query for a chip (the inverse of parseBookingFilter). */
export function bookingFilterSearch(filter: BookingFilter): string {
  if (filter === 'ALL') return '';
  if (filter === 'NEEDS_DRIVER') return '?needsDriver=true';
  return `?status=${filter}`;
}

/** The GET /provider/inquiries query for a chip. */
export function filterQuery(filter: BookingFilter): { status?: BookingStatus; needsDriver?: true } {
  if (filter === 'NEEDS_DRIVER') return { needsDriver: true };
  if (filter === 'ALL') return {};
  return { status: filter };
}

/** How many are waiting — the backend counts only New, Contacted and Needs a driver. */
export function filterCount(filter: BookingFilter, counts: ProviderBookingCounts | undefined): number | undefined {
  if (!counts) return undefined;
  if (filter === 'NEEDS_DRIVER') return counts.needsDriver;
  if (filter === 'PENDING') return counts.pending;
  if (filter === 'CONTACTED') return counts.contacted;
  return undefined;
}

export function filterLabel(filter: BookingFilter): string {
  if (filter === 'ALL') return 'All';
  if (filter === 'NEEDS_DRIVER') return 'Needs a driver';
  return BOOKING_STATUS_LABELS[filter];
}

/** What the list says when a chip has nothing in it. */
export function emptyListCopy(filter: BookingFilter): { title: string; description: string } {
  if (filter === 'ALL') {
    return {
      title: 'No booking requests yet',
      description: 'Requests from customers for your cars will show up here.',
    };
  }
  if (filter === 'NEEDS_DRIVER') {
    return {
      title: 'Every booking has a driver',
      description: 'Accepted bookings that still need a driver will show up here.',
    };
  }
  return {
    title: `No ${BOOKING_STATUS_LABELS[filter].toLowerCase()} requests`,
    description: 'Nothing has this status right now.',
  };
}

// ─── Duration, price, dates ─────────────────────────────────────────────────

const DURATION_UNITS: Record<RentalDurationType, string> = {
  HOURS_6: '6-hour block',
  HOURS_12: '12-hour block',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

/** "3 days", "1 week", "2 12-hour blocks" — null on old requests without a duration. */
export function durationLabel(type: RentalDurationType | null | undefined, quantity: number | null | undefined): string | null {
  if (!type || !quantity) return null;
  return `${quantity} ${DURATION_UNITS[type]}${quantity === 1 ? '' : 's'}`;
}

/** "PKR 5,000" — a backend Decimal string or number in `currency`; "—" without a value. */
export function formatPrice(value: string | number | null | undefined, currency: string): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** The request's estimated total in the car's currency, or null on old requests. */
export function totalPriceLabel(booking: Pick<BookingRequest, 'totalPrice' | 'vehicle'>): string | null {
  if (booking.totalPrice === null || booking.totalPrice === undefined) return null;
  return formatPrice(booking.totalPrice, getCurrencyCode(booking.vehicle.showroom?.country));
}

/** The car's day rate, e.g. "PKR 5,000 / day". */
export function dayRateLabel(booking: Pick<BookingRequest, 'vehicle'>): string {
  return `${formatPrice(booking.vehicle.pricePerDay, getCurrencyCode(booking.vehicle.showroom?.country))} / day`;
}

/** "27 Oct 2026, 3:00 PM" in the browser's locale and time zone (year left out when `withYear` is false). */
export function formatDateTime(iso: string, withYear = true): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : null),
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "27 Oct 2026". */
export function formatDate(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Contacting the customer ────────────────────────────────────────────────

/** A tel: link, or null when the number has no digits. */
export function callUrl(phone: string | null | undefined): string | null {
  const cleaned = (phone ?? '').replace(/[^\d+]/g, '');
  return /\d/.test(cleaned) ? `tel:${cleaned}` : null;
}

/**
 * A wa.me link, or null without digits. A local number ("0300 1234567") gets
 * the calling code of the market the car is rented in, in place of the 0;
 * "+…" and "00…" numbers are already international.
 */
export function whatsappUrl(phone: string | null | undefined, market: Market | null | undefined): string | null {
  const trimmed = (phone ?? '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) return `https://wa.me/${digits}`;
  if (digits.startsWith('00')) return digits.length > 2 ? `https://wa.me/${digits.slice(2)}` : null;
  if (digits.startsWith('0')) {
    const code = (MARKETS[market ?? DEFAULT_MARKET] ?? MARKETS[DEFAULT_MARKET]).phoneCallingCode.replace(/\D/g, '');
    return digits.length > 1 ? `https://wa.me/${code}${digits.slice(1)}` : null;
  }
  return `https://wa.me/${digits}`;
}

/** A mailto: link, or null without an address. */
export function emailUrl(email: string | null | undefined): string | null {
  const trimmed = (email ?? '').trim();
  return trimmed ? `mailto:${trimmed}` : null;
}

// ─── Status history, live state ─────────────────────────────────────────────

export interface StatusHistoryItem {
  key: string;
  title: string;
  note: string | null;
  at: string;
}

/** The request's timeline, newest first, ending with "Request received". */
export function statusHistoryItems(booking: Pick<BookingRequest, 'statusHistory' | 'createdAt'>): StatusHistoryItem[] {
  const changes = [...booking.statusHistory]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((entry) => ({
      key: entry.id,
      title: `${BOOKING_STATUS_LABELS[entry.oldStatus] ?? entry.oldStatus} → ${BOOKING_STATUS_LABELS[entry.newStatus] ?? entry.newStatus}`,
      note: entry.note?.trim() || null,
      at: entry.createdAt,
    }));
  return [...changes, { key: 'received', title: 'Request received', note: null, at: booking.createdAt }];
}

/** A line shown when the business has nothing left to do (null while it still can act). */
export function finishedStatusNote(status: BookingStatus): string | null {
  switch (status) {
    case 'ACCEPTED':
      return 'You accepted this request. Only KerayeGo can change its status now; you can still change the driver until the job starts. It is marked completed when the rental period ends.';
    case 'COMPLETED':
      return 'This rental is completed.';
    case 'REJECTED':
      return 'This request was declined.';
    case 'CANCELLED':
      return 'This request was cancelled.';
    default:
      return null;
  }
}

/**
 * Where the job stands, as text (the web has no live session of its own):
 * not started, under way since…, or ended at…. Null before the booking is
 * accepted or once it was declined/cancelled.
 */
export function jobStateText(booking: Pick<BookingRequest, 'status' | 'startedAt' | 'completedAt'>): string | null {
  if (booking.status === 'IN_PROGRESS') {
    return booking.startedAt
      ? `Job under way — started ${formatDateTime(booking.startedAt)}.`
      : 'Job under way.';
  }
  if (booking.status === 'COMPLETED') {
    const parts = [
      booking.startedAt ? `started ${formatDateTime(booking.startedAt)}` : null,
      booking.completedAt ? `ended ${formatDateTime(booking.completedAt)}` : null,
    ].filter(Boolean);
    return parts.length ? `Job ended — ${parts.join(', ')}.` : 'Job ended.';
  }
  if (booking.status === 'ACCEPTED') {
    return 'Not started yet. The driver starts and ends the job in the KerayeGo Partner app.';
  }
  return null;
}
