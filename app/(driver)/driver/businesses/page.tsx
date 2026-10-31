'use client';

import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, EmptyState, ErrorState } from '../../../../components/ui';
import { BusinessMembershipCard } from '../../../../components/driver/DriverBusinessCards';
import {
  useAcceptBusinessInvite,
  useLeaveBusiness,
  useMyDriverBusinesses,
} from '../../../../hooks/useDriverBusinesses';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import { formatDate } from '../../../../lib/driver/fields';
import { groupDriverBusinesses, pendingManagerInvites } from '../../../../lib/driver/jobs';
import { BusinessRole } from '../../../../types/enums';
import type { DriverLinkedBusiness } from '../../../../types/driver.types';

type Confirming = { kind: 'decline' | 'leave'; member: DriverLinkedBusiness };

// The driver's businesses (kerayego-partner app/(driver)/(tabs)/driver/businesses.tsx
// and features/driver/components/ManagerInvitations.tsx, A13, A38, A52, A54):
// invitations to manage a business, invitations to drive for one (Accept /
// Decline), and the businesses this driver works for now (Leave, after a
// confirmation). GET /driver/businesses; accept is POST
// /driver/businesses/:memberId/accept, decline and leave are /leave. Accepting
// or leaving refetches the workspaces (a dashboard may appear or go). A
// manager invitation the backend refuses (409: already owns or manages a
// business) shows its message as-is.
export default function DriverBusinessesPage() {
  const businessesQuery = useMyDriverBusinesses();
  const acceptInvite = useAcceptBusinessInvite();
  const leaveBusiness = useLeaveBusiness();
  const [confirming, setConfirming] = useState<Confirming | null>(null);

  const busy = acceptInvite.isPending || leaveBusiness.isPending;

  const accept = (member: DriverLinkedBusiness) => {
    const name = member.providerProfile.businessName;
    acceptInvite.mutate(member.id, {
      onSuccess: () =>
        toast.success('Invitation accepted', {
          description:
            member.role === BusinessRole.MANAGER
              ? `You now manage ${name}. Switch to the Business dashboard with the dashboard switcher in the sidebar.`
              : `You now drive for ${name}.`,
        }),
      onError: (err) =>
        toast.error('Could not accept', { description: getApiErrorMessage(err, 'Please try again.') }),
    });
  };

  const confirmLeaveOrDecline = () => {
    if (!confirming) return;
    const { kind, member } = confirming;
    leaveBusiness.mutate(member.id, {
      onSuccess: () => setConfirming(null),
      onError: (err) => {
        setConfirming(null);
        toast.error(kind === 'leave' ? 'Could not leave' : 'Could not decline', {
          description: getApiErrorMessage(err, 'Please try again.'),
        });
      },
    });
  };

  const memberships = businessesQuery.data;
  const { active, invitations } = groupDriverBusinesses(memberships);
  const managerInvites = pendingManagerInvites(memberships);
  const confirmName = confirming?.member.providerProfile.businessName ?? '';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Businesses</h1>
        <p className="mt-1 text-sm text-text-muted">The rental businesses you drive for, and their invitations.</p>
      </div>

      {businessesQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
        </div>
      ) : businessesQuery.isError ? (
        <ErrorState
          title="We couldn't load your businesses"
          description={getApiErrorMessage(businessesQuery.error, 'Something went wrong while loading this page.')}
          onRetry={() => void businessesQuery.refetch()}
        />
      ) : (
        <div className="space-y-8">
          {managerInvites.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Invitations to manage a business</h2>
              <ul className="space-y-3">
                {managerInvites.map((member) => (
                  <li key={member.id}>
                    <BusinessMembershipCard
                      member={member}
                      showStatus={false}
                      detail={`Invited as manager · ${formatDate(member.invitedAt)}`}
                      note="As a manager you handle booking requests, assign drivers and manage the business's drivers."
                    >
                      <InviteButtons
                        busy={busy}
                        accepting={acceptInvite.isPending && acceptInvite.variables === member.id}
                        onAccept={() => accept(member)}
                        onDecline={() => setConfirming({ kind: 'decline', member })}
                      />
                    </BusinessMembershipCard>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {invitations.length === 0 && active.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No businesses yet"
              description="When a rental business invites you to drive for them, the invitation appears here."
            />
          ) : null}

          {invitations.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Invitations</h2>
              <ul className="space-y-3">
                {invitations.map((member) => (
                  <li key={member.id}>
                    <BusinessMembershipCard member={member} detail={`Invited ${formatDate(member.invitedAt)}`}>
                      <InviteButtons
                        busy={busy}
                        accepting={acceptInvite.isPending && acceptInvite.variables === member.id}
                        onAccept={() => accept(member)}
                        onDecline={() => setConfirming({ kind: 'decline', member })}
                      />
                    </BusinessMembershipCard>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {active.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Businesses you drive for</h2>
              <ul className="space-y-3">
                {active.map((member) => (
                  <li key={member.id}>
                    <BusinessMembershipCard
                      member={member}
                      detail={member.joinedAt ? `Joined ${formatDate(member.joinedAt)}` : undefined}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setConfirming({ kind: 'leave', member })}
                      >
                        Leave
                      </Button>
                    </BusinessMembershipCard>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open && !leaveBusiness.isPending) setConfirming(null);
        }}
        title={confirming?.kind === 'leave' ? `Leave ${confirmName}?` : `Decline ${confirmName}?`}
        description={
          confirming?.kind === 'leave'
            ? 'You will no longer be assigned their bookings. They would need to invite you again.'
            : 'The business will see that you declined.'
        }
        confirmLabel={confirming?.kind === 'leave' ? 'Leave' : 'Decline'}
        cancelLabel="Cancel"
        loading={leaveBusiness.isPending}
        onConfirm={confirmLeaveOrDecline}
      />
    </div>
  );
}

function InviteButtons({
  busy,
  accepting,
  onAccept,
  onDecline,
}: {
  busy: boolean;
  accepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <>
      <Button size="sm" loading={accepting} disabled={busy} onClick={onAccept}>
        Accept
      </Button>
      <Button size="sm" variant="secondary" disabled={busy} onClick={onDecline}>
        Decline
      </Button>
    </>
  );
}
