'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../lib/api/team.api';
import type { BusinessTeamMember, InviteTeamMemberPayload } from '../types/team.types';

// The business team (kerayego-partner features/team/queries.ts). Errors are
// shown by the page, inline or as a toast — the hooks don't toast.

export const teamQueryKeys = {
  all: ['team'] as const,
  list: () => [...teamQueryKeys.all, 'list'] as const,
};

export function useMyTeam() {
  return useQuery({
    queryKey: teamQueryKeys.list(),
    queryFn: teamApi.getTeam,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteTeamMemberPayload) => teamApi.inviteMember(payload),
    onSuccess: (newMember) => {
      // Inviting an email whose invite expired re-sends that same row — replace it.
      queryClient.setQueryData<BusinessTeamMember[]>(teamQueryKeys.list(), (prev = []) => [
        newMember,
        ...prev.filter((m) => m.id !== newMember.id),
      ]);
    },
  });
}

/** Re-send a pending (usually expired) invite with a fresh 7 days. */
export function useReinviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teamApi.reinviteMember(memberId),
    onSuccess: (updated) => {
      queryClient.setQueryData<BusinessTeamMember[]>(teamQueryKeys.list(), (prev) =>
        prev?.map((m) => (m.id === updated.id ? updated : m)),
      );
    },
    // A 409 means the row changed meanwhile (accepted, declined, cancelled) — show its real state.
    onError: () => queryClient.invalidateQueries({ queryKey: teamQueryKeys.all }),
  });
}

/**
 * Remove a member or cancel an invite. The backend keeps the row as INACTIVE
 * (it moves to "Past members"), so the list is refetched rather than the row
 * dropped.
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teamApi.removeMember(memberId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: teamQueryKeys.all }),
  });
}
