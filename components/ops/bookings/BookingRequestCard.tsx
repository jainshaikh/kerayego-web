'use client';

import Link from 'next/link';
import { Card } from '../../ui';
import { StatusBadge } from '../../common/StatusBadge';
import {
  BOOKING_STATUS_LABELS,
  durationLabel,
  formatDateTime,
  totalPriceLabel,
} from '../../../lib/ops/bookingDisplay';
import { needsDriver } from '../../../lib/ops/driverAssignment';
import type { BookingRequest } from '../../../types/booking-requests.types';
import { CarThumbnail } from './BookingBits';

// One request in the business's list: car, status, customer, pickup → return
// with the duration, the estimated total — and "Needs a driver" on an accepted
// booking nobody is driving yet. Opens its detail page.
export function BookingRequestCard({ booking }: { booking: BookingRequest }) {
  const duration = durationLabel(booking.durationType, booking.durationQuantity);
  const total = totalPriceLabel(booking);
  const missingDriver = needsDriver(booking);

  return (
    <Link href={`/provider/inquiries/${booking.id}`} className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
      <Card hover className="flex gap-4">
        <CarThumbnail vehicle={booking.vehicle} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-ink">{booking.vehicle.title}</p>
            <StatusBadge status={booking.status} size="sm" label={BOOKING_STATUS_LABELS[booking.status]} />
          </div>
          <p className="mt-0.5 truncate text-sm text-ink">{booking.user.name}</p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {formatDateTime(booking.requestedFromDate, false)} → {formatDateTime(booking.requestedToDate, false)}
          </p>
          {duration || total ? (
            <p className="mt-0.5 text-xs text-text-muted">
              {[duration, total ? `${total} est.` : null].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {missingDriver ? (
            <StatusBadge status="PENDING" size="sm" label="Needs a driver" className="mt-2" />
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
