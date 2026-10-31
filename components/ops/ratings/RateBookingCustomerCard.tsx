'use client';

import { useState } from 'react';
import { Button, Card } from '../../ui';
import { useCustomersToRate } from '../../../hooks/useBusinessRatings';
import type { RateableBooking } from '../../../lib/ops/ratings';
import type { BookingStatus } from '../../../types/booking-requests.types';
import { RateCustomerModal } from './RateCustomerModal';

// The booking detail's "Rate this customer" card, ported from the KerayeGo
// Partner app's RateBookingCustomerCard: shown for a COMPLETED rental still
// waiting in GET /reviews/my/eligible → bookingsAsProvider. The page renders
// it only with can('rateCustomers') (the business admin — the backend lets
// only the owner rate for the business). Rated → the list refreshes and the
// card goes.
export function RateBookingCustomerCard({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const isCompleted = status === 'COMPLETED';
  const customers = useCustomersToRate({ enabled: isCompleted });
  // A snapshot, so the modal (and its thank-you) stays open after the rating
  // removes the booking from the list.
  const [selected, setSelected] = useState<RateableBooking | null>(null);
  const pending = isCompleted ? (customers.data?.find((b) => b.id === bookingId) ?? null) : null;

  return (
    <>
      {pending ? (
        <Card className="space-y-2 border-brand-100">
          <h2 className="text-sm font-semibold text-ink">Rate this customer</h2>
          <p className="text-sm text-text-muted">
            How was {pending.user.name} on this rental? Your rating is private: the customer never sees it, only KerayeGo
            does.
          </p>
          <Button size="sm" onClick={() => setSelected(pending)} aria-label={`Rate ${pending.user.name}`}>
            Rate this customer
          </Button>
        </Card>
      ) : null}
      {selected ? <RateCustomerModal key={selected.id} booking={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
