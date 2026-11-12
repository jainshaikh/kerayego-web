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
import { bookingPlaceSummary, isPriceToAgree, passengersLabel } from '../../../lib/ops/bookingRoute';
import type { BookingRequest } from '../../../types/booking-requests.types';
import { CarThumbnail } from './BookingBits';

// One request in the business's list: car, status, customer, where it goes
// ("Hyderabad → Larkana · 330 km", plan §3c), pickup → return, then the
// package, passengers and the estimated total ("Price to agree" on a
// week/month request, A79) — and "Needs a driver" on an accepted booking
// nobody is driving yet. Opens its detail page. Same as the Partner app's card.
export function BookingRequestCard({ booking }: { booking: BookingRequest }) {
  const places = bookingPlaceSummary(booking);
  const duration = durationLabel(booking.durationType, booking.durationQuantity);
  const total = totalPriceLabel(booking);
  const price = total ? `${total} est.` : isPriceToAgree(booking) ? 'Price to agree' : null;
  const details = [duration, passengersLabel(booking.passengerCount), price].filter(Boolean);
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
          {places ? <p className="mt-0.5 truncate text-xs text-text-muted">{places}</p> : null}
          <p className="mt-1 font-mono text-xs text-text-muted">
            {formatDateTime(booking.requestedFromDate, false)} → {formatDateTime(booking.requestedToDate, false)}
          </p>
          {details.length > 0 ? (
            <p className="mt-0.5 text-xs text-text-muted">{details.join(' · ')}</p>
          ) : null}
          {missingDriver ? (
            <StatusBadge status="PENDING" size="sm" label="Needs a driver" className="mt-2" />
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
