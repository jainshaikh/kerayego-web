'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../lib/api/media.api';
import { vehiclesApi, type CreateVehiclePayload, type UpdateVehiclePayload } from '../lib/api/vehicles.api';
import { imagePayloadFromUpload } from '../lib/ops/photos';
import { trackEvent } from '../lib/utils/analytics';
import type { FleetListFilters, FleetVehicle, FleetVehicleImage } from '../types/fleet.types';
import { providerQueryKeys } from './useProviderProfile';

// The business's fleet (/provider/vehicles), ported from the KerayeGo Partner
// app's features/fleet/queries.ts. Everything sits under ['vehicles'], so a
// change to one car refreshes every filtered list. Errors are shown by the
// pages (inline or toast), not here.

export const vehicleQueryKeys = {
  all: ['vehicles'] as const,
  lists: ['vehicles', 'my'] as const,
  myVehicles: (filters: FleetListFilters, page: number) => ['vehicles', 'my', filters, page] as const,
  vehicle: (id: string | undefined) => ['vehicles', 'detail', id] as const,
};

/** One page of the business's cars, newest first. */
export function useMyVehicles(filters: FleetListFilters, page: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: vehicleQueryKeys.myVehicles(filters, page),
    queryFn: () => vehiclesApi.list(filters, page),
    placeholderData: (previous) => previous,
    enabled: options.enabled ?? true,
  });
}

/** Every car, 20 at a time ("Load more") — the Ratings page's car list. */
export function useMyVehiclesInfinite() {
  return useInfiniteQuery({
    queryKey: [...vehicleQueryKeys.lists, 'infinite'] as const,
    queryFn: ({ pageParam }) => vehiclesApi.list({}, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined),
  });
}

/** One of the business's cars, with every photo, its features and showroom. */
export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: vehicleQueryKeys.vehicle(id),
    queryFn: () => vehiclesApi.get(id as string),
    enabled: !!id,
  });
}

/**
 * Shares the car a mutation returned and refreshes the lists. Only
 * GET /vehicles/:id carries plateHistory, so the cached one is kept and the
 * car refetched in the background (a plate change can change its history).
 */
function useStoreVehicle() {
  const queryClient = useQueryClient();
  return (vehicle: FleetVehicle) => {
    const key = vehicleQueryKeys.vehicle(vehicle.id);
    const cached = queryClient.getQueryData<FleetVehicle>(key);
    queryClient.setQueryData<FleetVehicle>(key, {
      ...vehicle,
      plateHistory: vehicle.plateHistory !== undefined ? vehicle.plateHistory : cached?.plateHistory,
    });
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists });
  };
}

/** POST /vehicles (business admin). Also refreshes the business (its car count). */
export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const storeVehicle = useStoreVehicle();
  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) => vehiclesApi.create(payload),
    onSuccess: (vehicle, variables) => {
      storeVehicle(vehicle);
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile });
      trackEvent('list_vehicle_complete', { make: variables.make, model: variables.model });
    },
  });
}

export function useUpdateVehicle(id: string) {
  const storeVehicle = useStoreVehicle();
  return useMutation({
    mutationFn: (payload: UpdateVehiclePayload) => vehiclesApi.update(id, payload),
    onSuccess: storeVehicle,
  });
}

export function useSubmitVehicleForReview(id: string) {
  const storeVehicle = useStoreVehicle();
  return useMutation({
    mutationFn: () => vehiclesApi.submitForReview(id),
    onSuccess: storeVehicle,
  });
}

/** DELETE /vehicles/:id (archive) — returns only { id, status }, so the car is refetched. */
export function useArchiveVehicle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => vehiclesApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.vehicle(id) });
      void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists });
    },
  });
}

function useRefreshPhotos(id: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.vehicle(id) });
    void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists });
  };
}

/**
 * Uploads a file into the car's folder (context=vehicle, entityId = the car,
 * so the backend names and watermarks it) and attaches it as the last photo.
 * If attaching fails (e.g. 10 photos already) the uploaded file is deleted
 * again, best effort, and the attach error is thrown.
 */
export function useAddVehiclePhoto(id: string, onProgress?: (percent: number) => void) {
  const refresh = useRefreshPhotos(id);
  return useMutation({
    mutationFn: async (file: File): Promise<FleetVehicleImage> => {
      const upload = await mediaApi.upload(file, 'vehicle', undefined, id, onProgress);
      try {
        return await vehiclesApi.addImage(id, imagePayloadFromUpload(upload));
      } catch (error) {
        await mediaApi.delete(upload.publicId).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: refresh,
  });
}

export function useRemoveVehiclePhoto(id: string) {
  const refresh = useRefreshPhotos(id);
  return useMutation({
    mutationFn: (imageId: string) => vehiclesApi.removeImage(id, imageId),
    onSuccess: refresh,
  });
}

/** Saves a new photo order; the cached car takes the returned order at once. */
export function useReorderVehiclePhotos(id: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshPhotos(id);
  return useMutation({
    mutationFn: (imageIds: string[]) => vehiclesApi.reorderImages(id, imageIds),
    onSuccess: (images) => {
      queryClient.setQueryData<FleetVehicle>(vehicleQueryKeys.vehicle(id), (vehicle) =>
        vehicle ? { ...vehicle, images } : vehicle,
      );
      refresh();
    },
  });
}
