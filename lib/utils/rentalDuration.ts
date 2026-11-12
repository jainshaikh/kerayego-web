/**
 * A rental request's package. Week and month are still package types — a
 * customer can ask for them in the KerayeGo app — but since 2026-11-11 they
 * have no price ("price to agree", plan A79): the business agrees one with the
 * customer. Only 6 hours, 12 hours and days are priced (the car's own prices).
 */
export type RentalDurationType = 'HOURS_6' | 'HOURS_12' | 'DAY' | 'WEEK' | 'MONTH';

/** The packages a car can have a price for. */
export type PricedPackageType = 'HOURS_6' | 'HOURS_12' | 'DAY';

export interface VehicleRentalPrices {
  pricePer6Hours?: string | number | null;
  pricePer12Hours?: string | number | null;
  pricePerDay: string | number;
}

/** The priced packages in display order, worded as people say them (plan A74). */
export const PRICED_PACKAGE_OPTIONS: { value: PricedPackageType; label: string }[] = [
  { value: 'HOURS_6', label: '6 hours' },
  { value: 'HOURS_12', label: '12 hours' },
  { value: 'DAY', label: 'Per day' },
];

/** Null when the provider hasn't priced that package for this car. */
export function getUnitPrice(vehicle: VehicleRentalPrices, type: PricedPackageType): number | null {
  const raw = {
    HOURS_6: vehicle.pricePer6Hours,
    HOURS_12: vehicle.pricePer12Hours,
    DAY: vehicle.pricePerDay,
  }[type];
  return raw === null || raw === undefined ? null : Number(raw);
}

/** The priced packages this car has a price for, in display order. */
export function getAvailableDurations(vehicle: VehicleRentalPrices) {
  return PRICED_PACKAGE_OPTIONS.filter((opt) => getUnitPrice(vehicle, opt.value) !== null);
}
