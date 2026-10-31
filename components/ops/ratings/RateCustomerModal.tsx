'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button, Modal, RatingStars, Textarea } from '../../ui';
import { apiErrorMessage } from '../../../lib/ops/apiError';
import { formatDate } from '../../../lib/ops/bookingDisplay';
import {
  RATE_CUSTOMER_DEFAULTS,
  RATING_COMMENT_MAX_LENGTH,
  rateCustomerSchema,
  rateCustomerSubtitle,
  starLabel,
  type RateableBooking,
  type RateCustomerFormValues,
} from '../../../lib/ops/ratings';
import { useRateCustomer } from '../../../hooks/useBusinessRatings';

interface RateCustomerModalProps {
  booking: RateableBooking;
  onClose: () => void;
}

// The business admin privately rates a completed rental's customer: 1–5 stars
// and an optional comment → POST /reviews. Ported from the KerayeGo Partner
// app's RateCustomerSheet. ×, a click outside and "Later" all just close it;
// after a rating it thanks the person (the rental has already dropped off
// every list). Mount it only while open, keyed by the booking.
export function RateCustomerModal({ booking, onClose }: RateCustomerModalProps) {
  const rateCustomer = useRateCustomer();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rated, setRated] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RateCustomerFormValues>({
    resolver: zodResolver(rateCustomerSchema),
    defaultValues: RATE_CUSTOMER_DEFAULTS,
  });

  const subtitle = rateCustomerSubtitle(booking, booking.updatedAt ? formatDate(booking.updatedAt) : '');
  const close = () => {
    if (!rateCustomer.isPending) onClose();
  };

  const onSubmit = async (values: RateCustomerFormValues) => {
    setSubmitError(null);
    try {
      await rateCustomer.mutateAsync({ booking, values });
      setRated(true);
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  };

  if (rated) {
    return (
      <Modal open onOpenChange={(open) => !open && onClose()} title="Thank you" description={subtitle}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="text-sm text-ink">
            Your rating of {booking.user.name} is saved. It stays private: only KerayeGo sees it.
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  const comment = watch('comment') ?? '';

  return (
    <Modal
      open
      onOpenChange={(open) => !open && close()}
      title="Rate your customer"
      description={subtitle}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={rateCustomer.isPending}>
            Later
          </Button>
          <Button loading={rateCustomer.isPending} onClick={handleSubmit(onSubmit)}>
            Submit rating
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2 rounded-control bg-page p-3 text-sm text-text-muted">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Private: the customer never sees this rating. Only KerayeGo sees it, and it is never shown on any profile.</p>
        </div>

        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div>
              <p className="mb-2 text-[13px] font-semibold text-slate-700">How was {booking.user.name}?</p>
              <div className="flex items-center gap-3">
                <RatingStars value={field.value} onChange={field.onChange} size="lg" />
                <span className="text-sm text-text-muted">{starLabel(field.value)}</span>
              </div>
              {errors.rating ? <p className="mt-1.5 text-[13px] text-red-700">{errors.rating.message}</p> : null}
            </div>
          )}
        />

        <Textarea
          label="Comment (optional)"
          rows={3}
          maxLength={RATING_COMMENT_MAX_LENGTH}
          placeholder="Anything KerayeGo should know about this customer"
          error={errors.comment?.message}
          helper={`${comment.length}/${RATING_COMMENT_MAX_LENGTH}`}
          {...register('comment')}
        />

        {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
      </div>
    </Modal>
  );
}
