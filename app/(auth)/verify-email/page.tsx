'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../../../lib/api/auth.api';
import { useAuthStore } from '../../../store/auth.store';
import { isIdentityVerified, roleToRoute } from '../../../hooks/useAuth';
import { safeRedirect } from '../../../lib/utils/safeRedirect';
import { setEmailVerifiedCookie } from '../../../lib/utils/auth-cookies';
import { Button, Card } from '../../../components/ui';

const RESEND_COOLDOWN_SECONDS = 60;

type VerifyState = 'loading' | 'success' | 'error' | 'pending';

function extractMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? fallback
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  // Same-site paths only (lib/utils/safeRedirect.ts) — anything else is dropped.
  const redirect = safeRedirect(searchParams.get('redirect'));
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

  const { user, isAuthenticated, setUser } = useAuthStore();
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Covers sessions from before this cookie existed (or any other drift between
    // the client-known verification state and the edge cookie middleware.ts reads):
    // if the store already says verified, resync the cookie and send them straight
    // back to where they were headed instead of stranding them on this page.
    // A verified phone counts too (phone sign-ups start with emailVerified false).
    if (isAuthenticated && user && isIdentityVerified(user)) {
      setEmailVerifiedCookie(true);
      // Back where they were headed, else their own role's dashboard.
      router.replace(redirect ?? roleToRoute(user.role));
    }
  }, [isAuthenticated, user, redirect, router]);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        // In case this tab already holds an authenticated (unverified) session for
        // the account being verified — keeps the client and middleware cookie in
        // sync so the dashboard unlocks without forcing a fresh login.
        setEmailVerifiedCookie(true);
        if (user) setUser({ ...user, emailVerified: true });
        setState('success');
      } catch (error: unknown) {
        setErrorMessage(extractMessage(error, 'Verification failed. The link may have expired.'));
        setState('error');
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await authApi.resendVerification();
      toast.success(res.data.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: unknown) {
      toast.error(extractMessage(error, 'Failed to resend verification email'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card padding="lg" className="rounded-sheet text-center shadow-sm">
        {state === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            <h1 className="mb-2 text-xl font-bold text-ink">Verifying your email...</h1>
            <p className="text-sm text-text-muted">Please wait a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-emerald-bg">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-ink">Email verified!</h1>
            <p className="mb-6 text-sm text-text-muted">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
            <Link href="/login">
              <Button>Sign in to your account</Button>
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-red-bg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-ink">Verification failed</h1>
            <p className="mb-6 text-sm text-text-muted">{errorMessage}</p>
            <Link href="/login" className="text-sm font-semibold text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-amber-bg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-ink">Verify your email</h1>
            <p className="mb-6 text-sm text-text-muted">
              {user?.email || emailParam ? (
                <>
                  We&apos;ve sent a verification link to{' '}
                  <span className="font-medium text-ink">{user?.email || emailParam}</span>. Click
                  it to activate your account.
                </>
              ) : (
                'Please click the link in your verification email, or request a new one.'
              )}
            </p>

            {isAuthenticated && !user?.emailVerified && (
              <Button className="mb-4 w-full" onClick={handleResend} loading={resending} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
              </Button>
            )}

            <Link href={loginHref} className="text-sm font-semibold text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
