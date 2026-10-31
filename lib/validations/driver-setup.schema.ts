import { z } from 'zod';
import {
  DriverAgreementType,
  DriverGender,
  DriverService,
  DriverTransmission,
  DriverVehicleType,
  PayoutMethod,
} from '../../types/enums';
import type { DriverProfile, UpdateDriverProfilePayload } from '../../types/driver.types';
import {
  amountOrNull,
  currentMonth,
  dateOnlyText,
  DRIVER_LIMITS,
  formatCnic,
  intOrNull,
  isAdult,
  MONTH_PATTERN,
  monthText,
  numberText,
  optionalAmount,
  optionalDate,
  optionalPhone,
  optionalText,
  optionalWholeNumber,
  textList,
  textOrNull,
  todayDateOnly,
  tooLong,
  yesNo,
} from '../driver/fields';
import { rateFieldsForServices } from '../driver/setupSteps';
import { WEEKDAYS, workingDayError, workingWeekFromApi, workingWeekToApi } from '../driver/workingHours';

// The six driver setup steps' forms — ports of kerayego-partner's
// features/driver/setup/*Step.ts (schema, defaults from GET /driver/profile,
// PATCH /driver/profile payload). Same rules and messages; dates are the
// strings the browser's date inputs hold (see lib/driver/fields.ts).

// ─── Step 1 — personal information ──────────────────────────────────────────

/** Languages offered as chips; anything else is added with "Other language". */
export const COMMON_LANGUAGES: readonly string[] = [
  'Urdu',
  'English',
  'Punjabi',
  'Sindhi',
  'Pashto',
  'Saraiki',
  'Balochi',
  'Hindko',
  'Arabic',
];

export const personalStepSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name as on your CNIC')
    .max(DRIVER_LIMITS.fullName, tooLong(DRIVER_LIMITS.fullName)),
  contactPhone: optionalPhone(DRIVER_LIMITS.contactPhone),
  dateOfBirth: optionalDate().refine((date) => date === '' || isAdult(date), 'You must be at least 18 years old'),
  city: optionalText(DRIVER_LIMITS.city),
  area: optionalText(DRIVER_LIMITS.area),
  residentialAddress: optionalText(DRIVER_LIMITS.residentialAddress),
  homeLat: z.number().min(-90).max(90).optional(),
  homeLng: z.number().min(-180).max(180).optional(),
  gender: z.nativeEnum(DriverGender).nullable(),
  comfortableWithFamilies: yesNo,
  contactEmail: z
    .string()
    .trim()
    .max(DRIVER_LIMITS.contactEmail, tooLong(DRIVER_LIMITS.contactEmail))
    .refine((value) => value === '' || z.string().email().safeParse(value).success, 'Enter a valid email address'),
  languages: textList('language'),
});

export type PersonalStepValues = z.infer<typeof personalStepSchema>;

export function personalStepDefaults(profile: DriverProfile | null): PersonalStepValues {
  return {
    fullName: profile?.fullName ?? '',
    contactPhone: profile?.contactPhone ?? '',
    dateOfBirth: dateOnlyText(profile?.dateOfBirth),
    city: profile?.city ?? '',
    area: profile?.area ?? '',
    residentialAddress: profile?.residentialAddress ?? '',
    homeLat: profile?.homeLat ?? undefined,
    homeLng: profile?.homeLng ?? undefined,
    gender: profile?.gender ?? null,
    comfortableWithFamilies: profile?.comfortableWithFamilies ?? null,
    contactEmail: profile?.contactEmail ?? '',
    languages: profile?.languages ?? [],
  };
}

