'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, buttonVariants, ConfirmDialog, Textarea } from '../ui';
import { useAuthStore } from '../../store/auth.store';
import { clearAuthCookies } from '../../lib/utils/auth-cookies';
import { getApiErrorMessage, useRequestAccountDeletion } from '../../hooks/useAccountDeletion';

const REASON_MAX = 500;

function formatDeletionDate(iso: string): string {
  // Rendered client-side only, so the viewer's own timezone is the right one.
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
}

/**
 * The signed-in half of /delete-account. Signed-out visitors get a sign-in link instead.
 * On success the backend has already revoked every refresh token, so this clears the
 * local session the same way logout does (store + middleware cookies) — no logout call.
 */
export function DeleteAccountForm() {
  const user = useAuthStore((s) => s.user);
  const storeAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const requestDeletion = useRequestAccountDeletion();

  // The auth store rehydrates from sessionStorage and the role cookie is browser-only,
  // so decide signed-in state after mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [hasRoleCookie, setHasRoleCookie] = useState(false);
  useEffect(() => {
    setHasRoleCookie(!!Cookies.get('userRole'));
    setMounted(true);
  }, []);

  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);

  const reasonTooLong = reason.trim().length > REASON_MAX;

  const handleConfirm = () => {
    setError(null);
    requestDeletion.mutate(reason.trim() || undefined, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        clearAuth();
        clearAuthCookies();
        setScheduledFor(result.scheduledFor);
      },
      onError: (err) => {
        setConfirmOpen(false);
        setError(getApiErrorMessage(err, 'We couldn’t request deletion. Please try again.'));
      },
    });
  };

  if (scheduledFor) {
    return (
      <div className="flex gap-3 rounded-xl border border-status-emerald-border bg-status-emerald-bg p-5 text-sm text-status-emerald-fg">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Deletion requested. You have been signed out.</p>
          <p className="mt-1 leading-relaxed">
            Your account will be deleted on {formatDeletionDate(scheduledFor)}. To cancel, sign in
            again before then, or use the link in the email we sent you.
          </p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface" />;
  }

  if (!storeAuthenticated && !hasRoleCookie) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-5">
        <p className="text-sm leading-relaxed text-text-muted">
          Sign in to the account you want to delete, then come back to this page.
        </p>
        <Link
          href="/login?callbackUrl=/delete-account"
          className={buttonVariants({ className: 'mt-4' })}
        >
          Sign in to delete your account
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      {user?.email ? (
        <p className="mb-4 text-sm text-text-muted">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>
        </p>
      ) : null}

      <Textarea
        label="Why are you leaving? (optional)"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={REASON_MAX}
        error={reasonTooLong ? `At most ${REASON_MAX} characters` : undefined}
        helper={`${reason.trim().length} / ${REASON_MAX} characters`}
        placeholder="Your answer helps us improve KerayeGo."
      />

      {error ? (
        <div
          role="alert"
          className="mt-4 flex gap-2.5 rounded-control border border-status-red-border bg-status-red-bg px-3.5 py-3 text-sm text-status-red-fg"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      ) : null}

      <Button
        variant="danger"
        className="mt-4"
        disabled={reasonTooLong}
        onClick={() => setConfirmOpen(true)}
      >
        Delete my account
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!requestDeletion.isPending) setConfirmOpen(open);
        }}
        title="Delete your KerayeGo account?"
        description="You will be signed out everywhere, and your account will be deleted after 72 hours. You can cancel by signing in again before then, or with the link in the email we send you."
        confirmLabel="Delete my account"
        cancelLabel="Keep my account"
        loading={requestDeletion.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
