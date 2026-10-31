import { BusinessRole } from '../../types/enums';
import type { WorkspaceRole } from '../../types/workspace.types';
import type { WorkspaceAction } from './workspaceSelection';

// Web-only companions to workspaceSelection.ts (which stays identical to the
// Partner app's): dashboard names, where each dashboard lives, and which
// can() action each portal route needs. The portal layouts
// (components/provider/ProviderPortal.tsx, components/driver/DriverPortal.tsx)
// read these, so a page under /provider or /driver is already guarded for its
// route's action. UX only — the backend enforces every rule itself.

/** Dashboard names. Never a bare "Admin": on this site that means KerayeGo admin. */
export const WORKSPACE_LABELS: Record<WorkspaceRole, string> = {
  [BusinessRole.BUSINESS_ADMIN]: 'Business admin',
  [BusinessRole.MANAGER]: 'Manager',
  [BusinessRole.DRIVER]: 'Driver',
};

/** Where switching to a dashboard navigates. */
export const WORKSPACE_HOME: Record<WorkspaceRole, string> = {
  [BusinessRole.BUSINESS_ADMIN]: '/provider/dashboard',
  [BusinessRole.MANAGER]: '/provider/dashboard',
  [BusinessRole.DRIVER]: '/driver/jobs',
};

/**
 * A PROVIDER account's own carpool pages under /provider (shared with
 * /dashboard for USER accounts, see middleware.ts). Not part of the business
 * portal: they render for PROVIDER accounts whatever dashboard is active.
 */
export const PROVIDER_PERSONAL_SECTIONS: readonly string[] = [
  'my-vehicles',
  'trips',
  'trip-inquiries',
  'incoming-requests',
  'reviews',
];

/** The /provider/<section> segment of a path, or '' for /provider itself. */
export function providerSection(pathname: string): string {
  return pathname.split('/')[2] ?? '';
}

export function isProviderPersonalPath(pathname: string): boolean {
  return PROVIDER_PERSONAL_SECTIONS.includes(providerSection(pathname));
}

// Longest prefix wins. A route not listed needs only a business dashboard
// (Business admin or Manager). Add nested routes here as pages are built, e.g.
// adding a car is owner-only while editing one is not.
const PROVIDER_ROUTE_ACTIONS: readonly (readonly [string, WorkspaceAction])[] = [
  ['/provider/inquiries', 'manageBookings'],
  ['/provider/vehicles', 'viewFleet'],
  ['/provider/vehicles/new', 'manageFleet'],
  ['/provider/live-map', 'viewLiveMap'],
  ['/provider/team', 'viewTeam'],
  ['/provider/ratings', 'viewRatings'],
  ['/provider/activity', 'viewActivityLogs'],
  ['/provider/profile', 'editBusinessProfile'],
  ['/provider/documents', 'manageDocuments'],
];

const DRIVER_ROUTE_ACTIONS: readonly (readonly [string, WorkspaceAction])[] = [
  ['/driver/jobs', 'driverJobs'],
  ['/driver/businesses', 'driverBusinesses'],
  ['/driver/profile', 'driverProfile'],
  ['/driver/setup', 'driverProfile'],
];

function matchAction(
  table: readonly (readonly [string, WorkspaceAction])[],
  pathname: string,
): WorkspaceAction | null {
  let best: readonly [string, WorkspaceAction] | null = null;
  for (const entry of table) {
    const [prefix] = entry;
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (!best || prefix.length > best[0].length) best = entry;
    }
  }
  return best ? best[1] : null;
}

/** The can() action a business portal path needs, or null when any business dashboard may open it. */
export function providerRouteAction(pathname: string): WorkspaceAction | null {
  return matchAction(PROVIDER_ROUTE_ACTIONS, pathname);
}

/** The can() action a driver portal path needs, or null when any driver dashboard may open it. */
export function driverRouteAction(pathname: string): WorkspaceAction | null {
  return matchAction(DRIVER_ROUTE_ACTIONS, pathname);
}

/** /driver/profile and /driver/setup/* are also open, without the sidebar, to someone becoming a driver. */
export function isDriverOnboardingPath(pathname: string): boolean {
  return (
    pathname === '/driver/profile' ||
    pathname.startsWith('/driver/profile/') ||
    pathname.startsWith('/driver/setup/')
  );
}
