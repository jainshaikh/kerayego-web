'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useTripInquiry, useUpdateTripInquiryStatus } from '../../../hooks/useTripInquiries';
import { StatusBadge } from '../../common/StatusBadge';
import { Button, Card, ConfirmDialog, ErrorState, WhatsAppButton } from '../../ui';
import { formatTripDateTime } from '../../../lib/utils/datetime';
import { RiderLiveView } from './RiderLiveView';

interface RiderTripDetailProps {
  backHref: string; // e.g. '/dashboard/trip-inquiries'
  reviewsHref: string; // e.g. '/dashboard/reviews'
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Rider's "my trip" page — the equivalent of mobile's trip-request/[id].tsx.
// Web previously had no per-inquiry detail page at all (only the flat list
// in MyTripInquiriesList); this branches on inquiry/trip status to show the
// right view at each stage of the lifecycle.
export function RiderTripDetail({ backHref, reviewsHref }: RiderTripDetailProps) {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: inquiry, isLoading, isError } = useTripInquiry(id);
  const updateStatus = useUpdateTripInquiryStatus();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="h-80 max-w-2xl animate-pulse rounded-card border border-border-subtle bg-surface" />
    );
  }

  if (isError || !inquiry) {
    return (
      <div className="max-w-2xl">
        <ErrorState
          title="Request not found"
          description="This request may have been removed, or the link is wrong."
          onBack={() => router.push(backHref)}
        />
      </div>
    );
  }

  const canCancel =
    (inquiry.status === 'PENDING' || inquiry.status === 'ACCEPTED') &&
    inquiry.trip.status !== 'IN_PROGRESS';
  const isLive = inquiry.status === 'ACCEPTED' && inquiry.trip.status === 'IN_PROGRESS';
  const isCompleted = inquiry.trip.status === 'COMPLETED';
  const driverPhone = inquiry.trip.postedBy.phone ?? inquiry.trip.contactNumber;

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-text-faint">
        <Link href={backHref} className="transition-colors hover:text-brand-700">
          Trip requests
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-ink">
          {titleCase(inquiry.trip.originCity)} → {titleCase(inquiry.trip.destinationCity)}
        </span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-[-0.035em] text-ink">
            {titleCase(inquiry.trip.originCity)} → {titleCase(inquiry.trip.destinationCity)}
          </h1>
          <StatusBadge status={isLive ? inquiry.trip.status : inquiry.status} />
        </div>
        {canCancel && (
          <Button variant="danger-outline" size="sm" onClick={() => setConfirmCancel(true)}>
            {inquiry.status === 'ACCEPTED' ? 'Cancel my seat' : 'Cancel request'}
          </Button>
        )}
      </div>

      <p className="font-mono text-[13px] text-text-muted">
        {formatTripDateTime(inquiry.trip.departureAt, { dateStyle: 'full', timeStyle: 'short' })} PKT ·{' '}
        {inquiry.requestedSeats} seat{inquiry.requestedSeats !== 1 ? 's' : ''}
      </p>

      {isLive ? (
        <RiderLiveView inquiry={inquiry} />
      ) : inquiry.status === 'ACCEPTED' ? (
        <Card className="space-y-3 p-5 text-sm">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            Driver & vehicle
          </p>
          <p className="font-medium text-ink">{inquiry.trip.postedBy.name}</p>
          <p className="text-text-muted">
            {inquiry.trip.userVehicle.make} {inquiry.trip.userVehicle.model}
            {inquiry.trip.userVehicle.year ? ` (${inquiry.trip.userVehicle.year})` : ''} ·{' '}
            {inquiry.trip.userVehicle.plateNumber}
          </p>
          {driverPhone && <WhatsAppButton phone={driverPhone} />}
          <p className="text-xs text-text-faint">
            {inquiry.trip.status === 'CANCELLED'
              ? 'This trip was cancelled by the driver.'
              : isCompleted
                ? 'This trip has ended.'
                : "You're confirmed — the live view opens automatically once the driver starts the trip."}
          </p>
        </Card>
      ) : inquiry.status === 'REJECTED' ? (
        <Card className="p-5 text-sm text-text-muted">
          {inquiry.rejectionReason || 'The driver declined this request.'}
        </Card>
      ) : (
        <Card className="p-5 text-sm text-text-muted">
          This request is {inquiry.status.toLowerCase()}.
        </Card>
      )}

      {isCompleted && (
        <Card className="flex items-center justify-between gap-3 p-4">
          <p className="text-sm text-text-muted">How was your ride?</p>
          <Link href={reviewsHref}>
            <Button size="sm" variant="secondary">
              Leave a review
            </Button>
          </Link>
        </Card>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={inquiry.status === 'ACCEPTED' ? 'Cancel your confirmed seat?' : 'Cancel this request?'}
        description={
          inquiry.status === 'ACCEPTED'
            ? "You already have a confirmed seat on this trip — cancelling frees it up for someone else, and the driver will be notified. This can't be undone."
            : 'The driver will no longer see this as pending. You can always send a new request.'
        }
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        loading={updateStatus.isPending}
        onConfirm={async () => {
          await updateStatus.mutateAsync({ id: inquiry.id, data: { newStatus: 'CANCELLED' } });
          setConfirmCancel(false);
        }}
      />
    </div>
  );
}
