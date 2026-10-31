'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton, Button, Card, ErrorState } from '../../../../../../components/ui';
import { StatusBadge } from '../../../../../../components/common/StatusBadge';
import { ConfirmModal } from '../../../../../../components/ops/ConfirmModal';
import { VehicleForm } from '../../../../../../components/ops/fleet/VehicleForm';
import { VehiclePhotos } from '../../../../../../components/ops/fleet/VehiclePhotos';
import {
  useArchiveVehicle,
  useSubmitVehicleForReview,
  useUpdateVehicle,
  useVehicle,
} from '../../../../../../hooks/useVehicles';
import { useProviderProfile } from '../../../../../../hooks/useProviderProfile';
import { useWorkspace } from '../../../../../../hooks/useWorkspace';
import { apiErrorMessage } from '../../../../../../lib/ops/apiError';
import { formatPrice } from '../../../../../../lib/ops/bookingDisplay';
import {
  VEHICLE_STATUS_LABELS,
  canArchiveVehicle,
  canEditVehicle,
  canManageVehiclePhotos,
  isPlateLocked,
  showsSubmit,
  submitBlocker,
  submitResultMessage,
  vehicleCurrency,
  vehicleStatusExplanation,
} from '../../../../../../lib/ops/fleetRules';
import {
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  toUpdateVehiclePayload,
  vehicleToFormValues,
  type VehicleFormValues,
} from '../../../../../../lib/ops/vehicleForm';
import type { Showroom } from '../../../../../../types/api.types';
import type { FleetVehicle, PlateHistory } from '../../../../../../types/fleet.types';

// One car (/provider/vehicles/[id]/edit), ported from the KerayeGo Partner
// app's app/(business)/fleet/[id].tsx: its status and what it means, photos,
// and the full form — for any car except an archived or suspended one, live
// cars included (the change goes live at once; a live car's plate is locked).
// Details and photos need can('editFleet') (business admin and manager);
// submitting and archiving need can('manageFleet') (business admin). The old
// web page only allowed editing DRAFT/REJECTED cars and never offered
// "Submit again" for a rejected one.

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;
  const vehicle = useVehicle(vehicleId);
  const business = useProviderProfile();

  const back = <BackButton label="Fleet" fallbackHref="/provider/vehicles" className="mb-2" />;

  if (vehicle.isPending || business.isPending) {
    return (
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-surface-hover" />
        <div className="h-40 rounded-card bg-surface-hover" />
        <div className="h-64 rounded-card bg-surface-hover" />
      </div>
    );
  }
  if (vehicle.isError || !vehicle.data) {
    return (
      <div className="max-w-3xl space-y-4">
        {back}
        <ErrorState
          title="We couldn't load this car"
          description={vehicle.error ? apiErrorMessage(vehicle.error) : 'Car not found.'}
          onRetry={() => vehicle.refetch()}
        />
      </div>
    );
  }

  return <VehicleDetail vehicle={vehicle.data} showrooms={business.data?.showrooms ?? []} back={back} />;
}

// "This car has history on KerayeGo" (plan A17/D16): the plate's rides and
// reviews from other listings, any owner. Parts that are 0 or null are left out.
function PlateHistoryCard({ history }: { history: PlateHistory }) {
  const parts: string[] = [];
  if (history.rideCount > 0) parts.push(`${history.rideCount.toLocaleString()} ${history.rideCount === 1 ? 'ride' : 'rides'}`);
  if (history.reviewCount > 0 && history.averageRating !== null) {
    parts.push(
      `★ ${history.averageRating.toFixed(1)} from ${history.reviewCount.toLocaleString()} ${history.reviewCount === 1 ? 'review' : 'reviews'}`,
    );
  }
  return (
    <Card className="flex gap-3 border-status-blue-border bg-status-blue-bg">
      <History className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" aria-hidden />
      <p className="text-sm text-ink">
        This car has history on KerayeGo{parts.length > 0 ? ` — ${parts.join(', ')}` : ''}. Reviews and rides stay with
        the car&rsquo;s plate, whoever lists it.
      </p>
    </Card>
  );
}

