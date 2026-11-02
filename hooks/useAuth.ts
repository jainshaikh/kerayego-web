'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../lib/api/auth.api';
import { setAuthCookies, clearAuthCookies } from '../lib/utils/auth-cookies';
import type { AuthUser } from '../types/api.types';
import type { RegisterFormValues } from '../lib/validations/auth.schema';
import { Role } from '../types/enums';

function roleToRoute(role: string): string {
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
      // used for RBAC redirects and gating unverified users out of the dashboard.
      setAuthCookies(authUser.role, authUser.emailVerified);
      return { user: authUser, deletionCancelled: deletionCancelled === true };
    },
    [setAuth],
  );

  const register = useCallback(async (data: RegisterFormValues) => {
    const response = await authApi.register(data);
    return response.data;
  }, []);

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
    register,
    logout,
    getDashboardRoute,
  };
}
