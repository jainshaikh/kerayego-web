import { z } from 'zod';
import type { FuelType, Transmission } from '../../types/api.types';
import type {
  ClearableVehicleField,
  CreateVehiclePayload,
  FleetVehicle,
  UpdateVehiclePayload,
} from '../../types/fleet.types';
import { COMMON_FEATURES, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '../validations/vehicle.schema';

// The add/edit car form, ported from the KerayeGo Partner app's
// features/fleet/vehicleForm.ts: fields, validation (the backend's
// CreateVehicleDto limits) and the request bodies. Number fields are kept as
// the text typed, so a cleared field stays empty and a price like "3500.5" can
// be typed a key at a time. An emptied optional field is sent as null on edit
// (which clears it) — the old web edit form left it out, so a weekly price
// could never be removed.

const currentYear = new Date().getFullYear();
export const VEHICLE_YEAR_MIN = 1990;
export const VEHICLE_YEAR_MAX = currentYear + 2;

// Decimal(10, 2) columns: at most 8 digits before the point.
const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const PRICE_FIELDS = [
  { name: 'pricePer6Hours', label: '6-hour price' },
  { name: 'pricePer12Hours', label: '12-hour price' },
  { name: 'pricePerDay', label: 'Daily price' },
  { name: 'pricePerWeek', label: 'Weekly price' },
  { name: 'pricePerMonth', label: 'Monthly price' },
] as const;

export type PriceFieldName = (typeof PRICE_FIELDS)[number]['name'];

export { COMMON_FEATURES, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS };

function wholeNumberField(requiredMessage: string, min: number, max: number, minMessage: string, maxMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(/^\d+$/, 'Enter a whole number')
    .refine((value) => Number(value) >= min, minMessage)
    .refine((value) => Number(value) <= max, maxMessage);
}

function priceField(required: boolean) {
  const base = z.string().trim();
  return (required ? base.min(1, 'Price per day is required') : base)
    .refine((value) => value === '' || PRICE_PATTERN.test(value), 'Enter a price like 3500 or 3500.50')
    .refine((value) => value === '' || Number(value) >= 1, 'Price must be at least 1');
}

function optionalText(max: number, message: string) {
  return z.string().trim().max(max, message);
}

export const vehicleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Listing title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  make: z
    .string()
    .trim()
    .min(1, 'Make is required')
    .min(2, 'Make must be at least 2 characters')
    .max(50, 'Make must be at most 50 characters'),
  model: z.string().trim().min(1, 'Model is required').max(50, 'Model must be at most 50 characters'),
  plateNumber: optionalText(20, 'Plate number must be at most 20 characters').refine(
    (value) => value === '' || value.length >= 2,
    'Plate number must be at least 2 characters',
  ),
  year: wholeNumberField(
    'Year is required',
    VEHICLE_YEAR_MIN,
    VEHICLE_YEAR_MAX,
    `Year must be ${VEHICLE_YEAR_MIN} or later`,
    `Year cannot exceed ${VEHICLE_YEAR_MAX}`,
  ),
  seatingCapacity: wholeNumberField('Seats are required', 1, 20, 'Minimum 1 seat', 'Maximum 20 seats'),
  engineType: optionalText(60, 'Engine must be at most 60 characters'),
  transmission: z.enum(['AUTOMATIC', 'MANUAL', 'CVT'], { required_error: 'Select a transmission type' }),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'], { required_error: 'Select a fuel type' }),
  pricePer6Hours: priceField(false),
  pricePer12Hours: priceField(false),
  pricePerDay: priceField(true),
  pricePerWeek: priceField(false),
  pricePerMonth: priceField(false),
  pricingNotes: optionalText(500, 'Pricing notes must be at most 500 characters'),
  availabilityNotes: optionalText(500, 'Availability notes must be at most 500 characters'),
  specialConditions: optionalText(1000, 'Special conditions must be at most 1000 characters'),
  showroomId: z.string().min(1, 'Choose the showroom this car is listed at'),
  features: z.array(z.string().trim().min(1).max(80, 'A feature name must be at most 80 characters')),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

/** A new car's starting values — Automatic, Petrol, 5 seats, at the business's first showroom. */
export function emptyVehicleFormValues(showrooms: readonly { id: string }[]): VehicleFormValues {
  return {
    title: '',
    make: '',
    model: '',
    plateNumber: '',
    year: '',
    seatingCapacity: '5',
    engineType: '',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    pricePer6Hours: '',
    pricePer12Hours: '',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    pricingNotes: '',
    availabilityNotes: '',
    specialConditions: '',
    showroomId: showrooms[0]?.id ?? '',
    features: [],
  };
}

/** "3500.00" → "3500", "3500.50" → "3500.5", null → "". */
export function priceToInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : '';
}

