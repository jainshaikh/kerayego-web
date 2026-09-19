'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tripsApi,
  type CreateTripPayload,
  type UpdateTripPayload,
  type RecordTripEventPayload,
} from '../lib/api/trips.api';
import { trackEvent } from '../lib/utils/analytics';

function errorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })
      ?.response?.data?.error?.message ?? fallback
  );
}

// ── Poster hooks (any signed-in user) ────────────────────────────────────

export function useMyTrips(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['trips', 'my', params],
    queryFn: () => tripsApi.getMyTrips(params),
  });
}

export function useMyTrip(id: string) {
  return useQuery({
    queryKey: ['trips', 'my', 'detail', id],
    queryFn: () => tripsApi.getMyTrip(id),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTripPayload) => tripsApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'my'] });
      trackEvent('offer_ride', { origin_city: variables.originCity, destination_city: variables.destinationCity });
      toast.success('Trip posted — now visible to riders');
    },
    onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to post trip')),
  });
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTripPayload) => tripsApi.update(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'my'] });
      toast.success('Trip updated');
    },
    onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to update trip')),
  });
}

export function useCancelTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => tripsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'my'] });
      toast.success('Trip cancelled');
    },
    onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to cancel trip')),
  });
}

// ── Day-of-trip execution ────────────────────────────────────────────────

export function useTripManifest(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['trips', 'my', 'manifest', tripId],
    queryFn: () => tripsApi.getManifest(tripId),
    enabled: enabled && !!tripId,
    // Fallback in case a socket drop is missed — the gateway never broadcasts
    // manifest/status changes, only location, so this is the only way a
    // second tab/device picks up another driver's pickup/dropoff taps.
    refetchInterval: enabled ? 20_000 : false,
  });
}

// start/end are NOT idempotent on the backend (a second call 400s) — callers
// must disable their trigger button while isPending.
export function useStartTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripsApi.startTrip(id),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'my'] });
      queryClient.setQueryData(['trips', 'my', 'detail', trip.id], trip);
      toast.success('Trip started');
    },
    onError: (error: unknown) => toast.error(errorMessage(error, 'Could not start the trip — it may already be in progress')),
  });
}

// recordEvent IS idempotent by the caller-supplied payload.id — reuse the same
// id on retry after a failure instead of generating a new one.
export function useRecordTripEvent(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordTripEventPayload) => tripsApi.recordEvent(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'my', 'manifest', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-inquiries'] });
    },
    onError: (error: unknown) => toast.error(errorMessage(error, 'Failed to record — please try again')),
  });
}

export function useEndTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripsApi.endTrip(id),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'my', 'manifest', trip.id] });
      queryClient.invalidateQueries({ queryKey: ['trip-inquiries'] });
      queryClient.setQueryData(['trips', 'my', 'detail', trip.id], trip);
      toast.success('Trip ended');
    },
    onError: (error: unknown) => toast.error(errorMessage(error, 'Could not end the trip — it may already be completed')),
  });
}

export function useMyActiveRide() {
  return useQuery({
    queryKey: ['trips', 'active-ride'],
    queryFn: () => tripsApi.getMyActiveRide(),
    staleTime: 20_000,
  });
}
