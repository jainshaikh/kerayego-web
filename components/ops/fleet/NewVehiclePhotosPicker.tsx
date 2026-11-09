'use client';

import { useEffect, useRef } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card } from '../../ui';
import { MAX_VEHICLE_PHOTOS } from '../../../lib/api/vehicles.api';
import { VEHICLE_PHOTO_ACCEPT, pickPhotoFiles } from '../../../lib/ops/photos';

/** A photo picked on "Add a car" — uploaded once the car is saved (it needs the car's id). */
export interface PendingVehiclePhoto {
  id: string;
  file: File;
  /** A local object URL for the preview; revoked when the photo is removed or the page closes. */
  previewUrl: string;
}

interface NewVehiclePhotosPickerProps {
  photos: readonly PendingVehiclePhoto[];
  onChange: (photos: PendingVehiclePhoto[]) => void;
  /** While the car is being saved / its photos uploaded. */
  disabled: boolean;
  /** e.g. "Uploading photo 2 of 5 · 40%" while the photos go up. */
  status?: string | null;
}

let nextId = 0;

// Photos for a car that doesn't exist yet: picked (several at once) and shown
// from local previews, in order — the first is the cover, any other can be
// made the cover or removed. Nothing is uploaded here: the files go up into
// the car's own folder right after "Save as draft" creates it (the backend
// only takes a fleet photo for an existing car of the business).
export function NewVehiclePhotosPicker({ photos, onChange, disabled, status }: NewVehiclePhotosPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Free every preview still held when the page goes away.
  const latest = useRef(photos);
  latest.current = photos;
  useEffect(() => () => latest.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)), []);

  const canAddMore = photos.length < MAX_VEHICLE_PHOTOS;

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.length === 0) return;
    const { accepted, rejected } = pickPhotoFiles(picked, MAX_VEHICLE_PHOTOS - photos.length);
    rejected.forEach((message) => toast.error(message));
    if (accepted.length === 0) return;
    onChange([
      ...photos,
      ...accepted.map((file) => ({ id: `photo-${(nextId += 1)}`, file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const remove = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  const makeCover = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) onChange([photo, ...photos.filter((p) => p.id !== id)]);
  };

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Photos ({photos.length}/{MAX_VEHICLE_PHOTOS})
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {photos.length > 1
              ? 'The first photo is the cover. Use “Make cover” to change it.'
              : 'Select several at once. Large photos are shrunk automatically and upload when you save the car.'}
          </p>
        </div>
        {canAddMore ? (
          <Button size="sm" variant="secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" />
            Add photos
          </Button>
        ) : null}
      </div>
      {!canAddMore ? (
        <p className="text-xs text-text-muted">
          A car can have up to {MAX_VEHICLE_PHOTOS} photos. Remove one to add another.
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-media border border-border-subtle bg-surface-hover"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview */}
              <img src={photo.previewUrl} alt={`Car photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded bg-ink/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(photo.id)}
                disabled={disabled}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/65 text-white hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(photo.id)}
                  disabled={disabled}
                  className="absolute bottom-1.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink/65 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                >
                  <Star className="h-3 w-3" /> Make cover
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-media border border-dashed border-border-strong px-4 text-center text-xs text-text-muted">
          No photos yet. At least one photo is needed before the car can be submitted for review.
        </div>
      )}

      {status ? <p className="text-xs font-medium text-ink">{status}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={VEHICLE_PHOTO_ACCEPT}
        multiple
        onChange={onFiles}
        className="sr-only"
      />
    </Card>
  );
}
