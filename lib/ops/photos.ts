import { MAX_VEHICLE_PHOTOS } from '../api/vehicles.api';
import { MAX_ORIGINAL_PHOTO_BYTES } from './compressImage';
import type { FleetVehicleImage } from '../../types/fleet.types';

// A car's photos (kerayego-backend vehicles.service.ts addImage / removeImage /
// reorderImages), ported from the KerayeGo Partner app's features/fleet/photos.ts.
// The first photo (lowest sortOrder) is the cover customers see.

/** The photos in display order (cover first). */
export function sortedImages<T extends Pick<FleetVehicleImage, 'sortOrder'>>(images: readonly T[]): T[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** `ids` with `id` moved to `toIndex` (clamped) — the imageIds the reorder call takes. */
export function moveImage(ids: readonly string[], id: string, toIndex: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return [...ids];
  const target = Math.max(0, Math.min(ids.length - 1, toIndex));
  const result = ids.filter((existing) => existing !== id);
  result.splice(target, 0, id);
  return result;
}

export function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

// What POST /media/upload?context=vehicle accepts (kerayego-backend
// media.service.ts ALLOWED_IMAGE_TYPES / MAX_IMAGE_BYTES). A picked photo is
// compressed first (compressImage.ts), so a bigger original is fine as long as
// the photo that's uploaded is at most MAX_VEHICLE_PHOTO_BYTES.
export const VEHICLE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const VEHICLE_PHOTO_ACCEPT = VEHICLE_PHOTO_TYPES.join(',');
export const MAX_VEHICLE_PHOTO_BYTES = 5 * 1024 * 1024;

/** Why this picked file can't be used, or null if it's fine (before compression). */
export function photoFileProblem(file: Pick<File, 'type' | 'size' | 'name'>): string | null {
  if (!(VEHICLE_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: only JPEG, PNG or WebP photos`;
  }
  if (file.size > MAX_ORIGINAL_PHOTO_BYTES) {
    return `${file.name}: too large (over ${MAX_ORIGINAL_PHOTO_BYTES / 1024 / 1024} MB) — pick a smaller photo`;
  }
  return null;
}

/** Why the compressed photo would still be refused by the backend, or null. */
export function compressedPhotoProblem(file: Pick<File, 'size' | 'name'>): string | null {
  return file.size > MAX_VEHICLE_PHOTO_BYTES
    ? `still larger than 5 MB after compressing — pick a smaller photo`
    : null;
}

/**
 * Splits picked files into the ones to upload — valid, in picked order, no more
 * than `room` (the photos still allowed) — and a message per file left out.
 */
export function pickPhotoFiles<T extends Pick<File, 'type' | 'size' | 'name'>>(
  files: readonly T[],
  room: number,
): { accepted: T[]; rejected: string[] } {
  const accepted: T[] = [];
  const rejected: string[] = [];
  let skippedForRoom = 0;
  for (const file of files) {
    const problem = photoFileProblem(file);
    if (problem) rejected.push(problem);
    else if (accepted.length < room) accepted.push(file);
    else skippedForRoom += 1;
  }
  if (skippedForRoom > 0) {
    rejected.push(
      `${skippedForRoom} photo${skippedForRoom === 1 ? '' : 's'} left out — a car can have up to ${MAX_VEHICLE_PHOTOS} photos`,
    );
  }
  return { accepted, rejected };
}

/** POST /vehicles/:id/images body from the upload: width/height only when they're whole numbers ≥ 0. */
export function imagePayloadFromUpload(upload: { url: string; publicId: string; width?: number; height?: number }) {
  const isDimension = (value: number | undefined): value is number => Number.isInteger(value) && (value as number) >= 0;
  return {
    url: upload.url,
    publicId: upload.publicId,
    ...(isDimension(upload.width) && { width: upload.width }),
    ...(isDimension(upload.height) && { height: upload.height }),
  };
}
