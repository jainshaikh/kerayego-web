'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRideSocket } from '../../../hooks/useRideSocket';

// Throttle floor between emitted positions — matches mobile's watch cadence
// (expo-location watchPositionAsync at 4s/10m) closely enough for the map's
// ~1s animation to always finish before the next update arrives.
const EMIT_THROTTLE_MS = 4000;

// Opt-in only (decision: web driver GPS is off by default) — a driver
// actually driving is on mobile, not a laptop; this exists for a driver
// using a phone browser without the app installed. Laptop/desktop
// geolocation is Wi-Fi-triangulated and unreliable, so nothing here ever
// auto-starts.
export function useDriverLocationWatch(tripId: string) {
  const { emitLocation } = useRideSocket();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastEmitAtRef = useRef(0);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not available in this browser.');
      return;
    }
    setError(null);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastEmitAtRef.current < EMIT_THROTTLE_MS) return;
        lastEmitAtRef.current = now;
        emitLocation({
          tripId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          headingDeg: position.coords.heading ?? undefined,
          speedKmh: position.coords.speed != null ? position.coords.speed * 3.6 : undefined,
          accuracyM: position.coords.accuracy ?? undefined,
          ts: Date.now(),
        });
      },
      () => {
        setError("Couldn't get your location — check your browser's location permission.");
        setSharing(false);
      },
      { enableHighAccuracy: true },
    );
    watchIdRef.current = id;
    setSharing(true);
  }, [emitLocation, tripId]);

  // Stop broadcasting if the driver navigates away from the cockpit — a
  // stale watch should never keep emitting after the page unmounts.
  useEffect(() => stop, [stop]);

  return { sharing, error, start, stop };
}
