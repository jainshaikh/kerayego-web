'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, CarTaxiFront, Lock } from 'lucide-react';
import { Button, Card, ErrorState } from '../ui';
import { useWorkspace, type Workspace } from '../../hooks/useWorkspace';
import { useAuthStore } from '../../store/auth.store';
import { BusinessRole, Role } from '../../types/enums';
import { WORKSPACE_HOME, WORKSPACE_LABELS } from '../../lib/workspace/workspaceRoutes';

// Full-page states the business and driver portal layouts show instead of a
// page: loading/failed dashboards, "no business dashboard", "switch to the
// right dashboard", and "not for your role". Pages under /provider and
// /driver don't need to render these themselves — the layouts already do.

export function WorkspaceLoadingScreen() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-control bg-surface-hover" />
      <div className="h-4 w-80 max-w-full rounded-control bg-surface-hover" />
      <div className="h-48 rounded-card bg-surface-hover" />
    </div>
  );
}

export function WorkspaceErrorScreen() {
  const { refetch } = useWorkspace();
  return (
    <ErrorState
      title="We couldn't load your dashboards"
      description="Check your connection and try again."
      onRetry={refetch}
    />
  );
}

function ScreenCard({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <Card padding="lg" className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-surface-hover text-text-muted">
        {icon}
      </div>
      <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-text-muted">{body}</p>
      <div className="mt-6 flex flex-col items-stretch gap-2.5">{children}</div>
    </Card>
  );
}

/** Link back to the person's own account: /dashboard, or a PROVIDER account's own carpool pages. */
function BackToMyAccount() {
  const isProviderAccount = useAuthStore((s) => s.user?.role === Role.PROVIDER);
  return (
    <Link
      href={isProviderAccount ? '/provider/trips' : '/dashboard'}
      className="mt-1 text-sm font-medium text-text-muted transition-colors hover:text-ink"
    >
      {isProviderAccount ? 'Back to my carpool' : 'Back to my dashboard'}
    </Link>
  );
}

/** The person has a dashboard for this portal but is working in another one: one click to switch. */
export function SwitchWorkspaceScreen({ workspace }: { workspace: Workspace }) {
  const { active, select } = useWorkspace();
  const router = useRouter();
  const isDriver = workspace.role === BusinessRole.DRIVER;
  return (
    <ScreenCard
      icon={isDriver ? <CarTaxiFront className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
      title={isDriver ? 'Switch to your driver dashboard' : 'Switch to your business dashboard'}
      body={
        active
          ? `You're working as ${WORKSPACE_LABELS[active]}. This page is part of your ${workspace.label} dashboard${
              workspace.businessName ? ` for ${workspace.businessName}` : ''
            }.`
          : 'This page is part of another dashboard.'
      }
    >
      <Button onClick={() => select(workspace.role)}>
        Switch to {workspace.label}
        {workspace.businessName ? ` · ${workspace.businessName}` : ''}
      </Button>
      {active && (
        <Button variant="secondary" onClick={() => router.push(WORKSPACE_HOME[active])}>
          Stay as {WORKSPACE_LABELS[active]}
        </Button>
      )}
      <BackToMyAccount />
    </ScreenCard>
  );
}

/** /provider for someone with no business dashboard: set one up, become a driver, or go back. */
export function NoBusinessScreen() {
  const { data, workspaces, select } = useWorkspace();
  const router = useRouter();
  const driver = workspaces.find((w) => w.role === BusinessRole.DRIVER);
  return (
    <ScreenCard
      icon={<Building2 className="h-6 w-6" />}
      title="You don't have a business dashboard"
      body="Rental businesses manage their cars, bookings and team here. Drivers work for rental businesses from their own driver dashboard."
    >
      {data?.canCreateBusiness && (
        <Link
          href="/provider/profile"
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all hover:-translate-y-0.5"
        >
          Set up my rental business <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      {driver ? (
        <Button
          variant="secondary"
          onClick={() => {
            select(driver.role);
            router.push(driver.home);
          }}
        >
          Open my driver dashboard
        </Button>
      ) : (
        <Link
          href="/driver/profile"
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-600 hover:text-brand-700"
        >
          Become a driver
        </Link>
      )}
      <BackToMyAccount />
    </ScreenCard>
  );
}

/** /driver for someone who isn't a driver (no driver profile, no invites). */
export function NotADriverScreen() {
  return (
    <ScreenCard
      icon={<CarTaxiFront className="h-6 w-6" />}
      title="You're not a driver yet"
      body="Create your driver profile to work for rental businesses on KerayeGo. KerayeGo checks your CNIC and licence before you can take jobs."
    >
      <Link
        href="/driver/profile"
        className="inline-flex h-[42px] items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all hover:-translate-y-0.5"
      >
        Become a driver <ArrowRight className="h-4 w-4" />
      </Link>
      <BackToMyAccount />
    </ScreenCard>
  );
}

/** A page the active dashboard doesn't offer (can() is false), e.g. a manager opening the business profile. */
export function NotForYourRoleScreen() {
  const { active } = useWorkspace();
  const isBusiness = active === BusinessRole.BUSINESS_ADMIN || active === BusinessRole.MANAGER;
  return (
    <ScreenCard
      icon={<Lock className="h-6 w-6" />}
      title="Not available in this dashboard"
      body={
        active === BusinessRole.MANAGER
          ? 'Only the business admin can open this page.'
          : `This page isn't part of the ${active ? WORKSPACE_LABELS[active] : ''} dashboard.`
      }
    >
      <Link
        href={isBusiness ? '/provider/dashboard' : '/driver/jobs'}
        className="inline-flex h-[42px] items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-600 hover:text-brand-700"
      >
        {isBusiness ? 'Go to the business dashboard' : 'Go to my jobs'}
      </Link>
    </ScreenCard>
  );
}
