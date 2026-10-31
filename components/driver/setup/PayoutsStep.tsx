'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input, Modal } from '../../ui';
import {
  DRIVER_AGREEMENT_TYPE_LABELS,
  PAYOUT_METHOD_LABELS,
  PayoutMethod,
  type DriverAgreementType,
} from '../../../types/enums';
import type { DriverProfile } from '../../../types/driver.types';
import { useAcceptDriverAgreements, useSaveDriverStep } from '../../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { DRIVER_LIMITS, formatDate, toggleValue } from '../../../lib/driver/fields';
import { fieldLabel, PRIVATE_NOTE } from '../../../lib/driver/setupSteps';
import {
  acceptanceOf,
  accountNumberLabel,
  AGREEMENT_ORDER,
  agreementsToAccept,
  DRIVER_AGREEMENT_SUMMARIES,
  hasAcceptedCurrent,
  payoutDetailsChanged,
  payoutsStepDefaults,
  payoutsStepPayload,
  payoutsStepSchema,
  type PayoutsStepValues,
} from '../../../lib/validations/driver-setup.schema';
import { CheckboxRow, ChipGroup, StepSection } from '../DriverFormFields';
import { SetupStepFrame, SetupStepGate, useSetupNavigation } from '../SetupStepFrame';

const PAYOUT_METHOD_OPTIONS = Object.values(PayoutMethod).map((value) => ({
  value,
  label: PAYOUT_METHOD_LABELS[value],
}));

// Setup step 6 — payouts and agreements (kerayego-partner
// app/(driver)/driver/setup/payouts.tsx). Payout details are needed only
// before KerayeGo starts paying drivers (A57); the account number is
// write-only — the field starts empty, is sent only when typed, and once
// saved only its masked form is shown. The four agreements are needed to be
// rental-ready (A58): ticking new ones and saving accepts their current
// versions (POST /driver/profile/agreements); each shows its version.
export function PayoutsStep() {
  return <SetupStepGate route="payouts">{(profile) => <PayoutsStepForm profile={profile} />}</SetupStepGate>;
}

function PayoutsStepForm({ profile }: { profile: DriverProfile | null }) {
  const { goNext } = useSetupNavigation('payouts');
  const saver = useSaveDriverStep(profile);
  const acceptAgreements = useAcceptDriverAgreements();
  const [reading, setReading] = useState<DriverAgreementType | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PayoutsStepValues>({
    resolver: zodResolver(payoutsStepSchema),
    defaultValues: payoutsStepDefaults(profile),
  });

  const finish = () => {
    toast.success('Driver profile saved');
    goNext();
  };

  const onSubmit = (values: PayoutsStepValues) => {
    const toAccept = agreementsToAccept(profile, values.agreements);
    const acceptThenFinish = () => {
      if (toAccept.length === 0) {
        finish();
        return;
      }
      acceptAgreements.mutate(toAccept, {
        onSuccess: finish,
        onError: (err) => saver.setError(getApiErrorMessage(err, 'Could not accept the agreements. Please try again.')),
      });
    };
    saver.setError(null);
    if (payoutDetailsChanged(profile, values)) saver.save(payoutsStepPayload(values), acceptThenFinish);
    else acceptThenFinish();
  };

  const method = useWatch({ control, name: 'payoutMethod' });
  const masked = profile?.payoutAccountMasked;
  const readingVersion = reading ? profile?.currentAgreementVersions?.[reading] : undefined;

  return (
    <SetupStepFrame
      route="payouts"
      profile={profile}
      onSubmit={handleSubmit(onSubmit)}
      isSaving={saver.isSaving || acceptAgreements.isPending}
      error={saver.error}
      isDirty={isDirty}
      intro="Where KerayeGo will pay you, and the agreements every driver accepts."
      confirm={saver.confirm}
      onConfirmSave={saver.confirmSave}
      onCancelConfirm={saver.cancelConfirm}
    >
      <StepSection
        title="Payout account"
        description={`Needed before payouts start — customers pay you directly for now. ${PRIVATE_NOTE}`}
      >
        <Controller
          control={control}
          name="payoutMethod"
          render={({ field }) => (
            <ChipGroup
              label={fieldLabel('Payout method', 'payout')}
              options={PAYOUT_METHOD_OPTIONS}
              isSelected={(value) => value === field.value}
              onPress={(value) => field.onChange(value === field.value ? null : value)}
            />
          )}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label={fieldLabel('Account title', 'payout')}
            placeholder="Name on the account"
            maxLength={DRIVER_LIMITS.payoutAccountTitle}
            error={errors.payoutAccountTitle?.message}
            {...register('payoutAccountTitle')}
          />
          <Input
            label={fieldLabel(accountNumberLabel(method), 'payout')}
            placeholder={masked ? `Saved: ${masked}` : 'PK36SCBL0000001123456702'}
            autoComplete="off"
            spellCheck={false}
            className="uppercase"
            maxLength={DRIVER_LIMITS.payoutAccountNumber}
            error={errors.payoutAccountNumber?.message}
            helper={
              masked
                ? `Saved as ${masked}. Type a new one only to change it.`
                : 'Never shown in full after saving.'
            }
            {...register('payoutAccountNumber')}
          />
        </div>
      </StepSection>

      <StepSection
        title="Agreements *"
        description="All four are needed to be rental-ready. Tick each one you accept, then save."
      >
        <Controller
          control={control}
          name="agreements"
          render={({ field }) => (
            <div className="space-y-4">
              {AGREEMENT_ORDER.map((type) => {
                const accepted = hasAcceptedCurrent(profile, type);
                const previous = acceptanceOf(profile, type);
                const version = profile?.currentAgreementVersions?.[type];
                const note = accepted
                  ? ` Accepted ${formatDate(previous?.acceptedAt)} (version ${previous?.version}).`
                  : previous
                    ? ` Updated since you accepted it — please accept again${version ? ` (version ${version})` : ''}.`
                    : version
                      ? ` Version ${version}.`
                      : '';
                return (
                  <CheckboxRow
                    key={type}
                    label={DRIVER_AGREEMENT_TYPE_LABELS[type]}
                    description={`${DRIVER_AGREEMENT_SUMMARIES[type]}${note}`}
                    checked={field.value.includes(type)}
                    disabled={accepted}
                    onToggle={() => field.onChange(toggleValue(field.value, type))}
                    accessory={
                      <button
                        type="button"
                        onClick={() => setReading(type)}
                        aria-label={`Read the ${DRIVER_AGREEMENT_TYPE_LABELS[type].toLowerCase()}`}
                        className="flex-shrink-0 py-0.5 text-sm font-semibold text-brand-700 hover:underline"
                      >
                        Read
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        />
      </StepSection>

      <Modal
        open={reading !== null}
        onOpenChange={(open) => {
          if (!open) setReading(null);
        }}
        title={reading ? DRIVER_AGREEMENT_TYPE_LABELS[reading] : ''}
        description={readingVersion ? `Version ${readingVersion}` : undefined}
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink">{reading ? DRIVER_AGREEMENT_SUMMARIES[reading] : ''}</p>
          {/* TODO(driver-agreements): the full text, once KerayeGo has written it (same as the Partner app). */}
          <p className="text-[13px] text-text-muted">
            The full text will be shown here before KerayeGo launches driver hire.
          </p>
        </div>
      </Modal>
    </SetupStepFrame>
  );
}
