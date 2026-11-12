import type { DriverVerificationStatus, Market } from './enums';
import type { PaginationMeta } from './api.types';
import type { RentalDurationType } from '../lib/utils/rentalDuration';

// Booking requests a business received — the shapes kerayego-backend returns
// (src/modules/booking-requests/booking-requests.service.ts BOOKING_SELECT,
// the controller and dto/update-booking-status.dto.ts). Ported from the
// KerayeGo Partner app's types/booking-requests.types.ts. If these and the
// backend disagree, the backend is right.
//
// String unions on purpose (kept in step with types/enums.ts's BookingRequestStatus).

/** NOT_STARTED: terminal, set only by the backend — an ACCEPTED rental whose booked period ended unstarted. */
export type BookingStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NOT_STARTED';

/** The assigned driver's answer to the job (BookingRequest.driverJobStatus). */
export type DriverJobStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

/** A rental request's trip (plan A76) — only on 6 h, 12 h and day requests; null for week/month and older requests. */
export type BookingTripType = 'ONE_WAY' | 'ROUND_TRIP';

export const BOOKING_TRIP_TYPE_LABELS: Record<BookingTripType, string> = {
  ONE_WAY: 'One way',
  ROUND_TRIP: 'Round trip',
};

/**
 * One pickup or drop-off of a rental request (BookingStop, plan §3c, the
 * backend's booking-stops.view.ts) — in route order: every pickup, then every
 * drop-off. Requests made before 2026-11-11 have none.
 */
export interface BookingStop {
  id: string;
  /** The backend's TripStopType, shared with carpool. */
  type: 'PICKUP' | 'DROPOFF';
  /** Route order, from 0. */
  sortOrder: number;
  /** The place as the customer picked it. */
  label: string;
  lat: number;
  lng: number;
  /** Lower-case ("hyderabad") — title-case it for display. Null when the customer app didn't send it. */
  city: string | null;
  /** The customer's note for this stop ("gate 2, white house"). */
  note: string | null;
  /** Google's drive from the previous stop — null on the first stop and on week/month requests (not routed). */
  legDistanceKm: number | null;
  legDurationMinutes: number | null;
  /**
   * When the car should get there (ISO): the pickup time + driving + 15 min per
   * earlier stop (not the first) + a 30-min break per full 4 h of driving. The
   * first stop is the pickup time; null after a stop with no leg. No traffic.
   */
  expectedAt: string | null;
}

/**
 * The route figures every booking response carries since the redesign
 * (2026-11-11, plan A74–A85) — all null on older requests, and absent from a
 * backend deployed before it (hence optional). Ported from the Partner app.
 */
export interface BookingRouteFields {
  /** Null on week/month requests and older ones. */
  tripType?: BookingTripType | null;
  /** 1 to the car's seats (A83). */
  passengerCount?: number | null;
  /** The customer's route through every stop — a round trip including the way back. Google, no live traffic. */
  routeDistanceKm?: number | null;
  /** Driving time of that route. */
  routeDurationMinutes?: number | null;
  /** Round trip only: the part from the last drop-off back through the pickups (already inside the route totals). */
  wayBackDistanceKm?: number | null;
  wayBackDurationMinutes?: number | null;
  /** Driving + 15 min per stop after the first + a 30-min break per full 4 h of driving (A80) — what the fit was checked on. */
  timeNeededMinutes?: number | null;
  /** Weekly & monthly requests only (A85): what the business needs to quote. kmPerMonth is optional. */
  driverHoursPerDay?: number | null;
  daysPerWeek?: number | null;
  kmPerMonth?: number | null;
  stops?: BookingStop[];
}

/** The customer who sent the request. */
export interface BookingCustomer {
  id: string;
  name: string;
  email: string;
  /** Free text up to 20 characters — not always international; null for some accounts. */
  phone: string | null;
}

/** The requested car, as BOOKING_SELECT picks it. */
export interface BookingVehicle {
  id: string;
  title: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  /** Decimal — arrives as a string. */
  pricePerDay: string;
  /** Its showroom's country sets the currency. */
  showroom: { country: Market } | null;
  /** Only the cover image, if any. */
  images: { url: string; altText: string | null }[];
}

/**
 * The assigned driver. The driver-assignment contract says { id, name,
 * avatarUrl, phone }; today's backend nests the full name and photo under
 * driverProfile — read it through assignedDriverSummary() (lib/ops/driverAssignment.ts).
 */
export interface BookingAssignedDriver {
  id: string;
  name: string;
  avatarUrl?: string | null;
  phone: string | null;
  driverProfile?: { fullName: string; avatarUrl: string | null } | null;
}

