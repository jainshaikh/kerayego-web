'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Inbox } from 'lucide-react';
import { useTripInquiryInbox, useUpdateTripInquiryStatus } from '../../hooks/useTripInquiries';
import { inquiryTripVehicle, type TripInquiry } from '../../lib/api/trip-inquiries.api';
import { Button, Card, EmptyState, Modal, Pagination, Textarea } from '../ui';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../../lib/utils/cn';
import { formatTripDateTime } from '../../lib/utils/datetime';
import { CancelSeatModal, canPosterCancelSeat } from './CancelSeatModal';

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface TripInquiryInboxProps {
  tripBasePath: string; // e.g. '/dashboard/trips' — links each card to its trip's detail page
}

// Incoming seat requests across ALL of the current user's posted trips — the
// per-trip detail page (MyTripDetail) shows this same data scoped to one trip;
// this is the aggregate view so a driver doesn't have to open every trip to
// find new requests. Shared between the customer (dashboard) and provider
// portal, same as MyTripsList/MyTripDetail — a trip poster can be either role.
export function TripInquiryInbox({ tripBasePath }: TripInquiryInboxProps) {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useTripInquiryInbox({ page });
  const updateStatus = useUpdateTripInquiryStatus();
  const [rejectModal, setRejectModal] = useState<{ inquiryId: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [cancelSeat, setCancelSeat] = useState<TripInquiry | null>(null);

  const inquiries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink">Incoming Requests</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Seat requests riders have sent for your posted trips.
        </p>
      </div>

      {isFetching && inquiries.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          description="Riders who ask for a seat on one of your trips will show up here."
        />
      ) : (
        <div className={cn('space-y-3', isFetching && 'opacity-70 transition-opacity')}>
          {inquiries.map((inquiry) => (
            <TripInquiryRow
              key={inquiry.id}
              inquiry={inquiry}
              tripBasePath={tripBasePath}
              onAccept={() => updateStatus.mutate({ id: inquiry.id, data: { newStatus: 'ACCEPTED' } })}
              onDecline={() => {
                setRejectNote('');
                setRejectModal({ inquiryId: inquiry.id });
              }}
              onCancelSeat={() => setCancelSeat(inquiry)}
              acting={updateStatus.isPending}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} className="mt-6" />
      )}

      <Modal
        open={!!rejectModal}
        onOpenChange={(open) => !open && setRejectModal(null)}
        title="Decline this request?"
        description="Let the rider know why, or suggest an alternative."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModal(null)} className="flex-1">
              Keep pending
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={updateStatus.isPending}
              onClick={async () => {
                if (!rejectModal) return;
                try {
                  await updateStatus.mutateAsync({
                    id: rejectModal.inquiryId,
                    data: { newStatus: 'REJECTED', note: rejectNote || undefined },
                  });
                } catch {
                  return; // the hook already toasts the backend's message
                }
                setRejectModal(null);
              }}
            >
              Decline request
            </Button>
          </>
        }
      >
        <Textarea
          rows={3}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Optional note for the rider…"
          className="resize-none"
        />
      </Modal>

      <CancelSeatModal inquiry={cancelSeat} onClose={() => setCancelSeat(null)} />
    </div>
  );
}

function TripInquiryRow({
  inquiry,
  tripBasePath,
  onAccept,
  onDecline,
  onCancelSeat,
  acting,
}: {
  inquiry: TripInquiry;
  tripBasePath: string;
  onAccept: () => void;
  onDecline: () => void;
  onCancelSeat: () => void;
  acting: boolean;
}) {
  // A return trip (A48) runs in a business's fleet car — userVehicle is null.
  const vehicle = inquiryTripVehicle(inquiry.trip);
  const vehicleLabel = vehicle
    ? [
        `${titleCase(vehicle.make)} ${titleCase(vehicle.model)}`,
        vehicle.year ? `${vehicle.year}` : null,
        vehicle.color ? titleCase(vehicle.color) : null,
        vehicle.plateNumber,
        vehicle.businessName,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Vehicle';

  return (
    <Card className="ease-spring transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-sm">
      <div className="flex gap-4">
        {/* Vehicle thumbnail — the whole reason this exists: a poster with
            several trips/vehicles posted at once needs a photo to tell one
            request from another at a glance, not just the route name. */}
        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-media border border-border-subtle bg-page">
          {vehicle?.imageUrl ? (
            <Image src={vehicle.imageUrl} alt={vehicleLabel} fill className="object-cover" sizes="80px" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`${tripBasePath}/${inquiry.trip.id}`}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-brand-700"
              >
                {titleCase(inquiry.trip.originCity)}
                <ArrowRight className="h-3.5 w-3.5 text-brand-600" />
                {titleCase(inquiry.trip.destinationCity)}
              </Link>
              <p className="mt-0.5 text-xs font-medium text-text-muted">
                {vehicleLabel}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {inquiry.user.name} · {inquiry.requestedSeats} seat{inquiry.requestedSeats !== 1 ? 's' : ''}
              </p>
              <p className="mt-0.5 text-xs text-text-faint">
                {inquiry.user.phone ?? inquiry.user.email}
                {inquiry.pickupNote ? ` · ${inquiry.pickupNote}` : ''}
              </p>
              {inquiry.message && (
                <p className="text-ink-soft mt-2.5 rounded-control bg-page px-3 py-2 text-xs italic">
                  &ldquo;{inquiry.message}&rdquo;
                </p>
              )}
            </div>
            <StatusBadge
              status={inquiry.status}
              label={
                inquiry.status === 'PENDING'
                  ? 'New'
                  : inquiry.status === 'ACCEPTED'
                    ? 'Accepted'
                    : inquiry.status === 'REJECTED'
                      ? 'Declined'
                      : inquiry.status === 'EXPIRED'
                        ? 'Expired'
                        : 'Cancelled'
              }
            />
          </div>

          <div className="mt-2 font-mono text-xs text-text-muted">
            {formatTripDateTime(inquiry.trip.departureAt)} PKT
          </div>

          {inquiry.status === 'PENDING' && (
            <div className="mt-3.5 flex gap-2.5">
              <Button size="sm" disabled={acting} onClick={onAccept}>
                Accept
              </Button>
              <Button size="sm" variant="danger-outline" onClick={onDecline}>
                Decline
              </Button>
            </div>
          )}

          {canPosterCancelSeat(inquiry) && (
            <div className="mt-3.5 flex gap-2.5">
              <Button size="sm" variant="danger-outline" disabled={acting} onClick={onCancelSeat}>
                Cancel seat
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
