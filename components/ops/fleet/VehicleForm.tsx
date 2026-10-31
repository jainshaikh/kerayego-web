'use client';

import { useEffect, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Input, PillToggle, Select, Textarea } from '../../ui';
import { getCurrencyCode } from '../../../lib/utils/currency';
import type { Showroom } from '../../../types/api.types';
import {
  FUEL_TYPE_OPTIONS,
  PRICE_FIELDS,
  TRANSMISSION_OPTIONS,
  featureOptions,
  sanitizePriceInput,
  sanitizeWholeNumberInput,
  toggleFeature,
  vehicleFormSchema,
  type VehicleFormValues,
} from '../../../lib/ops/vehicleForm';

interface VehicleFormProps {
  /** The business's showrooms (GET /providers/me); the car is listed at the one picked. */
  showrooms: readonly Showroom[];
  defaultValues: VehicleFormValues;
  submitLabel: string;
  submitting: boolean;
  /** A save error shown above the button. */
  error: string | null;
  /** Whether the button works with nothing changed (adding a car; saving a rejected car back to draft). */
  allowUnchanged?: boolean;
  onSubmit: (values: VehicleFormValues) => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** A live car's plate: shown but not editable (only KerayeGo can correct it). */
  plateLocked?: boolean;
  /** Shown left of the submit button, e.g. Cancel. */
  secondaryAction?: ReactNode;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function showroomAddress(showroom: Showroom): string {
  return [showroom.address, showroom.area, titleCase(showroom.city)].filter(Boolean).join(', ');
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <PillToggle key={option.value} active={option.value === value} onClick={() => onChange(option.value)}>
            {option.label}
          </PillToggle>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-[13px] text-red-700">{error}</p> : null}
    </div>
  );
}

