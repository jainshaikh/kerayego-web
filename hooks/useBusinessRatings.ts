'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../lib/api/reviews.api';
import {
  buildCustomerRatingPayload,
  customersToRate,
  isAlreadyRatedError,
  type RateableBooking,
  type RateCustomerFormValues,
} from '../lib/ops/ratings';

// The business's customer ratings, ported from the KerayeGo Partner app's
// features/ratings/queries.ts. Same query key as hooks/useReviews.ts's
// useMyEligibleReviews, so both stay in step; every review query sits under ['reviews'].

export const businessRatingKeys = {
  reviews: ['reviews'] as const,
  eligible: ['reviews', 'my', 'eligible'] as const,
};

/** Completed rentals whose customer the business can still rate, most recent first. */
export function useCustomersToRate(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: businessRatingKeys.eligible,
    queryFn: reviewsApi.getMyEligible,
    select: customersToRate,
    enabled: options.enabled ?? true,
  });
}

/**
 * POST /reviews — the business admin privately rates a rental's customer.
 * Every review query refreshes after it, so the rental leaves the lists; a
 * 409 (already rated, e.g. in the Partner app) refreshes the eligible list too.
 */
export function useRateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ booking, values }: { booking: Pick<RateableBooking, 'id' | 'user'>; values: RateCustomerFormValues }) =>
      reviewsApi.create(buildCustomerRatingPayload(booking, values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: businessRatingKeys.reviews }),
    onError: (error) => {
      if (isAlreadyRatedError(error)) void queryClient.invalidateQueries({ queryKey: businessRatingKeys.eligible });
    },
  });
}
