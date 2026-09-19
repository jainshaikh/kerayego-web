'use client';

import { useState } from 'react';
import { useRecordTripEvent } from '../../../hooks/useTrips';

type SelfEventType = 'ARRIVED' | 'DROPOFF';

// Plain confirm-button semantics (no navigator.geolocation/geofencing) —
// desktop browsers have no reliable GPS, and the backend's own arrival check
// is audit-only and never blocks either way. ARRIVED does NOT set
// pickupConfirmedAt server-side (stays driver-authoritative); DROPOFF IS
// authoritative (first-writer-wins with the driver's own tap).
export function useRiderTripActions(tripId: string, tripInquiryId: string) {
  const recordEvent = useRecordTripEvent(tripId);
  const [actioningKey, setActioningKey] = useState<SelfEventType | null>(null);

  const recordSelfEvent = async (type: SelfEventType) => {
    setActioningKey(type);
    try {
      await recordEvent.mutateAsync({
        id: crypto.randomUUID(),
        tripInquiryId,
        type,
        occurredAt: new Date().toISOString(),
      });
    } catch {
      // Swallowed — useRecordTripEvent's onError already surfaced a toast.
    } finally {
      setActioningKey((k) => (k === type ? null : k));
    }
  };

  return {
    actioningKey,
    confirmArrived: () => recordSelfEvent('ARRIVED'),
    confirmDropoff: () => recordSelfEvent('DROPOFF'),
  };
}
