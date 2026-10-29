'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Route } from 'lucide-react';
import { useMyTrips, useCancelTrip } from '../../hooks/useTrips';
import { StatusBadge } from '../common/StatusBadge';
import { buttonVariants, Card, ConfirmDialog, EmptyState } from '../ui';
import { getCurrencyCode } from '../../lib/utils/currency';
import { formatTripDateTime } from '../../lib/utils/datetime';

interface MyTripsListProps {
  basePath: string; // e.g. '/dashboard/trips'
  newHref: string; // e.g. '/dashboard/trips/new'
}

export function MyTripsList({ basePath, newHref }: MyTripsListProps) {
  const router = useRouter();
  const { data, isLoading } = useMyTrips({ limit: 50 });
  const cancelTrip = useCancelTrip();
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const trips = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink">My Trips</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Intercity trips you&apos;ve posted
            {meta && ` · ${meta.total} total`}
          </p>
        </div>
        {!isLoading && (
          <Link href={newHref} className={buttonVariants({ className: 'flex-shrink-0' })}>
            <Plus className="h-4 w-4" />
            Post a trip
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[104px] animate-pulse rounded-card border border-border-subtle bg-surface"
            />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No trips posted yet"
          description="Announce a city-to-city trip and riders will contact you directly."
          action={{ label: 'Post your first trip', onClick: () => router.push(newHref) }}
        />
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const departed = new Date(trip.departureAt) < new Date();
            return (
              <Card
                key={trip.id}
                className="ease-spring flex flex-wrap items-start justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`${basePath}/${trip.id}`}
                      className="font-semibold text-ink transition-colors hover:text-brand-700"
                    >
                      {trip.originCity.charAt(0).toUpperCase() + trip.originCity.slice(1)}
                      {' → '}
                      {trip.destinationCity.charAt(0).toUpperCase() + trip.destinationCity.slice(1)}
                    </Link>
                    <StatusBadge status={trip.status} size="sm" />
                    {departed && trip.status === 'ACTIVE' && (
                      <span className="text-xs text-text-faint">(departed)</span>
                    )}
                  </div>

                  <p className="mt-1 font-mono text-xs text-text-muted">
                    {trip.fleetVehicle?.title ??
                      `${trip.userVehicle?.make ?? ''} ${trip.userVehicle?.model ?? ''}`.trim()}{' '}
                    · {formatTripDateTime(trip.departureAt)} PKT
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4">
                    <span className="font-mono text-sm font-semibold text-ink">
                      {getCurrencyCode(trip.userVehicle?.country)} {Number(trip.pricePerSeat).toLocaleString()}
                      <span className="ml-0.5 font-sans text-xs font-normal text-text-faint">
                        /seat
                      </span>
                    </span>
                    <span className="text-xs text-text-faint">{trip.availableSeats} seats</span>
                  </div>

                  {trip.status === 'REJECTED' && trip.rejectionReason && (
                    <p className="mt-2 rounded-control border border-status-red-border bg-status-red-bg px-3 py-2 text-xs text-status-red-fg">
                      Reason: {trip.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <Link
                    href={`${basePath}/${trip.id}`}
                    className="text-xs font-semibold text-text-muted transition-colors hover:text-brand-700"
                  >
                    View
                  </Link>
                  {trip.status === 'ACTIVE' && (
                    <button
                      onClick={() => setConfirmCancelId(trip.id)}
                      className="text-xs font-medium text-text-faint transition-colors hover:text-red-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Was a hand-rolled fixed-overlay modal — ConfirmDialog already handles
          focus trap, escape, and scroll lock. */}
      <ConfirmDialog
        open={!!confirmCancelId}
        onOpenChange={(open) => !open && setConfirmCancelId(null)}
        title="Cancel this trip?"
        description="The trip will be taken down and no one will be able to request a seat on it. A trip with pending or booked seats can't be cancelled — open it and cancel or decline each seat first."
        confirmLabel="Cancel trip"
        cancelLabel="Keep it"
        destructive
        loading={cancelTrip.isPending}
        onConfirm={async () => {
          if (!confirmCancelId) return;
          try {
            await cancelTrip.mutateAsync({ id: confirmCancelId });
          } catch {
            // useCancelTrip toasts the backend's message (e.g. the A49 seat refusal).
          }
          setConfirmCancelId(null);
        }}
      />
    </div>
  );
}
