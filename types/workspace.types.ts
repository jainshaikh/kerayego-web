import type { BusinessRole, DriverVerificationStatus, ProviderStatus } from './enums';

// GET /users/me/workspaces — which business/driver dashboards this person has.
// Hand-written from the backend contract (kerayego-backend
// src/modules/users/dto/workspaces.response.ts), same as kerayego-partner's
// types/workspace.types.ts. If this and the backend ever disagree, the backend
// is right.

export interface BusinessAdminWorkspace {
  businessId: string;
  businessName: string;
  verificationStatus: ProviderStatus;
}

export interface ManagerWorkspace {
  businessId: string;
  businessName: string;
  verificationStatus: ProviderStatus;
  memberId: string;
}

export interface DriverWorkspace {
  hasProfile: boolean;
  verificationStatus: DriverVerificationStatus | null;
  activeBusinessCount: number;
  pendingInviteCount: number;
}

export interface MyWorkspaces {
  /** The business this person owns, or null. */
  businessAdmin: BusinessAdminWorkspace | null;
  /** The one business this person is an active manager of, or null. */
  manager: ManagerWorkspace | null;
  /** This person as an independent driver (a driver profile or any invited/active driver membership), or null. */
  driver: DriverWorkspace | null;
  /** Whether "Set up my rental business" may be offered (owns no business, manages none). */
  canCreateBusiness: boolean;
}

/** A dashboard a person can work in — the same three names as a business member's role. */
export type WorkspaceRole = BusinessRole;

/** One dashboard in the switcher, as useWorkspace().workspaces lists it. */
export interface Workspace {
  role: WorkspaceRole;
  /** "Business admin", "Manager" or "Driver" — never a bare "Admin" (that means KerayeGo admin here). */
  label: string;
  /** The business, for Business admin and Manager; null for Driver. */
  businessId: string | null;
  businessName: string | null;
  /** The business's status (Business admin, Manager) or the driver profile's (Driver; null without a profile). */
  verificationStatus: ProviderStatus | DriverVerificationStatus | null;
  /** Where switching to this dashboard navigates: /provider/dashboard or /driver/jobs. */
  home: string;
}
