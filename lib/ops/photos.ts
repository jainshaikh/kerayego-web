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
