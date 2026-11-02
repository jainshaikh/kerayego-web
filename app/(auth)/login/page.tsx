'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { requestCodeSchema, type RequestCodeFormValues } from '../../../lib/validations/auth.schema';
import { useAuth } from '../../../hooks/useAuth';
import { getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { SignInCodeStep } from '../../../components/auth/SignInCodeStep';
import { Button, Card, Input } from '../../../components/ui';

interface CodeSent {
  email: string;
  message: string;
  resendAfterSeconds: number;
}

function LoginPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState<CodeSent | null>(null);
  const searchParams = useSearchParams();
  // middleware.ts uses `callbackUrl` for protected-route redirects; the
  // vehicle/trip inquiry flows use `redirect` — accept either so signing in
  // from either path lands the user back where they actually meant to go,
  // instead of silently falling through to their dashboard.
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect');
  const { requestCode } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestCodeFormValues>({
    resolver: zodResolver(requestCodeSchema),
  });

  const onSubmit = async ({ email }: RequestCodeFormValues) => {
    setIsLoading(true);
    try {
      const result = await requestCode(email);
      setCodeSent({ email, message: result.message, resendAfterSeconds: result.resendAfterSeconds });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Could not send a code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card padding="lg" className="rounded-sheet shadow-sm">
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {codeSent ? 'Enter your code' : 'Welcome back'}
          </h1>
          {!codeSent && (
            <p className="mt-1 text-sm text-text-muted">
              Enter your email and we&apos;ll send you a 6-digit code.
            </p>
          )}
        </div>

        {codeSent ? (
          <SignInCodeStep
            email={codeSent.email}
            message={codeSent.message}
            resendAfterSeconds={codeSent.resendAfterSeconds}
            callbackUrl={callbackUrl}
            welcomeMessage="Welcome back!"
            onChangeEmail={() => setCodeSent(null)}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isLoading}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" size="lg" className="w-full" loading={isLoading}>
              Send code
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link
            href={callbackUrl ? `/register?redirect=${encodeURIComponent(callbackUrl)}` : '/register'}
            className="font-semibold text-brand-600 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
