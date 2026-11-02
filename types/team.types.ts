import type { BusinessRole, DriverVerificationStatus } from './enums';

// The business team (GET /providers/me/team and friends) — hand-written from
// kerayego-backend business-team.service.ts, same as kerayego-partner's
// types/team.types.ts. If this and the backend ever disagree, the backend is
// right.

/**
 * BusinessMember.status. Members are never deleted: a removed or departed one
 * becomes INACTIVE, a refused invite DECLINED. Only ACTIVE is a working
 * member. (Kept here rather than in types/enums.ts, which this area doesn't own.)
 */
export enum MembershipStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DECLINED = 'DECLINED',
}

export interface BusinessTeamDriverProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  city: string | null;
  experienceYears: number | null;
  licenseCategory: string | null;
  licenseExpiry: string | null;
  verificationStatus: DriverVerificationStatus;
  isOpenToWork: boolean;
}

/** The account of an ACTIVE member — contact details and driver profile. */
export interface BusinessTeamActiveUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  driverProfile: BusinessTeamDriverProfile | null;
}

/** What's kept of a past member (INACTIVE after having joined), for history. */
export interface BusinessTeamPastUser {
  id: string;
  name: string;
}

/**
 * One row of GET /providers/me/team — every membership the business ever had,
 * newest invite first (backend presentTeamMember, business-member.view.ts).
 * `userId` and `user` are null for pending, expired, declined and cancelled
 * invites — show inviteName / inviteEmail / invitePhone. `user` is the full
 * account only while ACTIVE, and `{ id, name }` for a past member.
 */
export interface BusinessTeamMember {
  id: string;
  providerProfileId: string;
  userId: string | null;
  inviteEmail: string | null;
  invitePhone: string | null;
  inviteName: string | null;
  role: BusinessRole;
  status: MembershipStatus;
  invitedAt: string;
  /** When a pending invite runs out (7 days after it was sent or re-sent); null on legacy rows. */
  expiresAt: string | null;
  /** A pending (INVITED) invite past its 7 days — it can no longer be accepted; "Send again" re-sends it. */
  expired: boolean;
  joinedAt: string | null;
  user: BusinessTeamActiveUser | BusinessTeamPastUser | null;
}

/** POST /providers/me/team/invites — InviteTeamMemberDto. */
export interface InviteTeamMemberPayload {
  fullName: string;
  email: string;
  phone?: string;
  role: BusinessRole.MANAGER | BusinessRole.DRIVER;
}
