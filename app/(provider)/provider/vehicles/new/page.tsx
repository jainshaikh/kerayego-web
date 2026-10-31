'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateVehicle } from '../../../../../hooks/useVehicles';
import { useProviderProfile } from '../../../../../hooks/useProviderProfile';
import { BackButton, ErrorState, buttonVariants } from '../../../../../components/ui';
import { TrackEvent } from '../../../../../components/common/TrackEvent';
import { AddCarGate } from '../../../../../components/ops/fleet/AddCarGate';
import { VehicleForm } from '../../../../../components/ops/fleet/VehicleForm';
import { apiErrorMessage } from '../../../../../lib/ops/apiError';
import { addCarBlockers } from '../../../../../lib/ops/fleetRules';
import { emptyVehicleFormValues, toCreateVehiclePayload, type VehicleFormValues } from '../../../../../lib/ops/vehicleForm';

// Add a car (/provider/vehicles/new — the layout lets only can('manageFleet'),
// the business admin, in), ported from the KerayeGo Partner app's
// app/(business)/fleet/new.tsx. POST /vehicles needs an approved business
// with a showroom, so what's missing is said up front instead of after the
// form is filled in. The car starts as a draft; photos are added next.
export default function NewVehiclePage() {
  const router = useRouter();
  const business = useProviderProfile();
  const createVehicle = useCreateVehicle();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const header = (
    <div>
      <BackButton label="Fleet" fallbackHref="/provider/vehicles" className="mb-2" />
      <h1 className="text-2xl font-bold tracking-tight text-ink">Add a car</h1>
      <p className="mt-1 text-sm text-text-muted">
        Fill in the details below. You can add photos and submit it after saving.
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
        toast.success('Car added. Next, add photos of your car before submitting it for review.');
        router.replace(`/provider/vehicles/${car.id}/edit`);
      },
      onError: (error) => setSubmitError(apiErrorMessage(error)),
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      <TrackEvent name="list_vehicle_start" />
      {header}
      <VehicleForm
        showrooms={showrooms}
        defaultValues={emptyVehicleFormValues(showrooms)}
        submitLabel="Save as draft"
        submitting={createVehicle.isPending}
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
