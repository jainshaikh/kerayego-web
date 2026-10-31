import { DEFAULT_MARKET, MARKETS } from '../config/markets';
import { Market } from '../../types/enums';
import type { Showroom } from '../../types/api.types';
import type { CreateShowroomPayload, UpdateShowroomPayload } from '../api/providers.api';
import type { ShowroomFormValues } from '../validations/business.schema';

// Showroom form values ↔ the backend's requests, and the rules the page shows
// around them (kerayego-backend showrooms.service.ts) — kerayego-partner
// features/showrooms/showroomPayload.ts. The Partner app's showroom screens
// don't edit opening hours, so neither does this: a PATCH never sends
// operatingHours and whatever is saved stays as it is.

/** showrooms.service.ts create: "Each provider can only have one showroom" (409 otherwise). */
export const MAX_SHOWROOMS_PER_BUSINESS = 1;

export function canAddShowroom(showroomCount: number): boolean {
  return showroomCount < MAX_SHOWROOMS_PER_BUSINESS;
}

/** Example values per market, for placeholders. */
export const MARKET_FORM_EXAMPLES: Record<Market, { phone: string; city: string; area: string }> = {
  [Market.PK]: { phone: '+92 300 1234567', city: 'Lahore', area: 'Gulberg III' },
  [Market.SA]: { phone: '+966 50 123 4567', city: 'Riyadh', area: 'Al Olaya' },
  [Market.AE]: { phone: '+971 50 123 4567', city: 'Dubai', area: 'Dubai Marina' },
};

/** The market choices, in the backend's order, labelled short enough for one row. */
export const SHOWROOM_MARKET_OPTIONS: { value: Market; label: string }[] = [Market.PK, Market.SA, Market.AE].map(
  (market) => ({ value: market, label: market === Market.AE ? 'UAE' : MARKETS[market].label }),
);

function currencyFor(market: Market): string {
  return (MARKETS[market] ?? MARKETS[DEFAULT_MARKET]).currencyCode;
}

/** "Pakistan · prices in PKR". */
export function describeMarket(market: Market): string {
  const meta = MARKETS[market] ?? MARKETS[DEFAULT_MARKET];
  return meta.label;
}

/** "karachi" → "Karachi" (cities are stored lowercase). */
export function titleCase(value: string): string {
  return value.replace(/(^|[\s-])([a-z])/g, (_m, sep: string, c: string) => sep + c.toUpperCase());
}

export function emptyShowroomForm(): ShowroomFormValues {
  return {
    name: '',
    address: '',
    city: '',
    area: '',
    contactNumber: '',
    whatsappNumber: '',
    country: DEFAULT_MARKET,
    mapLat: undefined,
    mapLng: undefined,
  };
}

/** A saved showroom as the edit form starts. */
export function formValuesFromShowroom(showroom: Showroom): ShowroomFormValues {
  const hasPin = showroom.mapLat !== null && showroom.mapLng !== null;
  return {
    name: showroom.name,
    address: showroom.address,
    city: titleCase(showroom.city),
    area: showroom.area ?? '',
    contactNumber: showroom.contactNumber,
    whatsappNumber: showroom.whatsappNumber ?? '',
    country: showroom.country ?? DEFAULT_MARKET,
    mapLat: hasPin ? (showroom.mapLat as number) : undefined,
    mapLng: hasPin ? (showroom.mapLng as number) : undefined,
  };
}

/** POST body: only filled-in optional fields; the map pin only when both coordinates are set. */
export function buildCreatePayload(values: ShowroomFormValues): CreateShowroomPayload {
  const payload: CreateShowroomPayload = {
    name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    contactNumber: values.contactNumber.trim(),
    country: values.country,
  };
  const area = values.area.trim();
  if (area) payload.area = area;
  const whatsappNumber = values.whatsappNumber.trim();
  if (whatsappNumber) payload.whatsappNumber = whatsappNumber;
  if (values.mapLat !== undefined && values.mapLng !== undefined) {
    payload.mapLat = values.mapLat;
    payload.mapLng = values.mapLng;
  }
  return payload;
}

/**
 * PATCH body: only what changed. Area / WhatsApp are cleared with '' (the
 * backend ignores null). The pin is only ever moved, never removed.
 */
export function buildUpdatePayload(showroom: Showroom, values: ShowroomFormValues): UpdateShowroomPayload {
  const payload: UpdateShowroomPayload = {};
  const name = values.name.trim();
  if (name !== showroom.name) payload.name = name;
  const address = values.address.trim();
  if (address !== showroom.address) payload.address = address;
  const city = values.city.trim();
  // Stored lowercase — a change of case alone is no change.
  if (city.toLowerCase() !== showroom.city) payload.city = city;
  const area = values.area.trim();
  if (area !== (showroom.area ?? '')) payload.area = area;
  const contactNumber = values.contactNumber.trim();
  if (contactNumber !== showroom.contactNumber) payload.contactNumber = contactNumber;
  const whatsappNumber = values.whatsappNumber.trim();
  if (whatsappNumber !== (showroom.whatsappNumber ?? '')) payload.whatsappNumber = whatsappNumber;
  if (values.country !== showroom.country) payload.country = values.country;
  if (
    values.mapLat !== undefined &&
    values.mapLng !== undefined &&
    (values.mapLat !== showroom.mapLat || values.mapLng !== showroom.mapLng)
  ) {
    payload.mapLat = values.mapLat;
    payload.mapLng = values.mapLng;
  }
  return payload;
}

/**
 * What changing the market does: every car listed through the showroom, and
 * its bookings, takes its currency from Showroom.country — prices are never
 * converted. null when the currency doesn't change.
 */
export function marketChangeWarning(saved: Market, chosen: Market): string | null {
  if (saved === chosen) return null;
  const from = currencyFor(saved);
  const to = currencyFor(chosen);
  if (from === to) return null;
  return `Cars listed through this showroom, and their bookings, will show prices in ${to} instead of ${from}. Prices aren't converted — check every car's price after saving.`;
}

/**
 * The confirmation before deleting. The backend never refuses it: cars listed
 * through the showroom are unlinked, so they drop out of city and nearby
 * searches and fall back to the default currency; and a business without a
 * showroom can't add cars or submit for review.
 */
export function deleteShowroomWarning(showroom: Showroom): string {
  const currency = currencyFor(showroom.country ?? DEFAULT_MARKET);
  const fallback = currencyFor(DEFAULT_MARKET);
  const currencyNote =
    currency !== fallback ? `, and their prices will show in ${fallback} instead of ${currency}` : '';
  return (
    `Cars listed through "${showroom.name}" will no longer be linked to a showroom: they stop appearing in city ` +
    `and nearby searches${currencyNote}. Without a showroom you can't add cars or submit your business for review.`
  );
}
