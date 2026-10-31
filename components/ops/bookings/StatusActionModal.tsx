'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, Modal, Textarea } from '../../ui';
import { licenceExpiryLabel } from '../../../lib/ops/driverAssignment';
import type { BusinessBookingAction } from '../../../lib/ops/bookingDisplay';
import {
  NOTE_MAX_LENGTH,
  statusActionCopy,
  statusNoteSchema,
  statusUpdateErrorMessage,
  statusUpdatePayload,
  type StatusNoteFormValues,
} from '../../../lib/ops/statusAction';
import { useUpdateBookingRequestStatus } from '../../../hooks/useBookingRequests';
import type { BookingRequest, BookingStatus, EligibleDriver } from '../../../types/booking-requests.types';
import { DriverAvatar } from './BookingBits';
import { DriverPickerList } from './DriverPickerList';

const SUCCESS_TOAST: Partial<Record<BookingStatus, string>> = {
  CONTACTED: 'Marked as contacted',
  ACCEPTED: 'Request accepted',
  REJECTED: 'Request declined',
  IN_PROGRESS: 'Trip started',
  COMPLETED: 'Trip completed',
};

interface StatusActionModalProps {
  booking: BookingRequest;
  /** The move to confirm; null keeps it closed. */
  action: BusinessBookingAction | null;
  onClose: () => void;
  /** "Invite a driver" from the driver step. Left out when this dashboard can't invite drivers. */
  onInviteDriver?: () => void;
}

// Confirms a status move with an optional note for the customer, ported from
// the KerayeGo Partner app's StatusActionSheet. Every move is final, so this is
// the confirmation step. Accepting also asks for the driver (A7, A38):
// "Choose a driver" swaps the body for the driver picker (one modal, never a
// modal over a modal); the pick is sent as assignedDriverId with the move to
// ACCEPTED. "Assign later" sends none — the booking then shows "Needs a driver".
export function StatusActionModal({ booking, action, onClose, onInviteDriver }: StatusActionModalProps) {
  const updateStatus = useUpdateBookingRequestStatus(booking.id);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<'confirm' | 'pickDriver'>('confirm');
  const [driver, setDriver] = useState<EligibleDriver | null>(null);
  const open = !!action;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StatusNoteFormValues>({
    resolver: zodResolver(statusNoteSchema),
    defaultValues: { note: '' },
  });

  // A fresh form (no driver, first step) each time it opens.
  useEffect(() => {
    if (open) {
      reset({ note: '' });
      setSubmitError(null);
      setStep('confirm');
      setDriver(null);
    }
  }, [open, reset]);

  if (!action) return null;
  const copy = statusActionCopy(action.status);
  const accepting = action.status === 'ACCEPTED';
  const noteLength = watch('note')?.length ?? 0;

  const close = () => {
    if (!updateStatus.isPending) onClose();
  };

  const onSubmit = async (values: StatusNoteFormValues) => {
    setSubmitError(null);
    const driverId = accepting ? (driver?.userId ?? null) : null;
    try {
      await updateStatus.mutateAsync(statusUpdatePayload(action.status, values.note, driverId));
      toast.success(SUCCESS_TOAST[action.status] ?? 'Request updated');
      onClose();
    } catch (error) {
      setSubmitError(statusUpdateErrorMessage(error, { withDriver: !!driverId }));
    }
  };

  if (step === 'pickDriver') {
    return (
      <Modal
        open={open}
        onOpenChange={(next) => !next && close()}
        title="Choose a driver"
        description={booking.vehicle.title}
        className="max-w-lg"
        footer={
          <Button variant="secondary" onClick={() => setStep('confirm')}>
            Back
          </Button>
        }
      >
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          <DriverPickerList
            bookingId={booking.id}
            active={open && step === 'pickDriver'}
            onSelect={(picked) => {
              setDriver(picked);
              setSubmitError(null);
              setStep('confirm');
            }}
            onInviteDriver={onInviteDriver}
          />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && close()}
      title={copy.title}
      description={`${booking.user.name} · ${booking.vehicle.title}`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={updateStatus.isPending}>
            Not now
          </Button>
          <Button
            variant={copy.destructive ? 'danger' : 'primary'}
            loading={updateStatus.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {accepting && !driver ? 'Accept, assign later' : copy.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-text-muted">{copy.explanation}</p>

        {accepting ? (
          <div className="space-y-2 rounded-control border border-border-subtle bg-page p-3">
            <p className="text-sm font-semibold text-ink">Driver</p>
            {driver ? (
              <div className="flex items-center gap-3">
                <DriverAvatar uri={driver.avatarUrl} name={driver.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{driver.name}</p>
                  <p className="text-xs text-text-muted">{licenceExpiryLabel(driver.licenseExpiry)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                Assign later — the booking will show “Needs a driver” until you pick one.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setStep('pickDriver')} disabled={updateStatus.isPending}>
                {driver ? 'Change driver' : 'Choose a driver'}
              </Button>
              {driver ? (
                <Button size="sm" variant="ghost" onClick={() => setDriver(null)} disabled={updateStatus.isPending}>
                  Assign later
                </Button>
              ) : null}
            </div>
            {driver ? <p className="text-xs text-text-muted">{driver.name} gets the job and must accept it.</p> : null}
          </div>
        ) : null}

        <Textarea
          label="Note for the customer (optional)"
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={copy.notePlaceholder}
          error={errors.note?.message}
          helper={`The customer can see this note. ${noteLength}/${NOTE_MAX_LENGTH}`}
          {...register('note')}
        />

        {submitError ? <p className="whitespace-pre-line text-sm text-red-700">{submitError}</p> : null}
      </div>
    </Modal>
  );
}
