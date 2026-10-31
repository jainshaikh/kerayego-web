'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MapPinned } from 'lucide-react';
import { BackButton, Button, Card, ErrorState } from '../../../../../components/ui';
import { StatusBadge } from '../../../../../components/common/StatusBadge';
import {
  CarThumbnail,
  DetailRow,
  Notice,
  SectionCard,
} from '../../../../../components/ops/bookings/BookingBits';
import { CustomerContactCard } from '../../../../../components/ops/bookings/CustomerContactCard';
import { DriverCard } from '../../../../../components/ops/bookings/DriverCard';
import { StatusActionModal } from '../../../../../components/ops/bookings/StatusActionModal';
import { StatusHistoryCard } from '../../../../../components/ops/bookings/StatusHistoryCard';
import { RateBookingCustomerCard } from '../../../../../components/ops/ratings/RateBookingCustomerCard';
import { useBookingRequest } from '../../../../../hooks/useBookingRequests';
import { useWorkspace } from '../../../../../hooks/useWorkspace';
import { apiErrorMessage } from '../../../../../lib/ops/apiError';
import {
  BOOKING_STATUS_LABELS,
  businessBookingActions,
  dayRateLabel,
  durationLabel,
  finishedStatusNote,
  formatDate,
  formatDateTime,
  jobStateText,
  totalPriceLabel,
  type BusinessBookingAction,
} from '../../../../../lib/ops/bookingDisplay';
import { getVehicleUrl } from '../../../../../lib/utils/vehicleUrl';

// One booking request (/provider/inquiries/[id] — business admin and manager,
// can('manageBookings')), ported from the KerayeGo Partner app's
// app/(business)/bookings/[id].tsx: the car, the rental period and price, the
// customer with Call / WhatsApp / Email, their message, the status buttons
// (each confirmed in a modal first; accepting also picks the driver or
// "Assign later"), the Driver card (assign / change / remove until the job
// starts, the driver's answer), where the job stands (text — the driver starts
// and ends it in the Partner app) and the status history. A completed rental
// the business admin hasn't rated the customer for yet gets a "Rate this
// customer" card first (can('rateCustomers')). The customer's shared location
// isn't shown: the Partner app shows it only to the job's driver.
export default function BookingRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const query = useBookingRequest(id);
  const { can } = useWorkspace();
  const [action, setAction] = useState<BusinessBookingAction | null>(null);
  // The picker's "Invite a driver" opens the Team page (business admin and manager invite drivers, A52).
  const inviteDriver = can('inviteDrivers') ? () => router.push('/provider/team') : undefined;

  const back = <BackButton label="Bookings" fallbackHref="/provider/inquiries" className="mb-2" />;

  if (query.isPending) {
    return (
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-surface-hover" />
        <div className="h-28 rounded-card bg-surface-hover" />
        <div className="h-48 rounded-card bg-surface-hover" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="max-w-3xl space-y-4">
        {back}
        <ErrorState
          title="We couldn't load this request"
          description={apiErrorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  const booking = query.data;
  const actions = businessBookingActions(booking.status);
  const duration = durationLabel(booking.durationType, booking.durationQuantity);
  const total = totalPriceLabel(booking);
  const finishedNote = finishedStatusNote(booking.status);
  const jobState = jobStateText(booking);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        {back}
        <h1 className="text-2xl font-bold tracking-tight text-ink">Booking request</h1>
      </div>

      <Card className="flex gap-4">
        <CarThumbnail vehicle={booking.vehicle} className="h-[72px] w-24" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link href={getVehicleUrl(booking.vehicle)} className="font-semibold text-ink hover:text-brand-700">
            {booking.vehicle.title}
          </Link>
          <div>
            <StatusBadge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status]} />
          </div>
          <p className="text-xs text-text-muted">Received {formatDate(booking.createdAt)}</p>
        </div>
      </Card>

      {can('rateCustomers') ? <RateBookingCustomerCard bookingId={booking.id} status={booking.status} /> : null}

      {/* Up top, so "Needs a driver" is the first thing seen. */}
      <DriverCard booking={booking} canManage={can('manageBookings')} onInviteDriver={inviteDriver} />

      {jobState ? (
        <Notice tone={booking.status === 'IN_PROGRESS' ? 'info' : booking.status === 'COMPLETED' ? 'success' : 'warning'}>
          <p>{jobState}</p>
          {booking.status === 'IN_PROGRESS' && can('viewLiveMap') ? (
            <Link href="/provider/live-map" className="mt-1 inline-flex items-center gap-1 font-semibold underline">
              <MapPinned className="h-3.5 w-3.5" /> See the driver on the live map
            </Link>
          ) : null}
        </Notice>
      ) : null}

      <SectionCard title="Rental">
        <div className="space-y-1.5">
          <DetailRow label="Pickup" value={formatDateTime(booking.requestedFromDate)} />
          <DetailRow label="Return" value={formatDateTime(booking.requestedToDate)} />
          {duration ? <DetailRow label="Duration" value={duration} /> : null}
          <DetailRow label="Pickup location" value={booking.pickupLocation?.trim() || 'Not given'} />
          {booking.isOneWay ? (
            <DetailRow
              label="Drop-off (one way)"
              value={[booking.dropoffLocation?.trim(), booking.dropoffCity?.trim()].filter(Boolean).join(', ') || 'Not given'}
            />
          ) : null}
          {total ? <DetailRow label="Estimated total" value={total} /> : null}
          <DetailRow label="Car’s day rate" value={dayRateLabel(booking)} />
        </div>
      </SectionCard>

      <CustomerContactCard customer={booking.user} market={booking.vehicle.showroom?.country} />

      {booking.message?.trim() ? (
        <SectionCard title="Customer’s message">
          <p className="whitespace-pre-line text-sm text-ink">{booking.message.trim()}</p>
        </SectionCard>
      ) : null}

      {actions.length > 0 ? (
        <div className="space-y-2">
          {booking.status === 'PENDING' ? (
            <p className="text-xs text-text-muted">Contact the customer first, then mark the request as contacted.</p>
          ) : null}
          <div className="flex flex-wrap gap-2.5">
            {actions.map((item) => (
              <Button
                key={item.status}
                variant={item.status === 'REJECTED' ? 'danger-outline' : 'primary'}
                onClick={() => setAction(item)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      ) : finishedNote ? (
        <p className="text-sm text-text-muted">{finishedNote}</p>
      ) : null}

      <StatusHistoryCard booking={booking} />

      <StatusActionModal
        booking={booking}
        action={action}
        onClose={() => setAction(null)}
        onInviteDriver={
          inviteDriver
            ? () => {
                setAction(null);
                inviteDriver();
              }
            : undefined
        }
      />
    </div>
  );
}
