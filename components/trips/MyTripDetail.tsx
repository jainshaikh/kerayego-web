'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Inbox } from 'lucide-react';
import { useMyTrip, useCancelTrip, useStartTrip } from '../../hooks/useTrips';
import { useTripInquiryInbox, useUpdateTripInquiryStatus } from '../../hooks/useTripInquiries';
import { StatusBadge } from '../common/StatusBadge';
import { Button, Card, ConfirmDialog, ErrorState, Modal, Textarea } from '../ui';
import { getCurrencyCode } from '../../lib/utils/currency';
import { formatTripDateTime } from '../../lib/utils/datetime';
import { DriverCockpit } from './live/DriverCockpit';
import { CancelSeatModal, canPosterCancelSeat } from './CancelSeatModal';
import type { TripInquiry } from '../../lib/api/trip-inquiries.api';

interface MyTripDetailProps {
  backHref: string; // e.g. '/dashboard/trips'
  vehicleBasePath: string; // e.g. '/dashboard/my-vehicles'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-text-faint">{label}</p>
      <p className="text-ink-soft mt-1 text-[13.5px] leading-relaxed">{children}</p>
    </div>
  );
}

export function MyTripDetail({ backHref, vehicleBasePath }: MyTripDetailProps) {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: trip, isLoading, isError } = useMyTrip(id);
  const cancelTrip = useCancelTrip();
  const startTrip = useStartTrip();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);

  const { data: inquiriesRes, isLoading: inquiriesLoading } = useTripInquiryInbox({ tripId: id });
  const updateInquiryStatus = useUpdateTripInquiryStatus();
  const [rejectModal, setRejectModal] = useState<{ inquiryId: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [cancelSeat, setCancelSeat] = useState<TripInquiry | null>(null);

  // A49: the backend refuses to cancel a trip while any seat request is still
  // PENDING or ACCEPTED — the poster declines/cancels each one first.
  const activeSeatCount =
    inquiriesRes?.data.filter((i) => i.status === 'PENDING' || i.status === 'ACCEPTED').length ?? 0;

  if (isLoading) {
    return (
      <div className="h-80 max-w-2xl animate-pulse rounded-card border border-border-subtle bg-surface" />
    );
  }

  if (isError || !trip) {
    return (
      <div className="max-w-2xl">
        <ErrorState
          title="Trip not found"
          description="This trip may have been removed, or the link is wrong."
          onBack={() => router.push(backHref)}
        />
      </div>
    );
  }

  // A started trip is a fundamentally different screen (live map + manifest,
  // no inquiry inbox, no vehicle gallery) — branch here rather than forking
  // this component's own JSX. MyTripDetail keeps owning data-loading and
  // error/breadcrumb state either way.
  if (trip.status === 'IN_PROGRESS') {
    return <DriverCockpit trip={trip} backHref={backHref} />;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-text-faint">
        <Link href={backHref} className="transition-colors hover:text-brand-700">
          Trips
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-ink">
          {trip.originCity} → {trip.destinationCity}
        </span>
      </nav>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-[-0.035em] text-ink">
                {trip.originCity.charAt(0).toUpperCase() + trip.originCity.slice(1)}
                {' → '}
                {trip.destinationCity.charAt(0).toUpperCase() + trip.destinationCity.slice(1)}
              </h1>
              <StatusBadge status={trip.status} />
            </div>
            <p className="mt-1.5 font-mono text-[13px] text-text-muted">
              {formatTripDateTime(trip.departureAt, { dateStyle: 'full', timeStyle: 'short' })} PKT
            </p>
            {trip.status === 'CANCELLED' && trip.cancelReason && (
              <p className="text-ink-soft mt-2.5 inline-block rounded-control border border-border-subtle bg-page px-3 py-2 text-xs">
                Cancelled: {trip.cancelReason}
              </p>
            )}
          </div>

          {trip.status === 'ACTIVE' && (
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-2.5">
                <Button
                  variant="danger-outline"
                  size="sm"
                  disabled={inquiriesLoading || activeSeatCount > 0}
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel trip
                </Button>
                <Button size="sm" onClick={() => setConfirmStart(true)}>
                  Start trip
                </Button>
              </div>
              {activeSeatCount > 0 && (
                <p className="text-right text-xs text-text-muted">
                  Cancel or decline each seat first
                </p>
              )}
            </div>
          )}
        </div>

        {((trip.isReturnTrip ? trip.fleetVehicle?.images : trip.userVehicle?.images) ?? []).length > 0 && (
          <div className="mt-5 flex gap-2.5 overflow-x-auto pb-1">
            {((trip.isReturnTrip ? trip.fleetVehicle?.images : trip.userVehicle?.images) ?? []).map((image) => (
              <div
                key={image.url}
                className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-media border border-border-subtle"
              >
                <Image src={image.url} alt="" fill className="object-cover" sizes="112px" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-5 border-t border-border-subtle pt-5 sm:grid-cols-2">
          <Field label="Vehicle">
            {trip.isReturnTrip && trip.fleetVehicle ? (
              <span className="font-medium text-ink">
                {trip.fleetVehicle.title}
                {trip.providerProfile ? ` (${trip.providerProfile.businessName})` : ''}
              </span>
            ) : trip.userVehicle ? (
              <Link
                href={`${vehicleBasePath}/${trip.userVehicle.id}`}
                className="font-medium text-brand-700 transition-colors hover:text-brand-800"
              >
                {trip.userVehicle.make} {trip.userVehicle.model}
                {trip.userVehicle.year ? ` (${trip.userVehicle.year})` : ''}
              </Link>
            ) : null}
          </Field>
          <Field label={trip.isReturnTrip ? 'Trip type' : 'Plate number'}>
            {trip.isReturnTrip ? 'Business Return Carpool' : (trip.userVehicle?.plateNumber ?? '—')}
          </Field>
          <Field label="Seats available">{trip.availableSeats}</Field>
          <Field label="Price per seat">
            <span className="font-mono font-semibold text-ink">
              {getCurrencyCode(trip.userVehicle?.country)} {Number(trip.pricePerSeat).toLocaleString()}
            </span>
          </Field>
          <Field label="WhatsApp contact">{trip.contactNumber}</Field>
          <Field label="Pickup point">{trip.pickupPoint}</Field>
          {trip.dropoffPoint && <Field label="Drop-off point">{trip.dropoffPoint}</Field>}
        </div>

        {trip.notes && (
          <div className="mt-5 border-t border-border-subtle pt-5">
            <Field label="Notes">{trip.notes}</Field>
          </div>
        )}
      </Card>

      {/* Incoming seat requests */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Incoming requests</h2>

        {inquiriesLoading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-control bg-page" />
            ))}
          </div>
        ) : !inquiriesRes?.data.length ? (
          <div className="flex items-center gap-3 rounded-control border border-border-subtle bg-page px-4 py-3.5">
            <Inbox className="h-4 w-4 flex-shrink-0 text-text-faint" />
            <p className="text-[13px] text-text-muted">
              No requests yet — riders who ask for a seat will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiriesRes.data.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-card border border-border-subtle p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {inquiry.user.name} · {inquiry.requestedSeats} seat
                      {inquiry.requestedSeats !== 1 ? 's' : ''}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
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

                {inquiry.status === 'PENDING' && (
                  <div className="mt-3.5 flex gap-2.5">
                    <Button
                      size="sm"
                      disabled={updateInquiryStatus.isPending}
                      onClick={() =>
                        updateInquiryStatus.mutate({
                          id: inquiry.id,
                          data: { newStatus: 'ACCEPTED' },
                        })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-outline"
                      onClick={() => {
                        setRejectNote('');
                        setRejectModal({ inquiryId: inquiry.id });
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {canPosterCancelSeat(inquiry) && (
                  <div className="mt-3.5 flex gap-2.5">
                    <Button
                      size="sm"
                      variant="danger-outline"
                      disabled={updateInquiryStatus.isPending}
                      onClick={() => setCancelSeat(inquiry)}
                    >
                      Cancel seat
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Decline needs a free-text note, so it is a Modal rather than a
          ConfirmDialog — but both replace hand-rolled fixed overlays. */}
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
              loading={updateInquiryStatus.isPending}
              onClick={async () => {
                if (!rejectModal) return;
                try {
                  await updateInquiryStatus.mutateAsync({
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

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this trip?"
        description="The trip will be taken down and no one will be able to request a seat on it. This can't be undone."
        confirmLabel="Cancel trip"
        cancelLabel="Keep it"
        destructive
        loading={cancelTrip.isPending}
        onConfirm={async () => {
          try {
            await cancelTrip.mutateAsync({ id: trip.id });
          } catch {
            // useCancelTrip already toasts the backend's message (e.g. the A49
            // "reject or cancel each seat request first" refusal).
            setConfirmCancel(false);
            return;
          }
          setConfirmCancel(false);
          router.push(backHref);
        }}
      />

      <CancelSeatModal inquiry={cancelSeat} onClose={() => setCancelSeat(null)} />

      <ConfirmDialog
        open={confirmStart}
        onOpenChange={setConfirmStart}
        title="Start this trip?"
        description="This switches the trip to live mode — a manifest and live location sharing become available, and riders will be notified."
        confirmLabel="Start trip"
        cancelLabel="Not yet"
        loading={startTrip.isPending}
        onConfirm={async () => {
          try {
            await startTrip.mutateAsync(trip.id);
          } catch {
            return; // useStartTrip toasts the backend's message
          }
          setConfirmStart(false);
        }}
      />
    </div>
  );
}
