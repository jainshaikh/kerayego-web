import { BusinessRole } from '../../types/enums';
import type { MyWorkspaces, WorkspaceRole } from '../../types/workspace.types';

// ─────────────────────────────────────────────────────────────────────────────
// KEEP IDENTICAL TO kerayego-partner/src/features/workspace/workspaceSelection.ts
//
// This is a copy of the KerayeGo Partner app's dashboard table: which
// dashboards a person has, which one opens, and what each may do. The website
// must offer a business exactly what the Partner app does, so the two files
// change together — edit both in the same change, never only one. Only the
// import paths above differ. There is no shared package or codegen keeping
// them in step.
// ─────────────────────────────────────────────────────────────────────────────

// Which dashboards a person has, which one opens, and what each may do
// (plan A26, A52–A55). Pure, so it's unit-tested. UX only — the backend
// decides every permission itself (A3).

/** The order dashboards are offered in; the first available one is the default. */
const WORKSPACE_ORDER: readonly WorkspaceRole[] = [
  BusinessRole.BUSINESS_ADMIN,
  BusinessRole.MANAGER,
  BusinessRole.DRIVER,
];

/** Every dashboard GET /users/me/workspaces gives this person, in WORKSPACE_ORDER. */
export function availableWorkspaces(data: MyWorkspaces | null | undefined): WorkspaceRole[] {
  if (!data) return [];
  return WORKSPACE_ORDER.filter((role) => {
    if (role === BusinessRole.BUSINESS_ADMIN) return data.businessAdmin !== null;
    if (role === BusinessRole.MANAGER) return data.manager !== null;
    return data.driver !== null;
  });
}

/** The remembered dashboard if it's still available, else the first available one, else null (welcome screen). */
export function resolveActiveWorkspace(
  available: readonly WorkspaceRole[],
  remembered: WorkspaceRole | null | undefined,
): WorkspaceRole | null {
  if (remembered && available.includes(remembered)) return remembered;
  return available[0] ?? null;
}

/** Business admin and manager share the (business) tabs; a driver has the (driver) tabs. */
export function isBusinessWorkspace(role: WorkspaceRole | null | undefined): boolean {
  return role === BusinessRole.BUSINESS_ADMIN || role === BusinessRole.MANAGER;
}

/** A stored value read back from storage, if it is a real dashboard name. */
export function parseWorkspaceRole(value: unknown): WorkspaceRole | null {
  return typeof value === 'string' && (WORKSPACE_ORDER as readonly string[]).includes(value)
    ? (value as WorkspaceRole)
    : null;
}

/** The switcher's button text for moving to `role`. */
export const workspaceSwitchLabels: Record<WorkspaceRole, string> = {
  [BusinessRole.BUSINESS_ADMIN]: 'Switch to Business',
  [BusinessRole.MANAGER]: 'Switch to Business',
  [BusinessRole.DRIVER]: 'Switch to Driver',
};

// ─── What each dashboard may do ─────────────────────────────────────────────

export type WorkspaceAction =
  // The business itself (A52: owner only).
  | 'editBusinessProfile'
  | 'manageShowrooms'
  | 'manageDocuments'
  | 'submitBusinessForReview'
  | 'viewActivityLogs'
  // Privately rating a completed rental's customer: the backend lets only the
  // owner (providerProfile.userId) do it for the business (reviews.service.ts
  // createForBooking). A driver rates their own jobs' customers under driverJobs.
  | 'rateCustomers'
  // Cars (A52, updated 2026-10-30): everyone in the business sees them; the
  // owner and a manager edit details, prices and photos; only the owner adds
  // a car, submits it for review or archives it.
  | 'viewFleet'
  | 'editFleet'
  | 'manageFleet'
  // Operations (A52: owner and manager).
  | 'manageBookings'
  | 'viewTeam'
  | 'inviteManagers'
  | 'inviteDrivers'
  | 'viewLiveMap'
  | 'viewRatings'
  // The driver's own work (A13, A26).
  | 'driverJobs'
  | 'driverBusinesses'
  | 'driverProfile';

const OPERATIONS: readonly WorkspaceAction[] = [
  'viewFleet',
  'editFleet',
  'manageBookings',
  'viewTeam',
  'inviteDrivers',
  'viewLiveMap',
  'viewRatings',
];

const PERMISSIONS: Record<WorkspaceRole, readonly WorkspaceAction[]> = {
  [BusinessRole.BUSINESS_ADMIN]: [
    ...OPERATIONS,
    'editBusinessProfile',
    'manageShowrooms',
    'manageDocuments',
    'submitBusinessForReview',
    'viewActivityLogs',
    'rateCustomers',
    'manageFleet',
    'inviteManagers',
  ],
  [BusinessRole.MANAGER]: OPERATIONS,
  [BusinessRole.DRIVER]: ['driverJobs', 'driverBusinesses', 'driverProfile'],
};

/** Whether the `role` dashboard offers `action`. No dashboard: nothing. */
export function can(role: WorkspaceRole | null | undefined, action: WorkspaceAction): boolean {
  return role ? PERMISSIONS[role].includes(action) : false;
}

/** The team roles this dashboard may invite or remove (A52: a manager handles drivers only). */
export function manageableTeamRoles(role: WorkspaceRole | null | undefined): BusinessRole[] {
  const roles: BusinessRole[] = [];
  if (can(role, 'inviteDrivers')) roles.push(BusinessRole.DRIVER);
  if (can(role, 'inviteManagers')) roles.push(BusinessRole.MANAGER);
  return roles;
}
