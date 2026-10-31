'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuthStore } from '../../store/auth.store';
import { Role } from '../../types/enums';
import { isBusinessWorkspace } from '../../lib/workspace/workspaceSelection';
import {
  isProviderPersonalPath,
  providerRouteAction,
  providerSection,
} from '../../lib/workspace/workspaceRoutes';
import { PortalFrame } from '../workspace/PortalFrame';
import {
  NoBusinessScreen,
  NotForYourRoleScreen,
  SwitchWorkspaceScreen,
  WorkspaceErrorScreen,
  WorkspaceLoadingScreen,
} from '../workspace/WorkspaceScreens';
import { ProviderSidebar } from './ProviderSidebar';

/**
 * What app/(provider)/layout.tsx shows for a /provider path (UX only — the
 * backend enforces every rule by business membership):
 *
 * - A PROVIDER account's own carpool pages (my-vehicles, trips,
 *   trip-inquiries, incoming-requests, reviews): always, with the sidebar,
 *   whatever dashboard is active. (middleware.ts sends USER accounts to the
 *   /dashboard copies.)
 * - Business pages: only while the active dashboard is Business admin or
 *   Manager, and only if it can() the route's action (workspaceRoutes.ts).
 *   Otherwise: a switch prompt when the person has a business dashboard but is
 *   working as Driver; the business create flow on /provider/profile for
 *   someone who may create one; else the "no business dashboard" screen.
 */
export function ProviderPortal({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isProviderAccount = useAuthStore((s) => s.user?.role === Role.PROVIDER);
  const { status, active, workspaces, data, can } = useWorkspace();

  // PROVIDER accounts keep their sidebar (it holds their own carpool links)
  // even without a business dashboard.
  const sidebar = <ProviderSidebar />;
  const frame = (content: ReactNode, withSidebar: boolean) => (
    <PortalFrame
      brand="KerayeGo Business"
      sidebar={withSidebar || isProviderAccount ? sidebar : null}
    >
      {content}
    </PortalFrame>
  );

  if (isProviderPersonalPath(pathname)) return frame(children, true);
  if (status === 'loading') return frame(<WorkspaceLoadingScreen />, false);
  if (status === 'error') return frame(<WorkspaceErrorScreen />, false);

  if (isBusinessWorkspace(active)) {
    const action = providerRouteAction(pathname);
    return frame(!action || can(action) ? children : <NotForYourRoleScreen />, true);
  }

  const business = workspaces.find((w) => isBusinessWorkspace(w.role));
  if (business) return frame(<SwitchWorkspaceScreen workspace={business} />, false);
  // Setting up a business: the existing create flow on /provider/profile.
  if (providerSection(pathname) === 'profile' && data?.canCreateBusiness)
    return frame(children, false);
  return frame(<NoBusinessScreen />, false);
}
