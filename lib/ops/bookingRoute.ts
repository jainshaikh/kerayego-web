import type {
  BookingRequest,
  BookingRouteFields,
  BookingStop,
  CarClash,
} from '../../types/booking-requests.types';
import type { RentalDurationType } from '../utils/rentalDuration';
import { cityLabel } from '../utils/copy';
import { BOOKING_STATUS_LABELS } from './bookingDisplay';

// The route of a rental request (plan §3c, A74–A88): its stops with expected
// times, km and driving time, the fit against the package, the business-only
// legs, and the car's clashing bookings (A88). Ported from the KerayeGo
// Partner app's features/booking-requests/bookingRoute.ts — change both
// together. One difference: Partner keeps bookingPlaceRows /
// bookingPlaceSummary in bookingDisplay.ts; here they live in this file, so
// bookingDisplay.ts (whose status labels clashLine reads) doesn't import it
// back. Figures are Google's without live traffic — every time is "about".

// ─── Small formatters ───────────────────────────────────────────────────────

/** "Shop 4, Main Boulevard, Lahore" — the address with its city (title-cased) added unless it's already in it; null with neither. */
export function placeText(location: string | null | undefined, city: string | null | undefined): string | null {
  const address = location?.trim() ?? '';
  const town = city?.trim() ? cityLabel(city.trim()) : '';
  if (!address) return town || null;
  if (!town || address.toLowerCase().includes(town.toLowerCase())) return address;
  return `${address}, ${town}`;
}

/** "330 km"; under 10 km with one decimal ("4.5 km"). */
export function kmLabel(km: number): string {
  if (km < 10) return `${Math.round(km * 10) / 10} km`;
  return `${Math.round(km)} km`;
}

