'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { TripInquiry } from '../../../lib/api/trip-inquiries.api';
import { useRiderLiveRoute } from './useRiderLiveRoute';
import { useRiderTripActions } from './useRiderTripActions';
import { LiveTripMap, type LiveTripMapStop } from './LiveTripMap';
import { ChatModal } from './ChatModal';
import { Button, Card, ConfirmDialog, WhatsAppButton } from '../../ui';
import { haversineDistanceMeters, formatDistanceShort } from '../../../lib/utils/geo-distance';

interface RiderLiveViewProps {
  inquiry: TripInquiry;
}

export function RiderLiveView({ inquiry }: RiderLiveViewProps) {
  const { stops, driverPosition, routePolyline } = useRiderLiveRoute(inquiry.trip.id, true);
  const { actioningKey, confirmArrived, confirmDropoff } = useRiderTripActions(
    inquiry.trip.id,
    inquiry.id,
  );
  const [arrivedTapped, setArrivedTapped] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const orderedStops = [...stops].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'PICKUP' ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  const mapStops: LiveTripMapStop[] = orderedStops
    .filter((s): s is typeof s & { lat: number; lng: number } => s.lat != null && s.lng != null)
    .map((s, index) => ({
      id: s.id,
      label: s.label,
      lat: s.lat,
      lng: s.lng,
      sequence: index + 1,
      muted: s.id !== inquiry.pickupStop?.id && s.id !== inquiry.dropoffStop?.id,
    }));

  const distanceToPickupM =
    driverPosition && inquiry.pickupStop ? haversineDistanceMeters(driverPosition, inquiry.pickupStop) : null;

  const pickedUp = !!inquiry.pickupConfirmedAt;
  const droppedOff = !!inquiry.droppedOffAt;

  return (
    <div className="space-y-5">
      <LiveTripMap
        stops={mapStops}
        routePolyline={routePolyline}
        driverPosition={driverPosition}
        className="h-72 overflow-hidden rounded-card border border-border-subtle"
      />

      {!droppedOff && !pickedUp && distanceToPickupM !== null && (
        <Card className="p-4 text-sm">
          <p className="font-semibold text-ink">
            Driver is {formatDistanceShort(distanceToPickupM / 1000)} away
          </p>
        </Card>
      )}

      <Card className="space-y-2 p-5 text-sm">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          Driver & vehicle
        </p>
        <p className="font-medium text-ink">{inquiry.trip.postedBy.name}</p>
        <p className="text-text-muted">
          {inquiry.trip.userVehicle.make} {inquiry.trip.userVehicle.model}
          {inquiry.trip.userVehicle.year ? ` (${inquiry.trip.userVehicle.year})` : ''} ·{' '}
          {inquiry.trip.userVehicle.plateNumber}
        </p>
        {(inquiry.trip.postedBy.phone ?? inquiry.trip.contactNumber) && (
          <WhatsAppButton phone={inquiry.trip.postedBy.phone ?? inquiry.trip.contactNumber} variant="text" />
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">Your stops</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-control border border-border-subtle px-3.5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{inquiry.pickupStop?.label ?? 'Pickup'}</p>
              <p className="text-xs text-text-faint">
                {pickedUp
                  ? 'Picked up'
                  : arrivedTapped
                    ? "You've told the driver you're here"
                    : 'Awaiting pickup'}
              </p>
            </div>
            {!pickedUp && !arrivedTapped && (
              <Button
                size="sm"
                variant="secondary"
                disabled={actioningKey === 'ARRIVED'}
                loading={actioningKey === 'ARRIVED'}
                onClick={async () => {
                  await confirmArrived();
                  setArrivedTapped(true);
                }}
              >
                I&apos;ve arrived
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border-subtle px-3.5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{inquiry.dropoffStop?.label ?? 'Drop-off'}</p>
              <p className="text-xs text-text-faint">{droppedOff ? 'Ride completed' : 'In progress'}</p>
            </div>
            {!droppedOff && (
              <Button size="sm" onClick={() => setConfirmComplete(true)}>
                Complete ride
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Button variant="secondary" onClick={() => setChatOpen(true)}>
        <MessageCircle className="h-4 w-4" />
        Message driver
      </Button>

      <ChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        tripInquiryId={inquiry.id}
        otherPartyName={inquiry.trip.postedBy.name}
      />

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Complete your ride?"
        description="Let the driver know you've been dropped off. This can't be undone."
        confirmLabel="Complete ride"
        cancelLabel="Not yet"
        loading={actioningKey === 'DROPOFF'}
        onConfirm={async () => {
          await confirmDropoff();
          setConfirmComplete(false);
        }}
      />
    </div>
  );
}
