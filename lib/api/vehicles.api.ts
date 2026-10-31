import apiClient from './client';
import type { ApiResponse, PaginationMeta } from '../../types/api.types';
import type {
  AddVehicleImagePayload,
  CreateVehiclePayload,
  FleetListFilters,
  FleetPage,
  FleetVehicle,
  FleetVehicleImage,
  FleetVehicleListItem,
  FleetVehicleStatus,
  UpdateVehiclePayload,
} from '../../types/fleet.types';

export type { CreateVehiclePayload, UpdateVehiclePayload, AddVehicleImagePayload };

// The business's own cars (kerayego-backend vehicles.controller.ts), matching
// the KerayeGo Partner app's api/vehicles.api.ts. Every call unwraps the
// { success, data, meta } envelope.

/** Cars per page of GET /vehicles. */
export const FLEET_PAGE_SIZE = 20;

/** POST /vehicles/:id/images answers 400 "Maximum 10 images per vehicle" past this. */
export const MAX_VEHICLE_PHOTOS = 10;

/** The GET /vehicles query: empty filters left out (an empty status is a 400). */
export function fleetListParams(filters: FleetListFilters, page: number, limit = FLEET_PAGE_SIZE) {
  const search = filters.search?.trim();
  return {
    page,
    limit,
    ...(filters.status && { status: filters.status }),
    ...(search && { search }),
  };
}

export const vehiclesApi = {
  /** GET /vehicles — one page of the business's cars, newest first. */
  list: async (filters: FleetListFilters, page = 1, limit = FLEET_PAGE_SIZE): Promise<FleetPage> => {
    const res = await apiClient.get<ApiResponse<FleetVehicleListItem[]>>('/vehicles', {
      params: fleetListParams(filters, page, limit),
    });
    return { data: res.data.data, meta: res.data.meta as PaginationMeta };
  },

  /** GET /vehicles/:id — 404 when it isn't this business's car. */
  get: async (id: string): Promise<FleetVehicle> => {
    const res = await apiClient.get<ApiResponse<FleetVehicle>>(`/vehicles/${id}`);
    return res.data.data;
  },

  /** POST /vehicles — a new DRAFT car without photos (business admin). */
  create: async (payload: CreateVehiclePayload): Promise<FleetVehicle> => {
    const res = await apiClient.post<ApiResponse<FleetVehicle>>('/vehicles', payload);
    return res.data.data;
  },

  /** PATCH /vehicles/:id — any status but ARCHIVED or SUSPENDED (business admin or manager). */
  update: async (id: string, payload: UpdateVehiclePayload): Promise<FleetVehicle> => {
    const res = await apiClient.patch<ApiResponse<FleetVehicle>>(`/vehicles/${id}`, payload);
    return res.data.data;
  },

  /** POST /vehicles/:id/submit-for-review — DRAFT with a photo; comes back APPROVED for an approved business. */
  submitForReview: async (id: string): Promise<FleetVehicle> => {
    const res = await apiClient.post<ApiResponse<FleetVehicle>>(`/vehicles/${id}/submit-for-review`);
    return res.data.data;
  },

  /** DELETE /vehicles/:id — archives the car. No undo. */
  archive: async (id: string): Promise<{ id: string; status: FleetVehicleStatus }> => {
    const res = await apiClient.delete<ApiResponse<{ id: string; status: FleetVehicleStatus }>>(`/vehicles/${id}`);
    return res.data.data;
  },

  /** POST /vehicles/:id/images — attaches an uploaded photo as the last one. */
  addImage: async (vehicleId: string, payload: AddVehicleImagePayload): Promise<FleetVehicleImage> => {
    const res = await apiClient.post<ApiResponse<FleetVehicleImage>>(`/vehicles/${vehicleId}/images`, payload);
    return res.data.data;
  },

  /** DELETE /vehicles/:id/images/:imageId — removes the photo and its stored file. */
  removeImage: async (vehicleId: string, imageId: string): Promise<{ deleted: boolean }> => {
    const res = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/vehicles/${vehicleId}/images/${imageId}`);
    return res.data.data;
  },

  /** PATCH /vehicles/:id/images/reorder — ids in the new order (first = cover); returns every photo. */
  reorderImages: async (vehicleId: string, imageIds: string[]): Promise<FleetVehicleImage[]> => {
    const res = await apiClient.patch<ApiResponse<FleetVehicleImage[]>>(`/vehicles/${vehicleId}/images/reorder`, {
      imageIds,
    });
    return res.data.data;
  },
};
