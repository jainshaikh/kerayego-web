'use client';

import { useState } from 'react';
import { useUpdateTripInquiryStatus } from '../../hooks/useTripInquiries';
import type { TripInquiry } from '../../lib/api/trip-inquiries.api';
import { Button, Modal, Textarea } from '../ui';

// Mirrors the backend's SEAT_CANCEL_BLOCKED_TRIP_STATUSES + its "already
// departed" check in TripInquiriesService.updateStatus: a poster can cancel a
// confirmed (ACCEPTED) seat only before departure, on a trip that isn't
// completed/cancelled/suspended. The backend re-checks and its message is
// toasted if this ever disagrees.
export function canPosterCancelSeat(inquiry: Pick<TripInquiry, 'status' | 'trip'>): boolean {
  if (inquiry.status !== 'ACCEPTED') return false;
  if (['COMPLETED', 'CANCELLED', 'SUSPENDED'].includes(inquiry.trip.status)) return false;
  return new Date(inquiry.trip.departureAt).getTime() > Date.now();
}

// A49: a trip with any pending or booked seat can't be cancelled, so the poster
// cancels each confirmed seat first. PATCH /trip-inquiries/:id/status with
// newStatus CANCELLED; `note` (max 500) is stored as the reason the rider sees.
export function CancelSeatModal({
  inquiry,
  onClose,
}: {
  inquiry: Pick<TripInquiry, 'id' | 'requestedSeats' | 'user'> | null;
  onClose: () => void;
}) {
  const updateStatus = useUpdateTripInquiryStatus();
  const [note, setNote] = useState('');

  const close = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal
      open={!!inquiry}
      onOpenChange={(open) => !open && close()}
      title="Cancel this booked seat?"
      description={
        inquiry
          ? `${inquiry.user.name}'s ${inquiry.requestedSeats} seat${
              inquiry.requestedSeats !== 1 ? 's' : ''
            } will be cancelled and the rider told. This can't be undone.`
          : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} className="flex-1">
            Keep seat
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={updateStatus.isPending}
            onClick={async () => {
              if (!inquiry) return;
              try {
                await updateStatus.mutateAsync({
                  id: inquiry.id,
                  data: { newStatus: 'CANCELLED', note: note.trim() || undefined },
                });
              } catch {
                return; // the hook already toasts the backend's message
              }
              close();
            }}
          >
            Cancel seat
          </Button>
        </>
      }
    >
      <Textarea
        rows={3}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional reason for the rider…"
        className="resize-none"
      />
    </Modal>
  );
}
