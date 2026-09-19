'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useVehicle,
  useUpdateVehicle,
  useSubmitVehicleForReview,
} from '../../../../../../hooks/useVehicles';
import { useProviderProfile } from '../../../../../../hooks/useProviderProfile';
import { VehicleImageManager } from '../../../../../../components/vehicles/VehicleImageManager';
import { StatusBadge } from '../../../../../../components/common/StatusBadge';
import {
  vehicleSchema,
  type VehicleFormValues,
  TRANSMISSION_OPTIONS,
  FUEL_TYPE_OPTIONS,
  COMMON_FEATURES,
} from '../../../../../../lib/validations/vehicle.schema';
import { cn } from '../../../../../../lib/utils/cn';
import { getCurrencyCode } from '../../../../../../lib/utils/currency';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white disabled:bg-slate-50 disabled:text-slate-400';

export default function EditVehiclePage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const router = useRouter();

  const { data: vehicle, isLoading } = useVehicle(vehicleId);
  const { data: profile } = useProviderProfile();
  const updateVehicle = useUpdateVehicle(vehicleId);
  const submitForReview = useSubmitVehicleForReview(vehicleId);

  const currency = getCurrencyCode(vehicle?.showroom?.country ?? profile?.showrooms?.[0]?.country);
  const isEditable = vehicle?.status === 'DRAFT' || vehicle?.status === 'REJECTED';
  const canSubmit = vehicle?.status === 'DRAFT' && (vehicle?.images?.length ?? 0) > 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        title: vehicle.title,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        transmission: vehicle.transmission as VehicleFormValues['transmission'],
        fuelType: vehicle.fuelType as VehicleFormValues['fuelType'],
        seatingCapacity: vehicle.seatingCapacity,
        engineType: vehicle.engineType ?? '',
        pricePer6Hours: vehicle.pricePer6Hours ? Number(vehicle.pricePer6Hours) : undefined,
        pricePer12Hours: vehicle.pricePer12Hours ? Number(vehicle.pricePer12Hours) : undefined,
        pricePerDay: Number(vehicle.pricePerDay),
        pricePerWeek: vehicle.pricePerWeek ? Number(vehicle.pricePerWeek) : undefined,
        pricePerMonth: vehicle.pricePerMonth ? Number(vehicle.pricePerMonth) : undefined,
        availabilityNotes: vehicle.availabilityNotes ?? '',
        pricingNotes: vehicle.pricingNotes ?? '',
        specialConditions: vehicle.specialConditions ?? '',
        features: vehicle.features?.map((f) => f.name) ?? [],
      });
    }
  }, [vehicle, reset]);

  const selectedFeatures = watch('features') ?? [];

  const toggleFeature = (feature: string) => {
    const current = selectedFeatures;
    if (current.includes(feature)) {
      setValue(
        'features',
        current.filter((f) => f !== feature),
        { shouldDirty: true },
      );
    } else {
      setValue('features', [...current, feature], { shouldDirty: true });
    }
  };

  const showroom = profile?.showrooms?.[0];

  const onSubmit = async (values: VehicleFormValues) => {
    await updateVehicle.mutateAsync({
      ...values,
      engineType: values.engineType || undefined,
      availabilityNotes: values.availabilityNotes || undefined,
      pricingNotes: values.pricingNotes || undefined,
      specialConditions: values.specialConditions || undefined,
      showroomId: showroom?.id,
      pricePerWeek: values.pricePerWeek ?? undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-100" />
        <div className="h-64 rounded-xl bg-slate-100" />
        <div className="h-48 rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Vehicle not found.</p>
        <button
          onClick={() => router.push('/provider/vehicles')}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Back to vehicles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <button
              onClick={() => router.push('/provider/vehicles')}
              className="text-slate-400 transition-colors hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="truncate text-xl font-bold text-slate-900">{vehicle.title}</h1>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        {canSubmit && (
          <button
            onClick={() => submitForReview.mutate()}
            disabled={submitForReview.isPending || isDirty}
            className="flex-shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            title={isDirty ? 'Save changes before submitting' : ''}
          >
            {submitForReview.isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
      </div>

      {/* Rejection reason banner */}
      {vehicle.status === 'REJECTED' && vehicle.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-semibold text-red-800">Not approved</p>
          <p className="mt-0.5 text-red-700">{vehicle.rejectionReason}</p>
          <p className="mt-1 text-xs text-red-600">
            Update the listing below and submit again when ready.
          </p>
        </div>
      )}

      {/* Images — always shown */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <VehicleImageManager vehicleId={vehicleId} images={vehicle.images ?? []} />
        {canSubmit && vehicle.images.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">
            Upload at least one photo to submit for review.
          </p>
        )}
      </section>

      {/* Edit form — only shown when editable */}
      {isEditable ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-800">Basic information</p>

            <div>
              <Label required>Listing title</Label>
              <input {...register('title')} className={inputCls} />
              <FieldError message={errors.title?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Make</Label>
                <input {...register('make')} className={inputCls} />
                <FieldError message={errors.make?.message} />
              </div>
              <div>
                <Label required>Model</Label>
                <input {...register('model')} className={inputCls} />
                <FieldError message={errors.model?.message} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label required>Year</Label>
                <input
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.year?.message} />
              </div>
              <div>
                <Label required>Seats</Label>
                <input
                  type="number"
                  {...register('seatingCapacity', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.seatingCapacity?.message} />
              </div>
              <div>
                <Label>Engine</Label>
                <input {...register('engineType')} placeholder="2.5L 4-Cyl" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Transmission</Label>
                <select {...register('transmission')} className={inputCls}>
                  {TRANSMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Fuel type</Label>
                <select {...register('fuelType')} className={inputCls}>
                  {FUEL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-800">Pricing</p>
            <p className="text-xs text-slate-500">
              Daily is required. Set any of the others to let renters pick that duration too —
              leave a field blank if you don&apos;t want to offer it.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>6-hour price ({currency})</Label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePer6Hours', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.pricePer6Hours?.message} />
              </div>
              <div>
                <Label>12-hour price ({currency})</Label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePer12Hours', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.pricePer12Hours?.message} />
              </div>
              <div>
                <Label required>Daily price ({currency})</Label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePerDay', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.pricePerDay?.message} />
              </div>
              <div>
                <Label>Weekly price ({currency})</Label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePerWeek', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.pricePerWeek?.message} />
              </div>
              <div>
                <Label>Monthly price ({currency})</Label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePerMonth', { valueAsNumber: true })}
                  className={inputCls}
                />
                <FieldError message={errors.pricePerMonth?.message} />
              </div>
            </div>

            <div>
              <Label>Pricing notes</Label>
              <input
                {...register('pricingNotes')}
                placeholder="e.g. Includes insurance"
                className={inputCls}
              />
            </div>
          </section>

          {/* Location & Details */}
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-800">Location & details</p>

            {showroom ? (
              <div>
                <Label>Location</Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <p className="text-sm font-medium text-slate-800">{showroom.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {showroom.address}, {showroom.area ? `${showroom.area}, ` : ''}
                    {showroom.city.charAt(0).toUpperCase() + showroom.city.slice(1)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  This vehicle will be listed at your showroom address.
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-600">
                No showroom on file — add one in your profile so this vehicle has a listed location.
              </p>
            )}

            <div>
              <Label>Availability notes</Label>
              <textarea
                {...register('availabilityNotes')}
                rows={2}
                className={cn(inputCls, 'resize-none')}
              />
            </div>

            <div>
              <Label>Special conditions</Label>
              <textarea
                {...register('specialConditions')}
                rows={2}
                className={cn(inputCls, 'resize-none')}
              />
            </div>
          </section>

          {/* Features */}
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-800">Features & amenities</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_FEATURES.map((feature) => {
                const selected = selectedFeatures.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary',
                    )}
                  >
                    {feature}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/provider/vehicles')}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        /* Read-only view for PENDING_REVIEW / APPROVED / ARCHIVED */
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-800">Vehicle details</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: 'Title', value: vehicle.title },
              { label: 'Make / Model', value: `${vehicle.make} ${vehicle.model}` },
              { label: 'Year', value: vehicle.year },
              { label: 'Transmission', value: vehicle.transmission },
              { label: 'Fuel type', value: vehicle.fuelType },
              { label: 'Seats', value: vehicle.seatingCapacity },
              {
                label: 'Price / day',
                value: `${currency} ${Number(vehicle.pricePerDay).toLocaleString()}`,
              },
              {
                label: 'Price / week',
                value: vehicle.pricePerWeek
                  ? `${currency} ${Number(vehicle.pricePerWeek).toLocaleString()}`
                  : '—',
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>

          {vehicle.features && vehicle.features.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-slate-400">Features</p>
              <div className="flex flex-wrap gap-1.5">
                {vehicle.features.map((f) => (
                  <span
                    key={f.id}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {vehicle.status === 'PENDING_REVIEW' && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
              This listing is under review and cannot be edited. We&apos;ll email you once approved.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
