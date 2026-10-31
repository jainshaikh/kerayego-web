'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { bookingRequestsApi } from '../lib/api/booking-requests.api';
import { filterQuery, type BookingFilter } from '../lib/ops/bookingDisplay';
import type { BookingRequestDetail, UpdateBookingStatusPayload } from '../types/booking-requests.types';
import { liveMapKeys } from './useLiveMap';

// The business's booking inbox, ported from the KerayeGo Partner app's
// features/booking-requests/queries.ts (page-numbered here instead of
// infinite scroll). Everything sits under ['booking-requests'].

export const bookingRequestKeys = {
  all: ['booking-requests'] as const,
  list: (filter: BookingFilter, page: number) => ['booking-requests', 'list', filter, page] as const,
  counts: ['booking-requests', 'counts'] as const,
  detail: (id: string | undefined) => ['booking-requests', 'detail', id] as const,
  eligibleDrivers: (id: string | undefined) => ['booking-requests', 'eligible-drivers', id] as const,
};

/** After a status or driver change: every list, the counts, every detail, the drivers lists and the live map. */
function refreshAfterBookingChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: bookingRequestKeys.all }),
    queryClient.invalidateQueries({ queryKey: liveMapKeys.all }),
  ]);
}

/** One page of requests for a filter chip, newest first. */
export function useIncomingBookingRequests(filter: BookingFilter, page: number) {
  return useQuery({
    queryKey: bookingRequestKeys.list(filter, page),
    queryFn: () => bookingRequestsApi.getIncoming({ ...filterQuery(filter), page }),
    placeholderData: (previous) => previous,
  });
}

/** How many are New, Contacted and Needs a driver. */
export function useIncomingBookingCounts() {
  return useQuery({
    queryKey: bookingRequestKeys.counts,
    queryFn: bookingRequestsApi.getIncomingCounts,
  });
}

export function useBookingRequest(id: string | undefined) {
  return useQuery({
    queryKey: bookingRequestKeys.detail(id),
    queryFn: () => bookingRequestsApi.getOne(id as string),
    enabled: !!id,
  });
}

/**
 * Moves a request to a new status. The detail shows the answer at once; then
 * everything refetches — also after a failure, since the usual failure is that
 * the request changed meanwhile (the customer cancelled it).
 */
export function useUpdateBookingRequestStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBookingStatusPayload) => bookingRequestsApi.updateStatus(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<BookingRequestDetail>(bookingRequestKeys.detail(id), (old) =>
        old ? { ...old, ...updated } : old,
      );
    },
    onSettled: () => refreshAfterBookingChange(queryClient),
  });
}

/** The business's drivers for the picker, fetched while it's open; always fresh (busy-ness changes by the minute). */
export function useEligibleDrivers(bookingId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: bookingRequestKeys.eligibleDrivers(bookingId),
    queryFn: () => bookingRequestsApi.getEligibleDrivers(bookingId as string),
    enabled: !!bookingId && enabled,
    staleTime: 0,
  });
}

/** Assigns, changes or (null) removes the booking's driver. */
export function useSetBookingDriver(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignedDriverId: string | null) => bookingRequestsApi.setDriver(bookingId, assignedDriverId),
    onSuccess: (updated) => {
      queryClient.setQueryData<BookingRequestDetail>(bookingRequestKeys.detail(bookingId), (old) =>
        old ? { ...old, ...updated } : updated,
      );
    },
    onSettled: () => refreshAfterBookingChange(queryClient),
  });
}