export function personalStepPayload(values: PersonalStepValues): UpdateDriverProfilePayload {
  const hasHome = values.homeLat !== undefined && values.homeLng !== undefined;
  return {
    fullName: values.fullName.trim(),
    contactPhone: textOrNull(values.contactPhone),
    dateOfBirth: textOrNull(values.dateOfBirth),
    city: textOrNull(values.city),
    area: textOrNull(values.area),
    residentialAddress: textOrNull(values.residentialAddress),
    homeLat: hasHome ? values.homeLat : null,
    homeLng: hasHome ? values.homeLng : null,
    gender: values.gender,
    comfortableWithFamilies: values.comfortableWithFamilies,
    contactEmail: textOrNull(values.contactEmail),
    languages: values.languages.map((language) => language.trim()),
  };
}

// ─── Step 2 — identity ──────────────────────────────────────────────────────

/** Common licence-issuing authorities, offered as suggestions. */
export const LICENSE_AUTHORITY_SUGGESTIONS: readonly string[] = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad (ICT)',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

export const DECLARATIONS = [
  { key: 'declaredNoSeriousConvictions', label: 'I have no serious traffic convictions in the last 3 years.' },
  { key: 'declaredNoCriminalRecord', label: 'I have no criminal record.' },
  { key: 'declaredNoLicenseSuspension', label: 'My licence has not been suspended in the last 3 years.' },
] as const;

const futureDate = (message: string) =>
  optionalDate().refine((date) => date === '' || date > todayDateOnly(), message);

export const identityStepSchema = z
  .object({
    cnicNumber: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || formatCnic(value) !== null,
        'Enter the 13 digits of your CNIC, e.g. 35202-1234567-1',
      ),
    cnicExpiry: futureDate('Your CNIC has expired — renew it first'),
    licenseNumber: optionalText(DRIVER_LIMITS.licenseNumber),
    licenseCategory: optionalText(DRIVER_LIMITS.licenseCategory),
    licenseIssueDate: optionalDate().refine(
      (date) => date === '' || date <= todayDateOnly(),
      'The issue date can’t be in the future',
    ),
    licenseExpiry: futureDate('Your licence has expired — renew it first'),
    licenseIssuingAuthority: optionalText(DRIVER_LIMITS.licenseIssuingAuthority),
    emergencyContactName: optionalText(DRIVER_LIMITS.emergencyContactName),
    emergencyContactPhone: optionalPhone(DRIVER_LIMITS.emergencyContactPhone),
    emergencyContactRelation: optionalText(DRIVER_LIMITS.emergencyContactRelation),
    declaredNoSeriousConvictions: z.boolean(),
    declaredNoCriminalRecord: z.boolean(),
    declaredNoLicenseSuspension: z.boolean(),
  })
  .refine(
    (values) => !values.licenseIssueDate || !values.licenseExpiry || values.licenseIssueDate < values.licenseExpiry,
    { path: ['licenseExpiry'], message: 'The expiry date must be after the issue date' },
  );

export type IdentityStepValues = z.infer<typeof identityStepSchema>;

export function identityStepDefaults(profile: DriverProfile | null): IdentityStepValues {
  return {
    cnicNumber: profile?.cnicNumber ?? '',
    cnicExpiry: dateOnlyText(profile?.cnicExpiry),
    licenseNumber: profile?.licenseNumber ?? '',
    licenseCategory: profile?.licenseCategory ?? '',
    licenseIssueDate: dateOnlyText(profile?.licenseIssueDate),
    licenseExpiry: dateOnlyText(profile?.licenseExpiry),
    licenseIssuingAuthority: profile?.licenseIssuingAuthority ?? '',
    emergencyContactName: profile?.emergencyContactName ?? '',
    emergencyContactPhone: profile?.emergencyContactPhone ?? '',
    emergencyContactRelation: profile?.emergencyContactRelation ?? '',
    declaredNoSeriousConvictions: profile?.declaredNoSeriousConvictions ?? false,
    declaredNoCriminalRecord: profile?.declaredNoCriminalRecord ?? false,
    declaredNoLicenseSuspension: profile?.declaredNoLicenseSuspension ?? false,
  };
}