function VehicleDetail({ vehicle, showrooms, back }: { vehicle: FleetVehicle; showrooms: Showroom[]; back: React.ReactNode }) {
  const router = useRouter();
  const { can } = useWorkspace();
  const updateVehicle = useUpdateVehicle(vehicle.id);
  const submitVehicle = useSubmitVehicleForReview(vehicle.id);
  const archiveVehicle = useArchiveVehicle(vehicle.id);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const onDirtyChange = useCallback((dirty: boolean) => setHasUnsavedChanges(dirty), []);

  const editsFleet = can('editFleet');
  const managesFleet = can('manageFleet');
  const canEdit = editsFleet && canEditVehicle(vehicle.status);
  const canPhotos = editsFleet && canManageVehiclePhotos(vehicle.status);
  const canArchive = managesFleet && canArchiveVehicle(vehicle.status);
  const canSubmit = managesFleet && showsSubmit(vehicle.status);
  const blocker = submitBlocker(vehicle, hasUnsavedChanges);
  const currency = vehicleCurrency(vehicle, showrooms);
  const plateLocked = isPlateLocked(vehicle.status, vehicle.plateNumber);

  const onSubmit = (values: VehicleFormValues) => {
    setSaveError(null);
    updateVehicle.mutate(toUpdateVehiclePayload(values, { plateLocked }), {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        toast.success(vehicle.status === 'APPROVED' ? 'Saved. Customers now see the updated details.' : 'Car details have been updated.');
      },
      onError: (error) => setSaveError(apiErrorMessage(error)),
    });
  };

  const submit = () => {
    submitVehicle.mutate(undefined, {
      onSuccess: (car) => toast.success(submitResultMessage(car.status)),
      onError: (error) => toast.error(`Could not submit: ${apiErrorMessage(error)}`),
    });
  };

  const archive = () => {
    archiveVehicle.mutate(undefined, {
      onSuccess: () => {
        setConfirmArchive(false);
        toast.success('Archived. The car has been removed from active listings.');
        router.push('/provider/vehicles');
      },
      onError: (error) => {
        setConfirmArchive(false);
        toast.error(`Could not archive: ${apiErrorMessage(error)}`);
      },
    });
  };

  const transmission = TRANSMISSION_OPTIONS.find((o) => o.value === vehicle.transmission)?.label ?? vehicle.transmission;
  const fuel = FUEL_TYPE_OPTIONS.find((o) => o.value === vehicle.fuelType)?.label ?? vehicle.fuelType;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        {back}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{vehicle.title}</h1>
      </div>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={vehicle.status} label={VEHICLE_STATUS_LABELS[vehicle.status]} />
        </div>
        <p className="text-sm text-text-muted">{vehicleStatusExplanation(vehicle.status)}</p>
        {(vehicle.status === 'REJECTED' || vehicle.status === 'SUSPENDED') && vehicle.rejectionReason ? (
          <p className="text-sm text-red-700">Reason from KerayeGo: {vehicle.rejectionReason}</p>
        ) : null}
        {canSubmit ? (
          <div className="space-y-2 pt-2">
            {blocker ? <p className="text-xs text-status-amber-fg">• {blocker}</p> : null}
            <Button onClick={submit} disabled={Boolean(blocker)} loading={submitVehicle.isPending}>
              {vehicle.status === 'REJECTED' ? 'Submit again' : 'Submit for review'}
            </Button>
          </div>
        ) : null}
      </Card>

      {vehicle.plateHistory ? <PlateHistoryCard history={vehicle.plateHistory} /> : null}

      <VehiclePhotos vehicleId={vehicle.id} images={vehicle.images} editable={canPhotos} />

      {canEdit ? (
        <VehicleForm
          // A save returns the car with a new updatedAt: remounting resets the
          // form to the saved values, so it no longer counts as changed.
          key={vehicle.updatedAt}
          showrooms={showrooms}
          defaultValues={vehicleToFormValues(vehicle, showrooms)}
          submitLabel="Save changes"
          submitting={updateVehicle.isPending}
          error={saveError}
          // PATCH on a REJECTED car moves it back to DRAFT, even with nothing changed.
          allowUnchanged={vehicle.status === 'REJECTED'}
          plateLocked={plateLocked}
          onSubmit={onSubmit}
          onDirtyChange={onDirtyChange}
        />
      ) : (
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Car specs</h2>
          <p className="text-sm text-text-muted">
            {titleCase(vehicle.make)} {titleCase(vehicle.model)} ({vehicle.year}) · {transmission} · {fuel} ·{' '}
            {vehicle.seatingCapacity} seats
          </p>
          {vehicle.plateNumber ? <p className="text-sm text-text-muted">Plate number: {vehicle.plateNumber}</p> : null}
          <p className="text-sm text-text-muted">Price per day: {formatPrice(vehicle.pricePerDay, currency)}</p>
          {vehicle.features.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {vehicle.features.map((feature) => (
                <span key={feature.id} className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-slate-600">
                  {feature.name}
                </span>
              ))}
            </div>
          ) : null}
        </Card>
      )}

      {canArchive ? (
        <Card className="space-y-2 border-status-red-border">
          <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
          <p className="text-xs text-text-muted">
            Archive this car to remove it completely from listings and stop any future bookings.
          </p>
          <Button variant="danger-outline" size="sm" onClick={() => setConfirmArchive(true)}>
            Archive car
          </Button>
        </Card>
      ) : null}

      <ConfirmModal
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive car?"
        description="Customers will no longer see or book this car. An archived car cannot be reactivated."
        confirmLabel="Archive"
        destructive
        loading={archiveVehicle.isPending}
        onConfirm={archive}
      />
    </div>
  );
}
