import { z } from 'zod';

// Shared pieces of the driver setup steps' forms (Zod + React Hook Form) and
// their PATCH /driver/profile payloads — a port of kerayego-partner's
// features/driver/setup/fields.ts. Limits follow the backend's
// UpdateDriverProfileDto. Form values hold text as typed; the payload builders
// trim it and send null for an emptied field (null clears it — "not answered").
// Unlike the app (native date pickers handing back Date objects), dates here
// are the strings the browser's date inputs use: 'YYYY-MM-DD', and 'YYYY-MM'
// for months (typed by hand where a browser has no month picker).

export const DRIVER_LIMITS = {
  fullName: 150,
  contactPhone: 25,
  city: 100,
  area: 100,
  residentialAddress: 500,
  contactEmail: 254,
  listItem: 50,
  listItems: 20,
  licenseNumber: 50,
  licenseCategory: 50,
  licenseIssuingAuthority: 100,
  emergencyContactName: 150,
  emergencyContactPhone: 25,
  emergencyContactRelation: 50,
  employer: 150,
  role: 100,
  employmentHistory: 10,
  referenceName: 150,
  referencePhone: 25,
  referenceRelation: 50,
  references: 5,
  certifications: 500,
  payoutAccountTitle: 150,
  payoutAccountNumber: 34,
} as const;

/** The youngest a driver may be (contract: dateOfBirth = 18+). */
export const MINIMUM_DRIVER_AGE = 18;

export function tooLong(max: number): string {
  return `Use ${max} characters or fewer`;
}

/** Optional text up to `max` characters. */
export function optionalText(max: number) {
  return z.string().trim().max(max, tooLong(max));
}

/** Optional phone number: digits, spaces, +, -, ( ) — at least 7 digits. */
export function optionalPhone(max: number) {
  return z
    .string()
    .trim()
    .max(max, tooLong(max))
    .refine(
      (value) => value === '' || (/^[+\d\s()-]+$/.test(value) && value.replace(/\D/g, '').length >= 7),
      'Enter a phone number, e.g. +92 300 1234567',
    );
}

/** Optional whole number ≥ 0 typed as text. */
export function optionalWholeNumber(example: string) {
  return z.string().trim().regex(/^\d*$/, `Enter a whole number, e.g. ${example}`);
}

/** Optional amount ≥ 0 typed as text: up to 8 digits and 2 decimals (backend MONEY rule). */
export function optionalAmount() {
  return z
    .string()
    .trim()
    .regex(/^(\d{1,8}(\.\d{1,2})?)?$/, 'Enter an amount, e.g. 1500');
}

/** Trimmed text, or null when empty. */
export function textOrNull(value: string | undefined): string | null {
  const text = value?.trim() ?? '';
  return text === '' ? null : text;
}

/** A whole number typed as text, or null when empty. */
export function intOrNull(value: string | undefined): number | null {
  const text = value?.trim() ?? '';
  return text === '' ? null : Number(text);
}

/** An amount typed as text, as the 2-decimal string the backend stores ("1500.5" → "1500.50"), or null. */
export function amountOrNull(value: string | undefined): string | null {
  const text = value?.trim() ?? '';
  if (text === '') return null;
  const [whole, fraction = ''] = text.split('.');
  return `${String(Number(whole))}.${fraction.padEnd(2, '0')}`;
}

/** A number or decimal string from GET as form text ('' when null). "1500.00" reads as "1500". */
export function numberText(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /^\d+\.0+$/.test(text) ? text.replace(/\.0+$/, '') : text;
}

/** A Pakistani CNIC in its written form 12345-1234567-1, or null when it isn't 13 digits. */
export function formatCnic(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '');
  if (!/^\d{13}$/.test(digits)) return null;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

// ─── Dates as 'YYYY-MM-DD' / months as 'YYYY-MM' ───────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** A calendar date as YYYY-MM-DD by the computer's own calendar (no shift to UTC). */
export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The day part of a stored date ('' when none) — what a date input holds. */
export function dateOnlyText(value: string | null | undefined): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '');
  return match ? match[1] : '';
}

/** The month part of a stored 'YYYY-MM…' value ('' when none). */
export function monthText(value: string | null | undefined): string {
  const match = /^(\d{4}-\d{2})/.exec(value ?? '');
  return match ? match[1] : '';
}

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function todayDateOnly(now: Date = new Date()): string {
  return toDateOnly(now);
}

export function tomorrowDateOnly(now: Date = new Date()): string {
  return toDateOnly(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

/** The latest birth date that makes someone 18 today, as YYYY-MM-DD. */
export function latestAdultBirthDate(now: Date = new Date()): string {
  return toDateOnly(new Date(now.getFullYear() - MINIMUM_DRIVER_AGE, now.getMonth(), now.getDate()));
}

/** Whether someone born on `birthDate` (YYYY-MM-DD) is at least 18 on `now`'s day. */
export function isAdult(birthDate: string, now: Date = new Date()): boolean {
  return birthDate <= latestAdultBirthDate(now);
}

/** "Mar 2021" from 'YYYY-MM'. */
export function formatMonth(month: string): string {
  const match = MONTH_PATTERN.exec(month);
  if (!match) return month;
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/** "12 Mar 2026" — the Partner app's formatDate. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "12 Mar 2026, 4:30 PM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** An optional YYYY-MM-DD field (a date input holds '' when empty). */
export function optionalDate() {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || DATE_ONLY_PATTERN.test(value), 'Enter a date, e.g. 2030-12-31');
}

// ─── Lists ──────────────────────────────────────────────────────────────────

/** A free-text list item (language, coverage area): trimmed, without duplicates (ignoring case). */
export function addListItem(list: readonly string[], item: string): string[] {
  const text = item.trim();
  if (text === '' || list.some((existing) => existing.toLowerCase() === text.toLowerCase())) return [...list];
  return [...list, text];
}

/** Adds the value when absent, removes it when present. */
export function toggleValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** A list of short free-text items (contract: ≤ 20 items, each ≤ 50 characters). */
export function textList(what: string) {
  return z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(DRIVER_LIMITS.listItem, `Each ${what} must be ${DRIVER_LIMITS.listItem} characters or fewer`),
    )
    .max(DRIVER_LIMITS.listItems, `Choose up to ${DRIVER_LIMITS.listItems}`);
}

/** Yes / no / not answered (contract booleans: null = not answered). */
export const yesNo = z.boolean().nullable();
