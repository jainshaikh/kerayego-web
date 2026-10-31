import type { DriverVerificationStatus, Market } from './enums';
import type { PaginationMeta } from './api.types';
import type { RentalDurationType } from '../lib/utils/rentalDuration';

// Booking requests a business received — the shapes kerayego-backend returns
// (src/modules/booking-requests/booking-requests.service.ts BOOKING_SELECT,
// the controller and dto/update-booking-status.dto.ts). Ported from the
// KerayeGo Partner app's types/booking-requests.types.ts. If these and the
// backend disagree, the backend is right.
//
// String unions on purpose: types/enums.ts's BookingRequestStatus has no
// IN_PROGRESS yet (a foundation file, not this area's to change).

export type BookingStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

/** The assigned driver's answer to the job (BookingRequest.driverJobStatus). */
export type DriverJobStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

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

/** A booking request as GET /provider/inquiries and PATCH /booking-requests/:id/status return it. */
export interface BookingRequest {
  id: string;
  status: BookingStatus;
  requestedFromDate: string;
  requestedToDate: string;
  /** Null only on requests made before durations existed. */
  durationType: RentalDurationType | null;
  durationQuantity: number | null;
  /** Decimal string; null on old requests. */
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
}

/** GET /booking-requests/:id — the same fields plus the two owner ids. */
export interface BookingRequestDetail extends BookingRequest {
  userId: string;
  providerProfileId: string;
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
