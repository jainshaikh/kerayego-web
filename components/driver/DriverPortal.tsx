'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '../../hooks/useWorkspace';
import { BusinessRole } from '../../types/enums';
import { driverRouteAction, isDriverOnboardingPath } from '../../lib/workspace/workspaceRoutes';
import { PortalFrame } from '../workspace/PortalFrame';
import {
  NotADriverScreen,
  NotForYourRoleScreen,
  SwitchWorkspaceScreen,
  WorkspaceErrorScreen,
  WorkspaceLoadingScreen,
} from '../workspace/WorkspaceScreens';
import { DriverSidebar } from './DriverSidebar';

/**
 * What app/(driver)/layout.tsx shows for a /driver path (UX only — the
 * backend enforces every rule by business membership):
 *
 * - Active dashboard is Driver: the page with the driver sidebar, if the
 *   dashboard can() the route's action (workspaceRoutes.ts).
 * - /driver/profile and /driver/setup/*: also open, without the sidebar, to
 *   someone becoming a driver (or working in another dashboard right now).
 * - Otherwise: a switch prompt when the person has a driver dashboard but is
 *   working in a business one, else "You're not a driver yet".
 */
export function DriverPortal({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, active, workspaces, can } = useWorkspace();

  const frame = (content: ReactNode, withSidebar: boolean) => (
    <PortalFrame brand="KerayeGo Driver" sidebar={withSidebar ? <DriverSidebar /> : null}>
      {content}
    </PortalFrame>
  );

  if (status === 'loading') return frame(<WorkspaceLoadingScreen />, false);
  if (status === 'error') return frame(<WorkspaceErrorScreen />, false);

  if (active === BusinessRole.DRIVER) {
    const action = driverRouteAction(pathname);
    return frame(!action || can(action) ? children : <NotForYourRoleScreen />, true);
  }

  if (isDriverOnboardingPath(pathname)) return frame(children, false);

  const driver = workspaces.find((w) => w.role === BusinessRole.DRIVER);
  if (driver) return frame(<SwitchWorkspaceScreen workspace={driver} />, false);
  return frame(<NotADriverScreen />, false);
}
