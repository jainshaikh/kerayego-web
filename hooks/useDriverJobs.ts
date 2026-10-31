'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../lib/api/driver.api';
import { driverKeys } from './useDriverProfile';
import type { CreateReturnTripPayload } from '../types/driver.types';

// The driver's assigned jobs, the customer rating and the return trip — the
// web twin of the jobs part of kerayego-partner's features/driver/queries.ts.
// Start/End job, location sharing and "Picked up customer" are not here: the
// on-trip session stays in the KerayeGo Partner app.

export function useMyDriverJobs() {
  return useQuery({
    queryKey: driverKeys.jobs(),
    queryFn: driverApi.getMyJobs,
  });
}

/** POST /driver/jobs/:bookingId/respond. Accept 403s while on hold; Decline always goes through. */
export function useRespondToDriverJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, response }: { bookingId: string; response: 'ACCEPT' | 'DECLINE' }) =>
      driverApi.respondToJob(bookingId, response),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: driverKeys.jobs() }),
  });
}

/**
 * GET /reviews/my/eligible — completed jobs whose customer is still unrated
 * (bookingsAsDriver). Same key as hooks/useReviews.ts useMyEligibleReviews:
 * one request, one cache entry.
 */
export function useDriverEligibleReviews() {
  return useQuery({
    queryKey: driverKeys.eligibleReviews,
    queryFn: driverApi.getMyEligibleReviews,
  });
}

/** POST /reviews — the private rating of a job's customer. Refreshes every review query (the job drops off). */
export function useRateDriverCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      customerId,
      rating,
      comment,
    }: {
      bookingId: string;
      customerId: string;
      rating: number;
      comment: string;
    }) => driverApi.rateCustomer(bookingId, customerId, rating, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    onError: () => {
      // 409 = already rated (e.g. in the Partner app): refresh so the button goes away.
      void queryClient.invalidateQueries({ queryKey: driverKeys.eligibleReviews });
    },
  });
}

export function useReturnTripTemplate(bookingId: string | null) {
  return useQuery({
    queryKey: driverKeys.returnTripTemplate(bookingId ?? ''),
    queryFn: () => driverApi.getReturnTripTemplate(bookingId as string),
    enabled: !!bookingId,
  });
}

export function useCreateReturnTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnTripPayload) => driverApi.postReturnTrip(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.jobs() });
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
