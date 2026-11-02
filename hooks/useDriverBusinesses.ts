'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../lib/api/driver.api';
import { driverKeys } from './useDriverProfile';
import { invalidateWorkspaces } from './useWorkspace';

// The businesses a driver works for and their invitations (driver and
// manager) — the web twin of the businesses part of kerayego-partner's
// features/driver/queries.ts. Accepting or leaving can add or remove a
// dashboard, so both refetch the workspaces.

export function useMyDriverBusinesses() {
  return useQuery({
    queryKey: driverKeys.businesses(),
    queryFn: driverApi.getMyBusinesses,
  });
}

/**
 * POST /driver/businesses/:memberId/accept — a driver or manager invitation.
 * Refusals (the page shows the server's message): 403 EMAIL_NOT_VERIFIED;
 * 404 not found; 409 expired, no longer pending, already a member (and, for a
 * manager, owns or manages a business). A refusal refetches the list, since
 * the invite may have expired or changed meanwhile.
 */
export function useAcceptBusinessInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => driverApi.acceptInvite(memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.businesses() });
      void invalidateWorkspaces(queryClient);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.businesses() });
    },
  });
}

/** POST /driver/businesses/:memberId/leave — leave a business or decline an invitation. */
export function useLeaveBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => driverApi.leaveBusiness(memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.businesses() });
      void queryClient.invalidateQueries({ queryKey: driverKeys.jobs() });
      void invalidateWorkspaces(queryClient);
    },
  });
}