/** PATCH body: the CNIC written 12345-1234567-1, dates as YYYY-MM-DD, emptied fields null. */
export function identityStepPayload(values: IdentityStepValues): UpdateDriverProfilePayload {
  return {
    cnicNumber: values.cnicNumber.trim() ? formatCnic(values.cnicNumber) : null,
    cnicExpiry: textOrNull(values.cnicExpiry),
    licenseNumber: textOrNull(values.licenseNumber),
    licenseCategory: textOrNull(values.licenseCategory),
    licenseIssueDate: textOrNull(values.licenseIssueDate),
    licenseExpiry: textOrNull(values.licenseExpiry),
    licenseIssuingAuthority: textOrNull(values.licenseIssuingAuthority),
    emergencyContactName: textOrNull(values.emergencyContactName),
    emergencyContactPhone: textOrNull(values.emergencyContactPhone),
    emergencyContactRelation: textOrNull(values.emergencyContactRelation),
    declaredNoSeriousConvictions: values.declaredNoSeriousConvictions,
    declaredNoCriminalRecord: values.declaredNoCriminalRecord,
    declaredNoLicenseSuspension: values.declaredNoLicenseSuspension,
  };
}

// ─── Step 3 — driving experience ────────────────────────────────────────────

/** The references the spec asks for, ideally (shown as two empty rows to start). */
export const SUGGESTED_REFERENCES = 2;

const monthField = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => MONTH_PATTERN.test(value), message)
    .refine((value) => !MONTH_PATTERN.test(value) || value <= currentMonth(), 'Can’t be in the future');

const employmentSchema = z
  .object({
    employer: z
      .string()
      .trim()
      .min(1, 'Enter the employer')
      .max(DRIVER_LIMITS.employer, tooLong(DRIVER_LIMITS.employer)),
    role: optionalText(DRIVER_LIMITS.role),
    from: monthField('Choose when you started (YYYY-MM)'),
    to: z.string().trim(),
    current: z.boolean(),
  })
  .superRefine((job, ctx) => {
    if (job.current) return;
    if (job.to === '') {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Choose when you left, or tick “I still work here”' });
      return;
    }
    if (!MONTH_PATTERN.test(job.to)) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Choose when you left (YYYY-MM)' });
      return;
    }
    if (job.to > currentMonth()) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Can’t be in the future' });
      return;
    }
    if (MONTH_PATTERN.test(job.from) && job.to < job.from) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'The end must be after the start' });
    }
  });

const referenceSchema = z.object({
  name: optionalText(DRIVER_LIMITS.referenceName),
  phone: optionalPhone(DRIVER_LIMITS.referencePhone),
  relation: optionalText(DRIVER_LIMITS.referenceRelation),
});

export const experienceStepSchema = z
  .object({
    experienceYears: optionalWholeNumber('8'),
    professionalExperienceYears: optionalWholeNumber('5'),
    employmentHistory: z
      .array(employmentSchema)
      .max(DRIVER_LIMITS.employmentHistory, `Add up to ${DRIVER_LIMITS.employmentHistory} jobs`),
    references: z
      .array(referenceSchema)
      .refine(
        (rows) => rows.filter((row) => row.name.trim() !== '').length <= DRIVER_LIMITS.references,
        `Add up to ${DRIVER_LIMITS.references} references`,
      ),
    vehicleTypes: z.array(z.nativeEnum(DriverVehicleType)),
    transmissions: z.array(z.nativeEnum(DriverTransmission)),
    highwayExperience: yesNo,
    navigationSkills: yesNo,
    hasSmartphoneGps: yesNo,
    certifications: optionalText(DRIVER_LIMITS.certifications),
  })
  .refine(
    (values) =>
      values.experienceYears === '' ||
      values.professionalExperienceYears === '' ||
      Number(values.professionalExperienceYears) <= Number(values.experienceYears),
    { path: ['professionalExperienceYears'], message: 'Can’t be more than your total driving experience' },
  )
  .superRefine((values, ctx) => {
    // A reference needs a name and a phone, or nothing at all.
    values.references.forEach((row, index) => {
      const filled = [row.name, row.phone, row.relation].some((value) => value.trim() !== '');
      if (!filled) return;
      if (row.name.trim() === '')
        ctx.addIssue({ code: 'custom', path: ['references', index, 'name'], message: 'Enter their name' });
      if (row.phone.trim() === '')
        ctx.addIssue({ code: 'custom', path: ['references', index, 'phone'], message: 'Enter their phone' });
    });
  });

