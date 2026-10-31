import apiClient from './client';
import type { ApiResponse, PaginationMeta } from '../../types/api.types';
import type { ActivityLogActorRole, ActivityLogCategory, ActivityLogEntry } from './admin.api';

export type { ActivityLogActorRole, ActivityLogCategory, ActivityLogEntry };

// The business's own activity log (plan A26, A33) — kerayego-backend
// GET /providers/me/activity-logs (+ /actors), the same entry shape the admin
// console reads. Business admin only: a manager gets a 403. View only —
// nothing here changes or deletes an entry. Same calls as kerayego-partner's
// api/activity-logs.api.ts.

/** Entries per page (the backend allows up to 100). */
export const ACTIVITY_LOG_PAGE_SIZE = 30;

/** Who did it — names are resolved when read, so a deleted account reads "Deleted user". */
export interface ActivityActor {
  id: string;
  name: string;
  role: ActivityLogActorRole | null;
}

/** The list's filters: undefined = every category / everyone. */
export interface ActivityLogFilters {
  category?: ActivityLogCategory;
  actorUserId?: string;
}

export const activityLogsApi = {
  /** GET /providers/me/activity-logs — one page, newest first. Empty filters are left out (an unknown category is a 400). */
  list: async (
    filters: ActivityLogFilters,
    page: number,
  ): Promise<{ data: ActivityLogEntry[]; meta: PaginationMeta }> => {
    const res = await apiClient.get<ApiResponse<ActivityLogEntry[]>>('/providers/me/activity-logs', {
      params: {
        page,
        limit: ACTIVITY_LOG_PAGE_SIZE,
        ...(filters.category && { category: filters.category }),
        ...(filters.actorUserId && { actorUserId: filters.actorUserId }),
      },
    });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  /** GET /providers/me/activity-logs/actors — everyone who appears in the log, past members included. */
  actors: async (): Promise<ActivityActor[]> => {
    const res = await apiClient.get<ApiResponse<{ actors: ActivityActor[] }>>(
      '/providers/me/activity-logs/actors',
    );
    return res.data.data.actors;
  },
};
