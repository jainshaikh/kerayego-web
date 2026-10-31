import { Role, UserStatus, ProviderStatus, VehicleStatus, BookingRequestStatus, Transmission, FuelType, Market, DriverVerificationStatus, DriverDocumentType, DriverGender, DriverVehicleType, DriverTransmission, DriverService, PayoutMethod, DriverAgreementType } from './enums';
export type { Transmission, FuelType };
export { Market };

// ─── API Response Envelope ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  /** True while KerayeGo checks the account after its phone matched a blocked person:
   * browsing works, but booking, posting trips, requesting seats and driving are paused. */
  identityHold?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  /** See User.identityHold. */
  identityHold?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  businessDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  verificationStatus: ProviderStatus;
  rejectionReason: string | null;
  isFeatured: boolean;
  /** Owner's CNIC (`12345-1234567-1`), returned only to the owner (GET /providers/me) and admin. */
  ownerCnicNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Showroom {
  id: string;
  providerProfileId: string;
  name: string;
  address: string;
  city: string;
  area: string | null;
  contactNumber: string;
  whatsappNumber: string | null;
  operatingHours: Record<string, string> | null;
  mapLat: number | null;
  mapLng: number | null;
  country: Market;
}

// ─── Vehicle ────────────────────────────────────────────────────────────────

export interface VehicleImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface VehicleImageFull extends VehicleImage {
  publicId: string;
  width: number | null;
  height: number | null;
}

export interface VehicleFeature {
  id: string;
  name: string;
  value: string | null;
}

