'use client';

import { useEffect, useState, type FormEventHandler, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, UserRound } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, ErrorState } from '../ui';
import { cn } from '../../lib/utils/cn';
import { useMyDriverProfile } from '../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import type { DriverProfile } from '../../types/driver.types';
import {
  canOpenSetupStep,
  DRIVER_PROFILE_HREF,
  DRIVER_SETUP_STEPS,
  FIELD_LEVEL_LEGEND,
  nextSetupRoute,
  previousSetupRoute,
  setupHref,
  setupStep,
  stepPositionLabel,
  type DriverSetupRoute,
} from '../../lib/driver/setupSteps';

// The frame of the driver setup steps (/driver/setup/<step>) — the web twin
// of kerayego-partner's features/driver/components/SetupStepScreen.tsx: the
// step's title, "Step n of 6", what the markers mean, the fields, and Back /
// Save & next. On the web the six steps are also listed across the top, so a
// manager filling in a driver's profile on a laptop can jump between them.

/** Moving between the steps: next after a save, back to the previous one, or to the profile after the ends. */
export function useSetupNavigation(route: DriverSetupRoute) {
  const router = useRouter();
  const next = nextSetupRoute(route);
  const previous = previousSetupRoute(route);
  return {
    isLast: next === null,
    goNext: () => router.push(next ? setupHref(next) : DRIVER_PROFILE_HREF),
    goBack: () => router.push(previous ? setupHref(previous) : DRIVER_PROFILE_HREF),
    goTo: (href: string) => router.push(href),
  };
}

/**
 * Loads GET /driver/profile for a step, with loading/error states. Every step
 * but Personal information needs a saved profile (its first save creates it),
 * so those point to step 1 until then.
 */
export function SetupStepGate({
  route,
  children,
}: {
  route: DriverSetupRoute;
  children: (profile: DriverProfile | null) => ReactNode;
}) {
  const router = useRouter();
  const profileQuery = useMyDriverProfile();
  const step = setupStep(route);

  if (profileQuery.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
      </div>
    );
  }
  if (profileQuery.isError) {
    return (
      <ErrorState
        title={`We couldn't load ${step.title.toLowerCase()}`}
        description={getApiErrorMessage(profileQuery.error, 'Something went wrong while loading your driver profile.')}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }
  if (!canOpenSetupStep(route, profileQuery.data)) {
    return (
      <EmptyState
        icon={UserRound}
        title="Start with your personal information"
        description="Save your name and details first — then you can fill in the other steps."
        action={{ label: 'Personal information', onClick: () => router.push(setupHref('personal')) }}
      />
    );
  }
  return <>{children(profileQuery.data)}</>;
}

interface SetupStepFrameProps {
  route: DriverSetupRoute;
  profile: DriverProfile | null;
  children: ReactNode;
  /** The form's submit handler (React Hook Form's handleSubmit(...)). */
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
  error: string | null;
  /** Unsaved changes: leaving asks before throwing them away. */
  isDirty: boolean;
  intro?: string;
  /** The "This needs checking again" question from useSaveDriverStep. */
  confirm?: { message: string } | null;
  onConfirmSave?: () => void;
  onCancelConfirm?: () => void;
}

export function SetupStepFrame({
  route,
  profile,
  children,
  onSubmit,
  isSaving,
  error,
  isDirty,
  intro,
  confirm,
  onConfirmSave,
  onCancelConfirm,
}: SetupStepFrameProps) {
  const step = setupStep(route);
  const { isLast, goBack, goTo } = useSetupNavigation(route);
  // Where to go once "Leave without saving?" is answered with Leave.
  const [leaveTo, setLeaveTo] = useState<(() => void) | null>(null);

  // Closing the tab or reloading with unsaved changes asks the browser's own question.
  useEffect(() => {
    if (!isDirty || isSaving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, isSaving]);

  const leave = (go: () => void) => {
    if (!isDirty) go();
    else setLeaveTo(() => go);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => leave(() => goTo(DRIVER_PROFILE_HREF))}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Driver profile
      </button>

      {/* The six steps */}
      <nav aria-label="Setup steps" className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max gap-1.5">
          {DRIVER_SETUP_STEPS.map((s, index) => {
            const current = s.route === route;
            const complete = profile?.steps?.[s.key]?.complete === true;
            const enabled = canOpenSetupStep(s.route, profile);
            return (
              <li key={s.route}>
                <button
                  type="button"
                  disabled={!enabled || current}
                  aria-current={current ? 'step' : undefined}
                  onClick={() => leave(() => goTo(setupHref(s.route)))}
                  className={cn(
                    'flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-xs font-medium transition-colors',
                    current
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-border-subtle bg-surface text-text-muted hover:border-border-strong hover:text-ink',
                    !enabled && 'cursor-not-allowed opacity-50 hover:border-border-subtle hover:text-text-muted',
                  )}
                >
                  {complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <span className="tabular-nums">{index + 1}.</span>
                  )}
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <header>
          <p className="text-[13px] font-semibold text-brand-700">{stepPositionLabel(route)}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{step.title}</h1>
          {intro ? <p className="mt-2 text-sm leading-relaxed text-text-muted">{intro}</p> : null}
          <p className="mt-2 text-xs text-text-faint">{FIELD_LEVEL_LEGEND}</p>
        </header>

        {children}

        {error ? (
          <p role="alert" className="rounded-control border border-status-red-border bg-status-red-bg px-4 py-3 text-sm text-status-red-fg">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-between">
          <Button type="button" variant="secondary" disabled={isSaving} onClick={() => leave(goBack)}>
            Back
          </Button>
          <Button type="submit" loading={isSaving} className="sm:min-w-[180px]">
            {isLast ? 'Save & finish' : 'Save & next'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={leaveTo !== null}
        onOpenChange={(open) => {
          if (!open) setLeaveTo(null);
        }}
        title="Leave without saving?"
        description="Your changes on this step will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => {
          const go = leaveTo;
          setLeaveTo(null);
          go?.();
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) onCancelConfirm?.();
        }}
        title="This needs checking again"
        description={confirm?.message}
        confirmLabel="Save anyway"
        cancelLabel="Cancel"
        onConfirm={() => onConfirmSave?.()}
      />
    </div>
  );
}
