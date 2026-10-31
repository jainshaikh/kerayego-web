import { getApiErrorMessage } from '../../hooks/useAccountDeletion';

// Person blocks (plan A22, D18; contract 2026-10-30) — a port of
// kerayego-partner's features/account/identityHold.ts. While an account is on
// hold the backend refuses booking, posting trips and driving (accepting a
// job, starting one) with 403 IDENTITY_ON_HOLD; a CNIC or email matching a
// block is refused with 403 IDENTITY_BLOCKED. The web only explains — the
// backend enforces both. The hold banner itself is the shared
// components/layout/IdentityHoldBanner.tsx (in PortalFrame), which reads
// ['users', 'me'] — refetch that after a hold refusal so it appears.

export const IDENTITY_ON_HOLD = 'IDENTITY_ON_HOLD';
export const IDENTITY_BLOCKED = 'IDENTITY_BLOCKED';
export const IDENTITY_HOLD_TITLE = 'Your account is being checked';
export const IDENTITY_HOLD_MESSAGE =
  'Your account is being checked by KerayeGo. You can browse, but booking, posting trips and driving are paused until the check is done — usually within a day.';

/** The query the hold banner reads. */
export const ME_QUERY_KEY = ['users', 'me'] as const;

/** The backend's error code ({ success: false, error: { code, message } }), if any. */
export function getApiErrorCode(error: unknown): string | undefined {
  return (error as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
}

/**
 * The title and text to show for a failed action: for a hold, the hold title
 * and the server's message (the contract's text when it sent none);
 * otherwise `fallbackTitle` and the server's message — which for
 * IDENTITY_BLOCKED is already the refusal text.
 */
export function actionError(
  error: unknown,
  fallbackTitle: string,
  fallbackMessage = 'Something went wrong. Please try again.',
): { title: string; message: string; onHold: boolean } {
  if (getApiErrorCode(error) === IDENTITY_ON_HOLD) {
    return { title: IDENTITY_HOLD_TITLE, message: getApiErrorMessage(error, IDENTITY_HOLD_MESSAGE), onHold: true };
  }
  return { title: fallbackTitle, message: getApiErrorMessage(error, fallbackMessage), onHold: false };
}
