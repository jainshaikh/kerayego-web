'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { PhoneAuthFlow } from '../../../components/auth/PhoneAuthFlow';
import { Role } from '../../../types/enums';
import { safeRedirect } from '../../../lib/utils/safeRedirect';
import { Logo } from '../../../components/common/Logo';

/**
 * Sign-up starts the same phone flow as /login (number → WhatsApp code → the
 * backend decides): a new number gets the profile step (name, email,
 * customer/business), a known one is simply signed in. `?role=PROVIDER`
 * (the "List your fleet" CTAs) preselects the business choice; `?redirect=`
 * is where to go afterwards.
 */
function RegisterPageContent() {
  const searchParams = useSearchParams();
  // Same-site paths only (lib/utils/safeRedirect.ts) — anything else is dropped.
  const redirect = safeRedirect(searchParams.get('redirect') || searchParams.get('callbackUrl'));
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
  const initialRole =
    searchParams.get('role')?.toUpperCase() === Role.PROVIDER ? Role.PROVIDER : Role.USER;

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
        <PhoneAuthFlow
          intent="signup"
          callbackUrl={redirect}
          initialRole={initialRole}
          titleClassName="text-[26px]"
          numberStepFooter={
            <p className="mt-6 text-center text-sm text-text-muted">
              Already have one?{' '}
              <Link href={loginHref} className="font-semibold text-brand-600 hover:underline">
                Sign in
              </Link>
            </p>
          }
        />

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
