'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../lib/api/auth.api';
import { setAuthCookies, clearAuthCookies } from '../lib/utils/auth-cookies';
import type {
  AuthUser,
  PhoneRegisterRequest,
  PhoneSignInSession,
  PhoneSignupNeeded,
} from '../types/api.types';
import { Role } from '../types/enums';
import { safeRedirect } from '../lib/utils/safeRedirect';

/**
 * Whether the account may enter the portals: a verified email, or a verified phone (phone
 * sign-ups start with emailVerified false — the WhatsApp code is the proof of identity).
 * Drives the middleware's `emailVerified` cookie and the /verify-email redirects.
 */
export function isIdentityVerified(u: Pick<AuthUser, 'emailVerified' | 'phoneVerified'>): boolean {
  return u.emailVerified || u.phoneVerified === true;
}

/** The dashboard a role lands on after sign-in (and when no safe redirect is given). */
export function roleToRoute(role: string): string {
  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) return '/admin/dashboard';
  if (role === Role.PROVIDER) return '/provider/dashboard';
  return '/dashboard';
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  /** POST /auth/code/request — the backend emails a 6-digit code. */
  const requestCode = useCallback(async (email: string) => {
    const response = await authApi.requestLoginCode(email);
    return response.data;
  }, []);

  /** POST /auth/code/verify — signs in; the refresh token arrives as an httpOnly cookie. */
  const verifyCode = useCallback(
    async (email: string, code: string) => {
      const response = await authApi.verifyLoginCode(email, code);
      const { accessToken, user: authUser, deletionCancelled } = response.data;
      setAuth(authUser, accessToken);
      // userRole/emailVerified cookies are readable by Next.js middleware (same origin) —
      // used for RBAC redirects and gating unverified users out of the dashboard. A verified
      // phone is enough (isIdentityVerified).
      setAuthCookies(authUser.role, isIdentityVerified(authUser));
      return { user: authUser, deletionCancelled: deletionCancelled === true };
    },
    [setAuth],
  );

  /** POST /auth/phone/request — the backend sends a 6-digit code on WhatsApp. */
  const requestPhoneCode = useCallback(async (phone: string) => {
    const response = await authApi.requestPhoneCode(phone);
    return response.data;
  }, []);

  // A phone session: stored exactly like the email-code sign-in (token in memory, user in
  // the store, refresh token as the backend's httpOnly cookie). The middleware's
  // `emailVerified` cookie is its "may enter the portals" signal; a correct WhatsApp code
  // proves the person (the backend makes the account ACTIVE and leaves emailVerified alone),
  // so it is set to true here — the email is confirmed later by the link the backend emails.
  const startPhoneSession = useCallback(
    (session: PhoneSignInSession) => {
      setAuth(session.user, session.accessToken);
      setAuthCookies(session.user.role, true);
      return { user: session.user, deletionCancelled: session.deletionCancelled === true };
    },
    [setAuth],
  );

  /**
   * POST /auth/phone/verify — signs in when the number has an account, else hands back
   * the signupToken for the profile step (no session yet).
   */
  const verifyPhoneCode = useCallback(
    async (
      phone: string,
      code: string,
    ): Promise<
      | { needsSignup: false; user: AuthUser; deletionCancelled: boolean }
      | PhoneSignupNeeded
    > => {
      const response = await authApi.verifyPhoneCode(phone, code);
      const result = response.data;
      if (result.needsSignup) return result;
      return { needsSignup: false, ...startPhoneSession(result) };
    },
    [startPhoneSession],
  );

  /** POST /auth/phone/register — creates the account for the verified number and signs in. */
  const registerWithPhone = useCallback(
    async (data: PhoneRegisterRequest) => {
      const response = await authApi.registerWithPhone(data);
      return startPhoneSession(response.data);
    },
    [startPhoneSession],
  );

  /**
   * Where to go once signed in: an explicit callbackUrl wins over the role's dashboard; an
   * account that must still verify its phone goes through /verify-phone first (contract §7.1).
   */
  const routeAfterSignIn = useCallback(
    (signedIn: AuthUser, callbackUrl: string | null) => {
      // Only a same-site path is followed — never an absolute URL (open redirect).
      const destination = safeRedirect(callbackUrl) ?? roleToRoute(signedIn.role);
      if (signedIn.mustVerifyPhone) {
        router.push(`/verify-phone?redirect=${encodeURIComponent(destination)}`);
      } else {
        router.push(destination);
      }
      router.refresh();
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      clearAuthCookies();
      router.push('/');
    }
  }, [clearAuth, router]);

  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const isProvider = user?.role === Role.PROVIDER;
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  // Accepts an explicit user so callers can pass the freshly-returned value from verifyCode()
  // rather than relying on the stale render-time store snapshot.
  const getDashboardRoute = (forUser?: AuthUser) => {
    const u = forUser ?? user;
    if (!u) return '/login';
    return roleToRoute(u.role);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isProvider,
    isSuperAdmin,
    requestCode,
    verifyCode,
    requestPhoneCode,
    verifyPhoneCode,
    registerWithPhone,
    routeAfterSignIn,
    logout,
    getDashboardRoute,
  };
}
