import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingsApi, type BookingStatus, type CreateBookingRequestData, type UpdateBookingStatusData } from '../lib/api/bookings.api';
import { trackEvent } from '../lib/utils/analytics';

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
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send inquiry');
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
      qc.invalidateQueries({ queryKey: ['provider-inquiries'] });
      qc.setQueryData(['bookings', updated.id], updated);
      const msg = STATUS_TOAST[data.newStatus];
      if (msg) toast.success(msg);
    },
    onError: () => toast.error('Failed to update status'),
  });
}

// ── Provider hooks ─────────────────────────────────────────────────────────

export function useProviderInquiries(status?: BookingStatus, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['provider-inquiries', status, page, limit],
    queryFn: () => bookingsApi.getProviderInquiries(status, page, limit),
    staleTime: 30_000,
  });
}