export type ExperienceStepValues = z.infer<typeof experienceStepSchema>;
export type ReferenceRow = ExperienceStepValues['references'][number];

export function emptyReference(): ReferenceRow {
  return { name: '', phone: '', relation: '' };
}

export function experienceStepDefaults(profile: DriverProfile | null): ExperienceStepValues {
  const references: ReferenceRow[] = (profile?.references ?? []).map((reference) => ({
    name: reference.name ?? '',
    phone: reference.phone ?? '',
    relation: reference.relation ?? '',
  }));
  while (references.length < SUGGESTED_REFERENCES) references.push(emptyReference());

  return {
    experienceYears: numberText(profile?.experienceYears),
    professionalExperienceYears: numberText(profile?.professionalExperienceYears),
    employmentHistory: (profile?.employmentHistory ?? []).flatMap((job) => {
      const from = monthText(job.from);
      // A row without a readable start month is dropped rather than shown broken.
      if (!from) return [];
      return [{ employer: job.employer ?? '', role: job.role ?? '', from, to: monthText(job.to), current: job.to === null }];
    }),
    references,
    vehicleTypes: profile?.vehicleTypes ?? [],
    transmissions: profile?.transmissions ?? [],
    highwayExperience: profile?.highwayExperience ?? null,
    navigationSkills: profile?.navigationSkills ?? null,
    hasSmartphoneGps: profile?.hasSmartphoneGps ?? null,
    certifications: profile?.certifications ?? '',
  };
}

/** PATCH body: months as 'YYYY-MM' (to null = current), empty reference rows left out. */
export function experienceStepPayload(values: ExperienceStepValues): UpdateDriverProfilePayload {
  return {
    experienceYears: intOrNull(values.experienceYears),
    professionalExperienceYears: intOrNull(values.professionalExperienceYears),
    employmentHistory: values.employmentHistory.map((job) => ({
      employer: job.employer.trim(),
      role: job.role.trim(),
      from: job.from.trim(),
      to: job.current || !job.to.trim() ? null : job.to.trim(),
    })),
    references: values.references
      .filter((row) => row.name.trim() !== '')
      .map((row) => ({ name: row.name.trim(), phone: row.phone.trim(), relation: row.relation.trim() })),
    vehicleTypes: values.vehicleTypes,
    transmissions: values.transmissions,
    highwayExperience: values.highwayExperience,
    navigationSkills: values.navigationSkills,
    hasSmartphoneGps: values.hasSmartphoneGps,
    certifications: textOrNull(values.certifications),
  };
}

// ─── Step 4 — services ──────────────────────────────────────────────────────

export const servicesStepSchema = z.object({
  services: z.array(z.nativeEnum(DriverService)),
  uniformAvailable: yesNo,
});

export type ServicesStepValues = z.infer<typeof servicesStepSchema>;

export function servicesStepDefaults(profile: DriverProfile | null): ServicesStepValues {
  return {
    services: profile?.services ?? [],
    uniformAvailable: profile?.uniformAvailable ?? null,
  };
}

/** PATCH body, services in the enum's order (whatever order they were ticked in). */
export function servicesStepPayload(values: ServicesStepValues): UpdateDriverProfilePayload {
  const order = Object.values(DriverService);
  return {
    services: [...values.services].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    uniformAvailable: values.uniformAvailable,
  };
}

// ─── Step 5 — availability and pricing ──────────────────────────────────────

const workingDaySchema = z.object({ working: z.boolean(), start: z.string(), end: z.string() });

