'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';
import { Button, Modal, buttonVariants } from '../../ui';
import { ConfirmModal } from '../ConfirmModal';
import { StatusBadge } from '../../common/StatusBadge';
import { callUrl, DRIVER_JOB_STATUS_META } from '../../../lib/ops/bookingDisplay';
import {
  assignedDriverSummary,
  driverActions,
  driverAssignmentErrorMessage,
  hasDriver,
  needsDriver,
} from '../../../lib/ops/driverAssignment';
import { useSetBookingDriver } from '../../../hooks/useBookingRequests';
import type { BookingRequest } from '../../../types/booking-requests.types';
import { DriverAvatar, Notice, SectionCard } from './BookingBits';
import { DriverPickerList } from './DriverPickerList';

interface DriverCardProps {
  booking: BookingRequest;
  /** useWorkspace().can('manageBookings') — business admin and manager (A52). */
  canManage: boolean;
  /** "Invite a driver" from the picker. Left out when this dashboard can't invite drivers. */
  onInviteDriver?: () => void;
}

// The booking's driver (A7, A38), ported from the KerayeGo Partner app's
// DriverCard: who it is, their answer (Waiting for driver / Accepted), Call —
// and, while the booking is ACCEPTED and not started, Assign / Change / Remove
// (PATCH /booking-requests/:id/driver). An accepted booking without a driver
// shows "Needs a driver". Nothing is shown before a request is accepted.
export function DriverCard({ booking, canManage, onInviteDriver }: DriverCardProps) {
  const setDriver = useSetBookingDriver(booking.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [savingDriverId, setSavingDriverId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const driver = hasDriver(booking) ? assignedDriverSummary(booking) : null;
  const actions = driverActions(booking, canManage);
  const missing = needsDriver(booking);
  if (!driver && !missing) return null;

  const openPicker = () => {
    setPickerError(null);
    setPickerOpen(true);
  };

  const pick = async (driverId: string) => {
    setPickerError(null);
    setSavingDriverId(driverId);
    try {
      await setDriver.mutateAsync(driverId);
      setPickerOpen(false);
    } catch (error) {
      setPickerError(driverAssignmentErrorMessage(error));
    } finally {
      setSavingDriverId(null);
    }
  };

  const remove = async () => {
    setRemoveError(null);
    try {
      await setDriver.mutateAsync(null);
      setConfirmRemove(false);
    } catch (error) {
      setConfirmRemove(false);
      setRemoveError(driverAssignmentErrorMessage(error));
    }
  };

  const tel = callUrl(driver?.phone);
  const answer = booking.driverJobStatus ? DRIVER_JOB_STATUS_META[booking.driverJobStatus] : null;

  return (
    <SectionCard title="Driver">
      {driver ? (
        <div className="flex items-center gap-3">
          <DriverAvatar uri={driver.avatarUrl} name={driver.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{driver.name}</p>
            {answer ? <StatusBadge status={answer.badge} size="sm" label={answer.label} className="mt-1" /> : null}
          </div>
        </div>
      ) : (
        <Notice tone="warning" title="Needs a driver">
          This booking is accepted but no driver has it yet. Assign one before the pickup.
        </Notice>
      )}

      {tel || actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tel ? (
            <a href={tel} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          ) : null}
          {actions.includes('assign') ? (
            <Button size="sm" onClick={openPicker}>
              Assign driver
            </Button>
          ) : null}
          {actions.includes('change') ? (
            <Button size="sm" variant="secondary" onClick={openPicker} disabled={setDriver.isPending}>
              Change
            </Button>
          ) : null}
          {actions.includes('remove') ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmRemove(true)}
              loading={setDriver.isPending && savingDriverId === null}
              aria-label="Remove driver"
            >
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}

      {removeError ? <p className="text-sm text-red-700">{removeError}</p> : null}

      {driver && booking.driverJobStatus === 'PENDING' && actions.length > 0 ? (
        <p className="text-xs text-text-muted">
          {driver.name} has been asked to accept this job. Their answer shows here once they reply.
        </p>
      ) : null}

      <Modal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={driver ? 'Change driver' : 'Assign a driver'}
        description={booking.vehicle.title}
        className="max-w-lg"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <DriverPickerList
            bookingId={booking.id}
            active={pickerOpen}
            currentDriverId={driver?.id ?? null}
            onSelect={(picked) => void pick(picked.userId)}
            savingDriverId={savingDriverId}
            error={pickerError}
            onInviteDriver={
              onInviteDriver
                ? () => {
                    setPickerOpen(false);
                    onInviteDriver();
                  }
                : undefined
            }
          />
        </div>
      </Modal>

      <ConfirmModal
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove driver?"
        description={`${driver?.name ?? 'The driver'} will no longer have this job. The booking will need another driver.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        destructive
        loading={setDriver.isPending}
        onConfirm={() => void remove()}
      />
    </SectionCard>
  );
}
