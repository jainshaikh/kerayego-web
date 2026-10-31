'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Loader2 } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState } from '../../ui';
import { StatusBadge } from '../../common/StatusBadge';
import { RatingSummaryBadge } from '../../common/RatingSummaryBadge';
import { ReviewsList } from '../../common/ReviewsList';
import { useRatingSummary } from '../../../hooks/useReviews';
import { useMyVehiclesInfinite } from '../../../hooks/useVehicles';
import { useWorkspace } from '../../../hooks/useWorkspace';
import { apiErrorInfo, apiErrorMessage } from '../../../lib/ops/apiError';
import { VEHICLE_STATUS_LABELS } from '../../../lib/ops/fleetRules';
import type { FleetVehicleListItem } from '../../../types/fleet.types';

// "Car ratings": every car of the business (GET /vehicles, newest first, 20 at
// a time) with its customers' public rating and reviews — ported from the
// KerayeGo Partner app's CarRatingsList / CarRatingCard. Business (PROVIDER)
// reviews are never shown (plan A18).
export function CarRatingsList() {
  const router = useRouter();
  const { can } = useWorkspace();
  const cars = useMyVehiclesInfinite();

  if (cars.isPending) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your cars…
      </p>
    );
  }
  if (!cars.data) {
    if (apiErrorInfo(cars.error).kind === 'forbidden') {
      return (
        <EmptyState
          icon={Car}
          title="Set up your business first"
          description="Once your business is set up and your cars are listed, customers' ratings of each car show up here."
        />
      );
    }
    return <ErrorState description={apiErrorMessage(cars.error)} onRetry={() => cars.refetch()} />;
  }

  const list = cars.data.pages.flatMap((page) => page.data);
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No cars yet"
        description="Add a car to your fleet. After each completed rental the customer can rate the car, and the ratings show up here."
        action={can('manageFleet') ? { label: 'Add a car', onClick: () => router.push('/provider/vehicles/new') } : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        Customers rate the car after a completed rental. These ratings are public: customers see them on the car’s page.
      </p>
      {list.map((car) => (
        <CarRatingCard key={car.id} car={car} />
      ))}
      {cars.isFetchNextPageError ? <p className="text-sm text-red-700">{apiErrorMessage(cars.error)}</p> : null}
      {cars.hasNextPage ? (
        <Button variant="secondary" loading={cars.isFetchingNextPage} onClick={() => cars.fetchNextPage()}>
          Load more cars
        </Button>
      ) : null}
    </div>
  );
}

function CarRatingCard({ car }: { car: FleetVehicleListItem }) {
  const [showReviews, setShowReviews] = useState(false);
  // Only offer the reviews when there are some — or when the summary failed,
  // so the list can show the error.
  const summary = useRatingSummary('VEHICLE', car.id);
  const canShowReviews = summary.isError || (summary.data?.count ?? 0) > 0;
  const cover = car.images[0];

  return (
    <Card className="space-y-3">
      <div className="flex gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-media bg-surface-hover text-text-faint">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt={cover.altText ?? car.title} className="h-full w-full object-cover" />
          ) : (
            <Car className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 text-sm font-semibold text-ink">{car.title}</p>
          <StatusBadge status={car.status} size="sm" label={VEHICLE_STATUS_LABELS[car.status]} />
          <div>
            <RatingSummaryBadge subjectType="VEHICLE" subjectId={car.id} size="sm" />
          </div>
        </div>
        {canShowReviews ? (
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onClick={() => setShowReviews((shown) => !shown)}
            aria-label={`${showReviews ? 'Hide' : 'Show'} reviews of ${car.title}`}
          >
            {showReviews ? 'Hide reviews' : 'Show reviews'}
          </Button>
        ) : null}
      </div>
      {canShowReviews && showReviews ? (
        <div className="border-t border-border-subtle pt-3">
          <ReviewsList subjectType="VEHICLE" subjectId={car.id} title="Customer reviews" />
        </div>
      ) : null}
    </Card>
  );
}
