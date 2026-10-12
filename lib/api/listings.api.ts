import apiClient from './client';
import type { ApiResponse, PaginationMeta, Transmission, FuelType, Market } from '../../types/api.types';

// Public listing shapes (no provider-private fields)
export interface ListingImage {
  url: string;
  altText: string | null;
}

export interface ListingVehicleCard {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  pricePer6Hours: string | null;
  pricePer12Hours: string | null;
  pricePerDay: string;
  pricePerWeek: string | null;
  pricePerMonth: string | null;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  locationText: string | null;
  status: string;
  updatedAt: string;
  images: ListingImage[];
  providerProfile: { businessName: string; slug: string };
  showroom: { city: string; area: string | null; country: Market; mapLat: number | null; mapLng: number | null } | null;
  // Computed, not stored — is there an ACCEPTED booking covering this exact moment.
  // Browse results exclude BOOKED vehicles by default; a vehicle's own detail
  // page still shows it, marked unavailable, so a direct link never 404s.
  availability: 'AVAILABLE' | 'BOOKED';
  bookedUntil: string | null;
  /** Only present when the request included lat/lng (nearby search). */
  distanceKm?: number;
}

export interface ListingFeature {
  id: string;
  name: string;
  value: string | null;
}

export interface ListingShowroom {
  id: string;
  name: string;
  city: string;
  area: string | null;
  contactNumber: string;
  whatsappNumber: string | null;
  operatingHours: Record<string, string> | null;
  mapLat: number | null;
  mapLng: number | null;
  country: Market;
}

export interface ListingVehicleDetail extends ListingVehicleCard {
  engineType: string | null;
  availabilityNotes: string | null;
  pricingNotes: string | null;
  specialConditions: string | null;
  viewCount: number;
  inquiryCount: number;
  features: ListingFeature[];
  images: (ListingImage & { id: string; sortOrder: number; width: number | null; height: number | null })[];
  providerProfile: {
    id: string;
    businessName: string;
    slug: string;
    logoUrl: string | null;
    verificationStatus: string;
  };
  showroom: ListingShowroom | null;
}

export interface ListingFilters {
  search?: string;
  make?: string;
  fuelType?: string;
  transmission?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  seats?: number;
  yearMin?: number;
  yearMax?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  providerSlug?: string;
  page?: number;
  limit?: number;
  /** Include vehicles currently out on a rental — excluded by default. */
  includeBooked?: boolean;
  /** Nearby search — pairs with lng. Independent of `city`; both can be set. */
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface ListingsResponse {
  data: ListingVehicleCard[];
  meta: PaginationMeta;
}

export const listingsApi = {
  getAll: async (filters: ListingFilters = {}): Promise<ListingsResponse> => {
    const params: Record<string, string | number | undefined> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        params[k] = v as string | number;
      }
    });

    const res = await apiClient.get<ApiResponse<ListingVehicleCard[]>>('/listings', { params });
    return {
      data: res.data.data,
      meta: res.data.meta as PaginationMeta,
    };
  },

  getBySlug: async (slug: string): Promise<ListingVehicleDetail> => {
    const res = await apiClient.get<ApiResponse<ListingVehicleDetail>>(`/listings/${slug}`);
    return res.data.data;
  },
};
