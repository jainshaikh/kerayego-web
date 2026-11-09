'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../lib/api/media.api';
import { vehiclesApi, type CreateVehiclePayload, type UpdateVehiclePayload } from '../lib/api/vehicles.api';
import { compressPhoto } from '../lib/ops/compressImage';
import { compressedPhotoProblem, imagePayloadFromUpload } from '../lib/ops/photos';
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
 * Compresses the photo in the browser (compressImage.ts — at most 2048 px,
 * JPEG, aiming for ≤ 1.5 MB; never over the backend's 5 MB), uploads it into
 * the car's folder (context=vehicle, entityId = the car, so the backend names
 * and watermarks it) and attaches it as the last photo. If attaching fails
 * (e.g. 10 photos already) the uploaded file is deleted again, best effort,
 * and the attach error is thrown.
 */
async function addVehiclePhoto(
  vehicleId: string,
  file: File,
  onStage?: (stage: PhotoUploadStage, percent: number) => void,
): Promise<FleetVehicleImage> {
  onStage?.('compressing', 0);
  const compressed = await compressPhoto(file);
  const problem = compressedPhotoProblem(compressed);
  if (problem) throw new Error(problem);
  onStage?.('uploading', 0);
  const upload = await mediaApi.upload(compressed, 'vehicle', undefined, vehicleId, (percent) =>
    onStage?.('uploading', percent),
  );
  try {
    return await vehiclesApi.addImage(vehicleId, imagePayloadFromUpload(upload));
  } catch (error) {
    await mediaApi.delete(upload.publicId).catch(() => undefined);
    throw error;
  }
}

export type PhotoUploadStage = 'compressing' | 'uploading';

/** Where a multi-photo upload is: photo `current` of `total`, being compressed or `percent` sent. */
export interface PhotoUploadProgress {
  current: number;
  total: number;
  stage: PhotoUploadStage;
  percent: number;
}

/** "Compressing photo 2 of 5" / "Uploading photo 2 of 5 · 40%" (no "of 1" for a single photo). */
export function photoProgressLabel({ current, total, stage, percent }: PhotoUploadProgress): string {
  const which = total > 1 ? ` ${current} of ${total}` : '';
  return stage === 'compressing' ? `Compressing photo${which}…` : `Uploading photo${which} · ${percent}%`;
}

export interface PhotoUploadResult {
  added: FleetVehicleImage[];
  failed: Array<{ fileName: string; error: unknown }>;
}

/**
 * Adds several photos to a car, one after another and in the given order (so
 * the first one picked becomes the cover of a car with no photos yet). A photo
 * that fails doesn't stop the rest — the result lists what failed. Used by the
 * edit page (VehiclePhotos) and right after "Add a car" saves the new car.
 */
export async function addVehiclePhotos(
  vehicleId: string,
  files: readonly File[],
  onProgress?: (progress: PhotoUploadProgress) => void,
): Promise<PhotoUploadResult> {
  const result: PhotoUploadResult = { added: [], failed: [] };
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const report = (stage: PhotoUploadStage, percent: number) =>
      onProgress?.({ current: index + 1, total: files.length, stage, percent });
    try {
      result.added.push(await addVehiclePhoto(vehicleId, file, report));
    } catch (error) {
      result.failed.push({ fileName: file.name, error });
    }
  }
  return result;
}

/**
 * The photos picked on "Add a car", uploaded right after the car is created
 * (its id is only known then). Refreshes the car, which useCreateVehicle
 * cached with no photos.
 */
export function useAddPhotosToNewVehicle(onProgress?: (progress: PhotoUploadProgress) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, files }: { vehicleId: string; files: readonly File[] }) =>
      addVehiclePhotos(vehicleId, files, onProgress),
    onSettled: (_result, _error, { vehicleId }) => {
      void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.vehicle(vehicleId) });
      void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists });
    },
  });
}

export function useAddVehiclePhotos(id: string, onProgress?: (progress: PhotoUploadProgress) => void) {
  const refresh = useRefreshPhotos(id);
  return useMutation({
    mutationFn: (files: readonly File[]) => addVehiclePhotos(id, files, onProgress),
    // Some photos may have been added even when others failed.
    onSettled: refresh,
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