// The add-a-car and edit-a-car form, ported from the KerayeGo Partner app's
// VehicleForm (same fields, labels and limits — the backend's CreateVehicleDto).
// It only collects the values; each page turns them into its own request.
export function VehicleForm({
  showrooms,
  defaultValues,
  submitLabel,
  submitting,
  error,
  allowUnchanged = false,
  onSubmit,
  onDirtyChange,
  plateLocked = false,
  secondaryAction,
}: VehicleFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const showroomId = useWatch({ control, name: 'showroomId' });
  const selectedShowroom = showrooms.find((showroom) => showroom.id === showroomId);
  const currency = getCurrencyCode(selectedShowroom?.country ?? showrooms[0]?.country);

  // Daily first: it's the required one.
  const priceFields = [...PRICE_FIELDS].sort(
    (a, b) => Number(b.name === 'pricePerDay') - Number(a.name === 'pricePerDay'),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Section title="Basic information">
        <Input
          label="Listing title"
          required
          placeholder="e.g. 2023 Toyota Corolla Altis"
          maxLength={100}
          error={errors.title?.message}
          {...register('title')}
        />
        <Input
          label={plateLocked ? 'License plate number' : 'License plate number (optional)'}
          placeholder="e.g. ABC-123"
          maxLength={20}
          readOnly={plateLocked}
          aria-readonly={plateLocked}
          className={plateLocked ? 'cursor-not-allowed bg-page uppercase text-text-faint' : 'uppercase'}
          helper={
            plateLocked ? "A live car's plate can't be changed here — contact KerayeGo support to correct it." : undefined
          }
          error={errors.plateNumber?.message}
          {...register('plateNumber')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Make" required placeholder="e.g. Toyota" maxLength={50} error={errors.make?.message} {...register('make')} />
          <Input label="Model" required placeholder="e.g. Corolla" maxLength={50} error={errors.model?.message} {...register('model')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="year"
            render={({ field }) => (
              <Input
                label="Year"
                required
                inputMode="numeric"
                placeholder="2023"
                maxLength={4}
                value={field.value}
                onChange={(e) => field.onChange(sanitizeWholeNumberInput(e.target.value))}
                onBlur={field.onBlur}
                error={errors.year?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="seatingCapacity"
            render={({ field }) => (
              <Input
                label="Seats"
                required
                inputMode="numeric"
                placeholder="5"
                maxLength={2}
                value={field.value}
                onChange={(e) => field.onChange(sanitizeWholeNumberInput(e.target.value))}
                onBlur={field.onBlur}
                error={errors.seatingCapacity?.message}
              />
            )}
          />
          <Input
            label="Engine (optional)"
            placeholder="e.g. 1.8L 4-Cylinder"
            maxLength={60}
            error={errors.engineType?.message}
            {...register('engineType')}
          />
        </div>
        <Controller
          control={control}
          name="transmission"
          render={({ field }) => (
            <ChoiceGroup
              label="Transmission"
              options={TRANSMISSION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.transmission?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="fuelType"
          render={({ field }) => (
            <ChoiceGroup
              label="Fuel type"
              options={FUEL_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.fuelType?.message}
            />
          )}
        />
      </Section>

      <Section title="Pricing">
        <p className="text-xs leading-relaxed text-text-muted">
          Prices are in {currency}, for the car with your driver — every KerayeGo rental comes with the business&apos;s
          driver. The daily price is required; set any of the others to let customers pick that duration too, or leave
          it blank if you don&apos;t offer it.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {priceFields.map(({ name, label }) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <Input
                  label={`${label} (${currency})${name === 'pricePerDay' ? '' : ' — optional'}`}
                  required={name === 'pricePerDay'}
                  inputMode="decimal"
                  placeholder={name === 'pricePerDay' ? 'e.g. 8000' : 'Not offered'}
                  maxLength={11}
                  value={field.value}
                  onChange={(e) => field.onChange(sanitizePriceInput(e.target.value))}
                  onBlur={field.onBlur}
                  error={errors[name]?.message}
                />
              )}
            />
          ))}
        </div>
        <Input
          label="Pricing notes (optional)"
          placeholder="e.g. Fuel included, minimum 3 days"
          maxLength={500}
          error={errors.pricingNotes?.message}
          {...register('pricingNotes')}
        />
      </Section>

      <Section title="Location & details">
        {showrooms.length > 1 ? (
          <Select label="Showroom" required error={errors.showroomId?.message} {...register('showroomId')}>
            {showrooms.map((showroom) => (
              <option key={showroom.id} value={showroom.id}>
                {showroom.name}
              </option>
            ))}
          </Select>
        ) : errors.showroomId?.message ? (
          <p className="text-[13px] text-red-700">{errors.showroomId.message}</p>
        ) : null}
        {selectedShowroom ? (
          <div className="rounded-control border border-border-subtle bg-page px-3.5 py-2.5">
            <p className="text-sm font-medium text-ink">{selectedShowroom.name}</p>
            <p className="mt-0.5 text-xs text-text-muted">{showroomAddress(selectedShowroom)}</p>
            <p className="mt-1 text-xs text-text-faint">This car will be listed at this showroom&apos;s address.</p>
          </div>
        ) : null}
        <Textarea
          label="Availability notes (optional)"
          rows={3}
          placeholder="e.g. Available weekdays only, minimum 2-day rental"
          maxLength={500}
          error={errors.availabilityNotes?.message}
          {...register('availabilityNotes')}
        />
        <Textarea
          label="Special conditions (optional)"
          rows={3}
          placeholder="e.g. Security deposit required, no smoking"
          maxLength={1000}
          error={errors.specialConditions?.message}
          {...register('specialConditions')}
        />
      </Section>

      <Section title="Features & amenities">
        <Controller
          control={control}
          name="features"
          render={({ field }) => (
            <div>
              <div className="flex flex-wrap gap-2">
                {featureOptions(field.value).map((name) => (
                  <PillToggle
                    key={name}
                    active={field.value.includes(name)}
                    onClick={() => field.onChange(toggleFeature(field.value, name))}
                  >
                    {name}
                  </PillToggle>
                ))}
              </div>
              {field.value.length > 0 ? (
                <p className="mt-2 text-xs text-text-muted">
                  {field.value.length} {field.value.length === 1 ? 'feature' : 'features'} selected
                </p>
              ) : null}
              {errors.features ? (
                <p className="mt-1.5 text-[13px] text-red-700">
                  {errors.features.message ?? errors.features.find?.((issue) => issue?.message)?.message}
                </p>
              ) : null}
            </div>
          )}
        />
      </Section>

      {error ? (
        <p role="alert" className="whitespace-pre-line text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2.5">
        {secondaryAction}
        <Button type="submit" loading={submitting} disabled={!allowUnchanged && !isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
