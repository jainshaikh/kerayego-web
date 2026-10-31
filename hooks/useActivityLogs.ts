'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { activityLogsApi, type ActivityLogFilters } from '../lib/api/activity-logs.api';

// The business's activity log (kerayego-partner features/activity-logs/queries.ts).
// Each filter combination (category + person) is its own list.
export const activityLogQueryKeys = {
  all: ['activity-logs'] as const,
  list: (filters: ActivityLogFilters) =>
    ['activity-logs', 'list', filters.category ?? null, filters.actorUserId ?? null] as const,
  actors: ['activity-logs', 'actors'] as const,
};

/** Newest first, 30 per page: fetchNextPage() loads the next. Business admin only (a manager gets a 403). */
export function useActivityLogInfinite(filters: ActivityLogFilters) {
  return useInfiniteQuery({
    queryKey: activityLogQueryKeys.list(filters),
    queryFn: ({ pageParam }) => activityLogsApi.list(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta && lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

/** Everyone who appears in the log (past members included), for the person filter. */
export function useActivityLogActors() {
  return useQuery({
    queryKey: activityLogQueryKeys.actors,
    queryFn: activityLogsApi.actors,
  });
}
