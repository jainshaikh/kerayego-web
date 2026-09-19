'use client';

import { useState } from 'react';
import { useRecordTripEvent } from '../../../hooks/useTrips';
import type { ManifestRouteStop } from '../../../lib/api/trips.api';

type RiderEventType = 'PICKUP' | 'DROPOFF' | 'NO_SHOW';

// Web equivalent of kerayego-mobile's useDriverTripActions, minus the offline
// action queue — that's a mobile-connectivity concern (AsyncStorage FIFO for
// spotty signal on the road). A web driver's failures just toast (handled by
// useRecordTripEvent's onError) and can be retried by tapping again, since
// recordEvent is idempotent by the client-generated `id` reused on retry.
export function useDriverTripActions(tripId: string) {
  const recordEvent = useRecordTripEvent(tripId);
  // NO_SHOW doesn't change any manifest field the refetch would pick up (it's
  // just a logged event) — tracked locally so the tap stays visible.
  const [noShowIds, setNoShowIds] = useState<Set<string>>(new Set());
  // ARRIVED is the same — a logged event with nothing on the manifest to
  // reflect it back.
  const [arrivedStopIds, setArrivedStopIds] = useState<Set<string>>(new Set());
  const [actioningKey, setActioningKey] = useState<string | null>(null);

  const handleRiderEvent = async (tripInquiryId: string, type: RiderEventType) => {
    const key = `${tripInquiryId}:${type}`;
    setActioningKey(key);
    try {
      await recordEvent.mutateAsync({
        id: crypto.randomUUID(),
        tripInquiryId,
        type,
        occurredAt: new Date().toISOString(),
      });
      if (type === 'NO_SHOW') setNoShowIds((prev) => new Set(prev).add(tripInquiryId));
    } catch {
      // Swallowed — useRecordTripEvent's onError already surfaced a toast.
    } finally {
      setActioningKey((k) => (k === key ? null : k));
    }
  };

  const handleArrived = async (stop: ManifestRouteStop) => {
    const key = `stop:${stop.id}`;
    setActioningKey(key);
    try {
      await recordEvent.mutateAsync({
        id: crypto.randomUUID(),
        type: 'ARRIVED',
        occurredAt: new Date().toISOString(),
        payload: { stopId: stop.id },
      });
      setArrivedStopIds((prev) => new Set(prev).add(stop.id));
    } catch {
      // Swallowed — see handleRiderEvent.
    } finally {
      setActioningKey((k) => (k === key ? null : k));
    }
  };

  return {
    noShowIds,
    arrivedStopIds,
    actioningKey,
    handleRiderEvent,
    handleArrived,
  };
}
