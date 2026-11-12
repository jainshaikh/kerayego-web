'use client';

import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import type { CarClash } from '../../../types/booking-requests.types';
import { CLASH_WARNING, clashLine } from '../../../lib/ops/bookingRoute';

interface CarClashWarningProps {
  clashes: CarClash[];
  /** Link each clashing booking to its page. Off inside the Accept dialog. */
  linked?: boolean;
}

// "This car is already booked" (plan A88): the same car's accepted or
// in-progress bookings that overlap this request — Accept would be refused
// with VEHICLE_ALREADY_BOOKED. Nothing when there are none. Port of the
// Partner app's CarClashWarning.
export function CarClashWarning({ clashes, linked = true }: CarClashWarningProps) {
  if (clashes.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-control border border-status-amber-border bg-status-amber-bg px-4 py-3 text-sm text-status-amber-fg"
    >
      <CalendarX className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">This car is already booked</p>
        <p className="text-xs leading-relaxed">{CLASH_WARNING}</p>
        <ul className="space-y-0.5 text-xs">
          {clashes.map((clash) => (
            <li key={clash.bookingId}>
              {linked ? (
                <Link href={`/provider/inquiries/${clash.bookingId}`} className="underline hover:no-underline">
                  {clashLine(clash)}
                </Link>
              ) : (
                clashLine(clash)
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
