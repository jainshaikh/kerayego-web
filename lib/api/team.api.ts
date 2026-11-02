import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';
import type { BusinessTeamMember, InviteTeamMemberPayload } from '../../types/team.types';

// The business team — kerayego-backend business-team.controller.ts. Business
// admin or manager (a manager invites and removes drivers only, 403
// otherwise). Same calls as kerayego-partner's api/team.api.ts.
export const teamApi = {
  /** GET /providers/me/team — every membership, current and past, newest invite first. */
  getTeam: async () => {
    const res = await apiClient.get<ApiResponse<BusinessTeamMember[]>>('/providers/me/team');
    return res.data.data;
  },

  /**
   * POST /providers/me/team/invites — invite a manager or driver (addressed to
   * the email only; the row comes back with user/userId null). 409 when the
   * email has an open invite or is a member here. Inviting an email whose
   * invite expired re-sends that same row with a fresh 7 days.
   */
  inviteMember: async (payload: InviteTeamMemberPayload) => {
    const res = await apiClient.post<ApiResponse<BusinessTeamMember>>(
      '/providers/me/team/invites',
      payload,
    );
    return res.data.data;
  },

  /**
   * POST /providers/me/team/:memberId/reinvite — re-send a pending invite
   * (expired or not) with a fresh 7 days. 409 for any other status; a manager
   * re-invites drivers only (403). Returns the team row.
   */
  reinviteMember: async (memberId: string) => {
    const res = await apiClient.post<ApiResponse<BusinessTeamMember>>(
      `/providers/me/team/${memberId}/reinvite`,
    );
    return res.data.data;
  },

  /**
   * DELETE /providers/me/team/:memberId — remove a member or cancel an invite.
   * The membership becomes INACTIVE; a removed active driver is taken off this
   * business's accepted jobs that haven't started.
   */
  removeMember: async (memberId: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/providers/me/team/${memberId}`,
    );
    return res.data.data;
  },
};
