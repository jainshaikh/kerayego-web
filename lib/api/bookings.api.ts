import { apiClient } from './client';
import type { ApiResponse, Market } from '../../types/api.types';
import type { RentalDurationType } from '../utils/rentalDuration';

export type BookingStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  /** Terminal, set by the backend: accepted, but the booked period ended before the job was started. */
  | 'NOT_STARTED';

export interface BookingVehicle {
  id: string;
  title: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: string | number;
  showroom: { country: Market } | null;
  images: Array<{ url: string; altText: string | null }>;
}

export interface BookingUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface BookingStatusHistory {
  id: string;
  oldStatus: BookingStatus;
  newStatus: BookingStatus;
  note?: string | null;
  createdAt: string;
}

export interface BookingRequest {
  id: string;
  status: BookingStatus;
  requestedFromDate: string;
  requestedToDate: string;
  durationType?: RentalDurationType | null;
  durationQuantity?: number | null;
  totalPrice?: string | number | null;
  pickupLocation?: string | null;
  isOneWay?: boolean;
  pickupCity?: string | null;
  dropoffCity?: string | null;
  dropoffLocation?: string | null;
  assignedDriverId?: string | null;
  assignedDriver?: {
    id: string;
    name: string;
    /**
     * For the customer: null unless the booking is IN_PROGRESS, or ACCEPTED
     * with the driver's job accepted (D14). Never offer Call/WhatsApp without it.
     */
    phone?: string | null;
    avatarUrl?: string | null;
    driverProfile?: {
      licenseCategory: string;
      yearsOfExperience?: number | null;
    } | null;
  } | null;
  message?: string | null;
  providerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: BookingUser;
  vehicle: BookingVehicle;
  providerProfile: { id: string; businessName: string; user: { phone: string | null } };
  statusHistory: BookingStatusHistory[];
}

export interface BookingsResponse {
  data: BookingRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateBookingRequestData {
  vehicleId: string;
  requestedFromDate: string;
  durationType: RentalDurationType;
  durationQuantity: number;
  pickupLocation?: string;
  message?: string;
}

export interface UpdateBookingStatusData {
  newStatus: BookingStatus;
  note?: string;
}

export interface BookingCounts {
  active: number;
  completed: number;
}

// Every call unwraps the backend's { success, data, meta? } envelope, like the
// other lib/api files. (Until 2026-11-10 these returned the envelope itself,
// so the dashboard's counts read `undefined` and always showed 0.)
export const bookingsApi = {
  create: (data: CreateBookingRequestData) =>
    apiClient
      .post<ApiResponse<BookingRequest>>('/booking-requests', data)
      .then((r) => r.data.data),

  getMyRequests: (page = 1, limit = 20): Promise<BookingsResponse> =>
    apiClient
      .get<ApiResponse<BookingRequest[]>>('/booking-requests', { params: { page, limit } })
      .then((r) => ({
        data: r.data.data,
        meta: r.data.meta as BookingsResponse['meta'],
      })),

  getMyCounts: () =>
    apiClient
      .get<ApiResponse<BookingCounts>>('/booking-requests/counts')
      .then((r) => r.data.data),

  getOne: (id: string) =>
    apiClient
      .get<ApiResponse<BookingRequest>>(`/booking-requests/${id}`)
      .then((r) => r.data.data),

  updateStatus: (id: string, data: UpdateBookingStatusData) =>
    apiClient
      .patch<ApiResponse<BookingRequest>>(`/booking-requests/${id}/status`, data)
      .then((r) => r.data.data),

  // Live driver tracking (Phase 7, D8)
  getLiveDriver: (id: string) =>
    apiClient
      .get<
        ApiResponse<{
          driver: {
            id: string;
            name: string;
            avatarUrl: string | null;
            /** Null unless IN_PROGRESS, or ACCEPTED with the driver's job accepted (D14). */
            phone: string | null;
            driverProfile?: any;
          };
          lastLocation: {
            lat: number | null;
            lng: number | null;
            heading: number | null;
            speed: number | null;
            updatedAt: string | null;
          };
        }>
      >(`/booking-requests/${id}/live-driver`)
      .then((r) => r.data.data),

  getLiveRoute: (id: string) =>
    apiClient
      .get<
        ApiResponse<
          Array<{
            id: string;
            lat: number;
            lng: number;
            heading: number | null;
            speed: number | null;
            recordedAt: string;
          }>
        >
      >(`/booking-requests/${id}/live-route`)
      .then((r) => r.data.data),
};
