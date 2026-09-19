import apiClient from './client';
import type { ApiResponse, PaginationMeta, Market } from '../../types/api.types';

export type TripStatus =
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'REJECTED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SUSPENDED';

export type TripEventType = 'START' | 'ARRIVED' | 'PICKUP' | 'NO_SHOW' | 'DROPOFF' | 'END';
export type PickupSource = 'DRIVER_TAP' | 'AUTO_ON_TRIP_END';

export interface TripVehicleImage {
  url: string;
  altText: string | null;
}

export interface TripVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  country: Market;
  // Card responses include only the cover (sortOrder 0); detail includes the full gallery.
  images: TripVehicleImage[];
}

// ── Public shapes ────────────────────────────────────────────────────────────

export interface TripStop {
  id: string;
  type: 'PICKUP' | 'DROPOFF';
  label: string;
  lat: number | null;
  lng: number | null;
  sortOrder: number;
}

export interface TripCard {
  id: string;
  originCity: string;
  destinationCity: string;
  // Legacy primary pickup/dropoff — mirrors the first pickup stop and last
  // dropoff stop in `stops`. Every rider still travels the full route
  // (first stop → last stop) at the flat pricePerSeat; the other stops are
  // just alternate meeting points at each end, not separately bookable legs.
  pickupPoint: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffPoint: string | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  stops: TripStop[];
  distanceKm: number | null;
  durationMinutes: number | null;
  departureAt: string;
  availableSeats: number;
  pricePerSeat: string | number;
  contactNumber: string;
  notes: string | null;
  status: TripStatus;
  createdAt: string;
  postedBy: { id: string; name: string };
  userVehicle: TripVehicle;
}

export interface TripDetail extends TripCard {
  rejectionReason: string | null;
  cancelReason: string | null;
  updatedAt: string;
  userVehicle: TripVehicle & { plateNumber: string; status: string };
}

export interface TripFilters {
  originCity?: string;
  destinationCity?: string;
  date?: string;
  minSeats?: number;
  sort?: 'departure_asc' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
  priceMin?: number;
  priceMax?: number;
  pickupPoint?: string;
  dropoffPoint?: string;
  /** Free-text match against the trip's vehicle make or model. */
  vehicleSearch?: string;
}

export interface TripsResponse {
  data: TripCard[];
  meta: PaginationMeta;
}

export interface TripMetaCities {
  origins: string[];
  destinations: string[];
}

export interface TripRouteGroup {
  originCity: string;
  destinationCity: string;
  tripCount: number;
  minPricePerSeat: string | number | null;
  nextDepartureAt: string | null;
}

// ── Poster shapes ─────────────────────────────────────────────────────────

export interface CreateTripStopPayload {
  label: string;
  lat?: number;
  lng?: number;
}

export interface CreateTripPayload {
  userVehicleId: string;
  originCity: string;
  destinationCity: string;
  // Ordered pickup points (at least one) and drop-off points (optional) —
  // A → B → C → D → E. Every rider still travels the whole route at the
  // flat pricePerSeat; these are alternate meeting points, not bookable legs.
  pickupStops: CreateTripStopPayload[];
  dropoffStops: CreateTripStopPayload[];
  departureAt: string;
  availableSeats: number;
  pricePerSeat: number;
  contactNumber: string;
  notes?: string;
}

export type UpdateTripPayload = Partial<CreateTripPayload>;

export type MyTrip = TripDetail;

// ── Day-of-trip execution shapes ─────────────────────────────────────────────

export interface ManifestStopRef {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
}

export interface ManifestRider {
  id: string; // tripInquiryId
  requestedSeats: number;
  pickupNote: string | null;
  pickupConfirmedAt: string | null;
  pickupSource: PickupSource | null;
  droppedOffAt: string | null;
  pickupStop: ManifestStopRef | null;
  dropoffStop: ManifestStopRef | null;
  user: { id: string; name: string; phone: string | null };
}

