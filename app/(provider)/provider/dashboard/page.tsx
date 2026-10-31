'use client';

import Link from 'next/link';
import {
  AlertCircle,
  Ban,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  MapPinned,
  Plus,
  Store,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useProviderProfile, useSubmitForReview } from '../../../../hooks/useProviderProfile';
import { useWorkspace, type WorkspaceAction } from '../../../../hooks/useWorkspace';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { Button, Card, ErrorState } from '../../../../components/ui';
import { cn } from '../../../../lib/utils/cn';
import type { ProviderProfileWithMeta } from '../../../../lib/api/providers.api';
import {
  SUBMIT_MIN_COMPLETENESS,
  statusExplanation,
  stillNeededItems,
  submitForReviewState,
} from '../../../../lib/workspace/businessStatus';
import { WORKSPACE_LABELS } from '../../../../lib/workspace/workspaceRoutes';
import { ProviderStatus } from '../../../../types/enums';

// The business dashboard, for the Business admin and a Manager alike (the
// layout only shows it while one of those is active). GET /providers/me
// returns the owned business for the owner and the managed one (read-only,
// `documents: []`) for a manager. Owner-only pieces are hidden with can().

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-start gap-3.5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control border border-border-subtle bg-page text-text-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <div className="mt-0.5 font-mono text-2xl font-semibold leading-tight text-ink">
          {value}
        </div>
        {sub && <p className="mt-0.5 text-xs text-text-faint">{sub}</p>}
      </div>
    </Card>
  );
}

function CompletenessBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500'
      : score >= SUBMIT_MIN_COMPLETENESS
        ? 'bg-amber-500'
        : 'bg-red-400';
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Profile completeness</span>
        <span className="font-mono text-xs font-semibold text-ink">{score}%</span>
      </div>
      <div className="h-[7px] overflow-hidden rounded-full bg-surface-hover">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

type Tone = 'amber' | 'blue' | 'red' | 'emerald';

const TONE_CLS: Record<Tone, string> = {
  amber: 'bg-status-amber-bg border-status-amber-border text-status-amber-fg',
  blue: 'bg-status-blue-bg border-status-blue-border text-status-blue-fg',
  red: 'bg-status-red-bg border-status-red-border text-status-red-fg',
  emerald: 'bg-status-emerald-bg border-status-emerald-border text-status-emerald-fg',
};

/** The status card's title, tone and (owner-only) next step; the body is statusExplanation(). */
function statusCard(
  profile: ProviderProfileWithMeta,
  can: (action: WorkspaceAction) => boolean,
): { tone: Tone; icon: LucideIcon; title: string; cta?: { href: string; label: string } } {
  const hasShowroom = profile.showrooms.length > 0;
  switch (profile.verificationStatus) {
    case ProviderStatus.PENDING:
      return {
        tone: 'amber',
        icon: AlertCircle,
        title: 'Business profile not submitted yet',
        cta: can('editBusinessProfile')
          ? { href: '/provider/profile', label: 'Complete profile →' }
          : undefined,
      };
    case ProviderStatus.PENDING_REVIEW:
      return { tone: 'blue', icon: Clock, title: 'Under review' };
    case ProviderStatus.REJECTED:
      return {
        tone: 'red',
        icon: AlertCircle,
        title: 'Not approved',
        cta: can('editBusinessProfile')
          ? { href: '/provider/profile', label: 'Update the profile →' }
          : undefined,
      };
    case ProviderStatus.SUSPENDED:
      return { tone: 'red', icon: Ban, title: 'Suspended' };
    case ProviderStatus.APPROVED:
      if (!hasShowroom) {
        return {
          tone: 'amber',
          icon: AlertCircle,
          title: 'One more step before cars can be listed',
          cta: can('manageShowrooms')
            ? { href: '/provider/profile', label: 'Add a showroom →' }
            : undefined,
        };
      }
      return {
        tone: 'emerald',
        icon: CheckCircle2,
        title: 'Approved',
        cta: can('manageFleet')
          ? { href: '/provider/vehicles/new', label: 'Add a vehicle →' }
          : undefined,
      };
  }
}

const QUICK_ACTIONS: {
  href: string;
  label: string;
  icon: LucideIcon;
  action: WorkspaceAction;
  /** Needs an approved business with a showroom. */
  gated?: boolean;
}[] = [
  {
    href: '/provider/profile',
    label: 'Edit business profile',
    icon: User,
    action: 'editBusinessProfile',
  },
  {
    href: '/provider/vehicles/new',
    label: 'Add a vehicle',
    icon: Plus,
    action: 'manageFleet',
    gated: true,
  },
  { href: '/provider/vehicles', label: 'Fleet', icon: Car, action: 'viewFleet', gated: true },
  {
    href: '/provider/inquiries',
    label: 'Bookings',
    icon: Inbox,
    action: 'manageBookings',
    gated: true,
  },
  { href: '/provider/team', label: 'Team', icon: Users, action: 'viewTeam' },
  { href: '/provider/live-map', label: 'Live map', icon: MapPinned, action: 'viewLiveMap' },
];

