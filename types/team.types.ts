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

/** One row of GET /providers/me/team — every membership the business ever had, newest invite first. */
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
  joinedAt: string | null;
  user?: {
    id: string;
    email: string;
    phone: string | null;
    driverProfile?: BusinessTeamDriverProfile | null;
  } | null;
}

/** POST /providers/me/team/invites — InviteTeamMemberDto. */
export interface InviteTeamMemberPayload {
  fullName: string;
  email: string;
  phone?: string;
  role: BusinessRole.MANAGER | BusinessRole.DRIVER;
}
