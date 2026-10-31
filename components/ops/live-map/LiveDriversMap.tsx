'use client';

import { useEffect, useRef } from 'react';
import { Map, Marker, Polyline, useMap } from '@vis.gl/react-google-maps';
import { Scan } from 'lucide-react';
import { GoogleMapsProvider } from '../../maps/GoogleMapsProvider';
import { dotIcon, formatLastSeen } from '../../../lib/ops/liveMap';
import type { DriverRouteFix, LiveDriverBooking } from '../../../types/live-map.types';

// The map half of the live map: one dot per driver with a GPS fix (the
// selected one larger, in brand red), the selected job's breadcrumb trail,
// and a "fit all" button. Picking a driver (here or in the list) pans to them
// (A27). The Partner app's map, on @vis.gl/react-google-maps like the rest of
// this site.

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 }; // Lahore, the Partner app's default region
const ICON = dotIcon('#FFFFFF', '#C2203C', 8);
const ICON_SELECTED = dotIcon('#C2203C', '#FFFFFF', 11);

interface LiveDriversMapProps {
  drivers: readonly LiveDriverBooking[];
  selectedBookingId: string | null;
  /** Bumped each time a driver is picked, so picking the same one again re-centres. */
  focusToken: number;
  route: readonly DriverRouteFix[];
  onSelect: (bookingId: string) => void;
  className?: string;
}

function points(drivers: readonly LiveDriverBooking[]) {
  return drivers.flatMap((d) => (d.lastLocation ? [{ lat: d.lastLocation.lat, lng: d.lastLocation.lng }] : []));
}

/** Fits every driver once the first positions arrive; never again by itself (it would fight the user's panning). */
function FitOnce({ drivers }: { drivers: readonly LiveDriverBooking[] }) {
  const map = useMap();
  const fitted = useRef(false);
  const all = points(drivers);
  useEffect(() => {
    if (!map || fitted.current || all.length === 0) return;
    fitted.current = true;
    fitTo(map, all);
  }, [map, all]);
  return null;
}

function fitTo(map: google.maps.Map, all: { lat: number; lng: number }[]) {
  if (all.length === 1) {
    map.setCenter(all[0]);
    map.setZoom(14);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  all.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, 50);
}

/** Pans to the picked driver. */
function FocusSelected({ driver, focusToken }: { driver: LiveDriverBooking | null; focusToken: number }) {
  const map = useMap();
  const lat = driver?.lastLocation?.lat;
  const lng = driver?.lastLocation?.lng;
  useEffect(() => {
    if (!map || focusToken === 0 || lat === undefined || lng === undefined) return;
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < 14) map.setZoom(14);
    // Only on a new pick, not on every position update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusToken]);
  return null;
}

function FitAllButton({ drivers }: { drivers: readonly LiveDriverBooking[] }) {
  const map = useMap();
  const all = points(drivers);
  if (all.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => map && fitTo(map, all)}
      aria-label="Show every driver"
      title="Show every driver"
      className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-md hover:bg-surface-hover"
    >
      <Scan className="h-5 w-5" />
    </button>
  );
}

export function LiveDriversMap({ drivers, selectedBookingId, focusToken, route, onSelect, className }: LiveDriversMapProps) {
  const selected = drivers.find((d) => d.bookingId === selectedBookingId) ?? null;
  const path = route.map((fix) => ({ lat: fix.lat, lng: fix.lng }));
  const first = points(drivers)[0];

  return (
    <GoogleMapsProvider>
      <div className={className} style={{ position: 'relative' }}>
        <Map defaultCenter={first ?? DEFAULT_CENTER} defaultZoom={12} gestureHandling="greedy" style={{ width: '100%', height: '100%' }}>
          <FitOnce drivers={drivers} />
          <FocusSelected driver={selected} focusToken={focusToken} />
          {path.length > 1 ? <Polyline path={path} strokeColor="#C2203C" strokeOpacity={0.7} strokeWeight={4} /> : null}
          {drivers.map((item) => {
            if (!item.lastLocation) return null;
            const isSelected = item.bookingId === selectedBookingId;
            return (
              <Marker
                key={item.bookingId}
                position={{ lat: item.lastLocation.lat, lng: item.lastLocation.lng }}
                icon={isSelected ? ICON_SELECTED : ICON}
                zIndex={isSelected ? 1000 : 500}
                title={`${item.driver.name} — ${item.vehicle.make} ${item.vehicle.model} — ${formatLastSeen(item.lastLocation.timestamp)}`}
                onClick={() => onSelect(item.bookingId)}
              />
            );
          })}
        </Map>
        {/* Outside <Map> but under the provider: useMap() returns the page's one map. */}
        <FitAllButton drivers={drivers} />
      </div>
    </GoogleMapsProvider>
  );
}
