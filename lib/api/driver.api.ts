import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';
import type { DriverAgreementType } from '../../types/enums';
import type {
  CreateReturnTripPayload,
  DriverAssignedJob,
  DriverEligibleReviews,
  DriverLinkedBusiness,
  DriverProfile,
  DriverUploadResult,
  DriverUploadTarget,
  ReturnTripTemplate,
  UpdateDriverProfilePayload,
} from '../../types/driver.types';

// The driver dashboard's calls — a copy of kerayego-partner's api/driver.api.ts
// (kerayego-backend driver-profile.controller.ts) without the on-trip ones
// (start/end job, location, customer location, picked up): those stay in the
// KerayeGo Partner app. Plus the two driver upload contexts (the web's shared
// lib/api/media.api.ts doesn't list them) and the customer rating.

// The client's default timeout would cut off a 10 MB document on a slow line.
const UPLOAD_TIMEOUT_MS = 120_000;

export const driverApi = {
  /** GET /driver/profile — null before the first save. */
  getMyProfile: async () => {
    const res = await apiClient.get<ApiResponse<DriverProfile | null>>('/driver/profile');
    return res.data.data;
  },

  /**
   * PATCH /driver/profile — create or update the profile with any subset of
   * the setup steps' fields (one step at a time). Changing name, date of
   * birth, CNIC or licence details while PENDING_REVIEW/VERIFIED sets it back
   * to UNVERIFIED. Returns the GET shape.
   */
  updateMyProfile: async (payload: UpdateDriverProfilePayload) => {
    const res = await apiClient.patch<ApiResponse<DriverProfile>>('/driver/profile', payload);
    return res.data.data;
  },

  /** POST /driver/profile/agreements — accept the current version of each. Returns the GET shape. */
  acceptAgreements: async (types: DriverAgreementType[]) => {
    const res = await apiClient.post<ApiResponse<DriverProfile>>('/driver/profile/agreements', { types });
    return res.data.data;
  },

  /**
   * POST /driver/profile/submit → PENDING_REVIEW. Needs rentalReady — 400
   * lists what's missing; 409 when the CNIC belongs to another driver.
   */
  submitForVerification: async () => {
    const res = await apiClient.post<ApiResponse<DriverProfile>>('/driver/profile/submit');
    return res.data.data;
  },

  /**
   * POST /media/upload?context=driver_document&documentType=… (JPEG/PNG/PDF ≤ 10 MB,
   * private; the selfie JPEG/PNG only) or context=driver_photo (JPEG/PNG/WebP ≤ 5 MB;
   * the backend saves it as avatarUrl). A document replaces the old one of its type.
   */
  upload: async (file: File, target: DriverUploadTarget, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ context: target.context });
    if (target.context === 'driver_document') params.set('documentType', target.documentType);

    const res = await apiClient.post<ApiResponse<DriverUploadResult>>(
      `/media/upload?${params.toString()}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: (event) => {
          if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
        },
      },
    );
    return res.data.data;
  },

  /** GET /driver/businesses — every membership of the account (any role, any status). */
  getMyBusinesses: async () => {
    const res = await apiClient.get<ApiResponse<DriverLinkedBusiness[]>>('/driver/businesses');
    return res.data.data;
  },

  /** POST /driver/businesses/:memberId/accept — a driver or manager invitation. */
  acceptInvite: async (memberId: string) => {
    const res = await apiClient.post<ApiResponse<DriverLinkedBusiness>>(`/driver/businesses/${memberId}/accept`);
    return res.data.data;
  },

  /** POST /driver/businesses/:memberId/leave — leave a business or decline an invitation. */
  leaveBusiness: async (memberId: string) => {
    const res = await apiClient.post<ApiResponse<DriverLinkedBusiness>>(`/driver/businesses/${memberId}/leave`);
    return res.data.data;
  },

  /** GET /driver/jobs — the rental jobs assigned to this driver. */
  getMyJobs: async () => {
    const res = await apiClient.get<ApiResponse<DriverAssignedJob[]>>('/driver/jobs');
    return res.data.data;
  },

  /** POST /driver/jobs/:bookingId/respond — ACCEPT (403 IDENTITY_ON_HOLD while on hold) or DECLINE. */
  respondToJob: async (bookingId: string, response: 'ACCEPT' | 'DECLINE') => {
    const res = await apiClient.post<ApiResponse<DriverAssignedJob>>(`/driver/jobs/${bookingId}/respond`, {
      response,
    });
    return res.data.data;
  },

  /** GET /driver/jobs/:bookingId/return-trip-template — pre-fill for the return carpool trip. */
  getReturnTripTemplate: async (bookingId: string) => {
    const res = await apiClient.get<ApiResponse<ReturnTripTemplate>>(
      `/driver/jobs/${bookingId}/return-trip-template`,
    );
    return res.data.data;
  },

  /** POST /trips — the return carpool trip in the business's car (A25, A28, A29, A48). */
  postReturnTrip: async (payload: CreateReturnTripPayload) => {
    const res = await apiClient.post<ApiResponse<{ id: string }>>('/trips', payload);
    return res.data.data;
  },

  /** GET /reviews/my/eligible — read here for bookingsAsDriver (completed jobs whose customer is unrated). */
  getMyEligibleReviews: async () => {
    const res = await apiClient.get<ApiResponse<DriverEligibleReviews>>('/reviews/my/eligible');
    return res.data.data;
  },

  /**
   * POST /reviews — privately rate a completed job's customer: one USER entry,
   * stored with isPublic false (only KerayeGo sees it, A24).
   */
  rateCustomer: async (bookingId: string, customerId: string, rating: number, comment: string) => {
    const text = comment.trim();
    const res = await apiClient.post<ApiResponse<unknown>>('/reviews', {
      context: 'BOOKING_REQUEST',
      contextId: bookingId,
      entries: [{ subjectType: 'USER', subjectId: customerId, rating, ...(text ? { comment: text } : {}) }],
    });
    return res.data.data;
  },
};
