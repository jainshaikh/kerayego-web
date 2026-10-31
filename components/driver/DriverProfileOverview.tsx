'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { Button, Card } from '../ui';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../../lib/utils/cn';
import { DriverVerificationStatus } from '../../types/enums';
import type { DriverProfile, DriverReadiness } from '../../types/driver.types';
import { useSubmitDriverVerification } from '../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import {
  DRIVER_VERIFICATION_LABELS,
  missingCountLabel,
  readinessRows,
  showsSubmitButton,
  verificationExplanation,
} from '../../lib/driver/verification';
import {
  canOpenSetupStep,
  DRIVER_SETUP_STEPS,
  setupHref,
  stepStatusText,
} from '../../lib/driver/setupSteps';

// The driver profile overview (/driver/profile) — web versions of
// kerayego-partner's VerificationCard, ReadinessCard and SetupStepsCard.

/**
 * Verification status and what it means, KerayeGo's reason when rejected, and
 * "Submit for verification" (enabled only when the backend says canSubmit). A
 * 400 (what's missing) or 409 (CNIC already registered to another driver)
 * shows the backend's message.
 */
export function DriverVerificationCard({ profile }: { profile: DriverProfile | null }) {
  const submit = useSubmitDriverVerification();
  const status = profile?.verificationStatus ?? DriverVerificationStatus.UNVERIFIED;
  const rejectionReason = status === DriverVerificationStatus.REJECTED ? profile?.rejectionReason?.trim() : null;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Verification</h2>
        <StatusBadge status={status} label={DRIVER_VERIFICATION_LABELS[status]} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {profile
          ? verificationExplanation(status)
          : 'Start with your personal information below. Once you are rental-ready, submit your details to KerayeGo.'}
      </p>
      {rejectionReason ? (
        <p className="mt-2 text-sm text-red-700">Reason from KerayeGo: {rejectionReason}</p>
      ) : null}

      {profile && showsSubmitButton(status) ? (
        <div className="mt-4 space-y-2">
          {submit.isError ? (
            <p role="alert" className="text-sm text-red-700">
              {getApiErrorMessage(submit.error, 'Could not submit. Please try again.')}
            </p>
          ) : null}
          <Button
            loading={submit.isPending}
            disabled={!profile.canSubmit}
            onClick={() =>
              submit.mutate(undefined, {
                onSuccess: () => toast.success('Submitted for verification', { description: 'KerayeGo will check your details.' }),
              })
            }
          >
            Submit for verification
          </Button>
          {!profile.canSubmit ? (
            <p className="text-[13px] text-text-muted">Finish everything under Rental-ready to submit.</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

/** The three readiness levels (A58): Rental-ready, Hire-ready, Payout-ready, with what's missing. */
export function DriverReadinessCard({ readiness }: { readiness: DriverReadiness | null | undefined }) {
  const rows = readinessRows(readiness);
  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">What you can do</h2>
      <ul className="mt-3 divide-y divide-border-subtle">
        {rows.map((row) => (
          <li key={row.key} className="py-4 first:pt-1 last:pb-0">
            <div className="flex items-center gap-2.5">
              {row.complete ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-text-faint" />
              )}
              <p className="flex-1 text-sm font-semibold text-ink">{row.title}</p>
              <StatusBadge
                status={row.complete ? 'COMPLETE' : 'MISSING'}
                label={missingCountLabel(row)}
                size="sm"
                className={row.complete ? 'border-status-emerald-border bg-status-emerald-bg text-status-emerald-fg' : undefined}
              />
            </div>
            <p className="mt-1 pl-[30px] text-[13px] text-text-muted">{row.description}</p>
            {!row.complete && row.missing.length > 0 ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-[46px] text-[13px] text-ink">
                {row.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      {readiness?.householdAllowed ? (
        <p className="mt-3 text-[13px] text-emerald-700">Police certificate added — you can offer household services.</p>
      ) : null}
    </Card>
  );
}

/** The six setup steps: complete or what's missing; each opens its step. Before the first save only step 1 opens. */
export function DriverSetupStepsCard({ profile }: { profile: DriverProfile | null }) {
  return (
    <Card padding="none">
      <div className="px-5 pb-2 pt-5">
        <h2 className="text-base font-semibold text-ink">Your driver profile</h2>
        <p className="mt-1 text-[13px] text-text-muted">Six steps. Save each one and come back any time.</p>
      </div>
      <ol>
        {DRIVER_SETUP_STEPS.map((step, index) => {
          const completeness = profile?.steps?.[step.key];
          const complete = completeness?.complete === true;
          const enabled = canOpenSetupStep(step.route, profile);
          const status = profile ? stepStatusText(completeness) : step.description;
          const content = (
            <>
              {complete ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-text-faint" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {index + 1}. {step.title}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[13px]',
                    complete || !profile ? 'text-text-muted' : 'text-status-amber-fg',
                  )}
                >
                  {status}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-faint" />
            </>
          );
          return (
            <li key={step.key} className="border-t border-border-subtle">
              {enabled ? (
                <Link
                  href={setupHref(step.route)}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-hover"
                >
                  {content}
                </Link>
              ) : (
                <div aria-disabled className="flex items-center gap-3 px-5 py-4 opacity-50">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
