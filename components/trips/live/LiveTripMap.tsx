'use client';

import { useEffect, useRef } from 'react';
import { Map, Marker, Polyline, useMap, useMarkerRef } from '@vis.gl/react-google-maps';
import { GoogleMapsProvider } from '../../maps/GoogleMapsProvider';
import { REACHED_DOT_BG, REACHED_DOT_FG, UPCOMING_DOT_BG, UPCOMING_DOT_FG } from './rideVisuals';
import { haversineDistanceMeters } from '../../../lib/utils/geo-distance';

export interface LiveTripMapStop {
  id: string;
  label: string;
  lat: number;
  lng: number;
  sequence: number;
  reached?: boolean;
  /** De-emphasize stops that aren't the current viewer's own (rider view). */
  muted?: boolean;
}

export interface LiveTripMapDriverPosition {
  lat: number;
  lng: number;
}

interface LiveTripMapProps {
  stops: LiveTripMapStop[];
  routePolyline?: { lat: number; lng: number }[];
  driverPosition?: LiveTripMapDriverPosition | null;
  className?: string;
}

// A jump bigger than this between two consecutive driver positions is treated
// as a genuine relocation (e.g. reconnect after a long gap), not movement —
// snap instead of animating across it.
const SNAP_JUMP_METERS = 2000;
const ANIMATE_MS = 1000;
const FALLBACK_CENTER = { lat: 30.3753, lng: 69.3451 }; // Pakistan's rough centroid

// Plain data-URI SVG icons (no `google.maps.Symbol`/`Size` construction) so
// these can be evaluated as prop expressions before the Maps JS API has
// necessarily finished loading — matches how ResultsMap.tsx's Marker icons
// are plain `{ url }` objects rather than runtime `google.maps.*` instances.
function dotIcon(fill: string, stroke: string, radius: number): string {
  const size = radius * 2 + 4;
  const c = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${c}" cy="${c}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const DRIVER_ICON = dotIcon('#C2203C', '#ffffff', 8);

function stopIcon(stop: LiveTripMapStop): string {
  const reached = !!stop.reached;
  return dotIcon(
    reached ? REACHED_DOT_BG : UPCOMING_DOT_BG,
    reached ? REACHED_DOT_FG : UPCOMING_DOT_FG,
    stop.muted ? 7 : 10,
  );
}

// Fits the map to every stop + the driver's current position exactly once,
// on mount — never re-fits on a later driver update, or the map would fight
// the user's own panning/zooming.
function FitBoundsOnce({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!map || fitted.current || points.length === 0) return;
    fitted.current = true;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 48);
    // Deliberately excludes `points` besides the mount-time value — this
    // effect must run once only (see `fitted` guard above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

// The one genuinely new mechanic vs. web's existing map components: the
// driver's marker glides between socket updates (~4s apart) instead of
// snapping, via a ~1s requestAnimationFrame lerp. Position is stored in a ref
// (not React state) so the animation loop doesn't trigger 60 re-renders/sec.
function DriverMarker({ position }: { position: LiveTripMapDriverPosition }) {
  const [markerRef, marker] = useMarkerRef();
  const renderedRef = useRef<{ lat: number; lng: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!marker) return;

    const target = { lat: position.lat, lng: position.lng };
    const from = renderedRef.current;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!from || haversineDistanceMeters(from, target) > SNAP_JUMP_METERS) {
      marker.setPosition(target);
      renderedRef.current = target;
      return;
    }

    const start = performance.now();
    const { lat: startLat, lng: startLng } = from;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATE_MS);
      marker.setPosition({
        lat: startLat + (target.lat - startLat) * t,
        lng: startLng + (target.lng - startLng) * t,
      });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        renderedRef.current = target;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [marker, position.lat, position.lng]);

  return <Marker ref={markerRef} position={position} icon={DRIVER_ICON} zIndex={1000} title="Driver" />;
}

export function LiveTripMap({ stops, routePolyline, driverPosition, className }: LiveTripMapProps) {
  const boundsPoints = [
    ...stops.map((s) => ({ lat: s.lat, lng: s.lng })),
    ...(driverPosition ? [{ lat: driverPosition.lat, lng: driverPosition.lng }] : []),
  ];

  return (
    <GoogleMapsProvider>
      <div className={className}>
        <Map
          defaultCenter={boundsPoints[0] ?? FALLBACK_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <FitBoundsOnce points={boundsPoints} />

          {routePolyline && routePolyline.length > 1 && (
            <Polyline path={routePolyline} strokeColor="#C2203C" strokeOpacity={0.55} strokeWeight={4} />
          )}

          {stops.map((stop) => (
            <Marker
              key={stop.id}
              position={{ lat: stop.lat, lng: stop.lng }}
              title={stop.label}
              icon={stopIcon(stop)}
              label={{
                text: String(stop.sequence),
                color: stop.reached ? REACHED_DOT_FG : UPCOMING_DOT_FG,
                fontSize: '11px',
                fontWeight: '600',
              }}
              zIndex={500}
            />
          ))}

          {driverPosition && <DriverMarker position={driverPosition} />}
        </Map>
      </div>
    </GoogleMapsProvider>
  );
}
