import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tripInquiriesApi,
  type TripInquiryStatus,
  type CreateTripInquiryPayload,
  type UpdateTripInquiryStatusPayload,
} from '../lib/api/trip-inquiries.api';
import { trackEvent } from '../lib/utils/analytics';

// ── Rider hooks ─────────────────────────────────────────────────────────────

export function useMyTripInquiries(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['trip-inquiries', 'my', page, limit],
    queryFn: () => tripInquiriesApi.getMine(page, limit),
  });
}

export function useMyTripInquiryCounts() {
  return useQuery({
    queryKey: ['trip-inquiries', 'counts'],
    queryFn: tripInquiriesApi.getMyCounts,
    staleTime: 60_000,
  });
}

export function useTripInquiry(id: string) {
  return useQuery({
    queryKey: ['trip-inquiries', id],
    queryFn: () => tripInquiriesApi.getOne(id),
    enabled: !!id,
    // The /ride socket only broadcasts location, never manifest/status changes
    // — poll while the trip is live so this tab picks up the driver's own
    // pickup/dropoff taps without a manual refresh.
    refetchInterval: (query) => (query.state.data?.trip.status === 'IN_PROGRESS' ? 15_000 : false),
  });
}

export function useCreateTripInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTripInquiryPayload) => tripInquiriesApi.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['trip-inquiries'] });
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['trip'] });
      trackEvent('join_ride', { trip_id: variables.tripId, seats: variables.requestedSeats });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send request');
    },
  });
}

const STATUS_TOAST: Partial<Record<TripInquiryStatus, string>> = {
  ACCEPTED: 'Request accepted',
  REJECTED: 'Request declined',
  CANCELLED: 'Request cancelled',
};

export function useUpdateTripInquiryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripInquiryStatusPayload }) =>
      tripInquiriesApi.updateStatus(id, data),
    onSuccess: (updated, { data }) => {
      qc.invalidateQueries({ queryKey: ['trip-inquiries'] });
      qc.invalidateQueries({ queryKey: ['trip-inquiry-inbox'] });
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['trip'] });
      qc.setQueryData(['trip-inquiries', updated.id], updated);
      const msg = STATUS_TOAST[data.newStatus];
      if (msg) toast.success(msg);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    },
  });
}

// ── Poster hooks (inbox across all of my own posted trips) ─────────────────

export function useTripInquiryInbox(params?: { tripId?: string; status?: TripInquiryStatus; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['trip-inquiry-inbox', params],
    queryFn: () => tripInquiriesApi.getInbox(params),
    staleTime: 30_000,
  });
}

export function useTripInquiryInboxCounts() {
  return useQuery({
    queryKey: ['trip-inquiry-inbox', 'counts'],
    queryFn: tripInquiriesApi.getInboxCounts,
    staleTime: 30_000,
  });
}
