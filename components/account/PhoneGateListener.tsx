'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePhoneGateStore } from '../../store/phone-gate.store';
import { useAuthStore } from '../../store/auth.store';
import { ME_QUERY_KEY, fetchMe, toAuthUser } from '../../hooks/usePhoneVerification';

// Paths whose layout renders PhoneVerificationGate itself (or that are the
// verify page / the admin console, which is never gated).
const SELF_GATED_PREFIXES = ['/dashboard', '/provider', '/driver', '/admin', '/verify-phone'];

function isSelfGated(pathname: string): boolean {
  return SELF_GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Mounted once in the root layout. When a request answers 403
 * PHONE_NOT_VERIFIED (lib/api/client.ts raises the flag), refetches GET
 * /users/me so every reader — PhoneVerificationGate first — sees
 * mustVerifyPhone. On a page without the gate (public pages), it sends the
 * person to /verify-phone and back here afterwards.
 */
export function PhoneGateListener() {
  const flagged = usePhoneGateStore((s) => s.phoneNotVerified);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!flagged) return;
    // Runs to the end even if the effect re-runs: fetchQuery dedupes, and the
    // flag is lowered only once the refetch is done.
    void (async () => {
      try {
        const me = await queryClient.fetchQuery({
          queryKey: ME_QUERY_KEY,
          queryFn: fetchMe,
          staleTime: 0,
        });
        const { user, setUser } = useAuthStore.getState();
        if (user && user.id === me.id) setUser(toAuthUser(me));
        const { pathname, search } = window.location;
        if (me.mustVerifyPhone && !isSelfGated(pathname)) {
          router.push(`/verify-phone?redirect=${encodeURIComponent(pathname + search)}`);
        }
      } catch {
        // /users/me itself failed (signed out, offline): nothing to show.
      } finally {
        usePhoneGateStore.getState().lower();
      }
    })();
  }, [flagged, queryClient, router]);

  return null;
}
