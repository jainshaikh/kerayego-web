'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Car, Clock, Image as ImageIcon, MapPin, Route } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { TripCard as TripCardType } from '../../lib/api/trips.api';
import { getCurrencyCode } from '../../lib/utils/currency';
import {
  formatDuration,
  formatTripDate,
  formatTripDateTime,
  formatTripTime,
  estimateArrival,
} from '../../lib/utils/datetime';
import { WhatsAppButton } from '../ui';

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function seatsPillClass(seats: number): string {
  if (seats <= 0) return 'bg-status-slate-bg text-status-slate-fg border-status-slate-border';
  if (seats === 1) return 'bg-status-amber-bg text-status-amber-fg border-status-amber-border';
  return 'bg-status-emerald-bg text-status-emerald-fg border-status-emerald-border';
}

interface TripCardProps {
  trip: TripCardType;
  className?: string;
  /**
   * Defaults to the permanent route page (/carpool/{origin}-to-{destination})
   * rather than this specific trip's own detail page — several trips can
   * share a route, and the route page is the durable, indexable landing
   * spot. The route page itself overrides this to link to the individual
   * trip's own nested detail page (/carpool/{route}/{id}) instead, since
   * there it needs to disambiguate between multiple trips on the same route.
   */
  href?: string;
}

export function TripCard({ trip, className, href }: TripCardProps) {
  const price = Number(trip.pricePerSeat).toLocaleString();
  const vehicle = trip.isReturnTrip ? trip.fleetVehicle : trip.userVehicle;
  const vehicleMake = vehicle?.make ?? '';
  const vehicleModel = vehicle?.model ?? '';
  const currency = getCurrencyCode(trip.userVehicle?.country);
  const poster = vehicle?.images?.[0];
  const pickupCount = trip.stops.filter((s) => s.type === 'PICKUP').length;
  const dropoffCount = trip.stops.filter((s) => s.type === 'DROPOFF').length;
  const hasMultipleStops = pickupCount > 1 || dropoffCount > 1;
  const hasRoute = trip.distanceKm != null && trip.durationMinutes != null;
  const arrival = hasRoute ? estimateArrival(trip.departureAt, trip.durationMinutes!) : null;
  const whatsappMessage = `Hi, I'm interested in your trip from ${titleCase(trip.originCity)} to ${titleCase(
    trip.destinationCity,
  )} on ${formatTripDateTime(trip.departureAt)}. Is a seat still available?`;
  const targetHref =
    href ?? `/carpool/${trip.originCity.toLowerCase()}-to-${trip.destinationCity.toLowerCase()}`;

  return (
    <Link
      href={targetHref}
      className={cn(
        // text-ink on the root: the card is an <a>, so without it children
        // inherit the link colour and the destination hover becomes a no-op.
        'group block overflow-hidden rounded-card border border-border-subtle bg-surface text-ink shadow-xs',
        'ease-spring transition-all duration-200',
        'hover:-translate-y-1.5 hover:border-brand-100 hover:shadow-md',
        className,
      )}
    >
      {/* Vehicle photo — always rendered so cards in a row stay the same height */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-hover">
        {poster ? (
          <Image
            src={poster.url}
            alt={poster.altText ?? `${vehicleMake} ${vehicleModel}`}
            fill
            className="ease-smooth object-cover transition-transform duration-500 group-hover:scale-[1.07]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-faint">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Header strip */}
      <div className="border-b border-border-subtle bg-page p-3.5">
        <div className="flex items-center gap-1.5 text-[15px] font-semibold leading-tight tracking-tight">
          <span className="truncate">{titleCase(trip.originCity)}</span>
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-brand-600" />
          <span className="truncate transition-colors group-hover:text-brand-700">
            {titleCase(trip.destinationCity)}
          </span>
        </div>
        <p className="mt-1.5 font-mono text-xs text-text-muted">
          {formatTripDate(trip.departureAt, { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · '}
          {formatTripTime(trip.departureAt)}
          {arrival && <> · arrives ~{formatTripTime(arrival.toISOString())}</>}
        </p>

        {/* Seats pill sits BELOW the route, not absolutely positioned over it —
            long city pairs (Rawalpindi → Faisalabad) ran under the old badge. */}
        <span
          className={cn(
            'mt-2.5 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold',
            seatsPillClass(trip.availableSeats),
          )}
        >
          {trip.availableSeats > 0
            ? `${trip.availableSeats} seat${trip.availableSeats !== 1 ? 's' : ''} left`
            : 'Full'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5 pb-4">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-semibold tracking-[-0.03em]">{currency} {price}</span>
          <span className="text-xs text-text-faint">/seat</span>
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
          <Car className="h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
          <span className="truncate">
            {vehicleMake} {vehicleModel}
            {trip.userVehicle?.color ? ` · ${trip.userVehicle.color}` : ''}
            {trip.isReturnTrip && trip.providerProfile ? ` · ${trip.providerProfile.businessName}` : ''}
          </span>
        </p>

        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-text-muted">
          <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
          <span className="line-clamp-1">
            {trip.pickupPoint}
            {trip.dropoffPoint ? ` → ${trip.dropoffPoint}` : ''}
          </span>
        </p>

        {hasMultipleStops && (
          <p className="mt-1 text-[11px] text-text-faint">
            {pickupCount > 1 ? `${pickupCount} pickup points` : null}
            {pickupCount > 1 && dropoffCount > 1 ? ' · ' : null}
            {dropoffCount > 1 ? `${dropoffCount} drop-off points` : null}
          </p>
        )}

        {hasRoute && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
            <Route className="h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
            <span>{trip.distanceKm} km</span>
            <Clock className="ml-1.5 h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
            <span>~{formatDuration(trip.durationMinutes!)} drive</span>
          </p>
        )}

        {/* Poster + WhatsApp */}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <span className="truncate text-xs text-text-muted">{trip.postedBy.name}</span>
          <span onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <WhatsAppButton phone={trip.contactNumber} message={whatsappMessage} variant="text" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader matching TripCard layout
export function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border-subtle bg-surface">
      {/* Warm shimmer. The old one used cold slate (#F1F5F9) and read as a grey
          hole punched in the warm page. */}
      <div className="aspect-video animate-shimmer bg-[linear-gradient(90deg,#FFF1EA_0px,#FFE4D9_120px,#FFF1EA_240px)] bg-[length:480px_100%]" />
      <div className="space-y-2.5 border-b border-border-subtle bg-page p-3.5">
        <div className="h-3.5 w-3/4 rounded-chip bg-surface-hover" />
        <div className="h-3 w-1/2 rounded-chip bg-surface-hover" />
        <div className="h-5 w-20 rounded-full bg-surface-hover" />
      </div>
      <div className="space-y-3 p-3.5 pb-4">
        <div className="h-4 w-1/3 rounded-chip bg-surface-hover" />
        <div className="h-3 w-1/2 rounded-chip bg-surface-hover" />
        <div className="flex justify-between border-t border-border-subtle pt-3">
          <div className="h-3 w-1/3 rounded-chip bg-surface-hover" />
          <div className="h-3 w-1/4 rounded-chip bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}
