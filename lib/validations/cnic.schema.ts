import { z } from 'zod';

/** Same pattern as the backend's CNIC_PATTERN: 13 digits, dashes optional. */
export const CNIC_PATTERN = /^\d{5}-?\d{7}-?\d$/;

/** A required CNIC number field, e.g. `12345-1234567-1`. */
export const cnicNumberSchema = z
  .string({ required_error: 'CNIC number is required' })
  .trim()
  .min(1, 'CNIC number is required')
  .regex(CNIC_PATTERN, 'Enter the 13-digit CNIC number, e.g. 12345-1234567-1');

/** Formats typed digits as `12345-1234567-1` while the user types (drops anything else). */
export function formatCnicInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}
