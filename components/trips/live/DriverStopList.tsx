'use client';

import { Check } from 'lucide-react';
import type { ManifestRouteStop } from '../../../lib/api/trips.api';
import { Button, Card } from '../../ui';

interface DriverStopListProps {
  stops: ManifestRouteStop[];
  arrivedStopIds: Set<string>;
  actioningKey: string | null;
  onArrive: (stop: ManifestRouteStop) => void;
}

// Web has no GPS geofencing (decision: rider/driver confirm buttons, not a
// distance gate — see plan). Sequencing is still enforced client-side: only
// the next unresolved stop's "Arrived" button is enabled, so a driver can't
// mark stop 3 before stop 1 by mistake.
export function DriverStopList({ stops, arrivedStopIds, actioningKey, onArrive }: DriverStopListProps) {
  const nextStopId = stops.find((s) => !arrivedStopIds.has(s.id))?.id;

  return (
    <Card className="space-y-3 p-5">
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">Route stops</p>
      <div className="space-y-2">
        {stops.map((stop, index) => {
          const reached = arrivedStopIds.has(stop.id);
          const isNext = stop.id === nextStopId;
          const key = `stop:${stop.id}`;
          return (
            <div
              key={stop.id}
              className="flex items-center justify-between gap-3 rounded-control border border-border-subtle px-3.5 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={
                    reached
                      ? 'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-status-emerald-bg text-status-emerald-fg'
                      : 'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-page text-xs font-semibold text-text-muted'
                  }
                >
                  {reached ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{stop.label}</p>
                  <p className="text-xs text-text-faint">{stop.type === 'PICKUP' ? 'Pickup' : 'Drop-off'}</p>
                </div>
              </div>
              {!reached && (
                <Button
                  size="sm"
                  variant={isNext ? 'primary' : 'secondary'}
                  disabled={!isNext || actioningKey === key}
                  loading={actioningKey === key}
                  onClick={() => onArrive(stop)}
                >
                  Arrived
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