// Full vehicle shape returned to the owning provider (includes publicId for deletion)
export interface ProviderVehicle {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  engineType: string | null;
  pricePer6Hours: string | null;
  pricePer12Hours: string | null;
  pricePerDay: string;
  pricePerWeek: string | null;
  pricePerMonth: string | null;
  locationText: string | null;
  availabilityNotes: string | null;
  pricingNotes: string | null;
  specialConditions: string | null;
  status: VehicleStatus;
  rejectionReason: string | null;
  viewCount: number;
  inquiryCount: number;
  showroomId: string | null;
  images: VehicleImageFull[];
  features: VehicleFeature[];
  showroom: { id: string; name: string; city: string; area: string | null; contactNumber: string; country: Market } | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleCard {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  pricePer6Hours: string | null;
  pricePer12Hours: string | null;
  pricePerDay: string;
  pricePerWeek: string | null;
  pricePerMonth: string | null;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  status: VehicleStatus;
  images: Pick<VehicleImage, 'url' | 'altText'>[];
  providerProfile: {
    businessName: string;
    slug: string;
  };
  showroom: {
    city: string;
    country: Market;
  } | null;
}

export interface VehicleDetail extends VehicleCard {
  engineType: string | null;
  locationText: string | null;
  availabilityNotes: string | null;
  pricingNotes: string | null;
  specialConditions: string | null;
  features: VehicleFeature[];
  viewCount: number;
}

// ─── Booking Requests ───────────────────────────────────────────────────────

export interface BookingRequest {
  id: string;
  vehicleId: string;
  providerProfileId: string;
  requestedFromDate: string;
  requestedToDate: string;
  pickupLocation: string | null;
  message: string | null;
  status: BookingRequestStatus;
  createdAt: string;
  updatedAt: string;
  vehicle: Pick<VehicleCard, 'id' | 'title' | 'slug' | 'images'>;
  providerProfile: Pick<ProviderProfile, 'id' | 'businessName' | 'slug'>;
}

export interface BookingStatusHistory {
  id: string;
  oldStatus: BookingRequestStatus;
  newStatus: BookingRequestStatus;
  changedByUserId: string;
  note: string | null;
  createdAt: string;
}

// SavedVehicle lives in lib/api/users.api.ts — its `.vehicle` field reuses
// ListingVehicleCard (lib/api/listings.api.ts), which would create a circular
// import if defined here (listings.api.ts already imports enums from this file).

// ─── Admin driver verification (/admin/drivers) ─────────────────────────────
// Admin-only shapes. `AdminDriverDocument.fileUrl` is a ~10-minute signed link:
// open it in a new tab, refetch the detail to refresh it, never persist/cache it,
// and never render these documents outside the admin driver pages.

export interface AdminDriverListItem {
  userId: string;
  fullName: string | null;
  city: string | null;
  verificationStatus: DriverVerificationStatus;
  licenseExpiry: string | null;
  submittedAt: string | null;
  avatarUrl: string | null;
  user: { name: string; email: string; phone: string | null };
}

/** `missing` entries are short readable labels from the backend ("Date of birth"). */
export interface DriverCompletion {
  complete: boolean;
  missing: string[];
}

/** A58 / A60 — see PROVIDER_APP_PLAN.md §3b. */
export interface DriverReadiness {
  rentalReady: DriverCompletion;
  hireReady: DriverCompletion;
  payoutReady: DriverCompletion;
  /** A POLICE_CERTIFICATE document exists and isn't REJECTED. */
  householdAllowed: boolean;
}

export type DriverOnboardingStep =
  | 'personal'
  | 'identity'
  | 'experience'
  | 'services'
  | 'availability'
  | 'payoutsAgreements';

export type DriverWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Per weekday: `HH:mm` start/end, or null when not working that day. */
export type DriverWorkingHours = Record<DriverWeekday, { start: string; end: string } | null>;

export interface DriverEmploymentEntry {
  employer: string;
  role: string;
  /** 'YYYY-MM' */
  from: string;
  /** 'YYYY-MM', or null = current job */
  to: string | null;
}

export interface DriverReference {
  name: string;
  phone: string;
  relation: string;
}

export interface DriverAgreementAcceptance {
  type: DriverAgreementType;
  version: string;
  acceptedAt: string;
}

// The GET /driver/profile shape as the admin sees it (payout masked; the full
// account number and cnicHash are never returned). Dates are 'YYYY-MM-DD',
// money is a decimal string in the driver's market currency (PKR for now).
export interface AdminDriverProfile {
  userId: string;
  // Step 1 — personal
  fullName: string | null;
  contactPhone: string | null;
  /** Always false until SMS/WhatsApp OTP exists. */
  phoneVerified: boolean;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  city: string | null;
  area: string | null;
  residentialAddress: string | null;
  homeLat: number | null;
  homeLng: number | null;
  gender: DriverGender | null;
  comfortableWithFamilies: boolean | null;
  contactEmail: string | null;
  languages: string[] | null;
  // Step 2 — identity
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
  declaredNoSeriousConvictions: boolean | null;
  declaredNoCriminalRecord: boolean | null;
  declaredNoLicenseSuspension: boolean | null;
  // Step 3 — experience
  experienceYears: number | null;
  professionalExperienceYears: number | null;
  employmentHistory: DriverEmploymentEntry[];
  references: DriverReference[];
  vehicleTypes: DriverVehicleType[];
  transmissions: DriverTransmission[];
  highwayExperience: boolean | null;
  navigationSkills: boolean | null;
  hasSmartphoneGps: boolean | null;
  certifications: string | null;
  // Step 4 — services
  services: DriverService[];
  uniformAvailable: boolean | null;
  // Step 5 — availability & pricing
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
  // Step 6 — payouts & agreements
  payoutMethod: PayoutMethod | null;
  payoutAccountTitle: string | null;
  /** e.g. "••••1234" — the full number is never returned. */
  payoutAccountMasked: string | null;
  agreements: DriverAgreementAcceptance[];
  currentAgreementVersions: Record<DriverAgreementType, string>;
  // Status
  isOpenToWork: boolean;
  verificationStatus: DriverVerificationStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  steps: Record<DriverOnboardingStep, DriverCompletion>;
  readiness: DriverReadiness;
  canSubmit: boolean;
}

export interface AdminDriverDocument {
  id: string;
  documentType: DriverDocumentType;
  status: string;
  rejectionReason: string | null;
  fileUrl: string;
  createdAt: string;
}

export interface AdminDriverDetail {
  profile: AdminDriverProfile;
  user: { id: string; name: string; email: string; phone: string | null; status: UserStatus; createdAt: string };
  documents: AdminDriverDocument[];
  memberships: Array<{ businessName: string; role: string; status: string }>;
  /** Same object as `profile.readiness`. */
  readiness: DriverReadiness;
}