export const availabilityStepSchema = z
  .object({
    serviceCity: optionalText(DRIVER_LIMITS.city),
    coverageAreas: textList('area'),
    workingHours: z.object({
      mon: workingDaySchema,
      tue: workingDaySchema,
      wed: workingDaySchema,
      thu: workingDaySchema,
      fri: workingDaySchema,
      sat: workingDaySchema,
      sun: workingDaySchema,
    }),
    outstationAvailable: yesNo,
    overnightAvailable: yesNo,
    hourlyRate: optionalAmount(),
    fullDayRate: optionalAmount(),
    monthlySalary: optionalAmount(),
    overtimeRate: optionalAmount(),
    minBookingHours: optionalWholeNumber('2'),
    minAdvanceNoticeHours: optionalWholeNumber('4'),
    maxTravelKm: optionalWholeNumber('50'),
  })
  .superRefine((values, ctx) => {
    for (const day of WEEKDAYS) {
      const message = workingDayError(values.workingHours[day]);
      if (message) ctx.addIssue({ code: 'custom', path: ['workingHours', day], message });
    }
  });

export type AvailabilityStepValues = z.infer<typeof availabilityStepSchema>;

export function availabilityStepDefaults(profile: DriverProfile | null): AvailabilityStepValues {
  return {
    // The service city starts as the city from step 1.
    serviceCity: profile?.serviceCity ?? profile?.city ?? '',
    coverageAreas: profile?.coverageAreas ?? [],
    workingHours: workingWeekFromApi(profile?.workingHours),
    outstationAvailable: profile?.outstationAvailable ?? null,
    overnightAvailable: profile?.overnightAvailable ?? null,
    hourlyRate: numberText(profile?.hourlyRate),
    fullDayRate: numberText(profile?.fullDayRate),
    monthlySalary: numberText(profile?.monthlySalary),
    overtimeRate: numberText(profile?.overtimeRate),
    minBookingHours: numberText(profile?.minBookingHours),
    minAdvanceNoticeHours: numberText(profile?.minAdvanceNoticeHours),
    maxTravelKm: numberText(profile?.maxTravelKm),
  };
}

/** PATCH body; a rate for a service not offered is left out (kept as it was). */
export function availabilityStepPayload(
  values: AvailabilityStepValues,
  services: readonly DriverService[],
): UpdateDriverProfilePayload {
  const rates = rateFieldsForServices(services);
  const payload: UpdateDriverProfilePayload = {
    serviceCity: textOrNull(values.serviceCity),
    coverageAreas: values.coverageAreas.map((area) => area.trim()),
    workingHours: workingWeekToApi(values.workingHours),
    outstationAvailable: values.outstationAvailable,
    overnightAvailable: values.overnightAvailable,
    overtimeRate: amountOrNull(values.overtimeRate),
    minAdvanceNoticeHours: intOrNull(values.minAdvanceNoticeHours),
    maxTravelKm: intOrNull(values.maxTravelKm),
  };
  if (rates.includes('hourlyRate')) payload.hourlyRate = amountOrNull(values.hourlyRate);
  if (rates.includes('minBookingHours')) payload.minBookingHours = intOrNull(values.minBookingHours);
  if (rates.includes('fullDayRate')) payload.fullDayRate = amountOrNull(values.fullDayRate);
  if (rates.includes('monthlySalary')) payload.monthlySalary = amountOrNull(values.monthlySalary);
  return payload;
}

// ─── Step 6 — payouts and agreements ────────────────────────────────────────

export const AGREEMENT_ORDER: readonly DriverAgreementType[] = [
  DriverAgreementType.SERVICE_AGREEMENT,
  DriverAgreementType.CODE_OF_CONDUCT,
  DriverAgreementType.PRIVACY_CONSENT,
  DriverAgreementType.FITNESS_DECLARATION,
];

