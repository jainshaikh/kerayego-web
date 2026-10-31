'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../ui';
import type { DriverProfile } from '../../../types/driver.types';
import { useSaveDriverStep } from '../../../hooks/useDriverProfile';
import { formatCnicInput } from '../../../lib/validations/cnic.schema';
import { DRIVER_LIMITS, todayDateOnly, tomorrowDateOnly } from '../../../lib/driver/fields';
import { fieldLabel, needsPoliceCertificate, PRIVATE_NOTE } from '../../../lib/driver/setupSteps';
import {
  DECLARATIONS,
  identityStepDefaults,
  identityStepPayload,
  identityStepSchema,
  LICENSE_AUTHORITY_SUGGESTIONS,
  type IdentityStepValues,
} from '../../../lib/validations/driver-setup.schema';
import { DriverDocumentsCard } from '../DriverDocumentsCard';
import { CheckboxRow, ChipGroup, StepSection } from '../DriverFormFields';
import { SetupStepFrame, SetupStepGate, useSetupNavigation } from '../SetupStepFrame';

const AUTHORITY_OPTIONS = LICENSE_AUTHORITY_SUGGESTIONS.map((value) => ({ value, label: value }));

// Setup step 2 — identity and documents (kerayego-partner
// app/(driver)/driver/setup/identity.tsx; all private, checked by KerayeGo).
// The documents upload on their own as soon as they're chosen; the form saves
// the numbers, dates, emergency contact and declarations. Changing the CNIC or
// licence details while under review or verified asks first.
export function IdentityStep() {
  return <SetupStepGate route="identity">{(profile) => <IdentityStepForm profile={profile} />}</SetupStepGate>;
}

function IdentityStepForm({ profile }: { profile: DriverProfile | null }) {
  const { goNext } = useSetupNavigation('identity');
  const saver = useSaveDriverStep(profile);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<IdentityStepValues>({
    resolver: zodResolver(identityStepSchema),
    defaultValues: identityStepDefaults(profile),
  });

  const onSubmit = (values: IdentityStepValues) => {
    if (!isDirty) {
      goNext();
      return;
    }
    saver.save(identityStepPayload(values), goNext);
  };

  const authority = useWatch({ control, name: 'licenseIssuingAuthority' });

  return (
    <SetupStepFrame
      route="identity"
      profile={profile}
      onSubmit={handleSubmit(onSubmit)}
      isSaving={saver.isSaving}
      error={saver.error}
      isDirty={isDirty}
      intro={`${PRIVATE_NOTE} KerayeGo checks it before businesses can give you jobs.`}
      confirm={saver.confirm}
      onConfirmSave={saver.confirmSave}
      onCancelConfirm={saver.cancelConfirm}
    >
      <StepSection title="CNIC">
        <div className="grid gap-5 md:grid-cols-2">
          <Controller
            control={control}
            name="cnicNumber"
            render={({ field }) => (
              <Input
                label={fieldLabel('CNIC number', 'required')}
                placeholder="35202-1234567-1"
                inputMode="numeric"
                maxLength={15}
                value={field.value}
                onChange={(e) => field.onChange(formatCnicInput(e.target.value))}
                onBlur={field.onBlur}
                error={errors.cnicNumber?.message}
                helper="Only you and KerayeGo see it — never a business."
              />
            )}
          />
          <Input
            label={fieldLabel('CNIC expiry date', 'required')}
            type="date"
            min={tomorrowDateOnly()}
            error={errors.cnicExpiry?.message}
            {...register('cnicExpiry')}
          />
        </div>
      </StepSection>

      <StepSection title="Driving licence">
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label={fieldLabel('Licence number', 'required')}
            placeholder="DL-12345"
            maxLength={DRIVER_LIMITS.licenseNumber}
            error={errors.licenseNumber?.message}
            {...register('licenseNumber')}
          />
          <Input
            label={fieldLabel('Category', 'required')}
            placeholder="LTV"
            maxLength={DRIVER_LIMITS.licenseCategory}
            className="uppercase"
            error={errors.licenseCategory?.message}
            {...register('licenseCategory')}
          />
          <Input
            label={fieldLabel('Issue date', 'required')}
            type="date"
            max={todayDateOnly()}
            error={errors.licenseIssueDate?.message}
            {...register('licenseIssueDate')}
          />
          <Input
            label={fieldLabel('Expiry date', 'required')}
            type="date"
            min={tomorrowDateOnly()}
            error={errors.licenseExpiry?.message}
            helper="Businesses see this date once you're verified."
            {...register('licenseExpiry')}
          />
        </div>
        <div className="space-y-3">
          <Input
            label={fieldLabel('Issuing province / authority', 'required')}
            placeholder="Punjab"
            maxLength={DRIVER_LIMITS.licenseIssuingAuthority}
            error={errors.licenseIssuingAuthority?.message}
            wrapperClassName="md:max-w-md"
            {...register('licenseIssuingAuthority')}
          />
          <ChipGroup
            options={AUTHORITY_OPTIONS}
            isSelected={(value) => value === authority.trim()}
            onPress={(value) =>
              setValue('licenseIssuingAuthority', value, { shouldDirty: true, shouldValidate: true })
            }
          />
        </div>
      </StepSection>

      <DriverDocumentsCard
        documents={profile?.documents}
        verificationStatus={profile?.verificationStatus}
        policeCertificateNeeded={needsPoliceCertificate(profile?.services ?? [])}
      />

      <StepSection
        title="Emergency contact *"
        description={`${PRIVATE_NOTE} Someone KerayeGo can call if something happens to you on a job.`}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Input
            label="Name"
            placeholder="Next of kin"
            maxLength={DRIVER_LIMITS.emergencyContactName}
            error={errors.emergencyContactName?.message}
            {...register('emergencyContactName')}
          />
          <Input
            label="Phone"
            placeholder="+92 300 0000000"
            type="tel"
            maxLength={DRIVER_LIMITS.emergencyContactPhone}
            error={errors.emergencyContactPhone?.message}
            {...register('emergencyContactPhone')}
          />
          <Input
            label="Relation"
            placeholder="Brother"
            maxLength={DRIVER_LIMITS.emergencyContactRelation}
            error={errors.emergencyContactRelation?.message}
            {...register('emergencyContactRelation')}
          />
        </div>
      </StepSection>

      <StepSection title="Declarations *" description="Tick each one that is true. KerayeGo may check them.">
        <div className="space-y-3">
          {DECLARATIONS.map((declaration) => (
            <Controller
              key={declaration.key}
              control={control}
              name={declaration.key}
              render={({ field }) => (
                <CheckboxRow
                  label={declaration.label}
                  checked={field.value}
                  onToggle={() => field.onChange(!field.value)}
                />
              )}
            />
          ))}
        </div>
      </StepSection>
    </SetupStepFrame>
  );
}
