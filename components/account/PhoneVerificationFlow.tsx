'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  sendPhoneCodeSchema,
  type SendPhoneCodeFormValues,
} from '../../lib/validations/phone.schema';
import { verifyCodeSchema, type VerifyCodeFormValues } from '../../lib/validations/auth.schema';
import { formatPhoneForDisplay } from '../../lib/utils/phone';
import {
  fetchMe,
  phoneErrorInfo,
  useApplyUser,
  useSendPhoneCode,
  useVerifyPhoneCode,
} from '../../hooks/usePhoneVerification';
import { PhoneErrorCode, type User } from '../../types/api.types';
import { Button, Input } from '../ui';

interface PhoneVerificationFlowProps {
  /** Prefills step 1 (the account's current number, or empty when changing it). */
  initialPhone: string | null;
  /** Called with the verified user, already put in the cache and the stored session. */
  onVerified: (user: User) => void;
  /** The verify screen's note that booking updates also go out on WhatsApp. */
  showUpdatesNote?: boolean;
}

type Step = { kind: 'phone' } | { kind: 'code'; phone: string };

/** Counts a resend cooldown down to 0, one second at a time. */
function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

/**
 * WhatsApp phone verification (contract §7): step 1 sends a code to the
 * number (POST /users/me/phone/send-code), step 2 checks the 6-digit code
 * (POST /users/me/phone/verify). Used by the blocking verify screen and by the
 * account page's Verify / Change number dialog.
 */
export function PhoneVerificationFlow({
  initialPhone,
  onVerified,
  showUpdatesNote = false,
}: PhoneVerificationFlowProps) {
  const [step, setStep] = useState<Step>({ kind: 'phone' });
  const [phoneValue, setPhoneValue] = useState(initialPhone ? formatPhoneForDisplay(initialPhone) : '');
  const [cooldown, setCooldown] = useCountdown();

  if (step.kind === 'code') {
    return (
      <CodeStep
        phone={step.phone}
        cooldown={cooldown}
        setCooldown={setCooldown}
        onVerified={onVerified}
        onChangeNumber={() => setStep({ kind: 'phone' })}
      />
    );
  }

  return (
    <PhoneStep
      defaultPhone={phoneValue}
      cooldown={cooldown}
      setCooldown={setCooldown}
      showUpdatesNote={showUpdatesNote}
      onVerified={onVerified}
      onCodeSent={(phone, typed) => {
        setPhoneValue(typed);
        setStep({ kind: 'code', phone });
      }}
    />
  );
}

function PhoneStep({
  defaultPhone,
  cooldown,
  setCooldown,
  showUpdatesNote,
  onVerified,
  onCodeSent,
}: {
  defaultPhone: string;
  cooldown: number;
  setCooldown: (seconds: number) => void;
  showUpdatesNote: boolean;
  onVerified: (user: User) => void;
  /** `phone` is how to show the number on step 2; `typed` is what to prefill if they come back. */
  onCodeSent: (phone: string, typed: string) => void;
}) {
  const sendCode = useSendPhoneCode();
  const applyUser = useApplyUser();
  const [finishing, setFinishing] = useState(false);
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
    try {
      const result = await sendCode.mutateAsync(phone);
      if (result.alreadyVerified) {
        // Already this account's verified number: nothing was sent.
        setFinishing(true);
        const me = await fetchMe();
        applyUser(me);
        onVerified(me);
        return;
      }
      setCooldown(result.resendInSeconds);
      onCodeSent(result.phone, phone);
    } catch (error: unknown) {
      setFinishing(false);
      const info = phoneErrorInfo(error, 'Could not send a code. Please try again.');
      if (info.code === PhoneErrorCode.CODE_RESEND_TOO_SOON) {
        setCooldown(info.retryAfterSeconds ?? 60);
        setTooSoonFor(phone);
        return;
      }
      setError('phone', { message: info.message });
    }
  };

  const busy = sendCode.isPending || finishing;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoFocus
        placeholder="0300 1234567"
        helper="Your WhatsApp number, e.g. 0300 1234567 or +92 300 1234567"
        disabled={busy}
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

      <Button
        type="submit"
        variant="whatsapp"
        size="lg"
        className="w-full"
        loading={busy}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Send code again in ${cooldown}s` : 'Send code on WhatsApp'}
      </Button>

      {showUpdatesNote ? (
        <p className="text-center text-xs leading-relaxed text-text-faint">
          We&apos;ll also send your booking updates on WhatsApp. You can turn them off in Settings.
        </p>
      ) : null}
    </form>
  );
}

function CodeStep({
  phone,
  cooldown,
  setCooldown,
  onVerified,
  onChangeNumber,
}: {
  phone: string;
  cooldown: number;
  setCooldown: (seconds: number) => void;
  onVerified: (user: User) => void;
  onChangeNumber: () => void;
}) {
  const verify = useVerifyPhoneCode();
  const sendCode = useSendPhoneCode();

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
    try {
      const user = await verify.mutateAsync(code.replace(/\s/g, ''));
      onVerified(user);
    } catch (error: unknown) {
      setError('code', {
        message: phoneErrorInfo(error, 'Could not verify the code. Please try again.').message,
      });
    }
  };

  const onResend = async () => {
    try {
      const result = await sendCode.mutateAsync(phone);
      if (result.alreadyVerified) {
        toast.success('This number is already verified.');
        return;
      }
      setCooldown(result.resendInSeconds);
      toast.success('A new code is on its way on WhatsApp.');
    } catch (error: unknown) {
      const info = phoneErrorInfo(error, 'Could not send a new code. Please try again.');
      if (info.code === PhoneErrorCode.CODE_RESEND_TOO_SOON) {
        setCooldown(info.retryAfterSeconds ?? 60);
        return;
      }
      toast.error(info.message);
    }
  };

  return (
    <div>
      <p className="text-sm text-text-muted">Sent to WhatsApp</p>
      <p className="mb-5 mt-1 text-sm font-medium text-ink">{formatPhoneForDisplay(phone)}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          placeholder="123456"
          className="font-mono text-lg tracking-[0.3em]"
          disabled={verify.isPending}
          error={errors.code?.message}
          {...register('code')}
        />

        <Button type="submit" size="lg" className="w-full" loading={verify.isPending}>
          Verify
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {cooldown > 0 ? (
          <span className="text-text-muted">Send again in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={sendCode.isPending}
            className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
          >
            {sendCode.isPending ? 'Sending…' : 'Send again'}
          </button>
        )}
        <button
          type="button"
          onClick={onChangeNumber}
          disabled={verify.isPending}
          className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
        >
          Change number
        </button>
      </div>
    </div>
  );
}