export const DRIVER_AGREEMENT_SUMMARIES: Record<DriverAgreementType, string> = {
  [DriverAgreementType.SERVICE_AGREEMENT]:
    'How you work with KerayeGo, businesses and customers — jobs, cancellations and payment (customers pay you directly for now).',
  [DriverAgreementType.CODE_OF_CONDUCT]:
    'Drive safely and lawfully, respect passengers, never drive tired or under the influence.',
  [DriverAgreementType.PRIVACY_CONSENT]:
    'KerayeGo may check your CNIC, licence and selfie, and keeps them private — businesses and customers never see them.',
  [DriverAgreementType.FITNESS_DECLARATION]:
    'You are medically fit to drive, with eyesight that meets the licence standard, and will tell KerayeGo if that changes.',
};

export const payoutsStepSchema = z.object({
  payoutMethod: z.nativeEnum(PayoutMethod).nullable(),
  payoutAccountTitle: optionalText(DRIVER_LIMITS.payoutAccountTitle),
  payoutAccountNumber: z
    .string()
    .trim()
    .max(DRIVER_LIMITS.payoutAccountNumber, tooLong(DRIVER_LIMITS.payoutAccountNumber))
    .regex(/^[A-Za-z0-9 -]*$/, 'Use letters, numbers and spaces only'),
  /** The agreements ticked on screen (accepted ones stay ticked). */
  agreements: z.array(z.nativeEnum(DriverAgreementType)),
});

export type PayoutsStepValues = z.infer<typeof payoutsStepSchema>;

/** Whether the driver has accepted this agreement at its current version. */
export function hasAcceptedCurrent(profile: DriverProfile | null, type: DriverAgreementType): boolean {
  if (!profile) return false;
  const current = profile.currentAgreementVersions?.[type];
  return (profile.agreements ?? []).some((agreement) => agreement.type === type && agreement.version === current);
}

/** The driver's acceptance of this agreement (any version), if any. */
export function acceptanceOf(profile: DriverProfile | null, type: DriverAgreementType) {
  return profile?.agreements?.find((agreement) => agreement.type === type);
}

export function payoutsStepDefaults(profile: DriverProfile | null): PayoutsStepValues {
  return {
    payoutMethod: profile?.payoutMethod ?? null,
    payoutAccountTitle: profile?.payoutAccountTitle ?? '',
    // Write-only: never pre-filled (GET returns only the masked form).
    payoutAccountNumber: '',
    agreements: AGREEMENT_ORDER.filter((type) => hasAcceptedCurrent(profile, type)),
  };
}

/** PATCH body for the payout fields. The account number is sent only when typed (spaces removed). */
export function payoutsStepPayload(values: PayoutsStepValues): UpdateDriverProfilePayload {
  const accountNumber = values.payoutAccountNumber.replace(/\s/g, '');
  return {
    payoutMethod: values.payoutMethod,
    payoutAccountTitle: textOrNull(values.payoutAccountTitle),
    ...(accountNumber ? { payoutAccountNumber: accountNumber } : null),
  };
}

/** The agreements ticked now that aren't yet accepted at their current version. */
export function agreementsToAccept(
  profile: DriverProfile | null,
  ticked: readonly DriverAgreementType[],
): DriverAgreementType[] {
  return AGREEMENT_ORDER.filter((type) => ticked.includes(type) && !hasAcceptedCurrent(profile, type));
}

/** Whether the payout fields differ from what's saved (an account number typed always counts). */
export function payoutDetailsChanged(profile: DriverProfile | null, values: PayoutsStepValues): boolean {
  const payload = payoutsStepPayload(values);
  return (
    payload.payoutAccountNumber !== undefined ||
    (payload.payoutMethod ?? null) !== (profile?.payoutMethod ?? null) ||
    (payload.payoutAccountTitle ?? null) !== (profile?.payoutAccountTitle ?? null)
  );
}

/** What the account-number field is called for this method. */
export function accountNumberLabel(method: PayoutMethod | null): string {
  switch (method) {
    case PayoutMethod.JAZZCASH:
      return 'JazzCash mobile account number';
    case PayoutMethod.EASYPAISA:
      return 'Easypaisa mobile account number';
    default:
      return 'Account number or IBAN';
  }
}
