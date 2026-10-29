import { useMutation } from '@tanstack/react-query';
import { usersApi } from '../lib/api/users.api';

// The backend's error envelope is { success: false, error: { message } }.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? fallback
  );
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
