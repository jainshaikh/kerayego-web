'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyBookings, useUpdateBookingStatus } from '../../../../hooks/useBookings';
import type { BookingRequest, BookingStatus } from '../../../../lib/api/bookings.api';
import { cn } from '../../../../lib/utils/cn';
import { getCurrencyCode } from '../../../../lib/utils/currency';
import { formatDurationLabel } from '../../../../lib/utils/rentalDuration';
import { getVehicleUrl } from '../../../../lib/utils/vehicleUrl';
import { WhatsAppButton } from '../../../../components/ui';

const STATUS_META: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: 'Awaiting response', color: 'bg-amber-100 text-amber-700' },
  CONTACTED: { label: 'Provider contacted you', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-indigo-100 text-indigo-700' },
  REJECTED: { label: 'Not accepted', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500' },
  COMPLETED: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
};

export default function UserInquiriesPage() {
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { data, isFetching } = useMyBookings(page);
  const updateStatus = useUpdateBookingStatus();

  const inquiries = data?.data ?? [];
  const meta = data?.meta;

  const handleCancel = async () => {
    if (!cancelId) return;
    await updateStatus.mutateAsync({
      id: cancelId,
      data: { newStatus: 'CANCELLED' },
    });
    setCancelId(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Inquiries</h1>
        <p className="mt-1 text-sm text-slate-500">Track the status of your booking requests.</p>
      </div>

      {isFetching && inquiries.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex gap-3">
                <div className="h-16 w-20 flex-shrink-0 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-100" />
                  <div className="h-3 w-64 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="font-medium text-slate-600">No inquiries yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Browse vehicles and send an inquiry to get started.
          </p>
          <Link
            href="/rent-a-car"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Browse vehicles
          </Link>
        </div>
      ) : (
        <div className={cn('space-y-3', isFetching && 'opacity-70 transition-opacity')}>
          {inquiries.map((inquiry) => (
            <UserInquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              onCancel={() => setCancelId(inquiry.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Cancel inquiry?</h2>
            <p className="mb-5 text-sm text-slate-500">
              This will notify the provider. You can always send a new inquiry.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCancelId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={updateStatus.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {updateStatus.isPending ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserInquiryCard({ inquiry, onCancel }: { inquiry: BookingRequest; onCancel: () => void }) {
  const meta = STATUS_META[inquiry.status];
  const fromDate = new Date(inquiry.requestedFromDate).toLocaleString('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const toDate = new Date(inquiry.requestedToDate).toLocaleString('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const durationLabel =
    inquiry.durationType && inquiry.durationQuantity
      ? formatDurationLabel(inquiry.durationType, inquiry.durationQuantity)
      : null;
  const thumb = inquiry.vehicle.images?.[0]?.url;
  const canCancel = inquiry.status === 'PENDING' || inquiry.status === 'CONTACTED';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <Link href={getVehicleUrl(inquiry.vehicle)} className="flex-shrink-0">
          <div className="h-14 w-20 overflow-hidden rounded-lg bg-slate-100">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt={inquiry.vehicle.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link
                href={getVehicleUrl(inquiry.vehicle)}
                className="text-sm font-semibold text-slate-900 hover:text-primary"
              >
                {inquiry.vehicle.title}
              </Link>
              <p className="mt-0.5 text-xs text-slate-500">
                {inquiry.providerProfile.businessName}
              </p>
              {inquiry.providerProfile.user.phone && (
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-xs text-slate-500">{inquiry.providerProfile.user.phone}</span>
                  <WhatsAppButton phone={inquiry.providerProfile.user.phone} variant="text" label="WhatsApp provider" />
                </div>
              )}
            </div>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', meta.color)}>
              {meta.label}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            {fromDate} → {toDate}
            {durationLabel && <> · {durationLabel}</>}
            {inquiry.totalPrice != null && (
              <>
                {' '}
                · {getCurrencyCode(inquiry.vehicle.showroom?.country)}{' '}
                {Number(inquiry.totalPrice).toLocaleString()} est.
              </>
            )}
          </div>

          {/* Provider note */}
          {inquiry.providerNotes && (
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">Provider note:</span> {inquiry.providerNotes}
            </div>
          )}

          {/* Status history timeline (collapsed, last 2 entries) */}
          {inquiry.statusHistory.length > 0 && (
            <div className="mt-2 text-xs text-slate-400">
              Last update:{' '}
              {STATUS_META[inquiry.statusHistory[0].newStatus]?.label ??
                inquiry.statusHistory[0].newStatus}
              {' · '}
              {new Date(inquiry.statusHistory[0].createdAt).toLocaleDateString('en-AE', {
                dateStyle: 'short',
              })}
            </div>
          )}

          {canCancel && (
            <div className="mt-3">
              <button
                onClick={onCancel}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
              >
                Cancel inquiry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
