import type {
  BusinessRole,
  DocumentStatus,
  DriverAgreementType,
  DriverDocumentType,
  DriverGender,
  DriverService,
  DriverTransmission,
  DriverVehicleType,
  DriverVerificationStatus,
  PayoutMethod,
} from './enums';

// The driver dashboard (/driver) — a copy of kerayego-partner's
// types/driver.types.ts and the driver parts of types/team.types.ts, which
// mirror the backend (kerayego-backend src/modules/users/driver-profile.*).
// Hand-written like the rest of types/; if this and the backend ever
// disagree, the backend is right. Dates are 'YYYY-MM-DD' (the backend may
// return a full ISO timestamp — read only its day); money is a decimal string
// in the driver's market currency (PKR for now).

// ─── Statuses types/enums.ts doesn't carry (it isn't this area's file) ──────

/** BookingRequest.status as GET /driver/jobs returns it — includes IN_PROGRESS (Start → End). */
export type DriverJobBookingStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

/** The assigned driver's own answer to a job (BookingRequest.driverJobStatus). */
export type DriverJobAnswer = 'PENDING' | 'ACCEPTED' | 'DECLINED';

/** BusinessMember.status. */
export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'DECLINED';

// ─── Profile and onboarding ─────────────────────────────────────────────────

/** One of the driver's own documents. Only the driver and KerayeGo see these (A12). */
export interface DriverDocument {
  id: string;
  documentType: DriverDocumentType;
  status: DocumentStatus;
  rejectionReason: string | null;
  /** A 10-minute signed link, made fresh on every GET /driver/profile. Open it; never store it. */
  fileUrl: string;
  createdAt: string;
}

/** A past job (step 3). `from`/`to` are 'YYYY-MM'; `to` null = current job. */
export interface DriverEmployment {
  employer: string;
  role: string;
  from: string;
  to: string | null;
}

export interface DriverReference {
  name: string;
  phone: string;
  relation: string;
}

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** One working day's hours, 24-hour 'HH:mm'. */
export interface WorkingDayHours {
  start: string;
  end: string;
}

/** Per weekday: the hours, or null for a day off. */
export type DriverWorkingHours = Record<WeekdayKey, WorkingDayHours | null>;

export interface DriverAgreementAcceptance {
  type: DriverAgreementType;
  version: string;
  acceptedAt: string;
}

/** What's done and what's still missing — `missing` holds short readable labels, e.g. "Date of birth". */
export interface DriverCompleteness {
  complete: boolean;
  missing: string[];
}

export type DriverStepKey =
  | 'personal'
  | 'identity'
  | 'experience'
  | 'services'
  | 'availability'
  | 'payoutsAgreements';

export interface DriverReadiness {
  /** Steps 1–3 + emergency contact + all four agreements at their current versions (A58). */
  rentalReady: DriverCompleteness;
  /** rentalReady + steps 4–5 (+ police certificate when a household service is chosen, A60). */
  hireReady: DriverCompleteness;
  /** Payout method, title and account — needed only before the first payout (A57). */
  payoutReady: DriverCompleteness;
  /** A police certificate exists (not rejected): household services are allowed. */
  householdAllowed: boolean;
}

/** Every field the driver fills in, by step (GET /driver/profile). */
export interface DriverProfileFields {
  // Step 1 — personal information
  fullName: string;
  contactPhone: string | null;
  /** Always false until SMS/WhatsApp OTP exists (A11). */
  phoneVerified: boolean;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  city: string | null;
  area: string | null;
  /** Private. */
  residentialAddress: string | null;
  /** Private. */
  homeLat: number | null;
  homeLng: number | null;
  gender: DriverGender | null;
  comfortableWithFamilies: boolean | null;
  contactEmail: string | null;
  languages: string[];
  // Step 2 — identity (all private)
  cnicNumber: string | null;
  cnicExpiry: string | null;
  licenseNumber: string | null;
  licenseCategory: string | null;
  licenseIssueDate: string | null;
  licenseExpiry: string | null;
  licenseIssuingAuthority: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  declaredNoSeriousConvictions: boolean;
  declaredNoCriminalRecord: boolean;
  declaredNoLicenseSuspension: boolean;
  // Step 3 — driving experience
  experienceYears: number | null;
  professionalExperienceYears: number | null;
  employmentHistory: DriverEmployment[];
  references: DriverReference[];
  vehicleTypes: DriverVehicleType[];
  transmissions: DriverTransmission[];
  /** null = not answered. */
  highwayExperience: boolean | null;
  navigationSkills: boolean | null;
  hasSmartphoneGps: boolean | null;
  certifications: string | null;
  // Step 4 — services
  services: DriverService[];
  uniformAvailable: boolean | null;
  // Step 5 — availability and pricing
  serviceCity: string | null;
  coverageAreas: string[];
  workingHours: DriverWorkingHours | null;
  outstationAvailable: boolean | null;
  overnightAvailable: boolean | null;
  hourlyRate: string | null;
  fullDayRate: string | null;
  monthlySalary: string | null;
  overtimeRate: string | null;
  minBookingHours: number | null;
  minAdvanceNoticeHours: number | null;
  maxTravelKm: number | null;
  // Step 6 — payouts (the full account number is never returned)
  payoutMethod: PayoutMethod | null;
  payoutAccountTitle: string | null;
  /** e.g. "••••1234". */
  payoutAccountMasked: string | null;
}

