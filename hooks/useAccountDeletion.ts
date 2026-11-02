import { useMutation } from '@tanstack/react-query';
import { usersApi } from '../lib/api/users.api';

// The backend's error envelope is { success: false, error: { message } }.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? fallback
  );
}

/**
 * The error envelope's machine-readable code (e.g. PHONE_TAKEN, CODE_INVALID),
 * the HTTP status, and whether it is a field-validation error (details list).
 */
export function getApiErrorCode(error: unknown): {
  code?: string;
  status?: number;
  isValidation: boolean;
} {
  const response = (
    error as {
      response?: { status?: number; data?: { error?: { code?: string; details?: unknown } } };
    }
  )?.response;
  return {
    code: response?.data?.error?.code,
    status: response?.status,
    isValidation: Array.isArray(response?.data?.error?.details),
  };
}

/** POST /users/me/delete-request — errors are shown inline by the caller, not toasted. */
export function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: (reason?: string) => usersApi.requestAccountDeletion(reason),
  });
}

/** POST /users/cancel-delete-by-token — public, used by the email's "Cancel deletion" link. */
export function useCancelAccountDeletionByToken() {
  return useMutation({
    mutationFn: (token: string) => usersApi.cancelAccountDeletionByToken(token),
  });
}
