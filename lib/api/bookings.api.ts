import { apiClient } from './client';
import type { Market } from '../../types/api.types';
import type { RentalDurationType } from '../utils/rentalDuration';

export type BookingStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

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

export interface ProviderBookingCounts {
  pending: number;
  contacted: number;
}

export const bookingsApi = {
  create: (data: CreateBookingRequestData) =>
    apiClient.post<BookingRequest>('/booking-requests', data).then((r) => r.data),

  getMyRequests: (page = 1, limit = 20) =>
    apiClient
      .get<BookingsResponse>('/booking-requests', { params: { page, limit } })
      .then((r) => r.data),

  getMyCounts: () =>
    apiClient.get<BookingCounts>('/booking-requests/counts').then((r) => r.data),

  getOne: (id: string) =>
    apiClient.get<BookingRequest>(`/booking-requests/${id}`).then((r) => r.data),

  updateStatus: (id: string, data: UpdateBookingStatusData) =>
    apiClient
      .patch<BookingRequest>(`/booking-requests/${id}/status`, data)
      .then((r) => r.data),

  // Live driver tracking (Phase 7, D8)
  getLiveDriver: (id: string) =>
    apiClient
      .get<{
        driver: {
          id: string;
          name: string;
          avatarUrl: string | null;
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
      }>(`/booking-requests/${id}/live-driver`)
      .then((r) => r.data),

  getLiveRoute: (id: string) =>
    apiClient
      .get<
        Array<{
          id: string;
          lat: number;
          lng: number;
          heading: number | null;
          speed: number | null;
          recordedAt: string;
        }>
      >(`/booking-requests/${id}/live-route`)
      .then((r) => r.data),

  // Provider
  getProviderInquiries: (status?: BookingStatus, page = 1, limit = 20) =>
    apiClient
      .get<BookingsResponse>('/provider/inquiries', { params: { status, page, limit } })
      .then((r) => r.data),

  getProviderCounts: () =>
    apiClient.get<ProviderBookingCounts>('/provider/inquiries/counts').then((r) => r.data),
};
