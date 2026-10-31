import { DriverService, HOUSEHOLD_DRIVER_SERVICES } from '../../types/enums';
import type { DriverCompleteness, DriverProfile, DriverStepKey } from '../../types/driver.types';

// The driver setup wizard — a port of kerayego-partner's
// features/driver/setup/driverSetup.ts: six steps, each its own page under
// /driver/setup/<route>, saved one at a time with PATCH /driver/profile. The
// profile page lists them with GET /driver/profile's `steps`.

export type DriverSetupRoute = 'personal' | 'identity' | 'experience' | 'services' | 'availability' | 'payouts';

export interface DriverSetupStep {
  /** GET /driver/profile `steps` key. */
  key: DriverStepKey;
  route: DriverSetupRoute;
  title: string;
  description: string;
}

export const DRIVER_SETUP_STEPS: readonly DriverSetupStep[] = [
  { key: 'personal', route: 'personal', title: 'Personal information', description: 'Name, phone, photo, address, languages' },
  { key: 'identity', route: 'identity', title: 'Identity and documents', description: 'CNIC, licence, selfie, emergency contact' },
  { key: 'experience', route: 'experience', title: 'Driving experience', description: 'Years, past jobs, vehicles, references' },
  { key: 'services', route: 'services', title: 'Services offered', description: 'What customers can hire you for' },
  { key: 'availability', route: 'availability', title: 'Availability and pricing', description: 'Working hours, areas, rates' },
  { key: 'payoutsAgreements', route: 'payouts', title: 'Payouts and agreements', description: 'Payout account, agreements' },
];

export const DRIVER_PROFILE_HREF = '/driver/profile';

export function setupHref(route: DriverSetupRoute): string {
  return `/driver/setup/${route}`;
}

export function isDriverSetupRoute(value: string): value is DriverSetupRoute {
  return DRIVER_SETUP_STEPS.some((step) => step.route === value);
}

export function setupStep(route: DriverSetupRoute): DriverSetupStep {
  const step = DRIVER_SETUP_STEPS.find((candidate) => candidate.route === route);
  if (!step) throw new Error(`Unknown driver setup step: ${route}`);
  return step;
}

/** "Step 2 of 6". */
export function stepPositionLabel(route: DriverSetupRoute): string {
  const index = DRIVER_SETUP_STEPS.findIndex((step) => step.route === route);
  return `Step ${index + 1} of ${DRIVER_SETUP_STEPS.length}`;
}

/** The step after this one, or null after the last. */
export function nextSetupRoute(route: DriverSetupRoute): DriverSetupRoute | null {
  const index = DRIVER_SETUP_STEPS.findIndex((step) => step.route === route);
  return DRIVER_SETUP_STEPS[index + 1]?.route ?? null;
}

/** The step before this one, or null for the first. */
export function previousSetupRoute(route: DriverSetupRoute): DriverSetupRoute | null {
  const index = DRIVER_SETUP_STEPS.findIndex((step) => step.route === route);
  return index > 0 ? DRIVER_SETUP_STEPS[index - 1].route : null;
}

/** Every step needs a saved profile, which the first save of Personal information creates. */
export function canOpenSetupStep(route: DriverSetupRoute, profile: DriverProfile | null): boolean {
  return route === 'personal' || profile !== null;
}

/** "Complete", or what's missing ("Date of birth, Gender and 3 more"). */
export function stepStatusText(completeness: DriverCompleteness | undefined, shown = 2): string {
  if (!completeness) return 'Not started';
  if (completeness.complete) return 'Complete';
  const { missing } = completeness;
  if (missing.length === 0) return 'Not complete';
  if (missing.length <= shown + 1) return `Missing: ${missing.join(', ')}`;
  return `Missing: ${missing.slice(0, shown).join(', ')} and ${missing.length - shown} more`;
}

// ─── Services rules (A60) and which rates they need ────────────────────────

export function isHouseholdService(service: DriverService): boolean {
  return HOUSEHOLD_DRIVER_SERVICES.includes(service);
}

/** Whether these services need a police certificate. */
export function needsPoliceCertificate(services: readonly DriverService[]): boolean {
  return services.some(isHouseholdService);
}

export const DRIVER_SERVICE_DESCRIPTIONS: Record<DriverService, string> = {
  [DriverService.PERSONAL_FAMILY]: "Drive a family's own car for errands, shopping and visits.",
  [DriverService.HOURLY]: 'Booked by the hour, in the customer’s car.',
  [DriverService.FULL_DAY]: 'Booked for a whole day of driving.',
  [DriverService.MONTHLY]: 'A regular job for one household or person, paid monthly.',
  [DriverService.RENTAL_CAR]: 'Drive cars that rental businesses give you jobs with.',
  [DriverService.OUTSTATION]: 'Trips to other cities, by the day.',
  [DriverService.AIRPORT]: 'Take customers to or from the airport.',
  [DriverService.CORPORATE]: 'Drive executives and company guests.',
  [DriverService.SCHOOL]: 'Daily school runs for children.',
  [DriverService.NIGHT]: 'Late-evening and night-time driving.',
};

/** The pricing fields of step 5 that depend on the services offered. */
export type ServiceRateField = 'hourlyRate' | 'minBookingHours' | 'fullDayRate' | 'monthlySalary';

const RATE_FIELDS_BY_SERVICE: Partial<Record<DriverService, readonly ServiceRateField[]>> = {
  [DriverService.HOURLY]: ['hourlyRate', 'minBookingHours'],
  [DriverService.FULL_DAY]: ['fullDayRate'],
  [DriverService.MONTHLY]: ['monthlySalary'],
};

/** Hourly → hourly rate + minimum duration, full-day → full-day rate, monthly → monthly salary. */
export function rateFieldsForServices(services: readonly DriverService[]): ServiceRateField[] {
  const fields = new Set<ServiceRateField>();
  for (const service of services) for (const field of RATE_FIELDS_BY_SERVICE[service] ?? []) fields.add(field);
  return (['hourlyRate', 'minBookingHours', 'fullDayRate', 'monthlySalary'] as const).filter((field) =>
    fields.has(field),
  );
}

// ─── Required / optional markers (plan Section 3b levels) ──────────────────

export type FieldLevel = 'required' | 'hire' | 'payout' | 'optional' | 'recommended';

const LEVEL_SUFFIX: Record<FieldLevel, string> = {
  required: ' *',
  hire: ' (for hire)',
  payout: ' (before payouts)',
  optional: ' (optional)',
  recommended: ' (recommended)',
};

/** A field label with its level marker: "Date of birth *", "Email (optional)". */
export function fieldLabel(label: string, level: FieldLevel): string {
  return `${label}${LEVEL_SUFFIX[level]}`;
}

/** The line at the top of each step explaining the markers. */
export const FIELD_LEVEL_LEGEND =
  '* Needed to be rental-ready. “For hire” is needed only to be hired by customers. Save any time and come back later.';

/** The note on fields only the driver and KerayeGo see. */
export const PRIVATE_NOTE = 'Private — only you and KerayeGo see it.';
