// Mirrors backend enums exactly — keep in sync with prisma/schema.prisma

export enum Role {
  USER = 'USER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum ProviderStatus {
  PENDING = 'PENDING',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum VehicleStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

// The markets this platform actually operates in, running in parallel —
// see lib/config/markets.ts for currency/phone/city metadata per code.
export enum Market {
  PK = 'PK',
  SA = 'SA',
  AE = 'AE',
}

export enum BookingRequestStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// A provider driver's own identity/licence verification (DriverProfile), reviewed
// by KerayeGo admins at /admin/drivers. Separate from a business's verification.
export enum DriverVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// DRIVING_LICENSE is the licence FRONT (kept for compatibility with older uploads).
export enum DriverDocumentType {
  ID_DOCUMENT_FRONT = 'ID_DOCUMENT_FRONT',
  ID_DOCUMENT_BACK = 'ID_DOCUMENT_BACK',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  DRIVING_LICENSE_BACK = 'DRIVING_LICENSE_BACK',
  SELFIE = 'SELFIE',
  POLICE_CERTIFICATE = 'POLICE_CERTIFICATE',
}

export const DRIVER_DOCUMENT_TYPE_LABELS: Record<DriverDocumentType, string> = {
  [DriverDocumentType.ID_DOCUMENT_FRONT]: 'CNIC front',
  [DriverDocumentType.ID_DOCUMENT_BACK]: 'CNIC back',
  [DriverDocumentType.DRIVING_LICENSE]: 'Licence front',
  [DriverDocumentType.DRIVING_LICENSE_BACK]: 'Licence back',
  [DriverDocumentType.SELFIE]: 'Live selfie',
  [DriverDocumentType.POLICE_CERTIFICATE]: 'Police character certificate',
};

// ─── Driver onboarding (PROVIDER_APP_PLAN.md §3b, A56–A60) ──────────────────

export enum DriverGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export const DRIVER_GENDER_LABELS: Record<DriverGender, string> = {
  [DriverGender.MALE]: 'Male',
  [DriverGender.FEMALE]: 'Female',
};

export enum DriverVehicleType {
  HATCHBACK = 'HATCHBACK',
  SEDAN = 'SEDAN',
  SUV_4X4 = 'SUV_4X4',
  LUXURY = 'LUXURY',
  VAN = 'VAN',
  HYBRID = 'HYBRID',
  ELECTRIC = 'ELECTRIC',
}

export const DRIVER_VEHICLE_TYPE_LABELS: Record<DriverVehicleType, string> = {
  [DriverVehicleType.HATCHBACK]: 'Hatchback',
  [DriverVehicleType.SEDAN]: 'Sedan',
  [DriverVehicleType.SUV_4X4]: 'SUV / 4×4',
  [DriverVehicleType.LUXURY]: 'Luxury / premium',
  [DriverVehicleType.VAN]: 'Van / Hiace',
  [DriverVehicleType.HYBRID]: 'Hybrid',
  [DriverVehicleType.ELECTRIC]: 'Electric',
};

export enum DriverTransmission {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

export const DRIVER_TRANSMISSION_LABELS: Record<DriverTransmission, string> = {
  [DriverTransmission.MANUAL]: 'Manual',
  [DriverTransmission.AUTOMATIC]: 'Automatic',
};

export enum DriverService {
  PERSONAL_FAMILY = 'PERSONAL_FAMILY',
  HOURLY = 'HOURLY',
  FULL_DAY = 'FULL_DAY',
  MONTHLY = 'MONTHLY',
  RENTAL_CAR = 'RENTAL_CAR',
  OUTSTATION = 'OUTSTATION',
  AIRPORT = 'AIRPORT',
  CORPORATE = 'CORPORATE',
  SCHOOL = 'SCHOOL',
  NIGHT = 'NIGHT',
}

export const DRIVER_SERVICE_LABELS: Record<DriverService, string> = {
  [DriverService.PERSONAL_FAMILY]: 'Personal / family driver',
  [DriverService.HOURLY]: 'Hourly driver',
  [DriverService.FULL_DAY]: 'Full-day driver',
  [DriverService.MONTHLY]: 'Monthly / permanent driver',
  [DriverService.RENTAL_CAR]: 'Rental car driver',
  [DriverService.OUTSTATION]: 'Outstation / intercity driver',
  [DriverService.AIRPORT]: 'Airport pickup / drop-off',
  [DriverService.CORPORATE]: 'Corporate / executive chauffeur',
  [DriverService.SCHOOL]: 'School pickup / drop-off',
  [DriverService.NIGHT]: 'Night-time driver',
};

/** Household services need a police character certificate (A60). */
export const HOUSEHOLD_DRIVER_SERVICES: readonly DriverService[] = [
  DriverService.PERSONAL_FAMILY,
  DriverService.MONTHLY,
  DriverService.SCHOOL,
  DriverService.NIGHT,
];

export enum PayoutMethod {
  BANK = 'BANK',
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
}

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  [PayoutMethod.BANK]: 'Bank account',
  [PayoutMethod.JAZZCASH]: 'JazzCash',
  [PayoutMethod.EASYPAISA]: 'Easypaisa',
};

export enum DriverAgreementType {
  SERVICE_AGREEMENT = 'SERVICE_AGREEMENT',
  CODE_OF_CONDUCT = 'CODE_OF_CONDUCT',
  PRIVACY_CONSENT = 'PRIVACY_CONSENT',
  FITNESS_DECLARATION = 'FITNESS_DECLARATION',
}

export const DRIVER_AGREEMENT_TYPE_LABELS: Record<DriverAgreementType, string> = {
  [DriverAgreementType.SERVICE_AGREEMENT]: 'Driver service agreement',
  [DriverAgreementType.CODE_OF_CONDUCT]: 'Code of conduct and safety policy',
  [DriverAgreementType.PRIVACY_CONSENT]: 'Privacy and identity-verification consent',
  [DriverAgreementType.FITNESS_DECLARATION]: 'Fitness-to-drive declaration',
};

export enum Transmission {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  CVT = 'CVT',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  CNG = 'CNG',
}
