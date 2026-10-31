'use client';

import { CheckCircle2, AlertCircle, Mail, Phone } from 'lucide-react';
import { Avatar, Button, Card } from '../../ui';
import { StatusBadge } from '../../common/StatusBadge';
import { BusinessRole, DriverVerificationStatus } from '../../../types/enums';
import { MembershipStatus, type BusinessTeamMember } from '../../../types/team.types';
import {
  BUSINESS_ROLE_LABELS,
  DRIVER_VERIFICATION_LABELS,
  MEMBERSHIP_STATUS_LABELS,
  driverReadiness,
  formatShortDate,
  isPastMember,
  memberName,
} from '../../../lib/team/teamGroups';

interface TeamMemberCardProps {
  member: BusinessTeamMember;
  /** Today's date, "YYYY-MM-DD" — for the licence check. */
  today: string;
  /** Whether this dashboard may remove the member / cancel the invite (manageableTeamRoles). */
  canManage: boolean;
  onRemove: () => void;
}

// One team member, as the Partner app's Team screen shows it: name, role and
// invite email, the membership badge and (a current driver) the verification
// badge, licence details and whether they can be given jobs — plus the dates
// they were invited and joined (or left).
export function TeamMemberCard({ member, today, canManage, onRemove }: TeamMemberCardProps) {
  const past = isPastMember(member);
  const isInvited = member.status === MembershipStatus.INVITED;
  const isDriver = member.role === BusinessRole.DRIVER;
  const driver = member.user?.driverProfile ?? null;
  const name = memberName(member);
  const email = member.inviteEmail ?? member.user?.email ?? null;
  const phone = member.invitePhone ?? member.user?.phone ?? null;
  const verification = driver?.verificationStatus ?? DriverVerificationStatus.UNVERIFIED;
  const readiness = isDriver && !past && !isInvited ? driverReadiness(driver, today) : null;

  return (
    <Card padding="sm" className={past ? 'opacity-80' : undefined}>
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="mt-0.5 text-xs text-text-muted">{BUSINESS_ROLE_LABELS[member.role]}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
            {email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </span>
            ) : null}
            {phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            status={member.status === MembershipStatus.DECLINED ? 'REJECTED' : member.status}
            label={MEMBERSHIP_STATUS_LABELS[member.status]}
            size="sm"
          />
          {isDriver && !past ? (
            <StatusBadge status={verification} label={DRIVER_VERIFICATION_LABELS[verification]} size="sm" />
          ) : null}
        </div>
      </div>

      {driver && !past ? (
        <div className="mt-3 space-y-0.5 text-xs text-text-muted">
          <p>
            Experience: {driver.experienceYears ?? 0} years · Category: {driver.licenseCategory || 'N/A'}
            {driver.city ? ` · ${driver.city}` : ''}
          </p>
          {driver.licenseExpiry ? (
            <p>License valid until {formatShortDate(driver.licenseExpiry)}</p>
          ) : null}
        </div>
      ) : null}

      {readiness ? (
        readiness.ready ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready to be assigned jobs
          </p>
        ) : (
          <p className="mt-2 inline-flex items-start gap-1.5 text-xs font-medium text-amber-700">
            <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            Can&apos;t be assigned jobs yet: {readiness.reasons.join(' · ')}
          </p>
        )
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
        <p className="text-xs text-text-faint">
          Invited {formatShortDate(member.invitedAt)}
          {member.joinedAt ? ` · Joined ${formatShortDate(member.joinedAt)}` : ''}
          {member.status === MembershipStatus.INACTIVE ? ' · No longer a member' : ''}
          {member.status === MembershipStatus.DECLINED ? ' · Declined the invite' : ''}
        </p>
        {!past && canManage ? (
          <Button size="sm" variant="ghost" className="text-red-700" onClick={onRemove}>
            {isInvited ? 'Cancel invite' : 'Remove'}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
