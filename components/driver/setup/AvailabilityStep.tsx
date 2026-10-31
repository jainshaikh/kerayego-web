'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button, Input } from '../../ui';
import type { DriverProfile } from '../../../types/driver.types';
import { useSaveDriverStep } from '../../../hooks/useDriverProfile';
import { getCurrencyCode } from '../../../lib/utils/currency';
import { DRIVER_LIMITS } from '../../../lib/driver/fields';
import {
  fieldLabel,
  rateFieldsForServices,
  setupHref,
  type ServiceRateField,
} from '../../../lib/driver/setupSteps';
import { WEEKDAY_NAMES, WEEKDAYS, withSameHoursEveryDay, workingDaySummary } from '../../../lib/driver/workingHours';
import {
  availabilityStepDefaults,
  availabilityStepPayload,
  availabilityStepSchema,
  type AvailabilityStepValues,
} from '../../../lib/validations/driver-setup.schema';
import { CheckboxRow, ChipListInput, FieldError, StepSection, YesNoField } from '../DriverFormFields';
import { SetupStepFrame, SetupStepGate, useSetupNavigation } from '../SetupStepFrame';

// The driver's market currency — only Pakistan for now (plan Section 3b).
const CURRENCY = getCurrencyCode();

const RATE_INPUTS: Record<ServiceRateField, { label: string; placeholder: string; amount: boolean; helper: string }> = {
  hourlyRate: { label: `Hourly rate (${CURRENCY})`, placeholder: '500', amount: true, helper: 'For hourly bookings.' },
  minBookingHours: {
    label: 'Minimum booking (hours)',
    placeholder: '2',
    amount: false,
    helper: 'The shortest hourly booking you take.',
  },
  fullDayRate: { label: `Full-day rate (${CURRENCY})`, placeholder: '4000', amount: true, helper: 'For a full day.' },
  monthlySalary: {
    label: `Expected monthly salary (${CURRENCY})`,
    placeholder: '45000',
    amount: true,
    helper: 'For monthly / permanent jobs.',
  },
};

// Setup step 5 — availability and pricing (kerayego-partner
// app/(driver)/driver/setup/availability.tsx; hire-ready). The rates asked
// for depend on the services from step 4 (hourly → hourly rate + minimum
// booking, full-day → full-day rate, monthly → monthly salary). Customers pay
// the driver directly for now (A57).
export function AvailabilityStep() {
  return <SetupStepGate route="availability">{(profile) => <AvailabilityStepForm profile={profile} />}</SetupStepGate>;
}

