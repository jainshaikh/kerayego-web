'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/api.types';
import { Card } from '../ui';
import { PhoneVerificationFlow } from './PhoneVerificationFlow';

/**
 * The blocking "Verify your mobile number" card (contract §7.1). Its only ways
 * out are verifying (onVerified) or Sign out — no close button by design.
 * Rendered by PhoneVerificationGate in the signed-in layouts and by the
 * /verify-phone page (sign-in with a public destination, or a 403 there).
 */
export function PhoneVerificationCard({
  phone,
  onVerified,
}: {
  phone: string | null;
  onVerified: (user: User) => void;
}) {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Card padding="lg" className="w-full max-w-md rounded-sheet shadow-sm">
      <div className="mb-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-status-emerald-bg">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Verify your mobile number</h1>
        <p className="mt-1 text-sm text-text-muted">
          We&apos;ll send a 6-digit code to your number on WhatsApp. You need a verified number to
          use KerayeGo.
        </p>
      </div>

      <PhoneVerificationFlow initialPhone={phone} onVerified={onVerified} showUpdatesNote />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4 text-sm">
        <span className="min-w-0 truncate text-text-muted">{user?.email}</span>
        <button
          type="button"
          onClick={async () => {
            setSigningOut(true);
            try {
              await logout();
            } finally {
              setSigningOut(false);
            }
          }}
          disabled={signingOut}
          className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </Card>
  );
}
