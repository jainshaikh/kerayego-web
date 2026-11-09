'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useAddPhotosToNewVehicle,
  useCreateVehicle,
  photoProgressLabel,
  type PhotoUploadProgress,
} from '../../../../../hooks/useVehicles';
import { useProviderProfile } from '../../../../../hooks/useProviderProfile';
import { BackButton, ErrorState, buttonVariants } from '../../../../../components/ui';
import { TrackEvent } from '../../../../../components/common/TrackEvent';
import { AddCarGate } from '../../../../../components/ops/fleet/AddCarGate';
import { VehicleForm } from '../../../../../components/ops/fleet/VehicleForm';
import {
  NewVehiclePhotosPicker,
  type PendingVehiclePhoto,
} from '../../../../../components/ops/fleet/NewVehiclePhotosPicker';
import { apiErrorMessage } from '../../../../../lib/ops/apiError';
import { addCarBlockers } from '../../../../../lib/ops/fleetRules';
import { emptyVehicleFormValues, toCreateVehiclePayload, type VehicleFormValues } from '../../../../../lib/ops/vehicleForm';

// Add a car (/provider/vehicles/new — the layout lets only can('manageFleet'),
// the business admin, in), ported from the KerayeGo Partner app's
// app/(business)/fleet/new.tsx. POST /vehicles needs an approved business
// with a showroom, so what's missing is said up front instead of after the
// form is filled in. Photos are picked here too (several at once, any one
// made the cover) and uploaded into the car's folder right after it's saved as
// a draft; then the car's own page opens.
export default function NewVehiclePage() {
  const router = useRouter();
  const business = useProviderProfile();
  const createVehicle = useCreateVehicle();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PendingVehiclePhoto[]>([]);
  const [photoProgress, setPhotoProgress] = useState<PhotoUploadProgress | null>(null);
  const addPhotos = useAddPhotosToNewVehicle(setPhotoProgress);
  const saving = createVehicle.isPending || addPhotos.isPending;

  const header = (
    <div>
      <BackButton label="Fleet" fallbackHref="/provider/vehicles" className="mb-2" />
      <h1 className="text-2xl font-bold tracking-tight text-ink">Add a car</h1>
      <p className="mt-1 text-sm text-text-muted">
        Add the details and photos below. You can submit it for review after saving.
      </p>
    </div>
  );

  if (business.isPending) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-surface-hover" />
        <div className="h-64 rounded-card bg-surface-hover" />
      </div>
    );
  }
  if (business.isError) {
    return (
      <div className="max-w-2xl space-y-5">
        {header}
        <ErrorState description={apiErrorMessage(business.error)} onRetry={() => business.refetch()} />
      </div>
    );
  }

  const blockers = addCarBlockers(business.data);
  if (blockers.length > 0 || !business.data) {
    return (
      <div className="max-w-2xl space-y-5">
        {header}
        <AddCarGate blockers={blockers} />
      </div>
    );
  }

  const showrooms = business.data.showrooms;

  const onSubmit = (values: VehicleFormValues) => {
    setSubmitError(null);
    createVehicle.mutate(toCreateVehiclePayload(values), {
      onSuccess: (car) => {
        const openCar = () => router.replace(`/provider/vehicles/${car.id}/edit`);
        if (photos.length === 0) {
          toast.success('Car added. Next, add photos of your car before submitting it for review.');
          openCar();
          return;
        }
        // The car exists now, so the photos can go into its folder — in the
        // order shown, so the first one is the cover. A failed photo doesn't
        // undo the car: its page says what's missing and can add it again.
        addPhotos.mutate(
          { vehicleId: car.id, files: photos.map((photo) => photo.file) },
          {
            onSuccess: ({ added, failed }) => {
              if (failed.length === 0) {
                toast.success(`Car added with ${added.length} photo${added.length === 1 ? '' : 's'}.`);
              } else {
                toast.success('Car added.');
                failed.forEach(({ fileName, error }) =>
                  toast.error(`${fileName} not added: ${apiErrorMessage(error)}`),
                );
              }
            },
            onError: () => toast.error('Car added, but its photos could not be uploaded — add them on its page.'),
            onSettled: openCar,
          },
        );
      },
      onError: (error) => setSubmitError(apiErrorMessage(error)),
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      <TrackEvent name="list_vehicle_start" />
      {header}
      <NewVehiclePhotosPicker
        photos={photos}
        onChange={setPhotos}
        disabled={saving}
        status={
          addPhotos.isPending && photoProgress
            ? `Car saved — ${photoProgressLabel(photoProgress).toLowerCase()}`
            : null
        }
      />
      <VehicleForm
        showrooms={showrooms}
        defaultValues={emptyVehicleFormValues(showrooms)}
        submitLabel={photos.length > 0 ? 'Save as draft and upload photos' : 'Save as draft'}
        submitting={saving}
        error={submitError}
        allowUnchanged
        onSubmit={onSubmit}
        secondaryAction={
          <Link href="/provider/vehicles" className={buttonVariants({ variant: 'secondary' })}>
            Cancel
          </Link>
        }
      />
    </div>
  );
}
