'use client';

import { Flag, MapPin, Navigation } from 'lucide-react';
import type { DriverAssignedJob } from '../../types/driver.types';
import { stopTimeLabel } from '../../lib/ops/bookingRoute';
import {
  googleMapsDirectionsUrl,
  jobPlaces,
  jobRouteDirectionsUrl,
  jobSummaryLine,
  showsPlaceMaps,
} from '../../lib/driver/jobPlaces';

// The job's route on the driver's Jobs page (plan A72, §3c): the package, trip
// type and passengers, then every pickup and drop-off in route order with the
// time the car should get there and the customer's note — where to go, never
// where the customer is. While the job is still to be driven each place has
// "Map" (Google Maps directions to it) and the whole route has "Directions for
// the whole route". Plain links to Google Maps — no Maps JavaScript here. Port
// of the KerayeGo Partner app's JobPlaces.
export function JobPlaces({ job }: { job: DriverAssignedJob }) {
  const places = jobPlaces(job);
  const summary = jobSummaryLine(job);
  if (places.length === 0 && !summary) return null;
  const withMaps = showsPlaceMaps(job);
  const routeUrl = withMaps ? jobRouteDirectionsUrl(job) : null;

  return (
    <div className="mt-4 space-y-2 border-t border-border-subtle pt-4">
      {summary ? <p className="text-[13px] text-text-muted">{summary}</p> : null}
      <ul className="space-y-2">
        {places.map((place) => {
          const Icon = place.kind === 'pickup' ? MapPin : Flag;
          return (
            <li key={place.key} className="flex items-start gap-2 text-sm">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
              <div className="min-w-0 flex-1">
                <p className="text-ink">
                  <span className="font-medium">{place.label}</span>
                  {place.expectedAt ? (
                    <span className="text-text-muted"> · {stopTimeLabel(place.expectedAt, job.requestedFromDate)}</span>
                  ) : null}
                  : {place.text}
                </p>
                {place.note ? <p className="text-xs text-text-muted">Note: {place.note}</p> : null}
              </div>
              {withMaps ? (
                <a
                  href={googleMapsDirectionsUrl(place.coords ?? place.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Directions to the ${place.label.toLowerCase()} in Google Maps`}
                  className="flex-shrink-0 rounded-control px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Map
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      {routeUrl ? (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-control border border-border-strong px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-hover"
        >
          <Navigation className="h-3.5 w-3.5" />
          Directions for the whole route
        </a>
      ) : null}
      {places.some((place) => place.expectedAt) ? (
        <p className="text-xs text-text-faint">Times are estimates without traffic.</p>
      ) : null}
    </div>
  );
}