/** One status change. Who made it isn't returned. */
export interface BookingStatusHistoryEntry {
  id: string;
  oldStatus: BookingStatus;
  newStatus: BookingStatus;
  /** The note sent with the change — the customer can read it too. */
  note: string | null;
  createdAt: string;
}

/**
 * A booking request as GET /provider/inquiries and PATCH /booking-requests/:id/status return it.
 * Since the redesign a new request has stops; the single pickup/drop-off fields
 * are then filled from the first pickup and the last drop-off (and isOneWay
 * from tripType), so older screens keep working.
 */
export interface BookingRequest extends BookingRouteFields {
  id: string;
  status: BookingStatus;
  requestedFromDate: string;
  requestedToDate: string;
  /** Null only on requests made before durations existed. */
  durationType: RentalDurationType | null;
  durationQuantity: number | null;
  /**
   * Decimal string: the car's price for the package when the request was sent.
   * Null on week/month requests since 2026-11-11 ("price to agree", A79) and on
   * requests from before durations existed.
   */
  totalPrice: string | null;
  pickupLocation: string | null;
  pickupCity?: string | null;
  isOneWay?: boolean;
  dropoffCity?: string | null;
  dropoffLocation?: string | null;
  message: string | null;
  providerNotes: string | null;
  assignedDriverId?: string | null;
  driverJobStatus?: DriverJobStatus | null;
  /** Set when the job starts (the booking turns IN_PROGRESS). */
  startedAt?: string | null;
  /** Set when the job ends (the booking turns COMPLETED). */
  completedAt?: string | null;
  assignedDriver?: BookingAssignedDriver | null;
  createdAt: string;
  updatedAt: string;
  user: BookingCustomer;
  vehicle: BookingVehicle;
  providerProfile: { id: string; businessName: string; user: { phone: string | null } };
  /** Newest first. */
  statusHistory: BookingStatusHistoryEntry[];
  /** For the business only (A78): its showroom → the first pickup. Null when the showroom has no map position. */
  approachDistanceKm?: number | null;
  approachDurationMinutes?: number | null;
  /** One way only: the driver's drive back after the last drop-off — to the showroom, or to the first pickup without one. Not part of the customer's time (A81). */
  driveBackDistanceKm?: number | null;
  driveBackDurationMinutes?: number | null;
}

/**
 * Another ACCEPTED or IN_PROGRESS booking of the same car whose pickup-to-return
 * period overlaps this one (A88). Accepting while one exists is refused with
 * 409 VEHICLE_ALREADY_BOOKED.
 */
export interface CarClash {
  bookingId: string;
  status: BookingStatus;
  requestedFromDate: string;
  requestedToDate: string;
}

/** GET /booking-requests/:id — the same fields plus the two owner ids. */
export interface BookingRequestDetail extends BookingRequest {
  userId: string;
  providerProfileId: string;
  /** The car's overlapping bookings, on a PENDING / CONTACTED request (else empty) — warn before Accept. Absent before 2026-11-11. */
  carClashes?: CarClash[];
}

/** GET /provider/inquiries/counts. */
export interface ProviderBookingCounts {
  pending: number;
  contacted: number;
  /** ACCEPTED, not started, no driver — same filter as ?needsDriver=true. */
  needsDriver: number;
}

/** PATCH /booking-requests/:id/status body (UpdateBookingStatusDto). */
export interface UpdateBookingStatusPayload {
  newStatus: BookingStatus;
  /** Up to 500 characters; the customer can see it. */
  note?: string;
  /** Only on the move to ACCEPTED. Left out = "Assign later". */
  assignedDriverId?: string;
}

/** PATCH /booking-requests/:id/driver body — null takes the driver off. */
export interface SetBookingDriverPayload {
  assignedDriverId: string | null;
}

/** One driver in GET /booking-requests/:id/eligible-drivers. */
export interface EligibleDriver {
  userId: string;
  name: string;
  avatarUrl: string | null;
  verificationStatus: DriverVerificationStatus;
  /** 'YYYY-MM-DD', or null with no licence on file. */
  licenseExpiry: string | null;
  eligible: boolean;
  /** Empty when eligible; readable, e.g. "Not verified yet", "Busy at that time". */
  reasons: string[];
}

/** GET /provider/inquiries query. */
export interface IncomingBookingRequestsParams {
  status?: BookingStatus;
  needsDriver?: boolean;
  page?: number;
  limit?: number;
}

export interface PagedBookingRequests {
  data: BookingRequest[];
  meta: PaginationMeta;
}
