import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingsApi, type BookingStatus, type CreateBookingRequestData, type UpdateBookingStatusData } from '../lib/api/bookings.api';
import { trackEvent } from '../lib/utils/analytics';
import { getApiErrorMessage } from './useAccountDeletion';

// ── User hooks ──────────────────────────────────────────────────────────────

export function useMyBookings(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['bookings', 'my', page, limit],
    queryFn: () => bookingsApi.getMyRequests(page, limit),
  });
}

export function useMyBookingCounts() {
  return useQuery({
    queryKey: ['bookings', 'counts'],
    queryFn: bookingsApi.getMyCounts,
    staleTime: 60_000,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingRequestData) => bookingsApi.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      trackEvent('complete_booking', { vehicle_id: variables.vehicleId });
    },
    // Shows the server's message, e.g. the hold message on 403 IDENTITY_ON_HOLD.
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Failed to send inquiry'));
    },
  });
}

const STATUS_TOAST: Partial<Record<BookingStatus, string>> = {
  CONTACTED: 'Marked as contacted',
  ACCEPTED: 'Inquiry accepted',
  REJECTED: 'Inquiry declined',
  CANCELLED: 'Inquiry cancelled',
  COMPLETED: 'Marked as completed',
};

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingStatusData }) =>
      bookingsApi.updateStatus(id, data),
    onSuccess: (updated, { data }) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      // The business inbox (hooks/useBookingRequests.ts), for someone who is both.
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      qc.setQueryData(['bookings', updated.id], updated);
      const msg = STATUS_TOAST[data.newStatus];
      if (msg) toast.success(msg);
    },
    onError: () => toast.error('Failed to update status'),
  });
}
