'use client';

import { useRatingSummary } from '../../hooks/useReviews';
import { RatingBadge } from '../ui';
import { cn } from '../../lib/utils/cn';
import { rideCountLabel } from '../../lib/utils/copy';
import type { ReviewSubjectType } from '../../lib/api/reviews.api';

interface RatingSummaryBadgeProps {
  subjectType: ReviewSubjectType;
  subjectId: string | undefined;
  size?: 'sm' | 'md';
  className?: string;
  /**
   * Car subjects only: also show "N rides on KerayeGo" (the plate's ride
   * count, plan A17) when it's above 0. Default true; pass false where the
   * page already renders the ride count itself (e.g. server-side).
   */
  showRideCount?: boolean;
}

// Small client island dropped into server-rendered detail pages — fetches and
// renders a subject's public rating summary ("★ 4.8 (23)" or "No ratings yet"),
// plus a car's ride count when it has one. Never shown for a person (USER).
export function RatingSummaryBadge({
  subjectType,
  subjectId,
  size,
  className,
  showRideCount = true,
}: RatingSummaryBadgeProps) {
  const { data, isLoading } = useRatingSummary(subjectType, subjectId);
  if (isLoading || !subjectId) return null;

  const average = data?.average ?? null;
  const count = data?.count ?? 0;
  const isCar = subjectType === 'VEHICLE' || subjectType === 'USER_VEHICLE';
  const rideCount = data?.rideCount ?? 0;
  if (!showRideCount || !isCar || rideCount <= 0) {
    return <RatingBadge average={average} count={count} size={size} className={className} />;
  }
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1.5', className)}>
      <RatingBadge average={average} count={count} size={size} />
      <span className={cn('text-text-muted', size === 'sm' ? 'text-xs' : 'text-sm')}>· {rideCountLabel(rideCount)}</span>
    </span>
  );
}
