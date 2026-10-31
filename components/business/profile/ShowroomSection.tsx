'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, MapPin, MessageCircle, Phone, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, EmptyState, Input, Modal, SegmentedTabs } from '../../ui';
import { MapLocationPicker } from '../../maps/MapLocationPicker';
import { useCreateShowroom, useDeleteShowroom, useUpdateShowroom } from '../../../hooks/useProviderProfile';
import { getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { MARKETS } from '../../../lib/config/markets';
import type { Market, Showroom } from '../../../types/api.types';
import {
  SHOWROOM_LIMITS,
  showroomFormSchema,
  type ShowroomFormValues,
} from '../../../lib/validations/business.schema';
import {
  MARKET_FORM_EXAMPLES,
  SHOWROOM_MARKET_OPTIONS,
  buildCreatePayload,
  buildUpdatePayload,
  canAddShowroom,
  deleteShowroomWarning,
  describeMarket,
  emptyShowroomForm,
  formValuesFromShowroom,
  marketChangeWarning,
  titleCase,
} from '../../../lib/business/showroomPayload';

// The business's showroom(s) — kerayego-partner app/(business)/business/
// showrooms (list, new, [id]). Business admin only (can('manageShowrooms')).
// The backend allows one showroom per business, so "Add" only shows without
// one. The address field is the web's map location picker (Places search,
// click or drag the pin), which sets the showroom's map pin.
export function ShowroomSection({ showrooms }: { showrooms: Showroom[] }) {
  const [editing, setEditing] = useState<Showroom | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Showroom | null>(null);
  const deleteShowroom = useDeleteShowroom();

  if (editing) {
    return (
      <ShowroomForm
        key={editing === 'new' ? 'new' : editing.id}
        showroom={editing === 'new' ? null : editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  const confirmDelete = () => {
    if (!deleting) return;
    deleteShowroom.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Showroom deleted');
        setDeleting(null);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Could not delete showroom'));
        setDeleting(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {showrooms.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No showrooms added"
          description="You need a showroom: it's where your business and cars are based. Every rental comes with your driver."
          action={{ label: 'Add showroom', onClick: () => setEditing('new') }}
        />
      ) : (
        showrooms.map((showroom) => {
          const market = MARKETS[showroom.country];
          return (
            <Card key={showroom.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{showroom.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {titleCase(showroom.city)}
                    {showroom.area ? `, ${showroom.area}` : ''} · {market?.label ?? showroom.country}
                  </p>
                </div>
              </div>
              <p className="flex items-start gap-1.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
                {showroom.address}
              </p>
              <div className="space-y-1 text-sm text-slate-700">
                <p className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-text-faint" />
                  {showroom.contactNumber}
                </p>
                {showroom.whatsappNumber ? (
                  <p className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    {showroom.whatsappNumber}
                  </p>
                ) : null}
                {showroom.mapLat === null || showroom.mapLng === null ? (
                  <p className="text-xs text-text-muted">No map pin yet — edit the showroom to set it.</p>
                ) : null}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => setEditing(showroom)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setDeleting(showroom)}>
                  Delete
                </Button>
              </div>
            </Card>
          );
        })
      )}

      {showrooms.length > 0 && canAddShowroom(showrooms.length) ? (
        <Button variant="secondary" onClick={() => setEditing('new')}>
          Add showroom
        </Button>
      ) : null}

      <Modal
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteShowroom.isPending) setDeleting(null);
        }}
        title="Delete showroom?"
        description={deleting ? deleteShowroomWarning(deleting) : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={deleteShowroom.isPending}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteShowroom.isPending} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function ShowroomForm({ showroom, onDone }: { showroom: Showroom | null; onDone: () => void }) {
  const createShowroom = useCreateShowroom();
  const updateShowroom = useUpdateShowroom();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ShowroomFormValues>({
    resolver: zodResolver(showroomFormSchema),
    defaultValues: showroom ? formValuesFromShowroom(showroom) : emptyShowroomForm(),
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const country = watch('country');
  const examples = MARKET_FORM_EXAMPLES[country] ?? MARKET_FORM_EXAMPLES[SHOWROOM_MARKET_OPTIONS[0].value];
  const marketWarning = showroom ? marketChangeWarning(showroom.country, country) : null;
  const busy = createShowroom.isPending || updateShowroom.isPending;

  const onSubmit = (values: ShowroomFormValues) => {
    setSubmitError(null);
    const onError = (err: unknown) => setSubmitError(getApiErrorMessage(err, 'Could not save the showroom'));
    if (!showroom) {
      createShowroom.mutate(buildCreatePayload(values), {
        onSuccess: () => {
          toast.success('Showroom added. Your showroom location has been saved.');
          onDone();
        },
        onError,
      });
      return;
    }
    const payload = buildUpdatePayload(showroom, values);
    if (Object.keys(payload).length === 0) {
      onDone();
      return;
    }
    updateShowroom.mutate(
      { showroomId: showroom.id, data: payload },
      {
        onSuccess: () => {
          toast.success('Showroom details updated');
          onDone();
        },
        onError,
      },
    );
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">{showroom ? 'Edit showroom' : 'Add showroom'}</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-slate-700">Market</p>
          <SegmentedTabs
            options={SHOWROOM_MARKET_OPTIONS}
            value={country}
            onChange={(value) =>
              setValue('country', value as Market, { shouldValidate: true, shouldDirty: true })
            }
          />
          <p className="mt-1.5 text-xs text-text-muted">{describeMarket(country)}</p>
        </div>

        {marketWarning ? (
          <p className="flex items-start gap-2 rounded-control border border-status-amber-border bg-status-amber-bg px-3 py-2 text-xs text-status-amber-fg">
            <AlertTriangle className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            {marketWarning}
          </p>
        ) : null}

        <Input
          label="Showroom name"
          required
          placeholder="Main Branch"
          maxLength={SHOWROOM_LIMITS.name}
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-700">
            Full address <span className="text-red-600">*</span>
          </label>
          <MapLocationPicker
            addressValue={watch('address') ?? ''}
            onAddressChange={(text) => setValue('address', text, { shouldValidate: true, shouldDirty: true })}
            lat={watch('mapLat')}
            lng={watch('mapLng')}
            onLocationChange={(lat, lng) => {
              setValue('mapLat', lat, { shouldDirty: true });
              setValue('mapLng', lng, { shouldDirty: true });
            }}
            placeholder="Shop 4, Al-Madina Center, Main Boulevard"
            inputClassName="w-full rounded-control border border-border-strong bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          {errors.address?.message ? (
            <p className="mt-[7px] text-[13px] text-red-700">{errors.address.message}</p>
          ) : (
            <p className="mt-[7px] text-[13px] text-text-faint">
              Search for the address, then click the map or drag the pin to the exact spot.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            required
            placeholder={examples.city}
            maxLength={SHOWROOM_LIMITS.city}
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label="Area (optional)"
            placeholder={examples.area}
            maxLength={SHOWROOM_LIMITS.area}
            error={errors.area?.message}
            {...register('area')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact phone number"
            required
            type="tel"
            placeholder={examples.phone}
            maxLength={SHOWROOM_LIMITS.phone}
            error={errors.contactNumber?.message}
            {...register('contactNumber')}
          />
          <Input
            label="WhatsApp number (optional)"
            type="tel"
            placeholder={examples.phone}
            maxLength={SHOWROOM_LIMITS.phone}
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
        </div>

        {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

        <Button type="submit" loading={busy} disabled={showroom ? !isDirty : false}>
          {showroom ? 'Save changes' : 'Save showroom'}
        </Button>
      </form>
    </Card>
  );
}
