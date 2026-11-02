'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { verifyCodeSchema, type VerifyCodeFormValues } from '../../lib/validations/auth.schema';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import { Button, Input } from '../ui';

export const DELETION_CANCELLED_MESSAGE = 'Welcome back. Your account deletion has been cancelled.';

interface SignInCodeStepProps {
  email: string;
  /** What the server said when it sent the code. */
  message: string;
  resendAfterSeconds: number;
  /** Where to go after signing in; otherwise the role's dashboard. */
  callbackUrl: string | null;
  /** Toast shown after signing in (unless a deletion was just cancelled). */
  welcomeMessage: string;
  onChangeEmail: () => void;
}

/**
 * The 6-digit code step shared by sign-in and sign-up: POST /auth/code/verify
 * (the refresh token arrives as an httpOnly cookie), then the same redirect the
 * old password sign-in did — by role, or back to `callbackUrl`.
 */
export function SignInCodeStep({
  email,
  message,
  resendAfterSeconds,
  callbackUrl,
  welcomeMessage,
  onChangeEmail,
}: SignInCodeStepProps) {
  const router = useRouter();
  const { verifyCode, requestCode, getDashboardRoute } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendAfterSeconds);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const onSubmit = async ({ code }: VerifyCodeFormValues) => {
    setIsVerifying(true);
    try {
      const { user, deletionCancelled } = await verifyCode(email, code.replace(/\s/g, ''));

      toast.success(deletionCancelled ? DELETION_CANCELLED_MESSAGE : welcomeMessage);

      if (!user.emailVerified) {
        router.push(
          callbackUrl ? `/verify-email?redirect=${encodeURIComponent(callbackUrl)}` : '/verify-email',
        );
        router.refresh();
        return;
      }

      // Pass user directly — getDashboardRoute() can't read the store update until re-render
      const destination = callbackUrl || getDashboardRoute(user);

      // The WhatsApp phone check comes first (contract §7.1), then on to the destination.
      if (user.mustVerifyPhone) {
        router.push(`/verify-phone?redirect=${encodeURIComponent(destination)}`);
        router.refresh();
        return;
      }

      router.push(destination);
      router.refresh();
    } catch (error: unknown) {
      setError('code', {
        message: getApiErrorMessage(error, 'Could not sign you in. Please try again.'),
      });
      setIsVerifying(false);
    }
  };

  const onResend = async () => {
    setIsResending(true);
    try {
      const result = await requestCode(email);
      toast.success(result.message);
      setSecondsLeft(result.resendAfterSeconds);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Could not send a new code. Please try again.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-text-muted">{message}</p>
      <p className="mb-5 mt-1 break-all text-sm font-medium text-ink">{email}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          placeholder="123456"
          className="font-mono text-lg tracking-[0.3em]"
          disabled={isVerifying}
          error={errors.code?.message}
          {...register('code')}
        />

        <Button type="submit" size="lg" className="w-full" loading={isVerifying}>
          Sign in
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {secondsLeft > 0 ? (
          <span className="text-text-muted">Send again in {secondsLeft}s</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={isResending}
            className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending…' : 'Send again'}
          </button>
        )}
        <button
          type="button"
          onClick={onChangeEmail}
          disabled={isVerifying}
          className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}
