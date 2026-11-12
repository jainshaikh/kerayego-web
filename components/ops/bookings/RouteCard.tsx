'use client';

import { Flag, MapPin } from 'lucide-react';
import type { BookingRequest } from '../../../types/booking-requests.types';
import { ROUTE_FOOTNOTE, routeFactRows, routeStopItems, stopTimeLabel } from '../../../lib/ops/bookingRoute';
import { DetailRow, SectionCard } from './BookingBits';

// A request's Route section (plan §3c, A78): every pickup and drop-off in
// route order with the time the car should get there, the customer's note and
// the drive from the stop before; then the route's km, driving and time needed
// against the package, and the business's own legs (showroom → first pickup,
// a one-way drive back). Places only — never anyone's live position (A72,
// A73). Nothing for a request without stops (sent before 2026-11-11 — its
// places are rows in the Rental card). Port of the Partner app's RouteCard.
export function RouteCard({ booking }: { booking: BookingRequest }) {
  const stops = routeStopItems(booking.stops);
  if (stops.length === 0) return null;
  const facts = routeFactRows(booking);

  return (
    <SectionCard title="Route">
      <ol className="space-y-3">
        {stops.map((stop) => {
          const Icon = stop.kind === 'pickup' ? MapPin : Flag;
          return (
            <li key={stop.key} className="flex gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap justify-between gap-x-3">
                  <span className="text-sm font-semibold text-ink">{stop.title}</span>
                  {stop.expectedAt ? (
                    <span className="text-xs text-text-muted">
                      {stopTimeLabel(stop.expectedAt, booking.requestedFromDate)}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-ink">{stop.place}</p>
                {stop.note ? <p className="text-xs text-text-muted">Note: {stop.note}</p> : null}
                {stop.leg ? <p className="text-xs text-text-muted">{stop.leg} from the stop before</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {facts.length > 0 ? (
        <div className="space-y-1.5 border-t border-border-subtle pt-3">
          {facts.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
          <p className="pt-1 text-xs leading-relaxed text-text-muted">{ROUTE_FOOTNOTE}</p>
        </div>
      ) : null}
    </SectionCard>
  );
}
