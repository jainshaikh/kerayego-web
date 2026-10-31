import apiClient from './client';
import type { ApiResponse, ProviderProfile, Showroom, PaginationMeta, Market } from '../../types/api.types';
import type { ListingVehicleCard } from './listings.api';

export interface CreateProviderPayload {
  businessName: string;
  businessDescription?: string;
  contactPhone?: string;
  /** `12345-1234567-1`. A CNIC on the block list is refused (403 IDENTITY_BLOCKED). */
  ownerCnicNumber?: string;
}

/**
 * PATCH /providers/me — only the fields sent change. businessDescription ''
 * clears it; logoUrl / bannerUrl null removes the image.
 */
export interface UpdateProviderPayload {
  businessName?: string;
  businessDescription?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  ownerCnicNumber?: string;
}

export interface CreateShowroomPayload {
  name: string;
  address: string;
  city: string;
  area?: string;
  contactNumber: string;
  whatsappNumber?: string;
  operatingHours?: Record<string, string>;
  mapLat?: number;
  mapLng?: number;
  /** The market it operates in (default PK) — every car listed through it is priced in its currency. */
  country?: Market;
}

/**
 * PATCH /providers/me/showrooms/:id — every field optional. name / address /
 * city / contactNumber: '' is ignored. area / whatsappNumber: clear with ''
 * (null is ignored). Never send operatingHours or country as null (400).
 */
export type UpdateShowroomPayload = Partial<CreateShowroomPayload>;

export interface CompletenessScore {
  score: number;
  missing: string[];
  total: number;
  passed: number;
}

/**
 * GET /providers/me — the business this account owns or manages, or null.
 * Showrooms oldest first; documents newest first, each with a fresh signed
 * fileUrl (a manager gets `documents: []` and no ownerCnicNumber).
 */
export interface ProviderProfileWithMeta extends ProviderProfile {
  showrooms: Showroom[];
  documents: UploadedDocument[];
  completenessScore: CompletenessScore;
  emailVerified: boolean;
  _count?: { vehicles: number; bookingRequests: number };
}

/**
 * One of the business's own documents (UploadedDocument, ownerType PROVIDER).
 * Created by POST /media/upload?context=document&documentType=…; deleted
 * (file and row) by DELETE /media/:publicId.
 */
export interface UploadedDocument {
  id: string;
  documentType: string;
  /**
   * A short-lived (10-minute) signed link, made fresh on every GET
   * /providers/me — the file is in a private bucket. Don't keep it: refetch
   * for a new one once it may have expired.
   */
  fileUrl: string;
  /** Storage key — what DELETE /media/:publicId takes. */
  publicId: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

// ── Public directory types ────────────────────────────────────────────────────

export interface PublicProviderCard {
  id: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  businessDescription: string | null;
  isFeatured: boolean;
  updatedAt: string;
  showrooms: { city: string; area: string | null; mapLat: number | null; mapLng: number | null }[];
  _count: { vehicles: number };
  /** Only present when the request included lat/lng (nearby search). */
  distanceKm?: number;
}

export interface PublicProviderShowroom {
  id: string;
  name: string;
  city: string;
  area: string | null;
  contactNumber: string;
  whatsappNumber: string | null;
  operatingHours: Record<string, string> | null;
  mapLat: number | null;
  mapLng: number | null;
}

export interface PublicProviderDetail {
  id: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  businessDescription: string | null;
  isFeatured: boolean;
  verificationStatus: string;
  showrooms: PublicProviderShowroom[];
  vehicles: (Pick<ListingVehicleCard, 'id' | 'slug' | 'title' | 'make' | 'model' | 'year' | 'pricePerDay' | 'transmission' | 'fuelType'> & {
    images: { url: string; altText: string | null }[];
  })[];
  _count: { vehicles: number };
}

export interface ProvidersListResponse {
  data: PublicProviderCard[];
  meta: PaginationMeta;
}

export const providersApi = {
  /** POST /providers — creates the business (status PENDING). 409 if the account already has one. */
  create: async (data: CreateProviderPayload) => {
    const res = await apiClient.post<ApiResponse<ProviderProfile>>('/providers', data);
    return res.data;
  },

  getMyProfile: async () => {
    const res = await apiClient.get<ApiResponse<ProviderProfileWithMeta | null>>('/providers/me');
    return res.data;
  },

  update: async (data: UpdateProviderPayload) => {
    const res = await apiClient.patch<ApiResponse<ProviderProfile>>('/providers/me', data);
    return res.data;
  },

  /**
   * POST /providers/me/submit-for-review — moves the business to
   * PENDING_REVIEW. 400 when already under review or approved, without a
   * showroom, under 60% complete, or without the owner's CNIC.
   */
  submitForReview: async () => {
    const res = await apiClient.post<ApiResponse<ProviderProfile>>('/providers/me/submit-for-review');
    return res.data;
  },


  // Showrooms (one per business: a second POST is a 409).
  createShowroom: async (data: CreateShowroomPayload) => {
    const res = await apiClient.post<ApiResponse<Showroom>>('/providers/me/showrooms', data);
    return res.data;
  },

  updateShowroom: async (showroomId: string, data: UpdateShowroomPayload) => {
    const res = await apiClient.patch<ApiResponse<Showroom>>(
      `/providers/me/showrooms/${showroomId}`,
      data,
    );
    return res.data;
  },

  /** DELETE — never refused for cars: the cars listed through it are unlinked. */
  deleteShowroom: async (showroomId: string) => {
    await apiClient.delete(`/providers/me/showrooms/${showroomId}`);
  },

  // Public directory
  getAllPublic: async (
    page = 1,
    limit = 12,
    city?: string,
    lat?: number,
    lng?: number,
    radiusKm?: number,
  ): Promise<ProvidersListResponse> => {
    const res = await apiClient.get<ApiResponse<PublicProviderCard[]>>('/providers', {
      params: { page, limit, city: city || undefined, lat, lng, radiusKm },
    });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },
};
