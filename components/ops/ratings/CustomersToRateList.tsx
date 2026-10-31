'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Users } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, buttonVariants } from '../../ui';
import { useCustomersToRate } from '../../../hooks/useBusinessRatings';
import { apiErrorMessage } from '../../../lib/ops/apiError';
import { formatDate } from '../../../lib/ops/bookingDisplay';
import type { RateableBooking } from '../../../lib/ops/ratings';
import { RateCustomerModal } from './RateCustomerModal';

// "Rate customers" (business admin only — can('rateCustomers')): completed
// rentals whose customer the business hasn't rated yet (GET /reviews/my/eligible
// → bookingsAsProvider), each with Rate and View booking. Ported from the
// KerayeGo Partner app's CustomersToRateList. A rated rental drops off.
export function CustomersToRateList() {
  const customers = useCustomersToRate();
  const [selected, setSelected] = useState<RateableBooking | null>(null);

  let content;
  if (customers.isPending) {
    content = (
      <p className="flex items-center gap-2 py-8 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  } else if (customers.isError) {
    content = <ErrorState description={apiErrorMessage(customers.error)} onRetry={() => customers.refetch()} />;
  } else if (customers.data.length === 0) {
    content = (
      <EmptyState
        icon={Users}
        title="No customers to rate"
        description="When a rental is completed, you can rate the customer here. Only KerayeGo sees your ratings."
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-text-muted">
          Rate the customer of each completed rental. Only KerayeGo sees these ratings: never the customer, and never on
          any profile.
        </p>
        {customers.data.map((booking) => (
          <Card key={booking.id} className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{booking.user.name}</p>
              <p className="text-xs text-text-muted">
                {booking.vehicle?.title ? `${booking.vehicle.title} · ` : ''}
                {booking.updatedAt ? `Rental completed ${formatDate(booking.updatedAt)}` : 'Rental completed'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setSelected(booking)} aria-label={`Rate ${booking.user.name}`}>
                Rate
              </Button>
              <Link href={`/provider/inquiries/${booking.id}`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                View booking
              </Link>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Outside the branches: the modal stays open (showing its error or thanks) if the list refreshes underneath it.
  return (
    <>
      {content}
      {selected ? <RateCustomerModal key={selected.id} booking={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
