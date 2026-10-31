// Display helpers for the business's live map, ported from the KerayeGo
// Partner app's app/(business)/business/live-map.tsx.

/** "Live now" (under 20 s), "45s ago", "3m ago", "2h ago", or "No GPS fix yet". */
export function formatLastSeen(timestamp: string | null | undefined, now: number = Date.now()): string {
  if (!timestamp) return 'No GPS fix yet';
  const diffSec = Math.max(0, Math.floor((now - new Date(timestamp).getTime()) / 1000));
  if (diffSec < 20) return 'Live now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

/** Speed as shown under a driver: "42 km/h", or "Stationary" without one. */
export function speedLabel(speedKmh: number | null | undefined): string {
  return speedKmh !== null && speedKmh !== undefined ? `${Math.round(speedKmh)} km/h` : 'Stationary';
}

/** A plain data-URI SVG dot (no google.maps.* construction, so it works before the Maps script loads). */
export function dotIcon(fill: string, stroke: string, radius: number): string {
  const size = radius * 2 + 4;
  const c = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${c}" cy="${c}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
