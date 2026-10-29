'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { buttonVariants } from '../ui';
import { getApiErrorMessage, useCancelAccountDeletionByToken } from '../../hooks/useAccountDeletion';

const INVALID_LINK = 'This link is invalid or has expired.';

/**
 * Runs POST /users/cancel-delete-by-token exactly once. The token is single-use, so the
 * ref guard matters: React StrictMode re-runs effects in dev, and a second call would
 * turn a success into "invalid or expired". The outcome is kept in local state from
 * mutateAsync rather than read off the mutation, because StrictMode's remount detaches
 * the mutation observer and the result would never reach this component.
 */
export function CancelDeletionByToken({ token }: { token: string | null }) {
  const cancel = useCancelAccountDeletionByToken();
  const { mutateAsync } = cancel;
  const started = useRef(false);
  const [outcome, setOutcome] = useState<{ ok: true } | { ok: false; message: string } | null>(null);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    mutateAsync(token)
      .then(() => setOutcome({ ok: true }))
      .catch((err: unknown) => {
        // No response at all = network/server unreachable, not a bad link.
        const reachedServer = !!(err as { response?: unknown })?.response;
        setOutcome({
          ok: false,
          message: reachedServer
            ? getApiErrorMessage(err, INVALID_LINK)
            : 'We couldn’t reach KerayeGo. Check your connection and open the link again.',
        });
      });
  }, [token, mutateAsync]);

  const signInLink = (
    <Link href="/login" className={buttonVariants({ className: 'mt-5' })}>
      Sign in
    </Link>
  );

  if (!token) {
    return <ErrorBox message={INVALID_LINK}>{signInLink}</ErrorBox>;
  }

  if (outcome?.ok) {
    return (
      <div className="rounded-xl border border-status-emerald-border bg-status-emerald-bg p-5 text-sm text-status-emerald-fg">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="font-semibold leading-relaxed">
            Your account deletion has been cancelled. You can sign in again.
          </p>
        </div>
        {signInLink}
      </div>
    );
  }

  if (outcome && !outcome.ok) {
    return <ErrorBox message={outcome.message}>{signInLink}</ErrorBox>;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface p-5 text-sm text-text-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
      Cancelling your account deletion…
    </div>
  );
}

function ErrorBox({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-status-red-border bg-status-red-bg p-5 text-sm text-status-red-fg">
      <div role="alert" className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <p className="leading-relaxed">{message}</p>
      </div>
      {children}
    </div>
  );
}
