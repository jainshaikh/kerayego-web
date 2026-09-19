import apiClient from './client';
import type { ApiResponse, PaginationMeta } from '../../types/api.types';
import type { PickupSource, TripStatus } from './trips.api';

export type TripInquiryStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface TripInquiryStopRef {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface TripInquiryUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface TripInquiryTrip {
  id: string;
  status: TripStatus;
  originCity: string;
  destinationCity: string;
  pickupPoint: string;
  dropoffPoint: string | null;
  departureAt: string;
  availableSeats: number;
  pricePerSeat: string | number;
  contactNumber: string;
  postedByUserId: string;
  postedBy: { id: string; name: string; email: string; phone: string | null };
  userVehicle: {
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    plateNumber: string;
    images: { url: string; altText: string | null }[];
  };
}

export interface TripInquiry {
  id: string;
  requestedSeats: number;
  pickupNote: string | null;
  message: string | null;
  status: TripInquiryStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Day-of-trip state — driver-authoritative (a rider's own self-report never
  // sets pickupConfirmedAt; see TripsService.recordEvent on the backend).
  pickupConfirmedAt: string | null;
  pickupSource: PickupSource | null;
  droppedOffAt: string | null;
  pickupStop: TripInquiryStopRef | null;
  dropoffStop: TripInquiryStopRef | null;
  user: TripInquiryUser;
  trip: TripInquiryTrip;
}

export interface ChatMessage {
  id: string;
  tripInquiryId: string;
  senderId: string;
  body: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface TripInquiriesResponse {
  data: TripInquiry[];
  meta: PaginationMeta;
}

export interface CreateTripInquiryPayload {
  tripId: string;
  requestedSeats: number;
  pickupStopId: string;
  dropoffStopId: string;
  pickupNote?: string;
  message?: string;
}

export interface UpdateTripInquiryStatusPayload {
  newStatus: TripInquiryStatus;
  note?: string;
}

export const tripInquiriesApi = {
  create: async (data: CreateTripInquiryPayload): Promise<TripInquiry> => {
    const res = await apiClient.post<ApiResponse<TripInquiry>>('/trip-inquiries', data);
    return res.data.data;
  },

  getMine: async (page = 1, limit = 20): Promise<TripInquiriesResponse> => {
    const res = await apiClient.get<ApiResponse<TripInquiry[]>>('/trip-inquiries', { params: { page, limit } });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  getMyCounts: async (): Promise<{ pending: number }> => {
    const res = await apiClient.get<ApiResponse<{ pending: number }>>('/trip-inquiries/counts');
    return res.data.data;
  },

  getOne: async (id: string): Promise<TripInquiry> => {
    const res = await apiClient.get<ApiResponse<TripInquiry>>(`/trip-inquiries/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: string, data: UpdateTripInquiryStatusPayload): Promise<TripInquiry> => {
    const res = await apiClient.patch<ApiResponse<TripInquiry>>(`/trip-inquiries/${id}/status`, data);
    return res.data.data;
  },

  // Poster inbox — incoming requests across all of my own posted trips
  getInbox: async (params?: { tripId?: string; status?: TripInquiryStatus; page?: number; limit?: number }): Promise<TripInquiriesResponse> => {
    const res = await apiClient.get<ApiResponse<TripInquiry[]>>('/my/trip-inquiries', { params });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  getInboxCounts: async (): Promise<{ pending: number }> => {
    const res = await apiClient.get<ApiResponse<{ pending: number }>>('/my/trip-inquiries/counts');
    return res.data.data;
  },

  // Chat — REST catch-up (history); live delivery is over the /ride socket.
  getMessages: async (tripInquiryId: string, after?: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ApiResponse<ChatMessage[]>>(
      `/trip-inquiries/${tripInquiryId}/messages`,
      { params: after ? { after } : undefined },
    );
    return res.data.data;
  },
};
