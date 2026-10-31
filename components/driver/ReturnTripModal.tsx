'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Modal } from '../ui';
import { StatusBadge } from '../common/StatusBadge';
import type { ReturnTripTemplate } from '../../types/driver.types';
import { useCreateReturnTrip, useReturnTripTemplate } from '../../hooks/useDriverJobs';
import { useDriverActionError } from '../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import { formatDateTime } from '../../lib/driver/fields';

// "Post a return trip" for a finished one-way job — the web twin of
// kerayego-partner's features/driver/ReturnTripSheet.tsx (A28, A48): GET
// /driver/jobs/:bookingId/return-trip-template pre-fills the route, car and
// departure; the driver sets their own seat price (no suggested price, A28),
// seats, points, contact number and notes; POST /trips publishes it. A 403
// IDENTITY_ON_HOLD shows the hold message.
export function ReturnTripModal({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
  const templateQuery = useReturnTripTemplate(bookingId);
  const open = bookingId !== null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Post Return Trip"
      description="Fill return leg seats with carpool passengers"
      className="max-w-lg"
    >
      {templateQuery.isPending ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
        </div>
      ) : templateQuery.isError ? (
        <div className="space-y-3 py-2 text-center">
          <p className="text-sm text-red-700">
            {getApiErrorMessage(templateQuery.error, 'Could not load the return trip.')}
          </p>
          <Button variant="secondary" onClick={() => void templateQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : templateQuery.data ? (
        <ReturnTripForm key={templateQuery.data.bookingId} template={templateQuery.data} onClose={onClose} />
      ) : null}
    </Modal>
  );
}

function ReturnTripForm({ template, onClose }: { template: ReturnTripTemplate; onClose: () => void }) {
  const createTrip = useCreateReturnTrip();
  const showActionError = useDriverActionError();

  const [pricePerSeat, setPricePerSeat] = useState('');
  const [availableSeats, setAvailableSeats] = useState(String(template.availableSeats));
  const [pickupPoint, setPickupPoint] = useState(template.pickupPoint || '');
  const [dropoffPoint, setDropoffPoint] = useState(template.dropoffPoint || '');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('Return carpool leg — air conditioned');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const price = Number(pricePerSeat);
    if (!price || price <= 0) {
      setError('Please enter a valid price per seat');
      return;
    }
    const seats = Number(availableSeats);
    if (!seats || seats <= 0) {
      setError('Please enter at least 1 available seat');
      return;
    }
    if (!contactNumber.trim()) {
      setError('Contact phone number is required for passengers to reach you');
      return;
    }
    setError(null);

    createTrip.mutate(
      {
        fleetVehicleId: template.fleetVehicleId,
        returnFromBookingId: template.bookingId,
        originCity: template.originCity,
        destinationCity: template.destinationCity,
        pickupPoint: pickupPoint.trim() || undefined,
        dropoffPoint: dropoffPoint.trim() || undefined,
        departureAt: template.suggestedDeparture,
        availableSeats: seats,
        pricePerSeat: price,
        contactNumber: contactNumber.trim(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Return trip is live!', {
            description:
              'Your return carpool trip has been published. Passengers searching for this route can now book seats.',
          });
          onClose();
        },
        // POST /trips is refused with 403 IDENTITY_ON_HOLD while the account is being checked.
        onError: (err) => showActionError(err, 'Could not post return trip'),
      },
    );
  };

  return (
    <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
      <div className="space-y-1 rounded-card bg-surface-hover p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold capitalize text-ink">
            {template.originCity} → {template.destinationCity}
          </p>
          <StatusBadge status="CARPOOL" label="Carpool seats" size="sm" />
        </div>
        <p className="text-[13px] text-text-muted">
          Vehicle: {template.vehicle.title} ({template.vehicle.year}) • Max capacity: {template.vehicle.seatingCapacity}
        </p>
        <p className="text-[13px] text-text-muted">Business: {template.providerProfile.businessName}</p>
        <p className="text-[13px] text-text-muted">Planned departure: {formatDateTime(template.suggestedDeparture)}</p>
      </div>

      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Price per seat (PKR)"
          placeholder="e.g. 1500"
          inputMode="numeric"
          value={pricePerSeat}
          onChange={(e) => {
            setPricePerSeat(e.target.value);
            if (error) setError(null);
          }}
          helper="You set the seat price based on ground conditions"
        />
        <Input
          label="Available seats"
          placeholder="e.g. 3"
          inputMode="numeric"
          value={availableSeats}
          onChange={(e) => setAvailableSeats(e.target.value)}
          helper={`Up to ${Math.max(1, template.vehicle.seatingCapacity - 1)} passenger seats`}
        />
      </div>
      <Input
        label="Pickup point"
        placeholder="e.g. Clifton Block 2 / Near Total Petrol"
        value={pickupPoint}
        onChange={(e) => setPickupPoint(e.target.value)}
      />
      <Input
        label="Dropoff point"
        placeholder="e.g. Hyderabad Saddar Station"
        value={dropoffPoint}
        onChange={(e) => setDropoffPoint(e.target.value)}
      />
      <Input
        label="Driver contact number"
        placeholder="+92 300 1234567"
        type="tel"
        value={contactNumber}
        onChange={(e) => {
          setContactNumber(e.target.value);
          if (error) setError(null);
        }}
        helper="Shown to riders after they book seats"
      />
      <Input
        label="Trip notes / preferences (optional)"
        placeholder="e.g. AC car, leaving on time, no smoking"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex justify-end gap-2.5 pt-1">
        <Button variant="secondary" disabled={createTrip.isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button loading={createTrip.isPending} onClick={submit}>
          Publish return trip
        </Button>
      </div>
    </div>
  );
}
