'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input, Textarea } from '../../ui';
import { formatCnicInput } from '../../../lib/validations/cnic.schema';
import {
  BUSINESS_DESCRIPTION_MAX,
  BUSINESS_NAME_MAX,
  CNIC_EXAMPLE,
  CNIC_MAX_LENGTH,
  type BusinessDetailsFormValues,
} from '../../../lib/validations/business.schema';

// The business name, description and owner's CNIC inputs, shared by the
// create form and the edit form — kerayego-partner
// features/business/components/BusinessDetailsFields.tsx. Both are the
// business admin's only (can('editBusinessProfile')), so a manager never sees
// the CNIC. It's masked 12345-1234567-1 while typing.
export function BusinessDetailsFields({ form }: { form: UseFormReturn<BusinessDetailsFormValues> }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const description = watch('businessDescription') ?? '';

  return (
    <>
      <Input
        label="Business name"
        required
        placeholder="Al Rashid Auto Rentals"
        maxLength={BUSINESS_NAME_MAX}
        error={errors.businessName?.message}
        {...register('businessName')}
      />
      <Textarea
        label="Description (optional)"
        placeholder="Tell customers about your cars, your drivers and the areas you serve."
        rows={5}
        maxLength={BUSINESS_DESCRIPTION_MAX}
        error={errors.businessDescription?.message}
        helper={`${description.length}/${BUSINESS_DESCRIPTION_MAX}`}
        {...register('businessDescription')}
      />
      <Input
        label="Owner's CNIC number"
        required
        inputMode="numeric"
        autoComplete="off"
        placeholder={CNIC_EXAMPLE}
        maxLength={CNIC_MAX_LENGTH}
        className="font-mono"
        error={errors.ownerCnicNumber?.message}
        helper="Only KerayeGo sees this. It's used to verify the business owner."
        {...register('ownerCnicNumber', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setValue('ownerCnicNumber', formatCnicInput(e.target.value), { shouldDirty: true }),
        })}
      />
    </>
  );
}
