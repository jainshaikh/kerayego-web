'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, Car } from 'lucide-react';

import {
  sendPhoneCodeSchema,
  type SendPhoneCodeFormValues,
} from '../../lib/validations/phone.schema';
import {
  phoneProfileSchema,
  verifyCodeSchema,
  type PhoneProfileFormValues,
  type VerifyCodeFormValues,
} from '../../lib/validations/auth.schema';
import { useAuth } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { phoneErrorInfo } from '../../hooks/usePhoneVerification';
import { getApiErrorCode, getApiErrorMessage } from '../../hooks/useAccountDeletion';
import { formatPhoneForDisplay } from '../../lib/utils/phone';
import { trackEvent } from '../../lib/utils/analytics';
import { PhoneErrorCode, PhoneSignupErrorCode } from '../../types/api.types';
import { Role } from '../../types/enums';
import { cn } from '../../lib/utils/cn';
import { Button, Input, RadioCard } from '../ui';
import { DELETION_CANCELLED_MESSAGE } from './SignInCodeStep';

type SignupRole = Role.USER | Role.PROVIDER;

type Step =
  | { kind: 'number' }
  /** `phone` is what /auth/phone/verify gets (E.164 from the server, or as typed after a 429). */
  | { kind: 'code'; phone: string }
  | { kind: 'profile'; phone: string; signupToken: string };

interface PhoneAuthFlowProps {
  /** Only changes the wording of the number step — the backend decides sign-in vs sign-up. */
  intent: 'signin' | 'signup';
  /** Where to go after signing in; otherwise the role's dashboard. */
  callbackUrl: string | null;
  /** Preselected on the profile step (e.g. /register?role=PROVIDER). */
  initialRole?: SignupRole;
  titleClassName?: string;
  /** Shown under the number step only (e.g. "Don't have an account? Create one"). */
  numberStepFooter?: ReactNode;
}

/** /login?method=email — the existing email-code sign-in, keeping where the person was headed. */
export function emailSignInHref(callbackUrl: string | null, email?: string): string {
  const params = new URLSearchParams({ method: 'email' });
  if (callbackUrl) params.set('callbackUrl', callbackUrl);
  if (email) params.set('email', email);
  return `/login?${params.toString()}`;
}

/**
 * Phone-first sign-in and sign-up — one flow behind both /login and /register:
 * number → WhatsApp code (POST /auth/phone/request → /auth/phone/verify) → a
 * known number is signed in; a new one gets the profile step (name, email,
 * customer/business) → POST /auth/phone/register → signed in. Sessions are
 * stored like the email-code sign-in (httpOnly refresh cookie); the redirect
 * afterwards is the shared one in useAuth().routeAfterSignIn.
 */
export function PhoneAuthFlow({
  intent,
  callbackUrl,
  initialRole = Role.USER,
  titleClassName,
  numberStepFooter,
}: PhoneAuthFlowProps) {
  const [step, setStep] = useState<Step>({ kind: 'number' });
  const [typedPhone, setTypedPhone] = useState('');
  // Shown on the number step after the flow had to start over.
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useCountdown();

  const restart = (message: string | null) => {
    setNotice(message);
    setStep({ kind: 'number' });
  };

  const title =
    step.kind === 'code'
      ? 'Enter your code'
      : step.kind === 'profile'
        ? 'Finish creating your account'
        : intent === 'signup'
          ? 'Create your account'
          : 'Welcome back';

  const subtitle =
    step.kind === 'code'
      ? null
      : step.kind === 'profile'
        ? 'Your number is verified. Tell us a little about you.'
        : intent === 'signup'
          ? 'Start with your mobile number. We’ll send you a code on WhatsApp.'
          : 'Enter your mobile number and we’ll send you a code on WhatsApp.';

  return (
    <div>
      <div className="mb-7">
        <h1 className={cn('text-2xl font-bold tracking-tight text-ink', titleClassName)}>
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
      </div>

      {step.kind === 'number' ? (
        <>
          <NumberStep
            defaultPhone={typedPhone}
            notice={notice}
            setCooldown={setCooldown}
            onCodeSent={(phone, typed) => {
              setNotice(null);
              setTypedPhone(typed);
              setStep({ kind: 'code', phone });
            }}
          />
          <p className="mt-4 text-center text-sm">
            <Link
              href={emailSignInHref(callbackUrl)}
              className="font-medium text-text-muted underline-offset-2 hover:text-brand-700 hover:underline"
            >
              Sign in with email instead
            </Link>
          </p>
          {numberStepFooter}
        </>
      ) : step.kind === 'code' ? (
        <CodeStep
          phone={step.phone}
          cooldown={cooldown}
          setCooldown={setCooldown}
          callbackUrl={callbackUrl}
          onSignupNeeded={(phone, signupToken) => setStep({ kind: 'profile', phone, signupToken })}
          onChangeNumber={() => restart(null)}
        />
      ) : (
        <ProfileStep
          phone={step.phone}
          signupToken={step.signupToken}
          initialRole={initialRole}
          callbackUrl={callbackUrl}
          onRestart={restart}
        />
      )}
    </div>
  );
}

