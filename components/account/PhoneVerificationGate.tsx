'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCurrentAccount } from '../../hooks/usePhoneVerification';
import { useAuthStore } from '../../store/auth.store';
import { Role } from '../../types/enums';
import { Logo } from '../common/Logo';
import { PhoneVerificationCard } from './PhoneVerificationCard';

/**
 * Wraps the signed-in, non-admin layouts — (dashboard), (provider), (driver).
 * While the account's `mustVerifyPhone` is true (from GET /users/me, falling
 * back to the stored sign-in user) it shows the blocking verify screen instead
 * of the whole portal; verifying reveals the page the person was on. Signing
 * in, a session restore (AuthBootstrap) and any 403 PHONE_NOT_VERIFIED (which
 * PhoneGateListener turns into a /users/me refetch) all land here. The admin
 * console never mounts this. UX only — the backend's PhoneVerifiedGuard is
 * the real gate.
 */
export function PhoneVerificationGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  const { account, me, isFetched } = useCurrentAccount(isAuthenticated && !isAdmin);

  // The server render has no stored user; match it on the first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mustVerify = mounted && isAuthenticated && !isAdmin && account?.mustVerifyPhone === true;
  if (!mustVerify) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="px-6 py-6">
        <Link href="/" className="flex w-fit items-center">
          <Logo className="h-7" />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 md:items-center">
        {isFetched ? (
          <PhoneVerificationCard
            phone={me?.phone ?? null}
            onVerified={() => toast.success('Your mobile number is verified.')}
          />
        ) : (
          // Wait for /users/me so step 1 can prefill the account's number.
          <div className="mt-24 h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        )}
      </main>
    </div>
  );
}
