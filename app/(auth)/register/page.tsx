'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, Car } from 'lucide-react';

import { registerSchema, type RegisterFormValues } from '../../../lib/validations/auth.schema';
import { useAuth } from '../../../hooks/useAuth';
import { getApiErrorCode, getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { SignInCodeStep } from '../../../components/auth/SignInCodeStep';
import { Role } from '../../../types/enums';
import { trackEvent } from '../../../lib/utils/analytics';
import { Button, Input, RadioCard } from '../../../components/ui';
import { Logo } from '../../../components/common/Logo';

// POST /auth/register doesn't say when a new code may be sent; the backend's cooldown is 60 s.
const RESEND_AFTER_SECONDS = 60;

function RegisterPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState<{ email: string; message: string } | null>(null);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: Role.USER },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // No password: the backend emails a 6-digit code, then the code step signs them in.
      const result = await registerUser(data);
      trackEvent('sign_up', { role: data.role });
      if (data.role === Role.PROVIDER) trackEvent('provider_signup');
      setCodeSent({ email: result.user.email, message: result.message });
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Could not create your account. Please try again.');
      const { code, status, isValidation } = getApiErrorCode(error);
      if (code === 'PHONE_TAKEN' || (status === 400 && !isValidation)) {
        // 409 PHONE_TAKEN, or 400 "Enter a valid mobile number…"
        setError('phone', { message });
      } else if (status === 409) {
        // "An account with this email already exists"
        setError('email', { message });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-[900px] grid-cols-1 overflow-hidden rounded-sheet border border-border-subtle bg-surface shadow-md md:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden flex-col justify-between bg-ink p-10 text-white md:flex">
        <div className="flex items-center">
          <Logo theme="dark" className="h-6" />
        </div>
        <div>
          <p className="mb-3.5 max-w-[15ch] text-[30px] font-bold leading-tight tracking-tight">
            Rent a car, or fill the empty seats in yours.
          </p>
          <p className="max-w-[34ch] text-[15px] leading-relaxed text-slate-400">
            Verified providers, verified drivers, and a direct line to both. No booking fees.
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="font-mono text-[22px] font-semibold">1,240</div>
            <div className="mt-1.5 text-xs text-slate-500">vehicles listed</div>
          </div>
          <div>
            <div className="font-mono text-[22px] font-semibold">380</div>
            <div className="mt-1.5 text-xs text-slate-500">verified providers</div>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="p-8 sm:p-10">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-tight text-ink">
          {codeSent ? 'Enter your code' : 'Create your account'}
        </h1>
        {codeSent ? (
          <div className="mt-4">
            <SignInCodeStep
              email={codeSent.email}
              message={codeSent.message}
              resendAfterSeconds={RESEND_AFTER_SECONDS}
              callbackUrl={redirect}
              welcomeMessage="Welcome to KerayeGo!"
              onChangeEmail={() => setCodeSent(null)}
            />
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-text-muted">
              Already have one?{' '}
              <Link href={loginHref} className="font-semibold text-brand-600 hover:underline">
                Sign in
              </Link>
            </p>

            {/* Account type toggle */}
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
                <input type="hidden" {...register('role')} />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
              <Input
                label="Full name"
                autoComplete="name"
                placeholder="Ahmed Al Rashid"
                disabled={isLoading}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isLoading}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Mobile number"
                required
                type="tel"
                autoComplete="tel"
                placeholder="03001234567"
                helper="e.g. 03001234567"
                disabled={isLoading}
                error={errors.phone?.message}
                {...register('phone')}
              />

              <p className="text-[13px] text-text-muted">
                We&apos;ll email you a 6-digit code to finish signing up.
              </p>

              <Button type="submit" size="lg" className="mt-1 w-full" loading={isLoading}>
                Create account
              </Button>
            </form>
          </>
        )}

        <p className="mt-5 text-center text-xs text-text-faint">
          By continuing you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  );
}
