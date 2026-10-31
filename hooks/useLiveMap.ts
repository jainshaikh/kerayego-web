'use client';

import { useQuery } from '@tanstack/react-query';
import { liveMapApi } from '../lib/api/live-map.api';

// The business's live map, ported from the KerayeGo Partner app's
// features/location/queries.ts. React Query's refetchInterval pauses while
// the browser tab is hidden (refetchIntervalInBackground defaults to false),
// so polling only runs while the page is visible.

export const liveMapKeys = {
  all: ['live-map'] as const,
  drivers: ['live-map', 'drivers'] as const,
  route: (bookingId: string | null) => ['live-map', 'route', bookingId] as const,
};

/** Every in-progress rental and its driver's last position; refetched every 10 s. */
export function useLiveDrivers() {
  return useQuery({
    queryKey: liveMapKeys.drivers,
    queryFn: liveMapApi.getLiveDrivers,
    refetchInterval: 10_000,
  });
}

/** The selected job's breadcrumb trail; refetched every 15 s while selected. */
export function useDriverRoute(bookingId: string | null) {
  return useQuery({
    queryKey: liveMapKeys.route(bookingId),
    queryFn: () => liveMapApi.getDriverRoute(bookingId as string),
    enabled: !!bookingId,
    refetchInterval: 15_000,
  });
}
