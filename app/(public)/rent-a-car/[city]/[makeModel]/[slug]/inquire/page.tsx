'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Image as ImageIcon, Minus, Plus } from 'lucide-react';
import { useAuth } from '../../../../../../../hooks/useAuth';
import { useCreateBooking } from '../../../../../../../hooks/useBookings';
import { getApiErrorMessage } from '../../../../../../../hooks/useAccountDeletion';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../../../../../../../lib/api/listings.api';
import { getCurrencyCode } from '../../../../../../../lib/utils/currency';
import { getAvailableDurations, getUnitPrice, computeReturnDate } from '../../../../../../../lib/utils/rentalDuration';
import {
  createBookingSchema,
  type CreateBookingFormValues,
} from '../../../../../../../lib/validations/booking.schema';
import { Button, Card, Input, Textarea } from '../../../../../../../components/ui';
import { cn } from '../../../../../../../lib/utils/cn';
import { trackEvent } from '../../../../../../../lib/utils/analytics';

export default function InquirePage() {
  const params = useParams<{ city: string; makeModel: string; slug: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const createBooking = useCreateBooking();
  const [submitted, setSubmitted] = useState(false);

  const { data: vehicleRes, isLoading: vehicleLoading } = useQuery({
    queryKey: ['listing', params.slug],
    queryFn: () => listingsApi.getBySlug(params.slug),
  });
  const vehicle = vehicleRes;
  const trackedBegin = useRef(false);

  useEffect(() => {
    if (trackedBegin.current || !vehicle?.id) return;
    trackedBegin.current = true;
    trackEvent('begin_booking', { vehicle_id: vehicle.id });
  }, [vehicle?.id]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: { vehicleId: '', durationType: 'DAY', durationQuantity: 1 },
  });

  useEffect(() => {
    if (vehicle?.id) setValue('vehicleId', vehicle.id);
  }, [vehicle?.id, setValue]);

  // Redirect unauthenticated users to login
  if (!authLoading && !user) {
    router.replace(`/login?redirect=/rent-a-car/${params.city}/${params.makeModel}/${params.slug}/inquire`);
    return null;
  }

  if (authLoading || vehicleLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">Vehicle not found.</p>
        <Link href="/rent-a-car" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Browse all vehicles
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: CreateBookingFormValues) => {
    const result = await createBooking.mutateAsync({
      vehicleId: values.vehicleId,
      requestedFromDate: values.requestedFromDate,
      durationType: values.durationType,
      durationQuantity: values.durationQuantity,
      pickupLocation: values.pickupLocation || undefined,
      message: values.message || undefined,
    });
    if (result) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-status-emerald-bg">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-ink">Inquiry sent!</h1>
        <p className="mb-6 text-text-muted">
          The provider for <strong className="font-semibold text-ink">{vehicle.title}</strong> has
          been notified and will be in touch with you soon.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/inquiries">
            <Button variant="primary">View my inquiries</Button>
          </Link>
          <Link href="/rent-a-car">
            <Button variant="secondary">Browse more vehicles</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currency = getCurrencyCode(vehicle.showroom?.country);
  const availableDurations = getAvailableDurations(vehicle);
  const durationType = watch('durationType');
  const durationQuantity = watch('durationQuantity') || 1;
  const unitPrice = getUnitPrice(vehicle, durationType);
  const total = unitPrice !== null ? unitPrice * durationQuantity : null;
  const fromDateValue = watch('requestedFromDate');
  const previewReturnDate =
    fromDateValue && unitPrice !== null
      ? computeReturnDate(new Date(fromDateValue), durationType, durationQuantity)
      : null;

  const decrementQty = () =>
    setValue('durationQuantity', Math.max(1, durationQuantity - 1), { shouldValidate: true });
  const incrementQty = () =>
    setValue('durationQuantity', durationQuantity + 1, { shouldValidate: true });

  // datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time, not UTC —
  // toISOString() would shift by the timezone offset and let past times through.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/rent-a-car" className="hover:text-slate-700">
          Rent a Car
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link
          href={`/rent-a-car/${params.city}/${params.makeModel}/${params.slug}`}
          className="max-w-[160px] truncate hover:text-slate-700"
        >
          {vehicle.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">Inquire</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
        {/* Form */}
        <div className="sm:col-span-3">
          <h1 className="mb-1 text-2xl font-bold text-ink">Send an inquiry</h1>
          <p className="mb-6 text-sm text-text-muted">
            Free to inquire — no payment until you agree terms with the provider.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <input type="hidden" {...register('vehicleId')} />

            <Input
              type="datetime-local"
              label="Pick-up date & time"
              min={today}
              error={errors.requestedFromDate?.message}
              {...register('requestedFromDate')}
            />

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                Rental duration
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {availableDurations.map((d) => {
                  const optionPrice = getUnitPrice(vehicle, d.value);
                  const active = durationType === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setValue('durationType', d.value, { shouldValidate: true })}
                      className={cn(
                        'rounded-lg border px-2 py-2.5 text-center transition-colors',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <span
                        className={cn(
                          'block text-sm font-medium',
                          active ? 'text-primary' : 'text-slate-700',
                        )}
                      >
                        {d.label}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-400">
                        {currency} {optionPrice?.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.durationType && (
                <p className="mt-1 text-xs text-destructive">{errors.durationType.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                {availableDurations.find((d) => d.value === durationType)?.label ?? 'Quantity'}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementQty}
                  disabled={durationQuantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-mono text-lg font-semibold text-ink">
                  {durationQuantity}
                </span>
                <button
                  type="button"
                  onClick={incrementQty}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Input
              label="Preferred pick-up location"
              helper="Optional"
              placeholder="e.g. showroom pickup, hotel delivery…"
              {...register('pickupLocation')}
            />

            <Textarea
              label="Message"
              helper="Optional"
              placeholder="Introduce yourself, ask about availability, special requirements…"
              error={errors.message?.message}
              {...register('message')}
            />

            {createBooking.isError && (
              <div className="rounded-control border border-status-red-border bg-status-red-bg px-4 py-3 text-sm text-status-red-fg">
                {getApiErrorMessage(createBooking.error, 'Something went wrong. Please try again.')}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isSubmitting || createBooking.isPending}
            >
              Send inquiry
            </Button>
          </form>
        </div>

        {/* Summary card */}
        <div className="sm:col-span-2">
          <Card className="sticky top-24 space-y-4">
            {/* Vehicle thumbnail */}
            <div className="aspect-[4/3] overflow-hidden rounded-control bg-surface-hover">
              {vehicle.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vehicle.images[0].url}
                  alt={vehicle.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-faint">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold text-ink">{vehicle.title}</p>
              <p className="text-sm text-text-muted">{vehicle.providerProfile.businessName}</p>
            </div>

            <div className="space-y-2 border-t border-border-subtle pt-3 text-sm">
              <div className="flex justify-between font-mono text-slate-600">
                <span>
                  {currency} {unitPrice?.toLocaleString()} ×{' '}
                  {durationQuantity}
                </span>
                {total !== null && (
                  <span className="font-semibold text-ink">
                    {currency} {total.toLocaleString()} est.
                  </span>
                )}
              </div>
              {previewReturnDate && (
                <p className="text-xs text-text-faint">
                  Return by{' '}
                  {previewReturnDate.toLocaleString('en-AE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>

            <p className="pt-1 text-xs text-text-faint">
              Estimate only — final pricing confirmed by the provider.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
