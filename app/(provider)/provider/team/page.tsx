'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, Button, Card, EmptyState, ErrorState, Modal, SegmentedTabs } from '../../../../components/ui';
import { TeamMemberCard } from '../../../../components/business/team/TeamMemberCard';
import { InviteMemberModal } from '../../../../components/business/team/InviteMemberModal';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { useMyTeam, useRemoveTeamMember } from '../../../../hooks/useTeam';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import { useAuthStore } from '../../../../store/auth.store';
import { manageableTeamRoles } from '../../../../lib/workspace/workspaceSelection';
import { BusinessRole } from '../../../../types/enums';
import { MembershipStatus, type BusinessTeamMember } from '../../../../types/team.types';
import { groupTeam, memberName } from '../../../../lib/team/teamGroups';

// The business team — kerayego-partner app/(business)/business/team. Business
// admin and manager (can('viewTeam'), the layout guards it). A business admin
// invites and removes managers and drivers; a manager drivers only
// (manageableTeamRoles, A52). Members are never deleted: removed, departed
// and declined ones sit under a collapsed "Past members".

type Filter = 'ALL' | 'MANAGERS' | 'DRIVERS';

/** Today in the browser's calendar, "YYYY-MM-DD" (for the licence check). */
function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** What removing this member does, for the confirm dialog. */
function removalCopy(member: BusinessTeamMember): { title: string; body: string; confirm: string } {
  const name = memberName(member);
  if (member.status === MembershipStatus.INVITED) {
    return {
      title: `Cancel the invite to ${name}?`,
      body: `${name} won't be able to accept it and won't join this business. You can invite them again later.`,
      confirm: 'Cancel invite',
    };
  }
  if (member.role === BusinessRole.DRIVER) {
    return {
      title: `Remove ${name}?`,
      body:
        `They will no longer have access to this business. Accepted bookings assigned to them that haven't ` +
        `started yet are unassigned, so you'll need to assign another driver; a job already under way isn't ` +
        `affected. The business admin and managers are told. They move to Past members.`,
      confirm: 'Remove driver',
    };
  }
  return {
    title: `Remove ${name}?`,
    body:
      'They will no longer have access to this business: its bookings, cars, drivers and live map. ' +
      'They move to Past members.',
    confirm: 'Remove manager',
  };
}