function AvailabilityStepForm({ profile }: { profile: DriverProfile | null }) {
  const router = useRouter();
  const { goNext } = useSetupNavigation('availability');
  const saver = useSaveDriverStep(profile);
  const services = profile?.services ?? [];
  const rateFields = rateFieldsForServices(services);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AvailabilityStepValues>({
    resolver: zodResolver(availabilityStepSchema),
    defaultValues: availabilityStepDefaults(profile),
  });

  const onSubmit = (values: AvailabilityStepValues) => {
    if (!isDirty) {
      goNext();
      return;
    }
    saver.save(availabilityStepPayload(values, services), goNext);
  };

  const week = useWatch({ control, name: 'workingHours' });
  const firstWorkingDay = WEEKDAYS.find((day) => week[day].working);

  return (
    <SetupStepFrame
      route="availability"
      profile={profile}
      onSubmit={handleSubmit(onSubmit)}
      isSaving={saver.isSaving}
      error={saver.error}
      isDirty={isDirty}
      intro="Where and when you work, and what you charge. Customers pay you directly for now."
      confirm={saver.confirm}
      onConfirmSave={saver.confirmSave}
      onCancelConfirm={saver.cancelConfirm}
    >
      <StepSection>
        <Input
          label={fieldLabel('Service city', 'hire')}
          placeholder="Lahore"
          maxLength={DRIVER_LIMITS.city}
          error={errors.serviceCity?.message}
          wrapperClassName="md:max-w-md"
          {...register('serviceCity')}
        />
        <Controller
          control={control}
          name="coverageAreas"
          render={({ field }) => (
            <ChipListInput
              label={fieldLabel('Coverage areas', 'hire')}
              value={field.value}
              onChange={field.onChange}
              addLabel="Add an area"
              addPlaceholder="Add an area, e.g. DHA, Gulberg"
              helper="Click an area to remove it."
              error={errors.coverageAreas?.message ?? errors.coverageAreas?.[0]?.message}
            />
          )}
        />
      </StepSection>

      <StepSection title={fieldLabel('Working days and hours', 'hire')}>
        <ul className="divide-y divide-border-subtle">
          {WEEKDAYS.map((day) => {
            const draft = week[day];
            const dayError = errors.workingHours?.[day]?.message;
            return (
              <li key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0">
                <div className="w-40">
                  <CheckboxRow
                    label={WEEKDAY_NAMES[day]}
                    checked={draft.working}
                    onToggle={() =>
                      setValue(`workingHours.${day}.working`, !draft.working, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
                {draft.working ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`${WEEKDAY_NAMES[day]} start`}
                      value={draft.start}
                      className="w-[130px] py-2"
                      onChange={(e) =>
                        setValue(`workingHours.${day}.start`, e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className="text-text-faint">–</span>
                    <Input
                      type="time"
                      aria-label={`${WEEKDAY_NAMES[day]} end`}
                      value={draft.end}
                      className="w-[130px] py-2"
                      onChange={(e) =>
                        setValue(`workingHours.${day}.end`, e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                ) : null}
                <span className="text-[13px] text-text-muted">{workingDaySummary(draft)}</span>
                {dayError ? (
                  <div className="w-full">
                    <FieldError message={dayError} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {firstWorkingDay ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setValue('workingHours', withSameHoursEveryDay(week, firstWorkingDay), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            Use {WEEKDAY_NAMES[firstWorkingDay]}&apos;s hours every working day
          </Button>
        ) : null}
      </StepSection>

      <StepSection>
        <Controller
          control={control}
          name="outstationAvailable"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel('Available for outstation travel?', 'hire')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="overnightAvailable"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel('Available for overnight work?', 'hire')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </StepSection>

      <StepSection
        title="Pricing"
        description={`Customers pay you directly for now (cash or transfer). Prices are in ${CURRENCY}.`}
      >
        {rateFields.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] text-text-muted">
              Choose hourly, full-day or monthly work under Services to set those rates.
            </p>
            {isDirty ? null : (
              <Button type="button" variant="secondary" size="sm" onClick={() => router.push(setupHref('services'))}>
                Choose services
              </Button>
            )}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          {rateFields.map((name) => {
            const input = RATE_INPUTS[name];
            return (
              <Input
                key={name}
                label={fieldLabel(input.label, 'hire')}
                placeholder={input.placeholder}
                inputMode={input.amount ? 'decimal' : 'numeric'}
                maxLength={input.amount ? 12 : 3}
                error={errors[name]?.message}
                helper={input.helper}
                {...register(name)}
              />
            );
          })}
          <Input
            label={fieldLabel(`Overtime / waiting rate per hour (${CURRENCY})`, 'optional')}
            placeholder="300"
            inputMode="decimal"
            maxLength={12}
            error={errors.overtimeRate?.message}
            {...register('overtimeRate')}
          />
          <Input
            label={fieldLabel('Advance notice (hours)', 'hire')}
            placeholder="4"
            inputMode="numeric"
            maxLength={3}
            error={errors.minAdvanceNoticeHours?.message}
            {...register('minAdvanceNoticeHours')}
          />
          <Input
            label={fieldLabel('Max distance (km)', 'optional')}
            placeholder="50"
            inputMode="numeric"
            maxLength={4}
            error={errors.maxTravelKm?.message}
            {...register('maxTravelKm')}
          />
        </div>
      </StepSection>
    </SetupStepFrame>
  );
}