// ─── Step 1: the number ──────────────────────────────────────────────────────

function NumberStep({
  defaultPhone,
  notice,
  setCooldown,
  onCodeSent,
}: {
  defaultPhone: string;
  notice: string | null;
  setCooldown: (seconds: number) => void;
  /** `phone` goes to /auth/phone/verify; `typed` is what to prefill if they come back. */
  onCodeSent: (phone: string, typed: string) => void;
}) {
  const { requestPhoneCode } = useAuth();
  const [sending, setSending] = useState(false);
  // CODE_RESEND_TOO_SOON: a code went out moments ago — they may already have it.
  const [tooSoonFor, setTooSoonFor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SendPhoneCodeFormValues>({
    resolver: zodResolver(sendPhoneCodeSchema),
    defaultValues: { phone: defaultPhone },
  });

  const onSubmit = async ({ phone }: SendPhoneCodeFormValues) => {
    setTooSoonFor(null);
    setSending(true);
    try {
      const result = await requestPhoneCode(phone);
      setCooldown(result.resendInSeconds);
      onCodeSent(result.phone, phone);
    } catch (error: unknown) {
      const info = phoneErrorInfo(error, 'Could not send a code. Please try again.');
      if (info.code === PhoneErrorCode.CODE_RESEND_TOO_SOON) {
        setCooldown(info.retryAfterSeconds ?? 60);
        setTooSoonFor(phone);
      } else {
        setError('phone', { message: info.message });
      }
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {notice ? (
        <p
          role="alert"
          className="rounded-control border border-status-amber-border bg-status-amber-bg px-3.5 py-3 text-sm text-status-amber-fg"
        >
          {notice}
        </p>
      ) : null}

      <Input
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoFocus
        placeholder="0300 1234567"
        helper="Your WhatsApp number, e.g. 0300 1234567 or +92 300 1234567"
        disabled={sending}
        error={errors.phone?.message}
        {...register('phone')}
      />

      {tooSoonFor ? (
        <p className="text-sm text-text-muted">
          A code was sent a moment ago.{' '}
          <button
            type="button"
            onClick={() => onCodeSent(tooSoonFor, tooSoonFor)}
            className="font-semibold text-brand-600 hover:underline"
          >
            Enter that code
          </button>
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={sending}>
        Continue
      </Button>
    </form>
  );
}

// ─── Step 2: the WhatsApp code ───────────────────────────────────────────────

function CodeStep({
  phone,
  cooldown,
  setCooldown,
  callbackUrl,
  onSignupNeeded,
  onChangeNumber,
}: {
  phone: string;
  cooldown: number;
  setCooldown: (seconds: number) => void;
  callbackUrl: string | null;
  onSignupNeeded: (phone: string, signupToken: string) => void;
  onChangeNumber: () => void;
}) {
  const { verifyPhoneCode, requestPhoneCode, routeAfterSignIn } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: VerifyCodeFormValues) => {
    setVerifying(true);
    try {
      const result = await verifyPhoneCode(phone, code.replace(/\s/g, ''));
      if (result.needsSignup) {
        onSignupNeeded(result.phone, result.signupToken);
        return;
      }
      toast.success(result.deletionCancelled ? DELETION_CANCELLED_MESSAGE : 'Welcome back!');
      routeAfterSignIn(result.user, callbackUrl);
    } catch (error: unknown) {
      // 401 CODE_INVALID, 403 suspended account (the server's message), 400 invalid number.
      setError('code', {
        message: phoneErrorInfo(error, 'Could not sign you in. Please try again.').message,
      });
      setVerifying(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      const result = await requestPhoneCode(phone);
      setCooldown(result.resendInSeconds);
      toast.success('A new code is on its way on WhatsApp.');
    } catch (error: unknown) {
      const info = phoneErrorInfo(error, 'Could not send a new code. Please try again.');
      if (info.code === PhoneErrorCode.CODE_RESEND_TOO_SOON) {
        setCooldown(info.retryAfterSeconds ?? 60);
      } else {
        toast.error(info.message);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-text-muted">We sent a 6-digit code to your WhatsApp.</p>
      <p className="mb-5 mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-medium text-ink">{formatPhoneForDisplay(phone)}</span>
        <button
          type="button"
          onClick={onChangeNumber}
          disabled={verifying}
          className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
        >
          Change
        </button>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          placeholder="123456"
          className="font-mono text-lg tracking-[0.3em]"
          disabled={verifying}
          error={errors.code?.message}
          {...register('code')}
        />

        <Button type="submit" size="lg" className="w-full" loading={verifying}>
          Continue
        </Button>
      </form>

      <div className="mt-5 text-sm">
        {cooldown > 0 ? (
          <span className="text-text-muted">Send again in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending || verifying}
            className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Send again'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: the profile (new numbers only) ──────────────────────────────────

function ProfileStep({
  phone,
  signupToken,
  initialRole,
  callbackUrl,
  onRestart,
}: {
  phone: string;
  signupToken: string;
  initialRole: SignupRole;
  callbackUrl: string | null;
  onRestart: (message: string) => void;
}) {
  const { registerWithPhone, routeAfterSignIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // 409 EMAIL_TAKEN: offer the email sign-in for that address.
  const [takenEmail, setTakenEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PhoneProfileFormValues>({
    resolver: zodResolver(phoneProfileSchema),
    defaultValues: { name: '', email: '', role: initialRole },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: PhoneProfileFormValues) => {
    setFormError(null);
    setTakenEmail(null);
    setSubmitting(true);
    try {
      const { user } = await registerWithPhone({ signupToken, ...data });
      trackEvent('sign_up', { role: data.role, method: 'phone' });
      if (data.role === Role.PROVIDER) trackEvent('provider_signup');
      toast.success('Welcome to KerayeGo!');
      routeAfterSignIn(user, callbackUrl);
    } catch (error: unknown) {
      setSubmitting(false);
      const { code, status } = getApiErrorCode(error);
      if (code === PhoneSignupErrorCode.SIGNUP_TOKEN_INVALID || status === 401) {
        onRestart('That took a little too long. Enter your number again to get a new code.');
        return;
      }
      if (code === PhoneErrorCode.PHONE_TAKEN) {
        onRestart(
          'An account with this number was just created. Enter your number again to sign in.',
        );
        return;
      }
      if (code === PhoneSignupErrorCode.EMAIL_TAKEN) {
        setError('email', {
          message: getApiErrorMessage(error, 'An account with this email already exists.'),
        });
        setTakenEmail(data.email);
        return;
      }
      // 403 IDENTITY_BLOCKED, 400 validation, or anything else: the server's message.
      setFormError(
        phoneErrorInfo(error, 'Could not create your account. Please try again.').message,
      );
    }
  };

  return (
    <div>
      <p className="mb-5 text-sm text-text-muted">
        Mobile number{' '}
        <span className="font-medium text-ink">{formatPhoneForDisplay(phone)}</span>
      </p>

      <div className="mb-5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          I want to
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <RadioCard
            selected={selectedRole === Role.USER}
            onClick={() => setValue('role', Role.USER)}
            icon={Car}
            title="Rent a vehicle"
            description="Browse listings and send inquiries."
          />
          <RadioCard
            selected={selectedRole === Role.PROVIDER}
            onClick={() => setValue('role', Role.PROVIDER)}
            icon={Building2}
            title="List my fleet"
            description="Requires business verification."
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <input type="hidden" {...register('role')} />

        <Input
          label="Full name"
          autoComplete="name"
          autoFocus
          placeholder="Ahmed Al Rashid"
          disabled={submitting}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          helper="We'll email you a link to confirm it."
          disabled={submitting}
          error={errors.email?.message}
          {...register('email')}
        />

        {takenEmail ? (
          <p className="text-sm text-text-muted">
            Is it yours?{' '}
            <Link
              href={emailSignInHref(callbackUrl, takenEmail)}
              className="font-semibold text-brand-600 hover:underline"
            >
              Sign in with email instead
            </Link>
          </p>
        ) : null}

        {formError ? (
          <p
            role="alert"
            className="rounded-control border border-status-red-border bg-status-red-bg px-3.5 py-3 text-sm text-status-red-fg"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-1 w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </div>
  );
}
