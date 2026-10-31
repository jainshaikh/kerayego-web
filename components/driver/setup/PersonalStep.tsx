'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../ui';
import { MapLocationField } from '../../maps/MapLocationField';
import { DRIVER_GENDER_LABELS, DriverGender } from '../../../types/enums';
import type { DriverProfile } from '../../../types/driver.types';
import { useSaveDriverStep } from '../../../hooks/useDriverProfile';
import { DRIVER_LIMITS, latestAdultBirthDate } from '../../../lib/driver/fields';
import { fieldLabel, PRIVATE_NOTE } from '../../../lib/driver/setupSteps';
import {
  COMMON_LANGUAGES,
  personalStepDefaults,
  personalStepPayload,
  personalStepSchema,
  type PersonalStepValues,
} from '../../../lib/validations/driver-setup.schema';
import { DriverPhotoField } from '../DriverPhotoField';
import { ChipGroup, ChipListInput, FieldError, StepSection, YesNoField } from '../DriverFormFields';
import { SetupStepFrame, SetupStepGate, useSetupNavigation } from '../SetupStepFrame';

const GENDER_OPTIONS = Object.values(DriverGender).map((value) => ({ value, label: DRIVER_GENDER_LABELS[value] }));

// Setup step 1 — personal information (kerayego-partner
// app/(driver)/driver/setup/personal.tsx). Its first save creates the driver
// profile (and with it the Driver dashboard); the profile photo can be added
// once that exists.
export function PersonalStep() {
  return <SetupStepGate route="personal">{(profile) => <PersonalStepForm profile={profile} />}</SetupStepGate>;
}

function PersonalStepForm({ profile }: { profile: DriverProfile | null }) {
  const { goNext } = useSetupNavigation('personal');
  const saver = useSaveDriverStep(profile);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PersonalStepValues>({
    resolver: zodResolver(personalStepSchema),
    defaultValues: personalStepDefaults(profile),
  });

  const onSubmit = (values: PersonalStepValues) => {
    if (profile && !isDirty) {
      goNext();
      return;
    }
    saver.save(personalStepPayload(values), goNext);
  };

  const homeLat = useWatch({ control, name: 'homeLat' });
  const homeLng = useWatch({ control, name: 'homeLng' });
  const hasHome = homeLat !== undefined && homeLng !== undefined;

  return (
    <SetupStepFrame
      route="personal"
      profile={profile}
      onSubmit={handleSubmit(onSubmit)}
      isSaving={saver.isSaving}
      error={saver.error}
      isDirty={isDirty}
      intro="Who you are and how KerayeGo, businesses and customers can reach you."
      confirm={saver.confirm}
      onConfirmSave={saver.confirmSave}
      onCancelConfirm={saver.cancelConfirm}
    >
      <StepSection title="Profile photo">
        {profile ? (
          <DriverPhotoField avatarUrl={profile.avatarUrl} fullName={profile.fullName} />
        ) : (
          <p className="text-[13px] text-text-muted">Save this step first — then add your profile photo here.</p>
        )}
      </StepSection>

      <StepSection>
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label={fieldLabel('Full name (as on CNIC)', 'required')}
            placeholder="Muhammad Ali"
            maxLength={DRIVER_LIMITS.fullName}
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label={fieldLabel('Mobile / WhatsApp number', 'required')}
            placeholder="+92 300 1234567"
            type="tel"
            maxLength={DRIVER_LIMITS.contactPhone}
            error={errors.contactPhone?.message}
            helper={
              profile?.phoneVerified
                ? 'Verified.'
                : 'Verified by a one-time code once that’s available — saved as unverified for now.'
            }
            {...register('contactPhone')}
          />
          <Input
            label={fieldLabel('Date of birth', 'required')}
            type="date"
            max={latestAdultBirthDate()}
            error={errors.dateOfBirth?.message}
            helper={`${PRIVATE_NOTE} You must be 18 or older.`}
            {...register('dateOfBirth')}
          />
          <div className="hidden md:block" />
          <Input
            label={fieldLabel('City', 'required')}
            placeholder="Lahore"
            maxLength={DRIVER_LIMITS.city}
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label={fieldLabel('Area', 'required')}
            placeholder="Johar Town"
            maxLength={DRIVER_LIMITS.area}
            error={errors.area?.message}
            {...register('area')}
          />
        </div>

        <Controller
          control={control}
          name="residentialAddress"
          render={({ field }) => (
            <MapLocationField
              label={fieldLabel('Full residential address', 'required')}
              placeholder="House, street, area, city"
              addressValue={field.value}
              onAddressChange={field.onChange}
              lat={homeLat}
              lng={homeLng}
              onLocationChange={(lat, lng) => {
                setValue('homeLat', lat, { shouldDirty: true });
                setValue('homeLng', lng, { shouldDirty: true });
              }}
              error={errors.residentialAddress?.message}
              helper={
                hasHome
                  ? `Home location set on the map. ${PRIVATE_NOTE} Used to match you with nearby jobs.`
                  : `Home location * — pick a suggestion or choose on the map. ${PRIVATE_NOTE}`
              }
            />
          )}
        />
        {errors.homeLat || errors.homeLng ? <FieldError message="Choose your home location on the map again." /> : null}
      </StepSection>

      <StepSection>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <ChipGroup
              label={fieldLabel('Gender', 'required')}
              options={GENDER_OPTIONS}
              isSelected={(value) => value === field.value}
              onPress={(value) => field.onChange(value)}
              error={errors.gender?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="comfortableWithFamilies"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel('Comfortable driving families or women-only passengers?', 'hire')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="languages"
          render={({ field }) => (
            <ChipListInput
              label={fieldLabel('Languages you speak', 'required')}
              value={field.value}
              onChange={field.onChange}
              suggestions={COMMON_LANGUAGES}
              addLabel="Other language"
              addPlaceholder="Other language, e.g. Kashmiri"
              error={errors.languages?.message ?? errors.languages?.[0]?.message}
            />
          )}
        />
        <Input
          label={fieldLabel('Email address', 'optional')}
          placeholder="you@example.com"
          type="email"
          autoComplete="off"
          maxLength={DRIVER_LIMITS.contactEmail}
          error={errors.contactEmail?.message}
          wrapperClassName="md:max-w-md"
          {...register('contactEmail')}
        />
      </StepSection>
    </SetupStepFrame>
  );
}