/** "7 h 10 min", "45 min", "3 h" ("min", not "m": "50 m" next to "4.5 km" reads like metres). */
export function minutesLabel(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "1 passenger", "3 passengers" — null when the request doesn't say (older requests). */
export function passengersLabel(count: number | null | undefined): string | null {
  if (!count) return null;
  return `${count} ${count === 1 ? 'passenger' : 'passengers'}`;
}

/** "330 km · 5 h 20 min" — whichever of the two is known; null with neither. */
export function distanceTimeLabel(km: number | null | undefined, minutes: number | null | undefined): string | null {
  const parts = [km != null ? kmLabel(km) : null, minutes != null ? minutesLabel(minutes) : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

// ─── Pickup and drop-off of a request without stops ─────────────────────────

// Optional fields: the customer's own booking type (lib/api/bookings.api.ts) uses these helpers too.
type PlaceFields = Partial<
  Pick<BookingRequest, 'pickupLocation' | 'pickupCity' | 'isOneWay' | 'dropoffLocation' | 'dropoffCity'>
> &
  Pick<BookingRouteFields, 'tripType' | 'routeDistanceKm' | 'stops'>;

export interface RouteFactRow {
  label: string;
  value: string;
}

/**
 * The request's places for the detail page of a request without stops (sent
 * before 2026-11-11, or by an older customer app — those with stops get the
 * Route section): the pickup always ("Not given" when the customer left it
 * empty), the drop-off when they gave one — and on a one-way request always,
 * since there the drop-off is where the job ends.
 */
export function bookingPlaceRows(booking: PlaceFields): RouteFactRow[] {
  const rows: RouteFactRow[] = [
    { label: 'Pickup location', value: placeText(booking.pickupLocation, booking.pickupCity) ?? 'Not given' },
  ];
  const dropoff = placeText(booking.dropoffLocation, booking.dropoffCity);
  if (booking.isOneWay) rows.push({ label: 'Drop-off (one way)', value: dropoff ?? 'Not given' });
  else if (dropoff) rows.push({ label: 'Drop-off location', value: dropoff });
  return rows;
}

/**
 * One short line for the request card: "Hyderabad → Larkana · 330 km" (cities
 * when known, title-cased — stops store them lower-case), "Karachi, round trip
 * · 4 stops · 40 km", or just the pickup; null with no place. The ends are the
 * first pickup and the last drop-off (the backend fills the single place
 * fields from them).
 */
export function bookingPlaceSummary(booking: PlaceFields): string | null {
  const city = (value: string | null | undefined) => (value?.trim() ? cityLabel(value.trim()) : null);
  const from = city(booking.pickupCity) || booking.pickupLocation?.trim() || null;
  const to = city(booking.dropoffCity) || booking.dropoffLocation?.trim() || null;
  let line: string | null;
  if (from && to) line = from.toLowerCase() === to.toLowerCase() ? from : `${from} → ${to}`;
  else if (to) line = `To ${to}`;
  else line = from;
  if (!line) return null;
  if (booking.tripType === 'ROUND_TRIP') line += ', round trip';
  const stopCount = booking.stops?.length ?? 0;
  const parts = [line];
  if (stopCount > 2) parts.push(`${stopCount} stops`);
  if (booking.routeDistanceKm != null) parts.push(kmLabel(booking.routeDistanceKm));
  return parts.join(' · ');
}

// ─── Stops ──────────────────────────────────────────────────────────────────

export interface RouteStopItem {
  key: string;
  kind: 'pickup' | 'dropoff';
  /** "Pickup", "Drop-off" — numbered ("Pickup 2") when there's more than one of that kind. */
  title: string;
  /** The place with its city. */
  place: string;
  note: string | null;
  /** ISO — the pickup time on the first stop; null when it couldn't be worked out. */
  expectedAt: string | null;
  /** "45 km · 50 min" — the drive from the stop before; null on the first stop and when unknown. */
  leg: string | null;
  lat: number;
  lng: number;
}

/** The stops in route order (every pickup, then every drop-off), ready to list. Empty for older requests. */
export function routeStopItems(stops: readonly BookingStop[] | undefined): RouteStopItem[] {
  const ordered = [...(stops ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const totals = {
    pickup: ordered.filter((stop) => stop.type === 'PICKUP').length,
    dropoff: ordered.filter((stop) => stop.type !== 'PICKUP').length,
  };
  const seen = { pickup: 0, dropoff: 0 };
  return ordered.map((stop, index) => {
    const kind = stop.type === 'PICKUP' ? 'pickup' : 'dropoff';
    seen[kind] += 1;
    const base = kind === 'pickup' ? 'Pickup' : 'Drop-off';
    return {
      key: stop.id,
      kind,
      title: totals[kind] > 1 ? `${base} ${seen[kind]}` : base,
      place: placeText(stop.label, stop.city) ?? stop.label,
      note: stop.note?.trim() || null,
      expectedAt: stop.expectedAt,
      leg: index === 0 ? null : distanceTimeLabel(stop.legDistanceKm, stop.legDurationMinutes),
      lat: stop.lat,
      lng: stop.lng,
    };
  });
}

/**
 * When the car should reach a stop: the time alone ("10:40 AM") on the
 * pickup's day, with the date ("12 Nov, 10:40 AM") on a later one. In the
 * browser's locale and time zone.
 */
export function stopTimeLabel(expectedAt: string, startIso: string): string {
  const at = new Date(expectedAt);
  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (at.toDateString() === new Date(startIso).toDateString()) return time;
  return `${at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}

// ─── Route facts and fit ────────────────────────────────────────────────────

const PACKAGE_HOURS: Partial<Record<RentalDurationType, number>> = {
  HOURS_6: 6,
  HOURS_12: 12,
};

type RouteBooking = BookingRouteFields &
  Pick<BookingRequest, 'durationType' | 'durationQuantity'> &
  Partial<
    Pick<
      BookingRequest,
      'approachDistanceKm' | 'approachDurationMinutes' | 'driveBackDistanceKm' | 'driveBackDurationMinutes'
    >
  >;

/**
 * How much of a 6- or 12-hour package the route leaves free (package − time
 * needed); null for days, week/month, or without a route. Negative = over
 * (only possible on a request the backend didn't check).
 */
export function spareMinutes(booking: RouteBooking): number | null {
  const hours = booking.durationType ? PACKAGE_HOURS[booking.durationType] : undefined;
  if (!hours || booking.timeNeededMinutes == null) return null;
  return hours * 60 * (booking.durationQuantity || 1) - booking.timeNeededMinutes;
}

/**
 * The Route section's figures, for the business (what the customer's route
 * takes, and the business's own legs around it). Nothing on requests without
 * a route (older ones, week/month).
 */
export function routeFactRows(booking: RouteBooking): RouteFactRow[] {
  const rows: RouteFactRow[] = [];
  const roundTrip = booking.tripType === 'ROUND_TRIP';
  if (booking.routeDistanceKm != null) {
    rows.push({
      label: 'Distance',
      value: `${kmLabel(booking.routeDistanceKm)}${roundTrip ? ', with the way back' : ''}`,
    });
  }
  if (booking.routeDurationMinutes != null) rows.push({ label: 'Driving', value: minutesLabel(booking.routeDurationMinutes) });
  if (booking.timeNeededMinutes != null) {
    rows.push({ label: 'Time needed', value: `About ${minutesLabel(booking.timeNeededMinutes)}` });
  }
  const spare = spareMinutes(booking);
  if (spare !== null) {
    rows.push(
      spare >= 0
        ? { label: 'Time to spare', value: minutesLabel(spare) }
        : { label: 'Over the package by', value: minutesLabel(-spare) },
    );
  }
  if (roundTrip) {
    const wayBack = distanceTimeLabel(booking.wayBackDistanceKm, booking.wayBackDurationMinutes);
    if (wayBack) rows.push({ label: 'Way back', value: wayBack });
  }
  const approach = distanceTimeLabel(booking.approachDistanceKm, booking.approachDurationMinutes);
  if (approach) rows.push({ label: 'Showroom → first pickup', value: approach });
  const driveBack = distanceTimeLabel(booking.driveBackDistanceKm, booking.driveBackDurationMinutes);
  if (driveBack) rows.push({ label: 'Driver’s drive back', value: driveBack });
  return rows;
}

/** The footnote under the route's figures. */
export const ROUTE_FOOTNOTE =
  'Time needed is the driving plus 15 minutes at each stop and a 30-minute break for every 4 hours of driving. Times are Google’s estimates without traffic. The drive to the first pickup and a one-way drive back aren’t part of the customer’s time.';

// ─── Weekly & monthly ───────────────────────────────────────────────────────

/** A week or month request with no price — the business agrees one with the customer (A79). Old priced week/month requests aren't. */
export function isPriceToAgree(booking: {
  durationType?: RentalDurationType | null;
  totalPrice?: string | number | null;
}): boolean {
  return (
    (booking.durationType === 'WEEK' || booking.durationType === 'MONTH') &&
    (booking.totalPrice === null || booking.totalPrice === undefined)
  );
}

/** A weekly/monthly request's working pattern (A85): driver hours a day, days a week, km a month (optional). */
export function longRentalRows(
  booking: Pick<BookingRouteFields, 'driverHoursPerDay' | 'daysPerWeek' | 'kmPerMonth'>,
): RouteFactRow[] {
  const rows: RouteFactRow[] = [];
  if (booking.driverHoursPerDay) {
    rows.push({
      label: 'Driver hours a day',
      value: `${booking.driverHoursPerDay} ${booking.driverHoursPerDay === 1 ? 'hour' : 'hours'}`,
    });
  }
  if (booking.daysPerWeek) {
    rows.push({ label: 'Days a week', value: `${booking.daysPerWeek} ${booking.daysPerWeek === 1 ? 'day' : 'days'}` });
  }
  if (booking.kmPerMonth) rows.push({ label: 'Km a month', value: `About ${booking.kmPerMonth} km` });
  return rows;
}

// ─── No double booking (A88) ────────────────────────────────────────────────

/** The car's overlapping bookings to warn about — only while the request can still be accepted. */
export function clashesToWarnAbout(
  booking: Pick<BookingRequest, 'status'> & { carClashes?: CarClash[] },
): CarClash[] {
  const undecided = booking.status === 'PENDING' || booking.status === 'CONTACTED';
  return undecided ? (booking.carClashes ?? []) : [];
}

/** "Accepted · 12 Nov, 10:00 AM → 13 Nov, 10:00 AM" (browser's locale and time zone). */
export function clashLine(clash: CarClash): string {
  const format = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  return `${BOOKING_STATUS_LABELS[clash.status]} · ${format(clash.requestedFromDate)} → ${format(clash.requestedToDate)}`;
}

export const CLASH_WARNING =
  'This car is already booked for part of this time. KerayeGo won’t let you accept this request while that booking stands — decline it, or ask the customer about another time.';
