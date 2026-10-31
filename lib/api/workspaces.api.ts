import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';
import type { MyWorkspaces } from '../../types/workspace.types';

export const workspacesApi = {
  /**
   * GET /users/me/workspaces — the business/driver dashboards this person has
   * (business admin = owner, manager, driver). Any signed-in account; the
   * backend decides access by business membership, not by the JWT role.
   */
  getMine: async () => {
    const response = await apiClient.get<ApiResponse<MyWorkspaces>>('/users/me/workspaces');
    return response.data.data;
  },
};
