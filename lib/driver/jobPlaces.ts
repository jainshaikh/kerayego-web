import type { DriverAssignedJob } from '../../types/driver.types';
import { BOOKING_TRIP_TYPE_LABELS } from '../../types/booking-requests.types';
import { durationLabel } from '../ops/bookingDisplay';
import { distanceTimeLabel, passengersLabel, placeText, routeStopItems } from '../ops/bookingRoute';

// Where a rental job goes, for the driver's Jobs page (owner decision
// 2026-11-09, plan A72): the booking's pickups and drop-offs — never the
// customer's live location. Since 2026-11-11 a request has stops with
// coordinates and expected times (plan §3c); older ones only have the single
// pickup / drop-off as text, so "Map" then opens Google Maps searching for
// that text. Port of the KerayeGo Partner app's features/driver/jobPlaces.ts
// — change both together.

type PlaceFields = Pick<DriverAssignedJob, 'pickupLocation' | 'pickupCity' | 'dropoffLocation' | 'dropoffCity'> &
  Partial<Pick<DriverAssignedJob, 'stops'>>;

export interface JobPlace {
  /** Unique within the job. */
  key: string;
  kind: 'pickup' | 'dropoff';
  /** "Pickup", "Pickup 2", "Drop-off". */
  label: string;
  /** What to show: the address, with the city when the address doesn't already name it. */
  text: string;
  /** The customer's note for the stop ("gate 2"). */
  note: string | null;
  /** ISO — when the car should get there (the pickup time on the first stop); null when unknown or on an older job. */
  expectedAt: string | null;
  /** Where "Map" goes: the stop's coordinates, or null on an older job (then the text is searched). */
  coords: { lat: number; lng: number } | null;
}

/** The job's places in route order: its stops, or on an older job the pickup and drop-off it has. */
export function jobPlaces(job: PlaceFields): JobPlace[] {
  const stops = routeStopItems(job.stops);
  if (stops.length > 0) {
    return stops.map((stop) => ({
      key: stop.key,
      kind: stop.kind,
      label: stop.title,
      text: stop.place,
      note: stop.note,
      expectedAt: stop.expectedAt,
      coords: { lat: stop.lat, lng: stop.lng },
    }));
  }
  const places: JobPlace[] = [];
  const pickup = placeText(job.pickupLocation, job.pickupCity);
  if (pickup) {
    places.push({ key: 'pickup', kind: 'pickup', label: 'Pickup', text: pickup, note: null, expectedAt: null, coords: null });
  }
  const dropoff = placeText(job.dropoffLocation, job.dropoffCity);
  if (dropoff) {
    places.push({ key: 'dropoff', kind: 'dropoff', label: 'Drop-off', text: dropoff, note: null, expectedAt: null, coords: null });
  }
  return places;
}

/** Whether the job still needs driving to its places — then the card offers "Map" for each. */
export function showsPlaceMaps(job: Pick<DriverAssignedJob, 'status'>): boolean {
  return job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS';
}

/**
 * The job in one line above its places: "12 hours · One way · 3 passengers ·
 * 330 km · 5 h 20 min" — whatever the booking has; null on an older job with
 * none of it.
 */
export function jobSummaryLine(
  job: Pick<
    DriverAssignedJob,
    'durationType' | 'durationQuantity' | 'tripType' | 'passengerCount' | 'routeDistanceKm' | 'routeDurationMinutes'
  >,
): string | null {
  const parts = [
    durationLabel(job.durationType ?? null, job.durationQuantity ?? null),
    job.tripType ? BOOKING_TRIP_TYPE_LABELS[job.tripType] : null,
    passengersLabel(job.passengerCount),
    distanceTimeLabel(job.routeDistanceKm, job.routeDurationMinutes),
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

const DIRECTIONS_BASE = 'https://www.google.com/maps/dir/?api=1';
/** Google Maps URLs take at most 9 waypoints. */
const MAX_WAYPOINTS = 9;

/**
 * Google Maps directions to a place — its coordinates when known, else its
 * text (Google finds the address itself, so no geocoding call is made — and no
 * Maps JavaScript load or API cost on this page).
 */
export function googleMapsDirectionsUrl(place: string | { lat: number; lng: number }): string {
  const destination = typeof place === 'string' ? place : `${place.lat},${place.lng}`;
  return `${DIRECTIONS_BASE}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

/**
 * Directions for the whole job from where the driver is: every stop in route
 * order, and on a round trip back through the pickups in reverse (the route
 * the backend worked out). Null on an older job (no coordinates), with a
 * single stop, or when it needs more than Google's 9 waypoints — then the
 * driver uses each stop's "Map".
 */
export function jobRouteDirectionsUrl(job: Pick<DriverAssignedJob, 'stops' | 'tripType'>): string | null {
  const stops = routeStopItems(job.stops);
  if (stops.length < 2) return null;
  const points = stops.map((stop) => `${stop.lat},${stop.lng}`);
  if (job.tripType === 'ROUND_TRIP') {
    const pickups = stops.filter((stop) => stop.kind === 'pickup').map((stop) => `${stop.lat},${stop.lng}`);
    points.push(...pickups.reverse());
  }
  const destination = points[points.length - 1];
  const waypoints = points.slice(0, -1);
  if (waypoints.length > MAX_WAYPOINTS) return null;
  return `${DIRECTIONS_BASE}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints.join('|'))}&travelmode=driving`;
}
