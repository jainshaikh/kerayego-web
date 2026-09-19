'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../../lib/api/trips.api';
import { geoApi } from '../../../lib/api/geo.api';
import { useTripRoomPresence } from '../../../hooks/useTripRoomPresence';
import { useRideSocket } from '../../../hooks/useRideSocket';

interface DriverPosition {
  lat: number;
  lng: number;
}

// Rider's data source for the whole route/stop list is the PUBLIC trip
// endpoint, not the manifest (driver-only) — same as mobile's
// useRiderLiveRoute, which uses tripsApi.getOne precisely because of that
// restriction.
export function useRiderLiveRoute(tripId: string, live: boolean) {
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

  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getById(tripId),
    enabled: !!tripId,
  });

  const stops = trip?.stops ?? [];
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
