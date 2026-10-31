import { BusinessRole, DriverVerificationStatus } from '../../types/enums';
import {
  MembershipStatus,
  type BusinessTeamDriverProfile,
  type BusinessTeamMember,
} from '../../types/team.types';

// The Team page's groups and labels — kerayego-partner's
// features/team/teamGroups.ts, plus the web page's per-role sections.
// GET /providers/me/team returns every membership the business ever had:
// members are never deleted, a removed or departed one becomes INACTIVE and a
// refused invite DECLINED. Current members (ACTIVE, INVITED) are listed;
// the rest go under a collapsed "Past members".

const PAST_STATUSES: ReadonlySet<MembershipStatus> = new Set([
  MembershipStatus.INACTIVE,
  MembershipStatus.DECLINED,
]);

/** True for a membership that has ended (INACTIVE or DECLINED) — no Remove button for these. */
export function isPastMember(member: Pick<BusinessTeamMember, 'status'>): boolean {
  return PAST_STATUSES.has(member.status);
}

export interface TeamSections<T> {
  managers: T[];
  drivers: T[];
  invites: T[];
  past: T[];
}

/** Active managers, active drivers, pending invites and past members, each in the backend's order. */
export function groupTeam<T extends Pick<BusinessTeamMember, 'status' | 'role'>>(
  members: readonly T[],
): TeamSections<T> {
  const sections: TeamSections<T> = { managers: [], drivers: [], invites: [], past: [] };
  for (const member of members) {
    if (isPastMember(member)) sections.past.push(member);
    else if (member.status === MembershipStatus.INVITED) sections.invites.push(member);
    else if (member.role === BusinessRole.MANAGER) sections.managers.push(member);
    else if (member.role === BusinessRole.DRIVER) sections.drivers.push(member);
  }
  return sections;
}

/** The member's name: their invite name, else their driver profile's, else their email. */
export function memberName(member: BusinessTeamMember): string {
  return (
    member.inviteName?.trim() ||
    member.user?.driverProfile?.fullName?.trim() ||
    member.user?.email ||
    member.inviteEmail ||
    'Team member'
  );
}

/** Never a bare "Admin" — on this site that means KerayeGo admin. */
export const BUSINESS_ROLE_LABELS: Record<BusinessRole, string> = {
  [BusinessRole.BUSINESS_ADMIN]: 'Business admin',
  [BusinessRole.MANAGER]: 'Manager',
  [BusinessRole.DRIVER]: 'Driver',
};

/** Badge wording per membership status (Partner's membershipStatusMeta). Tone comes from StatusBadge. */
export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  [MembershipStatus.INVITED]: 'Invited',
  [MembershipStatus.ACTIVE]: 'Active',
  [MembershipStatus.INACTIVE]: 'Inactive',
  [MembershipStatus.DECLINED]: 'Declined',
};

/** Badge wording per driver verification status (Partner's driverVerificationStatusMeta). */
export const DRIVER_VERIFICATION_LABELS: Record<DriverVerificationStatus, string> = {
  [DriverVerificationStatus.UNVERIFIED]: 'Unverified',
  [DriverVerificationStatus.PENDING_REVIEW]: 'Under Review',
  [DriverVerificationStatus.VERIFIED]: 'Verified',
  [DriverVerificationStatus.REJECTED]: 'Rejected',
};

/** The backend's driver-assignment reasons (driver-assignment.service.ts DRIVER_REASONS). */
export const DRIVER_NOT_READY = {
  notVerified: 'Not verified yet',
  noLicenceExpiry: 'No licence expiry on file',
  licenceExpired: 'Licence expired',
} as const;

/**
 * Whether a driver can be given jobs, by the backend's assignment rules that
 * don't depend on a booking: VERIFIED and a licence valid today. (A booking
 * also needs the licence valid until it ends, and the driver free then — the
 * booking page checks those.) Empty reasons = ready.
 */
export function driverReadiness(
  profile: BusinessTeamDriverProfile | null | undefined,
  today: string,
): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (profile?.verificationStatus !== DriverVerificationStatus.VERIFIED)
    reasons.push(DRIVER_NOT_READY.notVerified);
  const expiry = profile?.licenseExpiry?.slice(0, 10);
  if (!expiry) reasons.push(DRIVER_NOT_READY.noLicenceExpiry);
  else if (expiry < today) reasons.push(DRIVER_NOT_READY.licenceExpired);
  return { ready: reasons.length === 0, reasons };
}

/** "5 Nov 2026". */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
