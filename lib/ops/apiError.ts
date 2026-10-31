import { isAxiosError } from 'axios';

// A small twin of the KerayeGo Partner app's normalizeApiError (api/errors.ts)
// for the business operations pages (bookings, fleet, live map, ratings),
// whose error wording depends on the HTTP status: 400 "this changed since
// you opened it", 409 "busy at that time", 403 "no business yet". The
// backend's error body is { success: false, statusCode, error: { code,
// message, details? } } (http-exception.filter.ts).

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'network'
  | 'server'
  | 'unknown';

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  status?: number;
  /** The backend's error.code, e.g. 'PLATE_LOCKED'. */
  code?: string;
  /** Readable text: the backend's message, or its field messages one per line. */
  message: string;
  /** The 400 came with field-level details (a DTO validation error). */
  hasFieldErrors: boolean;
}

const FRIENDLY: Record<ApiErrorKind, string> = {
  validation: 'Please check what you entered and try again.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: "You don't have permission to do that.",
  not_found: 'We could not find what you were looking for.',
  conflict: 'This changed meanwhile. Please reload and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
  network: 'No connection. Check your internet and try again.',
  server: 'Something went wrong on our end. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

interface ErrorBody {
  error?: { code?: unknown; message?: unknown; details?: unknown };
}

export function apiErrorInfo(error: unknown): ApiErrorInfo {
  if (!isAxiosError(error)) return { kind: 'unknown', message: FRIENDLY.unknown, hasFieldErrors: false };
  if (!error.response) return { kind: 'network', message: FRIENDLY.network, hasFieldErrors: false };

  const status = error.response.status;
  const kind = kindFromStatus(status);
  const body = error.response.data as ErrorBody | undefined;
  let message = typeof body?.error?.message === 'string' && body.error.message ? body.error.message : FRIENDLY[kind];

  const details = Array.isArray(body?.error?.details) ? (body.error.details as unknown[]) : [];
  const detailMessages = details
    .map((d) => (typeof d === 'string' ? d : ((d as { message?: string })?.message ?? '')))
    .filter(Boolean);
  if (detailMessages.length > 0) message = detailMessages.join('\n');

  return {
    kind,
    status,
    ...(typeof body?.error?.code === 'string' ? { code: body.error.code } : {}),
    message,
    hasFieldErrors: details.length > 0,
  };
}

/** Just the readable message. */
export function apiErrorMessage(error: unknown): string {
  return apiErrorInfo(error).message;
}
