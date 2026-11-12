// Option lists for the fleet form (lib/ops/vehicleForm.ts, which holds the live
// schema). The old vehicleSchema that lived here — with week and month prices —
// was unused and was removed on 2026-11-12 (weeks and months have no price, plan A79).

export const TRANSMISSION_OPTIONS = [
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CVT', label: 'CVT' },
] as const;

export const FUEL_TYPE_OPTIONS = [
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'CNG', label: 'CNG' },
] as const;

export const COMMON_FEATURES = [
  'Air Conditioning',
  'GPS Navigation',
  'Bluetooth',
  'USB Charging',
  'Backup Camera',
  'Cruise Control',
  'Sunroof',
  'Leather Seats',
  'Heated Seats',
  'Child Seat',
  'Parking Sensors',
  'Lane Assist',
  'Apple CarPlay',
  'Android Auto',
  'Roof Rack',
  '4x4 / AWD',
] as const;