export default function ProviderTeamPage() {
  const { active, workspaces, can } = useWorkspace();
  const user = useAuthStore((s) => s.user);
  const manageable = manageableTeamRoles(active) as (BusinessRole.MANAGER | BusinessRole.DRIVER)[];
  const teamQuery = useMyTeam();
  const removeMember = useRemoveTeamMember();

  const [filter, setFilter] = useState<Filter>('ALL');
  const [pastOpen, setPastOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<BusinessTeamMember | null>(null);
  const today = useMemo(localToday, []);

  const isOwner = can('inviteManagers');
  const title = isOwner ? 'Team & drivers' : 'Drivers';
  const businessName = workspaces.find((w) => w.role === active)?.businessName ?? 'this business';

  const filtered = useMemo(
    () =>
      (teamQuery.data ?? []).filter((m) => {
        if (filter === 'MANAGERS') return m.role === BusinessRole.MANAGER;
        if (filter === 'DRIVERS') return m.role === BusinessRole.DRIVER;
        return true;
      }),
    [teamQuery.data, filter],
  );
  const sections = groupTeam(filtered);
  const currentCount = sections.managers.length + sections.drivers.length + sections.invites.length;

  const confirmRemove = () => {
    if (!removing) return;
    const member = removing;
    removeMember.mutate(member.id, {
      onSuccess: () => {
        toast.success(
          member.status === MembershipStatus.INVITED
            ? `Invite to ${memberName(member)} cancelled`
            : `${memberName(member)} removed`,
        );
        setRemoving(null);
      },
      onError: (err) =>
        toast.error(getApiErrorMessage(err, 'Could not remove member')),
    });
  };

  const renderList = (members: BusinessTeamMember[]) => (
    <div className="space-y-3">
      {members.map((member) => (
        <TeamMemberCard
          key={member.id}
          member={member}
          today={today}
          canManage={manageable.includes(member.role as BusinessRole.MANAGER | BusinessRole.DRIVER)}
          onRemove={() => setRemoving(member)}
        />
      ))}
    </div>
  );

  const section = (heading: string, members: BusinessTeamMember[], hint?: string) =>
    members.length > 0 ? (
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            {heading} <span className="font-normal text-text-muted">({members.length})</span>
          </h2>
          {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
        </div>
        {renderList(members)}
      </section>
    ) : null;

  const removal = removing ? removalCopy(removing) : null;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {isOwner
              ? 'Invite managers to help run operations, and drivers to assign them bookings.'
              : 'Invite drivers to assign them bookings, and manage your driver team.'}
          </p>
        </div>
        {manageable.length > 0 ? (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        ) : null}
      </div>

      {teamQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-surface-hover" />
          ))}
        </div>
      ) : teamQuery.isError ? (
        <ErrorState
          title="We couldn't load your team"
          description={getApiErrorMessage(teamQuery.error, 'Something went wrong while fetching your team.')}
          onRetry={() => void teamQuery.refetch()}
        />
      ) : (
        <>
          <SegmentedTabs
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'MANAGERS', label: 'Managers' },
              { value: 'DRIVERS', label: 'Drivers' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
          />

          {/* The business admin is the owner, not a team row (GET /providers/me/team lists members only). */}
          {filter === 'ALL' ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Business admin</h2>
              <Card padding="sm" className="flex items-center gap-3">
                <Avatar name={isOwner ? (user?.name ?? 'You') : businessName} tone="brand" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {isOwner ? `${user?.name ?? 'You'} (you)` : 'The business owner'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {isOwner
                      ? 'Runs the business profile, showrooms, documents and the whole team.'
                      : `Owns ${businessName} and manages its profile, showrooms and managers.`}
                  </p>
                </div>
              </Card>
            </section>
          ) : null}

          {currentCount === 0 ? (
            <EmptyState
              icon={Users}
              title={sections.past.length > 0 ? 'No current team members' : 'No team members yet'}
              description={
                manageable.includes(BusinessRole.MANAGER)
                  ? 'Invite managers to help run operations, or drivers to assign bookings and trips.'
                  : 'Invite drivers to assign them bookings and trips.'
              }
              action={
                manageable.length > 0
                  ? { label: 'Invite member', onClick: () => setInviteOpen(true) }
                  : undefined
              }
            />
          ) : (
            <>
              {section('Managers', sections.managers)}
              {section('Drivers', sections.drivers)}
              {section(
                'Pending invites',
                sections.invites,
                "Waiting for them to accept. Invites go to the email address you entered.",
              )}
            </>
          )}

          {sections.past.length > 0 ? (
            <section className="space-y-3">
              <button
                type="button"
                onClick={() => setPastOpen((open) => !open)}
                aria-expanded={pastOpen}
                className="flex w-full items-center justify-between rounded-control py-1 text-left text-sm font-semibold text-ink hover:text-brand-700"
              >
                <span>Past members ({sections.past.length})</span>
                <span className="inline-flex items-center gap-1 text-brand-700">
                  {pastOpen ? 'Hide' : 'Show'}
                  {pastOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>
              {pastOpen ? (
                <>
                  <p className="text-xs text-text-muted">
                    Removed, left, or declined the invite. They no longer have access to this business.
                  </p>
                  {renderList(sections.past)}
                </>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      <InviteMemberModal open={inviteOpen} onOpenChange={setInviteOpen} roles={manageable} />

      <Modal
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !removeMember.isPending) setRemoving(null);
        }}
        title={removal?.title ?? ''}
        description={removal?.body}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)} disabled={removeMember.isPending}>
              Keep
            </Button>
            <Button variant="danger" loading={removeMember.isPending} onClick={confirmRemove}>
              {removal?.confirm ?? 'Remove'}
            </Button>
          </>
        }
      />
    </div>
  );
}
