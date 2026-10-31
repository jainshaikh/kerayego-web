'use client';

import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Textarea } from '../../ui';
import {
  DRIVER_TRANSMISSION_LABELS,
  DRIVER_VEHICLE_TYPE_LABELS,
  DriverTransmission,
  DriverVehicleType,
} from '../../../types/enums';
import type { DriverProfile } from '../../../types/driver.types';
import { useSaveDriverStep } from '../../../hooks/useDriverProfile';
import { currentMonth, DRIVER_LIMITS, toggleValue } from '../../../lib/driver/fields';
import { fieldLabel } from '../../../lib/driver/setupSteps';
import {
  emptyReference,
  experienceStepDefaults,
  experienceStepPayload,
  experienceStepSchema,
  type ExperienceStepValues,
} from '../../../lib/validations/driver-setup.schema';
import { CheckboxRow, ChipGroup, FieldError, StepSection, YesNoField } from '../DriverFormFields';
import { SetupStepFrame, SetupStepGate, useSetupNavigation } from '../SetupStepFrame';

const VEHICLE_OPTIONS = Object.values(DriverVehicleType).map((value) => ({
  value,
  label: DRIVER_VEHICLE_TYPE_LABELS[value],
}));
const TRANSMISSION_OPTIONS = Object.values(DriverTransmission).map((value) => ({
  value,
  label: DRIVER_TRANSMISSION_LABELS[value],
}));

// Setup step 3 — driving experience (kerayego-partner
// app/(driver)/driver/setup/experience.tsx): years, past jobs (add/remove
// rows), references (ideally two), vehicles and transmissions (customers can
// filter on these), highway, navigation, smartphone, training. Months are
// picked with the browser's month input (typed as YYYY-MM where it has none).
export function ExperienceStep() {
  return <SetupStepGate route="experience">{(profile) => <ExperienceStepForm profile={profile} />}</SetupStepGate>;
}

