'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TripStop } from '../../../lib/api/trips.api';
import { geoApi } from '../../../lib/api/geo.api';
import { useTripRoomPresence } from '../../../hooks/useTripRoomPresence';
import { useRideSocket } from '../../../hooks/useRideSocket';

interface DriverPosition {
  lat: number;
  lng: number;
}

// The rider's stop list comes from their own request (GET /trip-inquiries/:id
// returns the trip's whole route as `trip.stops`), not from the public
// GET /trips/:id, which 404s once the trip is IN_PROGRESS (until 2026-11-10 it
// did, so the live map had no stops and no route line), and not from the
// manifest, which is driver-only. Same source as mobile's useRiderLiveRoute.
export function useRiderLiveRoute(tripId: string, routeStops: TripStop[], live: boolean) {
  useTripRoomPresence(tripId, live);
  const { onLocationUpdate } = useRideSocket();
  const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);

  useEffect(() => {
    if (!live) return;
    const unsubscribe = onLocationUpdate((payload) => {
      if (payload.tripId !== tripId) return;
      setDriverPosition({ lat: payload.lat, lng: payload.lng });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, tripId]);

  // Pickups first, then drop-offs, each by sortOrder: the route line runs from
  // the first pickup to the last drop-off.
  const stops = [...routeStops].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'PICKUP' ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  const originPoint =
    firstStop && firstStop.lat != null && firstStop.lng != null
      ? { lat: firstStop.lat, lng: firstStop.lng }
      : null;
  const destPoint =
    lastStop && lastStop.lat != null && lastStop.lng != null
      ? { lat: lastStop.lat, lng: lastStop.lng }
      : null;
  const hasRoute = !!originPoint && !!destPoint && firstStop.id !== lastStop.id;

  // Fetched once (staleTime: Infinity — the route between two fixed stops
  // never changes mid-trip). A failure is treated as "no overlay to show",
  // never something that blocks the live view.
  const { data: routePolyline } = useQuery({
    queryKey: ['trip', tripId, 'route-directions', originPoint, destPoint],
    queryFn: () => {
      if (!originPoint || !destPoint) return Promise.resolve(undefined);
      return geoApi
        .getRouteDirections(originPoint, destPoint)
        .then((r) => r.polyline)
        .catch(() => undefined);
    },
    enabled: hasRoute,
    staleTime: Infinity,
  });

  return { stops, driverPosition, routePolyline };
}
