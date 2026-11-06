'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrentAccount } from '../../../hooks/usePhoneVerification';
import { PhoneVerificationCard } from '../../../components/account/PhoneVerificationCard';

/** Only same-site paths — never an absolute or protocol-relative URL. */
function safeRedirect(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

const Spinner = () => (
  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
);

/**
 * The verify screen as its own page, for when the person isn't headed to a
 * gated layout: right after sign-in / sign-up (useAuth().routeAfterSignIn sends
 * everyone with mustVerifyPhone here, with the destination in `redirect`), or after a
 * 403 PHONE_NOT_VERIFIED on a public page (PhoneGateListener). The signed-in
 * layouts show the same card inline via PhoneVerificationGate.
 */
function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, getDashboardRoute } = useAuth();
  const { account, me, isFetched } = useCurrentAccount(isAuthenticated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const target =
    safeRedirect(searchParams.get('redirect')) ?? getDashboardRoute(account ?? undefined);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    // Nothing to verify (already verified, the gate is off, or an admin).
    if (me && !me.mustVerifyPhone) router.replace(target);
  }, [mounted, isAuthenticated, me, target, router]);

  if (!mounted || !isAuthenticated || !isFetched || (me && !me.mustVerifyPhone)) return <Spinner />;

  return (
    <PhoneVerificationCard
      phone={me?.phone ?? null}
      onVerified={(user) => {
        toast.success('Your mobile number is verified.');
        router.replace(safeRedirect(searchParams.get('redirect')) ?? getDashboardRoute(user));
      }}
    />
  );
}

export default function VerifyPhonePage() {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <Suspense fallback={<Spinner />}>
        <VerifyPhoneContent />
      </Suspense>
    </div>
  );
}
