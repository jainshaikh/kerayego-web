'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Radio } from 'lucide-react';
import type { MyTrip } from '../../../lib/api/trips.api';
import { useTripManifest, useEndTrip } from '../../../hooks/useTrips';
import { useTripRoomPresence } from '../../../hooks/useTripRoomPresence';
import { useRideSocket } from '../../../hooks/useRideSocket';
import { useDriverTripActions } from './useDriverTripActions';
import { useDriverLocationWatch } from './useDriverLocationWatch';
import { LiveTripMap, type LiveTripMapDriverPosition } from './LiveTripMap';
import { DriverStopList } from './DriverStopList';
import { DriverRiderCard } from './DriverRiderCard';
import { ChatModal } from './ChatModal';
import { Button, Card, ConfirmDialog } from '../../ui';
import { StatusBadge } from '../../common/StatusBadge';
import { getCurrencyCode } from '../../../lib/utils/currency';

interface DriverCockpitProps {
  trip: MyTrip;
  backHref: string;
}

// Rendered by MyTripDetail once a trip is IN_PROGRESS — a different screen
// from the pre-trip management view (map + manifest, no inquiry inbox, no
// vehicle gallery), so it's a clean branch rather than a fork of that
// 285-line component. Web gets a two-column desktop layout, not mobile's
// 3-tab Stops/Riders/Details split — that split exists purely for phone
// width.
export function DriverCockpit({ trip, backHref }: DriverCockpitProps) {
  useTripRoomPresence(trip.id, true);
  const { onLocationUpdate } = useRideSocket();
  const { data: manifest, isLoading } = useTripManifest(trip.id, true);
  const { noShowIds, arrivedStopIds, actioningKey, handleRiderEvent, handleArrived } =
    useDriverTripActions(trip.id);
  const locationWatch = useDriverLocationWatch(trip.id);
  const endTrip = useEndTrip();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [chatInquiryId, setChatInquiryId] = useState<string | null>(null);
  const [driverPosition, setDriverPosition] = useState<LiveTripMapDriverPosition | null>(null);

  // Renders incoming location regardless of who's emitting — a mobile driver
  // running the same trip, or this very tab if "Share my location" is on.
  useEffect(() => {
    const unsubscribe = onLocationUpdate((payload) => {
      if (payload.tripId !== trip.id) return;
      setDriverPosition({ lat: payload.lat, lng: payload.lng });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  const routeStops = manifest?.routeStops ?? [];
  const riders = manifest?.riders ?? [];
  const mapStops = routeStops.map((stop, index) => ({
    id: stop.id,
    label: stop.label,
    lat: stop.lat ?? 0,
    lng: stop.lng ?? 0,
    sequence: index + 1,
    reached: arrivedStopIds.has(stop.id),
  }));

  const chatRider = riders.find((r) => r.id === chatInquiryId);

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-text-faint">
        <Link href={backHref} className="transition-colors hover:text-brand-700">
          Trips
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-ink">
          {trip.originCity} → {trip.destinationCity}
        </span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-[-0.035em] text-ink">
            {trip.originCity} → {trip.destinationCity}
          </h1>
          <StatusBadge status={trip.status} />
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmEnd(true)}>
          End trip
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <LiveTripMap
            stops={mapStops}
            driverPosition={driverPosition}
            className="h-80 overflow-hidden rounded-card border border-border-subtle"
          />

          <Card className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Share my live location</p>
                <p className="text-xs text-text-muted">
                  Off by default — only turn this on if you&apos;re driving with this page open on
                  your phone.
                </p>
              </div>
              <Button
                size="sm"
                variant={locationWatch.sharing ? 'danger-outline' : 'secondary'}
                onClick={() => (locationWatch.sharing ? locationWatch.stop() : locationWatch.start())}
              >
                <Radio className="h-3.5 w-3.5" />
                {locationWatch.sharing ? 'Stop sharing' : 'Share location'}
              </Button>
            </div>
            {locationWatch.error && <p className="text-xs text-red-600">{locationWatch.error}</p>}
          </Card>

          <div className="space-y-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Riders
            </p>
            {isLoading ? (
              <div className="h-24 animate-pulse rounded-card border border-border-subtle bg-surface" />
            ) : riders.length === 0 ? (
              <p className="text-sm text-text-muted">No accepted riders on this trip.</p>
            ) : (
              riders.map((rider) => (
                <DriverRiderCard
                  key={rider.id}
                  rider={rider}
                  isNoShow={noShowIds.has(rider.id)}
                  actioningKey={actioningKey}
                  onEvent={handleRiderEvent}
                  onOpenChat={setChatInquiryId}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <DriverStopList
            stops={routeStops}
            arrivedStopIds={arrivedStopIds}
            actioningKey={actioningKey}
            onArrive={handleArrived}
          />

          <Card className="space-y-2 p-5 text-sm">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Trip details
            </p>
            <p className="text-text-muted">
              {trip.userVehicle.make} {trip.userVehicle.model}
              {trip.userVehicle.year ? ` (${trip.userVehicle.year})` : ''}
            </p>
            <p className="font-mono text-ink">
              {getCurrencyCode(trip.userVehicle?.country)} {Number(trip.pricePerSeat).toLocaleString()} /
              seat
            </p>
            <p className="text-text-muted">{trip.contactNumber}</p>
          </Card>
        </div>
      </div>

      <ChatModal
        open={!!chatInquiryId}
        onOpenChange={(open) => !open && setChatInquiryId(null)}
        tripInquiryId={chatInquiryId}
        otherPartyName={chatRider?.user.name ?? 'Rider'}
      />

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="End this trip?"
        description="Any rider you haven't tapped as picked up or dropped off will be marked as completed automatically."
        confirmLabel="End trip"
        cancelLabel="Not yet"
        destructive
        loading={endTrip.isPending}
        onConfirm={async () => {
          await endTrip.mutateAsync(trip.id);
          setConfirmEnd(false);
        }}
      />
    </div>
  );
}
