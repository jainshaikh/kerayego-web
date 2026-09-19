'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageSquareOff } from 'lucide-react';
import { useMyTripInquiries, useUpdateTripInquiryStatus } from '../../hooks/useTripInquiries';
import type { TripInquiry } from '../../lib/api/trip-inquiries.api';
import { Card, ConfirmDialog, EmptyState, Pagination } from '../ui';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../../lib/utils/cn';
import { formatTripDateTime } from '../../lib/utils/datetime';

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const STATUS_LABEL: Partial<Record<TripInquiry['status'], string>> = {
  PENDING: 'Awaiting response',
  REJECTED: 'Not accepted',
};

interface MyTripInquiriesListProps {
  basePath: string; // e.g. '/dashboard/trip-inquiries'
}

// Rider's own sent trip requests. Shared between the customer (dashboard) and
// provider portal, mirroring how MyTripDetail/MyTripsList are shared — a trip
// poster can be either an ordinary USER or a PROVIDER, and either can also be
// a rider requesting a seat on someone else's trip.
export function MyTripInquiriesList({ basePath }: MyTripInquiriesListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<TripInquiry | null>(null);
  const { data, isFetching } = useMyTripInquiries(page);
  const updateStatus = useUpdateTripInquiryStatus();

  const inquiries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink">My Trip Requests</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Track the seat requests you&apos;ve sent to drivers.
        </p>
      </div>

      {isFetching && inquiries.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-card border border-border-subtle bg-surface"
            />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquareOff}
          title="No trip requests yet"
          description="Browse trips and request a seat to get started."
          action={{ label: 'Browse trips', onClick: () => router.push('/carpool') }}
        />
      ) : (
        <div className={cn('space-y-3', isFetching && 'opacity-70 transition-opacity')}>
          {inquiries.map((inquiry) => {
            const canCancel =
              (inquiry.status === 'PENDING' || inquiry.status === 'ACCEPTED') &&
              inquiry.trip.status !== 'IN_PROGRESS';
            return (
              <Card
                key={inquiry.id}
                className="ease-spring transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`${basePath}/${inquiry.id}`}
                      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-brand-700"
                    >
                      {titleCase(inquiry.trip.originCity)}
                      <ArrowRight className="h-3.5 w-3.5 text-brand-600" />
                      {titleCase(inquiry.trip.destinationCity)}
                    </Link>
                    <p className="mt-1 text-xs text-text-muted">
                      {inquiry.requestedSeats} seat{inquiry.requestedSeats !== 1 ? 's' : ''} ·{' '}
                      {inquiry.trip.postedBy.name}
                    </p>
                  </div>
                  <StatusBadge status={inquiry.status} label={STATUS_LABEL[inquiry.status]} />
                </div>

                <div className="mt-2 font-mono text-xs text-text-muted">
                  {formatTripDateTime(inquiry.trip.departureAt)} PKT
                </div>

                {inquiry.status === 'ACCEPTED' && inquiry.trip.status === 'IN_PROGRESS' ? (
                  <Link
                    href={`${basePath}/${inquiry.id}`}
                    className="mt-3 flex items-center justify-between gap-2 rounded-control border border-status-violet-border bg-status-violet-bg px-3 py-2 text-xs font-semibold text-status-violet-fg transition-colors hover:brightness-95"
                  >
                    Trip in progress — view live
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  inquiry.status === 'ACCEPTED' && (
                    <div className="mt-3 rounded-control border border-status-emerald-border bg-status-emerald-bg px-3 py-2 text-xs leading-relaxed text-status-emerald-fg">
                      Accepted! Contact {inquiry.trip.postedBy.name} at{' '}
                      {inquiry.trip.postedBy.phone ?? inquiry.trip.contactNumber} to confirm pickup
                      details.
                    </div>
                  )
                )}
                {inquiry.status === 'REJECTED' && inquiry.rejectionReason && (
                  <div className="text-ink-soft mt-3 rounded-control bg-page px-3 py-2 text-xs">
                    {inquiry.rejectionReason}
                  </div>
                )}

                {canCancel && (
                  <div className="mt-3">
                    <button
                      onClick={() => setCancelTarget(inquiry)}
                      className="text-xs font-medium text-text-faint transition-colors hover:text-red-600"
                    >
                      {inquiry.status === 'ACCEPTED' ? 'Cancel my seat' : 'Cancel request'}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title={cancelTarget?.status === 'ACCEPTED' ? 'Cancel your confirmed seat?' : 'Cancel this request?'}
        description={
          cancelTarget?.status === 'ACCEPTED'
            ? "You already have a confirmed seat on this trip — cancelling frees it up for someone else, and the driver will be notified. This can't be undone."
            : 'The driver will no longer see this as pending. You can always send a new request.'
        }
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        loading={updateStatus.isPending}
        onConfirm={async () => {
          if (!cancelTarget) return;
          await updateStatus.mutateAsync({ id: cancelTarget.id, data: { newStatus: 'CANCELLED' } });
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