function ExperienceStepForm({ profile }: { profile: DriverProfile | null }) {
  const { goNext } = useSetupNavigation('experience');
  const saver = useSaveDriverStep(profile);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ExperienceStepValues>({
    resolver: zodResolver(experienceStepSchema),
    defaultValues: experienceStepDefaults(profile),
  });
  const jobs = useFieldArray({ control, name: 'employmentHistory' });
  const references = useFieldArray({ control, name: 'references' });
  const history = useWatch({ control, name: 'employmentHistory' });

  const onSubmit = (values: ExperienceStepValues) => {
    if (!isDirty) {
      goNext();
      return;
    }
    saver.save(experienceStepPayload(values), goNext);
  };

  const thisMonth = currentMonth();

  return (
    <SetupStepFrame
      route="experience"
      profile={profile}
      onSubmit={handleSubmit(onSubmit)}
      isSaving={saver.isSaving}
      error={saver.error}
      isDirty={isDirty}
      intro="Your driving background. Customers can filter drivers by vehicle, transmission and highway experience."
      confirm={saver.confirm}
      onConfirmSave={saver.confirmSave}
      onCancelConfirm={saver.cancelConfirm}
    >
      <StepSection>
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label={fieldLabel('Total driving (years)', 'required')}
            placeholder="8"
            inputMode="numeric"
            maxLength={2}
            error={errors.experienceYears?.message}
            {...register('experienceYears')}
          />
          <Input
            label={fieldLabel('As a driver (years)', 'required')}
            placeholder="5"
            inputMode="numeric"
            maxLength={2}
            error={errors.professionalExperienceYears?.message}
            {...register('professionalExperienceYears')}
          />
        </div>
        <Controller
          control={control}
          name="vehicleTypes"
          render={({ field }) => (
            <ChipGroup
              label={fieldLabel('Vehicles you can drive', 'required')}
              options={VEHICLE_OPTIONS}
              isSelected={(value) => field.value.includes(value)}
              onPress={(value) => field.onChange(toggleValue(field.value, value))}
            />
          )}
        />
        <Controller
          control={control}
          name="transmissions"
          render={({ field }) => (
            <ChipGroup
              label={fieldLabel('Transmission (choose both if you drive both)', 'required')}
              options={TRANSMISSION_OPTIONS}
              isSelected={(value) => field.value.includes(value)}
              onPress={(value) => field.onChange(toggleValue(field.value, value))}
            />
          )}
        />
        <Controller
          control={control}
          name="highwayExperience"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel('Highway / outstation driving experience?', 'required')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="hasSmartphoneGps"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel('Do you have a smartphone with GPS?', 'required')}
              value={field.value}
              onChange={field.onChange}
              helper="Needed to share your live location during a job."
            />
          )}
        />
        <Controller
          control={control}
          name="navigationSkills"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel('Comfortable with Google Maps navigation?', 'recommended')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Textarea
          label={fieldLabel('Special certifications or training', 'optional')}
          placeholder="e.g. defensive driving course, first aid"
          rows={3}
          maxLength={DRIVER_LIMITS.certifications}
          error={errors.certifications?.message}
          {...register('certifications')}
        />
      </StepSection>

      <StepSection title={fieldLabel('Previous jobs', 'recommended')} description="Where you have worked as a driver.">
        {jobs.fields.map((job, index) => {
          const current = history?.[index]?.current ?? false;
          const rowErrors = errors.employmentHistory?.[index];
          return (
            <div key={job.id} className="space-y-4 rounded-control border border-border-subtle p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Employer"
                  placeholder="Family, company or rental business"
                  maxLength={DRIVER_LIMITS.employer}
                  error={rowErrors?.employer?.message}
                  {...register(`employmentHistory.${index}.employer`)}
                />
                <Input
                  label="Role"
                  placeholder="Family driver"
                  maxLength={DRIVER_LIMITS.role}
                  error={rowErrors?.role?.message}
                  {...register(`employmentHistory.${index}.role`)}
                />
                <Input
                  label="From"
                  type="month"
                  placeholder="YYYY-MM"
                  max={thisMonth}
                  error={rowErrors?.from?.message}
                  {...register(`employmentHistory.${index}.from`)}
                />
                {current ? (
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-slate-700">To</p>
                    <p className="py-[11px] text-[15px] text-ink">Now</p>
                  </div>
                ) : (
                  <Input
                    label="To"
                    type="month"
                    placeholder="YYYY-MM"
                    max={thisMonth}
                    error={rowErrors?.to?.message}
                    {...register(`employmentHistory.${index}.to`)}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Controller
                  control={control}
                  name={`employmentHistory.${index}.current`}
                  render={({ field }) => (
                    <CheckboxRow
                      label="I still work here"
                      checked={field.value}
                      onToggle={() => field.onChange(!field.value)}
                    />
                  )}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => jobs.remove(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove this job
                </Button>
              </div>
            </div>
          );
        })}
        <FieldError message={errors.employmentHistory?.message} />
        {jobs.fields.length < DRIVER_LIMITS.employmentHistory ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => jobs.append({ employer: '', role: '', from: thisMonth, to: '', current: false })}
          >
            <Plus className="h-4 w-4" />
            Add a job
          </Button>
        ) : null}
      </StepSection>

      <StepSection
        title={fieldLabel('References', 'recommended')}
        description="Ideally two previous employers KerayeGo may call. Leave a row empty to skip it."
      >
        {references.fields.map((reference, index) => {
          const rowErrors = errors.references?.[index];
          return (
            <div key={reference.id} className="space-y-4 rounded-control border border-border-subtle p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Reference {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => references.remove(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Name"
                  placeholder="Their full name"
                  maxLength={DRIVER_LIMITS.referenceName}
                  error={rowErrors?.name?.message}
                  {...register(`references.${index}.name`)}
                />
                <Input
                  label="Phone"
                  placeholder="+92 300 0000000"
                  type="tel"
                  maxLength={DRIVER_LIMITS.referencePhone}
                  error={rowErrors?.phone?.message}
                  {...register(`references.${index}.phone`)}
                />
                <Input
                  label="Relation"
                  placeholder="Former employer"
                  maxLength={DRIVER_LIMITS.referenceRelation}
                  error={rowErrors?.relation?.message}
                  {...register(`references.${index}.relation`)}
                />
              </div>
            </div>
          );
        })}
        <FieldError message={errors.references?.message ?? errors.references?.root?.message} />
        {references.fields.length < DRIVER_LIMITS.references ? (
          <Button type="button" variant="secondary" onClick={() => references.append(emptyReference())}>
            <Plus className="h-4 w-4" />
            Add a reference
          </Button>
        ) : null}
      </StepSection>
    </SetupStepFrame>
  );
}