/** "Submit for review" (owner only), offered while the business is PENDING or REJECTED. */
function SubmitForReviewCard({ profile }: { profile: ProviderProfileWithMeta }) {
  const submit = useSubmitForReview();
  const state = submitForReviewState(profile);
  if (state.kind === 'hidden') return null;
  const title = state.resubmit ? 'Submit again' : 'Submit for review';

  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-sm text-text-muted">
        KerayeGo checks every business before its cars can be listed. To submit, you need at least
        one showroom, a profile that is at least {SUBMIT_MIN_COMPLETENESS}% complete and the
        owner&apos;s CNIC number.
      </p>
      {state.kind === 'blocked' && (
        <ul className="space-y-1">
          {state.reasons.map((reason) => (
            <li key={reason} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              {reason}
            </li>
          ))}
        </ul>
      )}
      <Button
        onClick={() => submit.mutate()}
        disabled={state.kind !== 'ready'}
        loading={submit.isPending}
      >
        {title}
      </Button>
    </Card>
  );
}

export default function ProviderDashboardPage() {
  const { active, can } = useWorkspace();
  const { data: profile, isLoading, isError, refetch } = useProviderProfile();

  if (isError) {
    return <ErrorState title="We couldn't load your business" onRetry={() => void refetch()} />;
  }

  const showrooms = profile?.showrooms?.length ?? 0;
  const documents = profile?.documents?.length ?? 0;
  const status = profile?.verificationStatus ?? ProviderStatus.PENDING;
  const completeness = profile?.completenessScore?.score ?? 0;
  // Admin approval only unlocks vehicle listing once a showroom is on file —
  // an approved profile alone isn't enough.
  const canAddVehicle = status === ProviderStatus.APPROVED && showrooms > 0;
  const viewer = can('submitBusinessForReview') ? 'admin' : 'manager';
  const card = profile ? statusCard(profile, can) : null;
  const stillNeeded = profile ? stillNeededItems(profile) : [];
  const quickActions = QUICK_ACTIONS.filter((a) => can(a.action));
  const skeleton = (w: string) => (
    <span className={cn('inline-block h-6 animate-pulse rounded-control bg-surface-hover', w)} />
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isLoading ? (
              <span className="inline-block h-7 w-48 animate-pulse rounded-control bg-surface-hover" />
            ) : (
              (profile?.businessName ?? 'Your business')
            )}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Business dashboard{active ? ` · ${WORKSPACE_LABELS[active]}` : ''}
          </p>
        </div>
        {!isLoading && profile && <StatusBadge status={status} />}
      </div>

      {/* Status */}
      {profile && card && (
        <div className={cn('flex items-start gap-3 rounded-card border p-4', TONE_CLS[card.tone])}>
          <card.icon className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{card.title}</p>
            <p className="mt-0.5 text-sm opacity-90">{statusExplanation(profile, viewer)}</p>
            {card.cta && (
              <Link
                href={card.cta.href}
                className="mt-2 inline-block text-sm font-semibold hover:underline"
              >
                {card.cta.label}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Submit for review — the business admin only */}
      {profile && can('submitBusinessForReview') && <SubmitForReviewCard profile={profile} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Business status"
          value={isLoading ? skeleton('w-20') : <StatusBadge status={status} />}
          icon={Store}
        />
        <StatCard
          label="Showrooms"
          value={isLoading ? skeleton('w-8') : showrooms}
          sub={
            showrooms === 0
              ? 'None added yet'
              : showrooms === 1
                ? '1 location'
                : `${showrooms} locations`
          }
          icon={Store}
        />
        {can('manageDocuments') && (
          <StatCard
            label="Documents"
            value={isLoading ? skeleton('w-8') : documents}
            sub={documents === 0 ? 'None uploaded' : `${documents} uploaded`}
            icon={FileText}
          />
        )}
      </div>

      {/* Completeness (owner) + Quick Actions */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {can('editBusinessProfile') && (
          <Card className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Profile completeness</p>
              <Link
                href="/provider/profile"
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Edit profile
              </Link>
            </div>

            {isLoading ? (
              <div className="h-2 w-full animate-pulse rounded-full bg-surface-hover" />
            ) : (
              <CompletenessBar score={completeness} />
            )}

            {!isLoading && stillNeeded.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-text-muted">Still needed</p>
                <ul className="space-y-1">
                  {stillNeeded.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isLoading && profile && stillNeeded.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                All required information provided
              </p>
            )}
          </Card>
        )}

        {quickActions.length > 0 && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-ink">Quick actions</p>
            <nav className="space-y-1">
              {quickActions.map((action) => {
                const disabled = action.gated && !canAddVehicle;
                const Icon = action.icon;
                if (disabled) {
                  return (
                    <span
                      key={action.label}
                      title={
                        status !== ProviderStatus.APPROVED
                          ? 'Available after the business is approved'
                          : 'A showroom is needed first'
                      }
                      className="flex cursor-not-allowed select-none items-center gap-2.5 rounded-control px-3 py-2 text-sm text-text-faint"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </span>
                  );
                }
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-surface-hover hover:text-brand-600"
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                );
              })}
            </nav>
          </Card>
        )}
      </div>
    </div>
  );
}
