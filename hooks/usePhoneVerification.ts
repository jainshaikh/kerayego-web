'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '../lib/api/users.api';
import { useAuthStore } from '../store/auth.store';
import { PhoneErrorCode, type AuthUser, type User } from '../types/api.types';
import { getApiErrorCode, getApiErrorMessage } from './useAccountDeletion';

/** The shared GET /users/me query (also read by IdentityHoldBanner and the account pages). */
export const ME_QUERY_KEY = ['users', 'me'] as const;

export function fetchMe(): Promise<User> {
  return usersApi.getMe().then((r) => r.data);
}

export function useMe(enabled = true) {
  return useQuery({ queryKey: ME_QUERY_KEY, queryFn: fetchMe, enabled, staleTime: 60_000 });
}

/** The stored session user (auth.store) for a full user view. */
export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    identityHold: user.identityHold,
    phoneVerified: user.phoneVerified,
    mustVerifyPhone: user.mustVerifyPhone,
    whatsappUpdates: user.whatsappUpdates,
  };
}

/** Puts a fresh user view into both the ['users','me'] cache and the stored session user. */
export function useApplyUser() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useCallback(
    (user: User) => {
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setUser(toAuthUser(user));
    },
    [queryClient, setUser],
  );
}

/**
 * The /users/me data when it belongs to the signed-in account, else the stored
 * session user — a cached /users/me from an earlier account in this tab must
 * never decide anything for the current one.
 */
export function useCurrentAccount(enabled = true) {
  const storedUser = useAuthStore((s) => s.user);
  const query = useMe(enabled && !!storedUser);
  const me = query.data && storedUser && query.data.id === storedUser.id ? query.data : undefined;
  // isFetched: the /users/me request has settled (data or error) at least once.
  return { me, storedUser, account: me ?? storedUser, isFetched: query.isFetched };
}

/** POST /users/me/phone/send-code — errors are shown by the caller (phoneErrorInfo). */
export function useSendPhoneCode() {
  return useMutation({ mutationFn: (phone: string) => usersApi.sendPhoneCode(phone) });
}

/** POST /users/me/phone/verify — on success the returned user replaces the stored one. */
export function useVerifyPhoneCode() {
  const applyUser = useApplyUser();
  return useMutation({
    mutationFn: (code: string) => usersApi.verifyPhoneCode(code),
    onSuccess: applyUser,
  });
}

/** PATCH /users/me { whatsappUpdates } — optimistic, rolled back (with a toast) on error. */
export function useUpdateWhatsAppUpdates() {
  const queryClient = useQueryClient();
  const applyUser = useApplyUser();
  return useMutation({
    mutationFn: (whatsappUpdates: boolean) =>
      usersApi.updateMe({ whatsappUpdates }).then((r) => r.data),
    onMutate: async (whatsappUpdates) => {
      await queryClient.cancelQueries({ queryKey: ME_QUERY_KEY });
      const previous = queryClient.getQueryData<User>(ME_QUERY_KEY);
      if (previous) queryClient.setQueryData<User>(ME_QUERY_KEY, { ...previous, whatsappUpdates });
      return { previous };
    },
    onError: (error, _value, context) => {
      if (context?.previous) queryClient.setQueryData(ME_QUERY_KEY, context.previous);
      toast.error(getApiErrorMessage(error, 'Could not update your WhatsApp setting. Try again.'));
    },
    onSuccess: applyUser,
  });
}

export interface PhoneErrorInfo {
  message: string;
  code?: string;
  /** Set for CODE_RESEND_TOO_SOON: seconds until another code can be asked for. */
  retryAfterSeconds?: number;
}

const DEFAULT_RESEND_SECONDS = 60;

/** The contract's wording for each send-code / verify error. */
export function phoneErrorInfo(error: unknown, fallback: string): PhoneErrorInfo {
  const { code, status } = getApiErrorCode(error);
  const body = (
    error as {
      response?: {
        data?: {
          retryAfterSeconds?: unknown;
          error?: { retryAfterSeconds?: unknown; details?: unknown };
        };
      };
    }
  )?.response?.data;

  switch (code) {
    case PhoneErrorCode.PHONE_TAKEN:
      return {
        code,
        message: 'This number is on another KerayeGo account. Contact KerayeGo support.',
      };
    case PhoneErrorCode.CODE_RESEND_TOO_SOON: {
      // The contract puts retryAfterSeconds on the error; accept it in either
      // place the backend's envelope may carry it, else assume the 60 s window.
      const raw =
        body?.error?.retryAfterSeconds ??
        (body?.error?.details as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds ??
        body?.retryAfterSeconds;
      const seconds = typeof raw === 'number' && raw > 0 ? Math.ceil(raw) : DEFAULT_RESEND_SECONDS;
      return { code, message: 'A code was sent a moment ago.', retryAfterSeconds: seconds };
    }
    case PhoneErrorCode.CODE_LIMIT_REACHED:
      return { code, message: 'Too many codes today. Try again tomorrow.' };
    case PhoneErrorCode.WHATSAPP_SEND_FAILED:
      return {
        code,
        message: getApiErrorMessage(
          error,
          "We couldn't send a WhatsApp message to this number. Check that it uses WhatsApp and try again.",
        ),
      };
    case PhoneErrorCode.WHATSAPP_UNAVAILABLE:
      return {
        code,
        message: 'WhatsApp codes are not available right now. Please try again later.',
      };
    case PhoneErrorCode.CODE_INVALID:
      return {
        code,
        message: getApiErrorMessage(error, 'That code is wrong or has expired. Ask for a new one.'),
      };
  }

  if (status === 400) {
    // Invalid number (the backend's readable message), or a DTO validation
    // error whose details carry the field messages.
    const details = body?.error?.details;
    const first = Array.isArray(details) ? details[0] : undefined;
    const detailMessage =
      typeof first === 'string' ? first : (first as { message?: string } | undefined)?.message;
    return { code, message: detailMessage ?? getApiErrorMessage(error, fallback) };
  }
  if (status === 429) return { code, message: 'Too many tries. Wait a minute and try again.' };
  return { code, message: getApiErrorMessage(error, fallback) };
}