export interface ManifestRouteStop {
  id: string;
  type: 'PICKUP' | 'DROPOFF';
  label: string;
  lat: number | null;
  lng: number | null;
}

export interface TripManifest {
  trip: TripDetail;
  riders: ManifestRider[];
  routeStops: ManifestRouteStop[];
}

export interface RecordTripEventPayload {
  id: string; // client-generated idempotency key
  tripInquiryId?: string;
  type: TripEventType;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface TripEvent {
  id: string;
  tripId: string;
  tripInquiryId: string | null;
  type: TripEventType;
  occurredAt: string;
  payload: Record<string, unknown> | null;
}

export type MyActiveRide =
  | { role: 'driver'; tripId: string }
  | { role: 'rider'; tripId: string; tripInquiryId: string }
  | null;

export const tripsApi = {
  // Public search
  getAll: async (filters: TripFilters = {}): Promise<TripsResponse> => {
    const params: Record<string, string | number | undefined> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        params[k] = v as string | number;
      }
    });

    const res = await apiClient.get<ApiResponse<TripCard[]>>('/trips', { params });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  getById: async (id: string): Promise<TripDetail> => {
    const res = await apiClient.get<ApiResponse<TripDetail>>(`/trips/${id}`);
    return res.data.data;
  },

  getMetaCities: async (): Promise<TripMetaCities> => {
    const res = await apiClient.get<ApiResponse<TripMetaCities>>('/trips/meta/cities');
    return res.data.data;
  },

  getRouteGroups: async (): Promise<TripRouteGroup[]> => {
    const res = await apiClient.get<ApiResponse<TripRouteGroup[]>>('/trips/meta/routes');
    return res.data.data;
  },

  // Poster operations
  create: async (data: CreateTripPayload): Promise<MyTrip> => {
    const res = await apiClient.post<ApiResponse<MyTrip>>('/trips', data);
    return res.data.data;
  },

  getMyTrips: async (params?: { page?: number; limit?: number }): Promise<{ data: MyTrip[]; meta: PaginationMeta }> => {
    const res = await apiClient.get<ApiResponse<MyTrip[]>>('/my/trips', { params });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  getMyTrip: async (id: string): Promise<MyTrip> => {
    const res = await apiClient.get<ApiResponse<MyTrip>>(`/my/trips/${id}`);
    return res.data.data;
  },

  update: async (id: string, data: UpdateTripPayload): Promise<MyTrip> => {
    const res = await apiClient.patch<ApiResponse<MyTrip>>(`/my/trips/${id}`, data);
    return res.data.data;
  },

  cancel: async (id: string, reason?: string): Promise<MyTrip> => {
    const res = await apiClient.patch<ApiResponse<MyTrip>>(`/my/trips/${id}/cancel`, { reason });
    return res.data.data;
  },

  // ── Day-of-trip execution (driver + rider self-service) ──────────────────
  startTrip: async (id: string): Promise<MyTrip> => {
    const res = await apiClient.post<ApiResponse<MyTrip>>(`/my/trips/${id}/start`);
    return res.data.data;
  },

  getManifest: async (id: string): Promise<TripManifest> => {
    const res = await apiClient.get<ApiResponse<TripManifest>>(`/my/trips/${id}/manifest`);
    return res.data.data;
  },

  recordEvent: async (id: string, data: RecordTripEventPayload): Promise<TripEvent> => {
    const res = await apiClient.post<ApiResponse<TripEvent>>(`/my/trips/${id}/events`, data);
    return res.data.data;
  },

  endTrip: async (id: string): Promise<MyTrip> => {
    const res = await apiClient.post<ApiResponse<MyTrip>>(`/my/trips/${id}/end`);
    return res.data.data;
  },

  getMyActiveRide: async (): Promise<MyActiveRide> => {
    const res = await apiClient.get<ApiResponse<MyActiveRide>>('/my/active-ride');
    return res.data.data;
  },
};
