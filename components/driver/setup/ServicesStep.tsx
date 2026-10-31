'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '../../ui';
import { DRIVER_SERVICE_LABELS, DriverService } from '../../../types/enums';
import type { DriverProfile } from '../../../types/driver.types';
import { useSaveDriverStep } from '../../../hooks/useDriverProfile';
import { toggleValue } from '../../../lib/driver/fields';
import {
  DRIVER_SERVICE_DESCRIPTIONS,
  fieldLabel,
  isHouseholdService,
  needsPoliceCertificate,
  setupHref,
} from '../../../lib/driver/setupSteps';
import {
  servicesStepDefaults,
  servicesStepPayload,
  servicesStepSchema,
  type ServicesStepValues,
} from '../../../lib/validations/driver-setup.schema';
import { CheckboxRow, StepSection, YesNoField } from '../DriverFormFields';
import { SetupStepFrame, SetupStepGate, useSetupNavigation } from '../SetupStepFrame';

const SERVICES = Object.values(DriverService);

// Setup step 4 — services offered (kerayego-partner
// app/(driver)/driver/setup/services.tsx; at least one to be hire-ready).
// Household services need a police certificate (A60) — the step says so and
// points to the Identity step when it's missing.
export function ServicesStep() {
  return <SetupStepGate route="services">{(profile) => <ServicesStepForm profile={profile} />}</SetupStepGate>;
}

function ServicesStepForm({ profile }: { profile: DriverProfile | null }) {
  const router = useRouter();
  const { goNext } = useSetupNavigation('services');
  const saver = useSaveDriverStep(profile);

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ServicesStepValues>({
    resolver: zodResolver(servicesStepSchema),
    defaultValues: servicesStepDefaults(profile),
  });

  const onSubmit = (values: ServicesStepValues) => {
    if (!isDirty) {
      goNext();
      return;
    }
    saver.save(servicesStepPayload(values), goNext);
  };

  const services = useWatch({ control, name: 'services' });
  const missingCertificate = needsPoliceCertificate(services) && !profile?.readiness?.householdAllowed;

  return (
    <SetupStepFrame
      route="services"
      profile={profile}
      onSubmit={handleSubmit(onSubmit)}
      isSaving={saver.isSaving}
      error={saver.error}
      isDirty={isDirty}
      intro="What customers can hire you for. Choose at least one to be hire-ready."
      confirm={saver.confirm}
      onConfirmSave={saver.confirmSave}
      onCancelConfirm={saver.cancelConfirm}
    >
      <StepSection title={fieldLabel('Services', 'hire')}>
        <Controller
          control={control}
          name="services"
          render={({ field }) => (
            <div className="grid gap-4 md:grid-cols-2">
              {SERVICES.map((service) => (
                <CheckboxRow
                  key={service}
                  label={DRIVER_SERVICE_LABELS[service]}
                  description={
                    isHouseholdService(service)
                      ? `${DRIVER_SERVICE_DESCRIPTIONS[service]} Needs a police certificate.`
                      : DRIVER_SERVICE_DESCRIPTIONS[service]
                  }
                  checked={field.value.includes(service)}
                  onToggle={() => field.onChange(toggleValue(field.value, service))}
                />
              ))}
            </div>
          )}
        />
      </StepSection>

      {missingCertificate ? (
        <section className="rounded-card border border-status-amber-border bg-status-amber-bg p-5 text-status-amber-fg">
          <p className="text-sm font-semibold">Police certificate needed</p>
          <p className="mt-1 text-[13px] leading-relaxed">
            Household services (personal/family, monthly, school runs, night-time) need a police character certificate.
            Add it under Identity and documents{isDirty ? ' after saving this step.' : '.'}
          </p>
          {isDirty ? null : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => router.push(setupHref('identity'))}
            >
              Add police certificate
            </Button>
          )}
        </section>
      ) : null}

      <StepSection>
        <Controller
          control={control}
          name="uniformAvailable"
          render={({ field }) => (
            <YesNoField
              label={fieldLabel(
                'Do you have a uniform?',
                services.includes(DriverService.CORPORATE) ? 'hire' : 'optional',
              )}
              value={field.value}
              onChange={field.onChange}
              helper="Needed for corporate / executive work; optional otherwise."
            />
          )}
        />
      </StepSection>
    </SetupStepFrame>
  );
}
