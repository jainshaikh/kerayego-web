import type { CarRating } from '../../lib/api/listings.api';
import { rideCountLabel } from '../../lib/utils/copy';
import { cn } from '../../lib/utils/cn';
import { RatingBadge } from '../ui';
import { RatingSummaryBadge } from '../common/RatingSummaryBadge';

interface CarRatingLineProps {
  vehicleId: string;
  /**
   * The listing's own figures (A87). An older backend doesn't send them — the
   * line then asks GET /reviews/summary itself, unless `fetchIfMissing` is
   * false (a list card: one request per card is too many).
   */
  carRating?: CarRating;
  fetchIfMissing?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

// "This exact car · ★ 4.6 (12) · 30 rides on KerayeGo" (plan A87): the
// customer requests this car — the one in the photos, identified by its plate
// (A15) — and the rating and rides are that car's own, across every listing
// of its plate. Same wording as the customer app's CarRatingLine. No hooks, so
// server pages can render it.
export function CarRatingLine({
  vehicleId,
  carRating,
  fetchIfMissing = true,
  size = 'sm',
  className,
}: CarRatingLineProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5', size === 'sm' ? 'text-xs' : 'text-sm', className)}>
      <span className="font-semibold text-brand-700">This exact car</span>
      {carRating ? (
        <>
          <span className="text-text-faint">·</span>
          <RatingBadge average={carRating.averageRating} count={carRating.reviewCount} size={size} />
          {carRating.rideCount > 0 ? (
            <>
              <span className="text-text-faint">·</span>
              <span className="text-text-muted">{rideCountLabel(carRating.rideCount)}</span>
            </>
          ) : null}
        </>
      ) : fetchIfMissing ? (
        <>
          <span className="text-text-faint">·</span>
          <RatingSummaryBadge subjectType="VEHICLE" subjectId={vehicleId} size={size} />
        </>
      ) : null}
    </span>
  );
}
