'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyBookings, useUpdateBookingStatus } from '../../../../hooks/useBookings';
import type { BookingRequest, BookingStatus } from '../../../../lib/api/bookings.api';
import { cn } from '../../../../lib/utils/cn';
import { getCurrencyCode } from '../../../../lib/utils/currency';
import { getVehicleUrl } from '../../../../lib/utils/vehicleUrl';
import { rideCountLabel } from '../../../../lib/utils/copy';
import { durationLabel as packageLabel } from '../../../../lib/ops/bookingDisplay';
import {
  bookingPlaceSummary,
  isPriceToAgree,
  minutesLabel,
  passengersLabel,
  routeStopItems,
  stopTimeLabel,
} from '../../../../lib/ops/bookingRoute';
import { BOOKING_TRIP_TYPE_LABELS } from '../../../../types/booking-requests.types';
import { Avatar, RatingBadge, WhatsAppButton } from '../../../../components/ui';
import { ConfirmModal } from '../../../../components/ops/ConfirmModal';

const STATUS_META: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: 'Awaiting response', color: 'bg-amber-100 text-amber-700' },
  CONTACTED: { label: 'Provider contacted you', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-indigo-100 text-indigo-700' },
  REJECTED: { label: 'Not accepted', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500' },
  COMPLETED: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  // Set by KerayeGo when an accepted rental's booked period ended without the
  // job being started. Neutral; not a ride, not rateable.
  NOT_STARTED: { label: 'Not started', color: 'bg-slate-100 text-slate-500' },
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
    try {
      await updateStatus.mutateAsync({
        id: cancelId,
        data: { newStatus: 'CANCELLED' },
      });
      setCancelId(null);
    } catch {
      // The hook toasts the failure; the dialog stays open so they can retry.
    }
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

      {/* Cancel confirmation — shared Modal: top-right × and a click outside close it. */}
      <ConfirmModal
        open={cancelId !== null}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
        title="Cancel inquiry?"
        description="This will notify the provider. You can always send a new inquiry."
        cancelLabel="Keep it"
        confirmLabel="Yes, cancel"
        destructive
        loading={updateStatus.isPending}
        onConfirm={handleCancel}
      />
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
  // The package as people say it ("12 hours", "3 days", "1 week") and where the
  // trip goes ("Hyderabad → Larkana · 330 km"), plan §3c.
  const durationLabel = packageLabel(inquiry.durationType, inquiry.durationQuantity);
  const places = bookingPlaceSummary(inquiry);
  // The place summary already says "round trip"; only one way needs naming here.
  const tripDetails = [
    inquiry.tripType === 'ONE_WAY' ? BOOKING_TRIP_TYPE_LABELS.ONE_WAY : null,
    passengersLabel(inquiry.passengerCount),
  ].filter(Boolean);
  const priceToAgree = isPriceToAgree(inquiry);
  const thumb = inquiry.vehicle.images?.[0]?.url;
  // The backend lets the customer cancel only while PENDING (BOOKING_TRANSITIONS:
  // once the provider has made contact only they or KerayeGo can move it) —
  // the same rule as mobile's userBookingActions.
  const canCancel = inquiry.status === 'PENDING';

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
            {priceToAgree && <> · Price to agree — the business will call you</>}
          </div>

          {(places || tripDetails.length > 0) && (
            <div className="mt-1 text-xs text-slate-500">
              {[places, ...tripDetails].filter(Boolean).join(' · ')}
            </div>
          )}

          <RequestRoute inquiry={inquiry} />

          <DriverCard inquiry={inquiry} />

          {/* Provider note */}
          {inquiry.providerNotes && (
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">Provider note:</span> {inquiry.providerNotes}
            </div>
          )}

          {inquiry.status === 'NOT_STARTED' && (
            <p className="mt-2 text-xs text-slate-500">
              The booked period ended before this rental was started, so it was closed. You can send a new
              request for this car any time in the KerayeGo app.
            </p>
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

/**
 * The request's stops in route order with the time the car should get there
 * (plan §3c) — folded away under "Route" so the list stays short. Nothing on
 * older requests, which have no stops.
 */
function RequestRoute({ inquiry }: { inquiry: BookingRequest }) {
  const stops = routeStopItems(inquiry.stops);
  if (stops.length === 0) return null;
  return (
    <details className="mt-2 text-xs text-slate-600">
      <summary className="cursor-pointer font-medium text-slate-700">
        Route · {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
        {inquiry.timeNeededMinutes != null && <> · about {minutesLabel(inquiry.timeNeededMinutes)}</>}
      </summary>
      <ol className="mt-1.5 space-y-1 border-l border-slate-200 pl-3">
        {stops.map((stop) => (
          <li key={stop.key}>
            <span className="font-medium text-slate-700">{stop.title}</span>
            {stop.expectedAt && <> · {stopTimeLabel(stop.expectedAt, inquiry.requestedFromDate)}</>}
            {' — '}
            {stop.place}
            {stop.note && <span className="text-slate-400"> ({stop.note})</span>}
          </li>
        ))}
      </ol>
      <p className="mt-1 text-slate-400">Times are estimates without traffic.</p>
    </details>
  );
}

/**
 * The driver card once a driver is assigned (plan A86) — photo, name, their
 * rating and rides, and what KerayeGo checked: "Identity verified" / "Licence
 * verified" (never "safe"; a check that didn't pass isn't shown). Call /
 * WhatsApp when the backend sends the phone (D14: once the driver confirms
 * the job). Same rules as the customer app's RentalDriverCard.
 */
function DriverCard({ inquiry }: { inquiry: BookingRequest }) {
  const driver = inquiry.assignedDriver;
  const shown = inquiry.status === 'ACCEPTED' || inquiry.status === 'IN_PROGRESS' || inquiry.status === 'COMPLETED';
  if (!driver || !shown) return null;
  const rideCount = driver.rideCount ?? 0;
  const contactable = inquiry.status === 'ACCEPTED' || inquiry.status === 'IN_PROGRESS';
  return (
    <div className="mt-3 rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your driver</p>
      <div className="mt-2 flex items-center gap-3">
        {driver.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={driver.avatarUrl} alt={`${driver.name}'s photo`} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <Avatar name={driver.name} />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{driver.name}</p>
          {(driver.rating || rideCount > 0) && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <RatingBadge average={driver.rating?.average ?? null} count={driver.rating?.count ?? 0} size="sm" />
              {rideCount > 0 && <span>· {rideCountLabel(rideCount)}</span>}
            </p>
          )}
        </div>
      </div>
      {(driver.identityVerified || driver.licenceVerified) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {driver.identityVerified && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Identity verified
            </span>
          )}
          {driver.licenceVerified && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Licence verified
            </span>
          )}
        </div>
      )}
      {contactable &&
        (driver.phone ? (
          <div className="mt-2 flex items-center gap-3">
            <a href={`tel:${driver.phone}`} className="text-xs font-medium text-slate-700 hover:text-brand-700">
              Call {driver.phone}
            </a>
            <WhatsAppButton phone={driver.phone} variant="text" label="WhatsApp driver" />
          </div>
        ) : (
          inquiry.status === 'ACCEPTED' && (
            <p className="mt-2 text-xs text-slate-500">You can call your driver once they confirm the job.</p>
          )
        ))}
    </div>
  );
}