/**
 * GET /driver/profile (null before the first save), PATCH /driver/profile,
 * POST /driver/profile/agreements and POST /driver/profile/submit.
 */
export interface DriverProfile extends DriverProfileFields {
  agreements: DriverAgreementAcceptance[];
  /** The version each agreement must be accepted at. */
  currentAgreementVersions: Record<DriverAgreementType, string>;
  isOpenToWork: boolean;
  verificationStatus: DriverVerificationStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** One per type — pick by documentType (lib/driver/verification.ts driverDocumentFor). */
  documents: DriverDocument[];
  steps: Record<DriverStepKey, DriverCompleteness>;
  readiness: DriverReadiness;
  /** rentalReady is complete and the status is UNVERIFIED or REJECTED. */
  canSubmit: boolean;
}

type EditableField = Exclude<
  keyof DriverProfileFields,
  'phoneVerified' | 'avatarUrl' | 'payoutAccountMasked'
>;

/**
 * PATCH /driver/profile — any subset of the step fields; null clears one.
 * `payoutAccountNumber` is write-only (GET returns only the masked value).
 * Changing fullName, dateOfBirth, CNIC or licence fields while PENDING_REVIEW
 * or VERIFIED sets the profile back to UNVERIFIED. Creates the profile if
 * none exists (send fullName with the first save).
 */
export type UpdateDriverProfilePayload = {
  [K in EditableField]?: K extends 'fullName' ? string : DriverProfileFields[K] | null;
} & {
  payoutAccountNumber?: string;
  isOpenToWork?: boolean;
};

// ─── Uploads (POST /media/upload, driver contexts) ──────────────────────────

/** Where a driver upload goes: a private document (with its type) or the profile photo. */
export type DriverUploadTarget =
  | { context: 'driver_document'; documentType: DriverDocumentType }
  | { context: 'driver_photo' };

/** POST /media/upload's response for the driver contexts. */
export interface DriverUploadResult {
  /** The new document's id — driver_document only. */
  id?: string;
  url: string;
  publicId: string;
  format: string;
  /** A 10-minute signed link — private files (driver_document) only. */
  previewUrl?: string;
}

// ─── Businesses ─────────────────────────────────────────────────────────────

/** GET /driver/businesses — every membership of the account (any role, any status). */
export interface DriverLinkedBusiness {
  id: string;
  providerProfileId: string;
  role: BusinessRole;
  status: MembershipStatus;
  invitedAt: string;
  joinedAt: string | null;
  providerProfile: {
    id: string;
    businessName: string;
    slug: string;
    logoUrl: string | null;
    verificationStatus: string;
  };
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

/** GET /driver/jobs — the rental bookings a business assigned to this driver. */
export interface DriverAssignedJob {
  id: string;
  status: DriverJobBookingStatus;
  driverJobStatus: DriverJobAnswer | null;
  startedAt: string | null;
  completedAt: string | null;
  /** When the driver marked the customer picked up (in the Partner app). */
  customerPickedUpAt: string | null;
  requestedFromDate: string;
  requestedToDate: string;
  pickupLocation: string | null;
  pickupCity?: string | null;
  /** Only a one-way job leaves the car away from home (a return trip to post). */
  isOneWay: boolean;
  dropoffCity?: string | null;
  dropoffLocation?: string | null;
  totalPrice: string | null;
  vehicle: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    images: { url: string }[];
  };
  providerProfile: {
    id: string;
    businessName: string;
    logoUrl: string | null;
  };
  user: {
    id: string;
    name: string;
    phone: string | null;
  };
}

/** GET /driver/jobs/:bookingId/return-trip-template — pre-fill for the return carpool leg (A28, A48). */
export interface ReturnTripTemplate {
  bookingId: string;
  fleetVehicleId: string;
  vehicle: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    seatingCapacity: number;
    images: { url: string; altText?: string | null }[];
  };
  providerProfile: {
    id: string;
    businessName: string;
    logoUrl: string | null;
  };
  originCity: string;
  destinationCity: string;
  pickupPoint: string;
  dropoffPoint: string;
  availableSeats: number;
  suggestedDeparture: string;
  isOneWay: boolean;
}

/** POST /trips for a return leg in the business's car. */
export interface CreateReturnTripPayload {
  fleetVehicleId: string;
  returnFromBookingId: string;
  originCity: string;
  destinationCity: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  departureAt: string;
  availableSeats: number;
  pricePerSeat: number;
  contactNumber: string;
  notes?: string;
}

// ─── Rating the customer of a completed job (A24) ──────────────────────────

/** A completed rental whose customer this account can still rate (GET /reviews/my/eligible). */
export interface RateableBooking {
  /** The booking request's id — the review's contextId. */
  id: string;
  updatedAt: string;
  user: { id: string; name: string };
  vehicle?: { id?: string; title: string };
}

/**
 * The parts of GET /reviews/my/eligible the driver dashboard reads. The web's
 * own EligibleForReview type (lib/api/reviews.api.ts) predates
 * bookingsAsDriver, so the driver area reads the same response through this.
 */
export interface DriverEligibleReviews {
  bookingsAsProvider: RateableBooking[];
  /** Missing on a backend deploy that predates it. */
  bookingsAsDriver?: RateableBooking[];
}
