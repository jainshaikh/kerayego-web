import apiClient from './client';
import type { ApiResponse, PaginationMeta } from '../../types/api.types';

// Mirrors the backend's EntityType — a review's subject can be any of these.
// PROVIDER is kept only so legacy business reviews can still be read; the backend
// no longer accepts new business reviews (A18) — customers rate the car + driver.
export type ReviewSubjectType = 'VEHICLE' | 'USER_VEHICLE' | 'PROVIDER' | 'USER';
export type ReviewContext = 'BOOKING_REQUEST' | 'TRIP_INQUIRY';

export interface ReviewEntryInput {
  subjectType: ReviewSubjectType;
  subjectId: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewPayload {
  context: ReviewContext;
  contextId: string;
  entries: ReviewEntryInput[];
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; name: string };
}

export interface ReviewsResponse {
  data: PublicReview[];
  meta: PaginationMeta;
}

export interface RatingSummary {
  count: number;
  average: number | null;
  /**
   * Car subjects (VEHICLE / USER_VEHICLE) only: completed rentals + carpool
   * trips of the car's plate across every owner (0 without a plate). Absent
   * for USER / PROVIDER subjects.
   */
  rideCount?: number;
}

// Mirrors reviews.service.ts getMyEligible(). bookingsAsCustomer rows carry the
// vehicle + the assigned driver (null when none was assigned); bookingsAsProvider
// rows carry the customer.
export interface EligibleBooking {
  id: string;
  updatedAt?: string;
  providerProfileId?: string;
  vehicle?: { id: string; title: string; slug: string };
  assignedDriverId?: string | null;
  assignedDriver?: {
    id: string;
    name: string;
    driverProfile: { fullName: string } | null;
  } | null;
  user?: { id: string; name: string };
}

export interface EligibleTrip {
  id: string;
  trip: {
    id: string;
    originCity: string;
    destinationCity: string;
    departureAt?: string;
    // A normal trip runs in the poster's own car (userVehicleId); a return trip
    // runs in a business's fleet car (fleetVehicleId, userVehicleId null) — A48.
    userVehicleId?: string | null;
    fleetVehicleId?: string | null;
    isReturnTrip?: boolean;
    postedByUserId?: string;
  };
  user?: { id: string; name: string };
}

export interface EligibleForReview {
  bookingsAsCustomer: EligibleBooking[];
  bookingsAsProvider: EligibleBooking[];
  tripsAsRider: EligibleTrip[];
  tripsAsDriver: EligibleTrip[];
}

export const reviewsApi = {
  create: async (data: CreateReviewPayload) => {
    const res = await apiClient.post<ApiResponse<unknown>>('/reviews', data);
    return res.data.data;
  },

  getPublic: async (
    subjectType: ReviewSubjectType,
    subjectId: string,
    page = 1,
    limit = 20,
  ): Promise<ReviewsResponse> => {
    const res = await apiClient.get<ApiResponse<PublicReview[]>>('/reviews', {
      params: { subjectType, subjectId, page, limit },
    });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  getSummary: async (subjectType: ReviewSubjectType, subjectId: string): Promise<RatingSummary> => {
    const res = await apiClient.get<ApiResponse<RatingSummary>>('/reviews/summary', {
      params: { subjectType, subjectId },
    });
    return res.data.data;
  },

  getMyEligible: async (): Promise<EligibleForReview> => {
    const res = await apiClient.get<ApiResponse<EligibleForReview>>('/reviews/my/eligible');
    return res.data.data;
  },
};
