/**
 * Spaces an E.164 number for display: "+923001234567" → "+92 300 1234567",
 * "+971501234567" → "+971 50 123 4567", "+966501234567" → "+966 50 123 4567".
 * Anything else is returned unchanged.
 */
export function formatPhoneForDisplay(phone: string): string {
  const pk = /^\+92(\d{3})(\d{7})$/.exec(phone);
  if (pk) return `+92 ${pk[1]} ${pk[2]}`;
  const gulf = /^\+(971|966)(\d{2})(\d{3})(\d{4})$/.exec(phone);
  if (gulf) return `+${gulf[1]} ${gulf[2]} ${gulf[3]} ${gulf[4]}`;
  return phone;
}
