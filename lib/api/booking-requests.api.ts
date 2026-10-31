import { apiClient } from './client';
import type { ApiResponse, PaginationMeta } from '../../types/api.types';
import type {
  BookingRequest,
  BookingRequestDetail,
  EligibleDriver,
  IncomingBookingRequestsParams,
  PagedBookingRequests,
  ProviderBookingCounts,
  SetBookingDriverPayload,
  UpdateBookingStatusPayload,
} from '../../types/booking-requests.types';

// The business's booking inbox (kerayego-backend booking-requests.controller.ts),
// ported from the KerayeGo Partner app's api/booking-requests.api.ts. The list
// and counts are for a business admin or manager (403 "No provider profile
// found" otherwise); detail and status are shared with customers and KerayeGo
// admin — the backend checks the request belongs to this business.
// Unwraps the { success, data, meta } envelope (unlike the older bookings.api.ts).

export const BOOKING_REQUESTS_PAGE_SIZE = 20;

export const bookingRequestsApi = {
  /** GET /provider/inquiries — newest first; one status, or needsDriver (ACCEPTED, not started, no driver). */
  getIncoming: async ({
    status,
    needsDriver,
    page = 1,
    limit = BOOKING_REQUESTS_PAGE_SIZE,
  }: IncomingBookingRequestsParams = {}): Promise<PagedBookingRequests> => {
    const res = await apiClient.get<ApiResponse<BookingRequest[]>>('/provider/inquiries', {
      params: { status, needsDriver: needsDriver ? 'true' : undefined, page, limit },
    });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  /** GET /provider/inquiries/counts — New (PENDING), Contacted and Needs a driver. */
  getIncomingCounts: async (): Promise<ProviderBookingCounts> => {
    const res = await apiClient.get<ApiResponse<ProviderBookingCounts>>('/provider/inquiries/counts');
    return res.data.data;
  },

  /** GET /booking-requests/:id — 403 if it isn't this business's request. */
  getOne: async (id: string): Promise<BookingRequestDetail> => {
    const res = await apiClient.get<ApiResponse<BookingRequestDetail>>(`/booking-requests/${id}`);
    return res.data.data;
  },

  /** PATCH /booking-requests/:id/status — returns the updated request (without the owner ids). */
  updateStatus: async (id: string, data: UpdateBookingStatusPayload): Promise<BookingRequest> => {
    const res = await apiClient.patch<ApiResponse<BookingRequest>>(`/booking-requests/${id}/status`, data);
    return res.data.data;
  },

  /** GET /booking-requests/:id/eligible-drivers — every active driver, eligible first, the rest with reasons. */
  getEligibleDrivers: async (bookingId: string): Promise<EligibleDriver[]> => {
    const res = await apiClient.get<ApiResponse<EligibleDriver[]>>(`/booking-requests/${bookingId}/eligible-drivers`);
    return res.data.data;
  },

  /**
   * PATCH /booking-requests/:id/driver — assign, change or (null) remove the
   * driver while ACCEPTED and not started (409 otherwise; 400 with reasons or
   * 409 "Busy at that time" for a driver who can't take it). Returns the detail.
   */
  setDriver: async (bookingId: string, assignedDriverId: string | null): Promise<BookingRequestDetail> => {
    const body: SetBookingDriverPayload = { assignedDriverId };
    const res = await apiClient.patch<ApiResponse<BookingRequestDetail>>(`/booking-requests/${bookingId}/driver`, body);
    return res.data.data;
  },
};