/** Digits and one point with at most 2 decimals; anything else typed or pasted is dropped. */
export function sanitizePriceInput(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  const fraction = cleaned
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return `${cleaned.slice(0, dot)}.${fraction}`;
}

export function sanitizeWholeNumberInput(text: string): string {
  return text.replace(/\D/g, '');
}

/** The form's values for an existing car. */
export function vehicleToFormValues(vehicle: FleetVehicle, showrooms: readonly { id: string }[]): VehicleFormValues {
  return {
    title: vehicle.title,
    make: vehicle.make,
    model: vehicle.model,
    plateNumber: vehicle.plateNumber ?? '',
    year: String(vehicle.year),
    seatingCapacity: String(vehicle.seatingCapacity),
    engineType: vehicle.engineType ?? '',
    transmission: vehicle.transmission as VehicleFormValues['transmission'],
    fuelType: vehicle.fuelType as VehicleFormValues['fuelType'],
    pricePer6Hours: priceToInput(vehicle.pricePer6Hours),
    pricePer12Hours: priceToInput(vehicle.pricePer12Hours),
    pricePerDay: priceToInput(vehicle.pricePerDay),
    pricePerWeek: priceToInput(vehicle.pricePerWeek),
    pricePerMonth: priceToInput(vehicle.pricePerMonth),
    pricingNotes: vehicle.pricingNotes ?? '',
    availabilityNotes: vehicle.availabilityNotes ?? '',
    specialConditions: vehicle.specialConditions ?? '',
    showroomId: vehicle.showroomId ?? showrooms[0]?.id ?? '',
    features: vehicle.features.map((feature) => feature.name),
  };
}

/** Trimmed, blanks and repeats dropped. */
export function normalizeFeatures(features: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of features) {
    const name = raw.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

const OPTIONAL_TEXT_FIELDS = ['plateNumber', 'engineType', 'pricingNotes', 'availabilityNotes', 'specialConditions'] as const;
const OPTIONAL_PRICE_FIELDS = ['pricePer6Hours', 'pricePer12Hours', 'pricePerWeek', 'pricePerMonth'] as const;

type AssertClearable<T extends ClearableVehicleField> = T;
export type OptionalFormField = AssertClearable<
  (typeof OPTIONAL_TEXT_FIELDS)[number] | (typeof OPTIONAL_PRICE_FIELDS)[number]
>;

function requiredFields(values: VehicleFormValues) {
  return {
    title: values.title.trim(),
    make: values.make.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    transmission: values.transmission as Transmission,
    fuelType: values.fuelType as FuelType,
    seatingCapacity: Number(values.seatingCapacity),
    pricePerDay: Number(values.pricePerDay),
    showroomId: values.showroomId,
    features: normalizeFeatures(values.features),
  };
}

/** POST /vehicles body: empty optional fields left out. */
export function toCreateVehiclePayload(values: VehicleFormValues): CreateVehiclePayload {
  const payload: CreateVehiclePayload = requiredFields(values);
  for (const field of OPTIONAL_TEXT_FIELDS) {
    const text = values[field].trim();
    if (text) payload[field] = text;
  }
  for (const field of OPTIONAL_PRICE_FIELDS) {
    const text = values[field].trim();
    if (text) payload[field] = Number(text);
  }
  return payload;
}

/**
 * PATCH /vehicles/:id body: an emptied optional field is sent as null. With
 * `plateLocked` the plate is left out entirely (the backend answers 403
 * PLATE_LOCKED to any plate change on a live car).
 */
export function toUpdateVehiclePayload(values: VehicleFormValues, options: { plateLocked?: boolean } = {}): UpdateVehiclePayload {
  const payload: UpdateVehiclePayload = requiredFields(values);
  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (field === 'plateNumber' && options.plateLocked) continue;
    const text = values[field].trim();
    payload[field] = text || null;
  }
  for (const field of OPTIONAL_PRICE_FIELDS) {
    const text = values[field].trim();
    payload[field] = text ? Number(text) : null;
  }
  return payload;
}

/** The feature chips: the common list, then any other feature the car already has. */
export function featureOptions(selected: readonly string[]): string[] {
  const common: readonly string[] = COMMON_FEATURES;
  return [...common, ...selected.filter((name) => !common.includes(name))];
}

export function toggleFeature(features: readonly string[], name: string): string[] {
  return features.includes(name) ? features.filter((feature) => feature !== name) : [...features, name];
}
