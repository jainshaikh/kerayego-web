'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card } from '../../ui';
import { cn } from '../../../lib/utils/cn';
import { MAX_VEHICLE_PHOTOS } from '../../../lib/api/vehicles.api';
import { apiErrorMessage } from '../../../lib/ops/apiError';
import { moveImage, sortedImages } from '../../../lib/ops/photos';
import { useAddVehiclePhoto, useRemoveVehiclePhoto, useReorderVehiclePhotos } from '../../../hooks/useVehicles';
import type { FleetVehicleImage } from '../../../types/fleet.types';
import { ConfirmModal } from '../ConfirmModal';

interface VehiclePhotosProps {
  vehicleId: string;
  images: readonly FleetVehicleImage[];
  /** can('editFleet') and a status that allows changes (canManageVehiclePhotos). */
  editable: boolean;
}

// A car's photos, ported from the KerayeGo Partner app's fleet detail: add
// (uploaded into the car's folder, watermarked by the backend, then attached),
// remove (asks first) and — beyond the Partner app, which has no reorder
// control yet though its API supports it — move left / right and "Make cover".
// The first photo is the cover customers see. Up to MAX_VEHICLE_PHOTOS.
export function VehiclePhotos({ vehicleId, images, editable }: VehiclePhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const addPhoto = useAddVehiclePhoto(vehicleId, setProgress);
  const removePhoto = useRemoveVehiclePhoto(vehicleId);
  const reorder = useReorderVehiclePhotos(vehicleId);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const sorted = sortedImages(images);
  const ids = sorted.map((image) => image.id);
  const canAddMore = sorted.length < MAX_VEHICLE_PHOTOS;
  const busy = addPhoto.isPending || removePhoto.isPending || reorder.isPending;

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProgress(0);
    addPhoto.mutate(file, {
      // e.g. 400 "Maximum 10 images per vehicle", a file over 5 MB, or 403 for
      // a manager (the backend's photo upload is business admin only today).
      onError: (error) => toast.error(`Photo not added: ${apiErrorMessage(error)}`),
    });
  };

  const move = (id: string, toIndex: number) => {
    reorder.mutate(moveImage(ids, id, toIndex), {
      onError: (error) => toast.error(`Could not reorder photos: ${apiErrorMessage(error)}`),
    });
  };

  const confirmRemove = () => {
    if (!removeId) return;
    removePhoto.mutate(removeId, {
      onSuccess: () => setRemoveId(null),
      onError: (error) => {
        setRemoveId(null);
        toast.error(`Could not remove photo: ${apiErrorMessage(error)}`);
      },
    });
  };

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Photos ({sorted.length}/{MAX_VEHICLE_PHOTOS})
          </h2>
          {editable && sorted.length > 1 ? (
            <p className="mt-0.5 text-xs text-text-muted">The first photo is the cover. Use the arrows to reorder.</p>
          ) : null}
        </div>
        {editable && canAddMore ? (
          <Button size="sm" variant="secondary" loading={addPhoto.isPending} disabled={busy} onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" />
            {addPhoto.isPending ? `Uploading ${progress}%` : 'Add photo'}
          </Button>
        ) : null}
      </div>
      {editable && !canAddMore ? (
        <p className="text-xs text-text-muted">
          A car can have up to {MAX_VEHICLE_PHOTOS} photos. Remove one to add another.
        </p>
      ) : null}

      {sorted.length > 0 ? (
        <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', reorder.isPending && 'opacity-70')}>
          {sorted.map((image, index) => (
            <div key={image.id} className="group relative aspect-[4/3] overflow-hidden rounded-media border border-border-subtle bg-surface-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.altText ?? `Car photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded bg-ink/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              ) : null}
              {editable ? (
                <>
                  <button
                    type="button"
                    onClick={() => setRemoveId(image.id)}
                    disabled={busy}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/65 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {sorted.length > 1 ? (
                    <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => move(image.id, index - 1)}
                        disabled={busy || index === 0}
                        aria-label="Move photo left"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/65 text-white disabled:invisible"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {index > 0 ? (
                        <button
                          type="button"
                          onClick={() => move(image.id, 0)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full bg-ink/65 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                        >
                          <Star className="h-3 w-3" /> Make cover
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => move(image.id, index + 1)}
                        disabled={busy || index === sorted.length - 1}
                        aria-label="Move photo right"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/65 text-white disabled:invisible"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-media border border-dashed border-border-strong text-center text-xs text-text-muted">
          No photos added yet. At least one photo is required.
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />

      <ConfirmModal
        open={!!removeId}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remove photo?"
        description="This photo will be deleted from the car."
        confirmLabel="Remove"
        destructive
        loading={removePhoto.isPending}
        onConfirm={confirmRemove}
      />
    </Card>
  );
}
