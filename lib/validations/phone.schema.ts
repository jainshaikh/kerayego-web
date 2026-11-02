import { z } from 'zod';

// Step 1 of the WhatsApp phone verification. The backend normalises and
// validates the number (0300…, 300…, 92…, +92…, 0092… → E.164) and answers
// 400 with a readable message for an invalid one — this only catches empties.
export const sendPhoneCodeSchema = z.object({
  phone: z.string().trim().min(1, 'Enter your mobile number').max(20, 'That number is too long'),
});

export type SendPhoneCodeFormValues = z.infer<typeof sendPhoneCodeSchema>;

// Step 2 reuses verifyCodeSchema (6 digits, spaces ignored) from auth.schema.ts.
