'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../lib/api/workspaces.api';
import { useAuthStore } from '../store/auth.store';
import { useWorkspaceSelectionStore } from '../store/workspace.store';
import { BusinessRole } from '../types/enums';
import type { MyWorkspaces, Workspace, WorkspaceRole } from '../types/workspace.types';
import {
  availableWorkspaces,
  can as roleCan,
  resolveActiveWorkspace,
  type WorkspaceAction,
} from '../lib/workspace/workspaceSelection';
import { WORKSPACE_HOME, WORKSPACE_LABELS } from '../lib/workspace/workspaceRoutes';

export type { Workspace, WorkspaceRole, WorkspaceAction, MyWorkspaces };

// Which business/driver dashboard the signed-in person is working in — the
// web twin of kerayego-partner's WorkspaceProvider. GET /users/me/workspaces
// lists the dashboards (Business admin = owner, Manager, Driver); the chosen
// one is remembered per user in localStorage (store/workspace.store.ts),
// defaulting to the first of Business admin, Manager, Driver. Every
// role-based show/hide in /provider and /driver goes through can() — never
// check roles in pages. UX only: the backend decides every permission itself.
//
// No context provider needed: React Query shares the data and a zustand store
// shares the choice, so every caller sees the same `active`.

export const workspaceQueryKeys = {
  all: ['workspaces', 'mine'] as const,
  mine: (userId: string | null) => ['workspaces', 'mine', userId] as const,
};

/**
 * Refetch the dashboards after anything that can add or remove one: creating
 * a business, saving a first driver profile, accepting or leaving a business.
 */
export function invalidateWorkspaces(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all });
}

function toWorkspace(role: WorkspaceRole, data: MyWorkspaces): Workspace {
  const business =
    role === BusinessRole.BUSINESS_ADMIN
      ? data.businessAdmin
      : role === BusinessRole.MANAGER
        ? data.manager
        : null;
  return {
    role,
    label: WORKSPACE_LABELS[role],
    businessId: business?.businessId ?? null,
    businessName: business?.businessName ?? null,
    verificationStatus: business
      ? business.verificationStatus
      : (data.driver?.verificationStatus ?? null),
    home: WORKSPACE_HOME[role],
  };
}

export interface UseWorkspaceResult {
  status: 'loading' | 'ready' | 'error';
  /** Every dashboard this person has, default first. */
  workspaces: Workspace[];
  /** The dashboard in use, or null when the person has none. */
  active: WorkspaceRole | null;
  /** GET /users/me/workspaces, once loaded. */
  data: MyWorkspaces | undefined;
  /** Work in `role` from now on (remembered for this user). Doesn't navigate — see WORKSPACE_HOME. */
  select: (role: WorkspaceRole) => void;
  /** Whether the active dashboard offers `action` (UX only; the backend decides). */
  can: (action: WorkspaceAction) => boolean;
  refetch: () => void;
}

export function useWorkspace(): UseWorkspaceResult {
  // '' when this tab doesn't know the user (see store/workspace.store.ts). The
  // query still runs: only signed-in areas use this hook (middleware.ts), and
  // the API client refreshes the session itself.
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const query = useQuery({
    queryKey: workspaceQueryKeys.mine(userId || null),
    queryFn: workspacesApi.getMine,
    staleTime: 60_000,
  });

  const remembered = useWorkspaceSelectionStore((s) => s.remembered);
  const load = useWorkspaceSelectionStore((s) => s.load);
  const choose = useWorkspaceSelectionStore((s) => s.choose);
  useEffect(() => {
    load(userId);
  }, [load, userId]);
  const rememberedForUser = remembered?.userId === userId ? remembered : null;

  const roles = useMemo(() => availableWorkspaces(query.data), [query.data]);
  const workspaces = useMemo(
    () => (query.data ? roles.map((role) => toWorkspace(role, query.data)) : []),
    [roles, query.data],
  );
  const active = resolveActiveWorkspace(roles, rememberedForUser?.role);

  const select = useCallback((role: WorkspaceRole) => choose(userId, role), [choose, userId]);
  const can = useCallback((action: WorkspaceAction) => roleCan(active, action), [active]);
  const { refetch: refetchQuery } = query;
  const refetch = useCallback(() => {
    void refetchQuery();
  }, [refetchQuery]);

  let status: UseWorkspaceResult['status'];
  if (query.isError && !query.data) status = 'error';
  else if (query.isPending || !rememberedForUser) status = 'loading';
  else status = 'ready';

  return { status, workspaces, active, data: query.data, select, can, refetch };
}
