import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, ChevronRight, Clock, Route as RouteIcon } from 'lucide-react';
import { fetchTripById } from '../../../../../lib/api/server';
import { getCurrencyCode } from '../../../../../lib/utils/currency';
import {
  estimateArrival,
  formatDuration,
  formatTripDate,
  formatTripDateTime,
  formatTripTime,
} from '../../../../../lib/utils/datetime';
import { Button, Card, WhatsAppButton } from '../../../../../components/ui';
import { RatingSummaryBadge } from '../../../../../components/common/RatingSummaryBadge';
import { ReviewsList } from '../../../../../components/common/ReviewsList';

interface PageProps {
  params: { route: string; id: string };
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const res = await fetchTripById(params.id);
  // notFound() here (not fallback metadata) catches a bad id at the metadata
  // step too, matching the vehicle detail page's fix (see its longer note —
  // app/(public)/rent-a-car/[city]/[makeModel]/[slug]/page.tsx). This route
  // has no loading.tsx ancestor, so the page component's own notFound() below
  // already sets a real 404 on its own; this fetch is deduped against that
  // identical call via Next's request memoization, so adding it here is free.
  if (!res?.data) notFound();

  const t = res.data;
  const description = `Trip from ${titleCase(t.originCity)} to ${titleCase(t.destinationCity)} on ${formatTripDate(t.departureAt, { dateStyle: 'medium' })}. ${getCurrencyCode(t.userVehicle?.country)} ${Number(t.pricePerSeat).toLocaleString()} per seat.`;
  const coverImage = t.userVehicle?.images?.[0]?.url;
  // Canonical is derived from the trip's own live route, not the URL's
  // [route] segment — if they ever mismatch (a stale/shared link), the
  // canonical still points at the correct permanent URL for this trip.
  const canonicalRoute = `${t.originCity.toLowerCase()}-to-${t.destinationCity.toLowerCase()}`;

  return {
    title: `${titleCase(t.originCity)} → ${titleCase(t.destinationCity)}`,
    description,
    alternates: {
      canonical: `/carpool/${canonicalRoute}/${t.id}`,
    },
    openGraph: {
      title: `${titleCase(t.originCity)} → ${titleCase(t.destinationCity)}`,
      description,
      images: coverImage
        ? [{ url: coverImage, alt: `${t.userVehicle.make} ${t.userVehicle.model}` }]
        : undefined,
    },
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const res = await fetchTripById(params.id);
  if (!res?.data) notFound();

  const trip = res.data;
  const price = Number(trip.pricePerSeat).toLocaleString();
  const currency = getCurrencyCode(trip.userVehicle?.country);
  const routeSlug = `${trip.originCity.toLowerCase()}-to-${trip.destinationCity.toLowerCase()}`;
  const hasRoute = trip.distanceKm != null && trip.durationMinutes != null;
  const arrival = hasRoute ? estimateArrival(trip.departureAt, trip.durationMinutes!) : null;
  const pickupStops = trip.stops.filter((s) => s.type === 'PICKUP');
  const dropoffStops = trip.stops.filter((s) => s.type === 'DROPOFF');

  const whatsappMessage = `Hi, I'm interested in your trip from ${titleCase(trip.originCity)} to ${titleCase(trip.destinationCity)} on ${formatTripDateTime(trip.departureAt)}. Is a seat still available?`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Carpool', item: '/carpool' },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${titleCase(trip.originCity)} → ${titleCase(trip.destinationCity)}`,
        item: `/carpool/${routeSlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: formatTripDate(trip.departureAt),
        item: `/carpool/${routeSlug}/${trip.id}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/carpool" className="hover:text-slate-700">
          Carpool
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link href={`/carpool/${routeSlug}`} className="hover:text-slate-700">
          {titleCase(trip.originCity)} → {titleCase(trip.destinationCity)}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="truncate font-semibold text-ink">{formatTripDate(trip.departureAt)}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Route + time */}
          <div>
            <div className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-ink">
              <span>{titleCase(trip.originCity)}</span>
              <ArrowRight className="h-5 w-5 text-brand-600" />
              <span>{titleCase(trip.destinationCity)}</span>
            </div>
            <p className="mt-2 font-mono text-sm text-text-muted">
              Departs{' '}
              {formatTripDate(trip.departureAt, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {' at '}
              {formatTripTime(trip.departureAt)}
              {' (PKT)'}
            </p>
            {hasRoute && arrival && (
              <p className="mt-1 font-mono text-xs text-text-muted">
                {trip.distanceKm} km · ~{formatDuration(trip.durationMinutes!)} drive · estimated arrival{' '}
                {formatTripTime(arrival.toISOString())} PKT
              </p>
            )}
          </div>

          {/* Vehicle photos */}
          {trip.userVehicle.images.length > 0 && (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {trip.userVehicle.images.map((image, index) => (
                <div
                  key={image.url}
                  className={`relative aspect-video overflow-hidden rounded-media border border-border-subtle ${index === 0 ? 'col-span-2 aspect-[16/9] sm:col-span-3' : ''}`}
                >
                  <Image
                    src={image.url}
                    alt={image.altText ?? `${trip.userVehicle.make} ${trip.userVehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 700px"
                    priority={index === 0}
                  />
                </div>
              ))}
            </section>
          )}

          {/* Pickup / dropoff */}
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-ink">Pickup &amp; drop-off</h2>
            <div>
              <p className="text-xs font-medium text-text-faint">
                Pickup point{pickupStops.length > 1 ? 's' : ''}
              </p>
              {pickupStops.length > 1 ? (
                <ol className="mt-1 space-y-1">
                  {pickupStops.map((stop, i) => (
                    <li key={stop.id} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-text-faint">{i + 1}.</span>
                      {stop.label}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-0.5 text-sm text-slate-700">{trip.pickupPoint}</p>
              )}
            </div>
            {dropoffStops.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-faint">
                  Drop-off point{dropoffStops.length > 1 ? 's' : ''}
                </p>
                {dropoffStops.length > 1 ? (
                  <ol className="mt-1 space-y-1">
                    {dropoffStops.map((stop, i) => (
                      <li key={stop.id} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-text-faint">{i + 1}.</span>
                        {stop.label}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-0.5 text-sm text-slate-700">{trip.dropoffPoint}</p>
                )}
              </div>
            )}
            {(pickupStops.length > 1 || dropoffStops.length > 1) && (
              <p className="text-xs text-text-faint">
                Every rider travels the full route — these are just alternate meeting points at each end.
              </p>
            )}
            {hasRoute && arrival && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-4 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <RouteIcon className="h-4 w-4 text-text-faint" />
                  {trip.distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-text-faint" />
                  ~{formatDuration(trip.durationMinutes!)} drive
                </span>
                <span className="text-xs text-text-muted">
                  Estimated to reach drop-off around{' '}
                  <span className="font-semibold text-ink">{formatTripTime(arrival.toISOString())} PKT</span>
                  {' · based on typical drive time, not live traffic'}
                </span>
              </div>
            )}
          </Card>

          {/* Vehicle info */}
          <Card>
            <h2 className="mb-3 text-base font-semibold text-ink">Vehicle</h2>
            <p className="font-medium text-ink">
              {trip.userVehicle.make} {trip.userVehicle.model}
              {trip.userVehicle.year ? ` (${trip.userVehicle.year})` : ''}
            </p>
            {trip.userVehicle.color && (
              <p className="mt-1 text-sm text-text-muted">{trip.userVehicle.color}</p>
            )}
            <RatingSummaryBadge
              subjectType="USER_VEHICLE"
              subjectId={trip.userVehicle.id}
              size="sm"
              className="mt-2"
            />
          </Card>

          {trip.notes && (
            <Card>
              <h2 className="mb-2 text-base font-semibold text-ink">Notes from the driver</h2>
              <p className="text-sm text-text-muted">{trip.notes}</p>
            </Card>
          )}

          {/* Poster */}
          <Card>
            <h2 className="mb-3 text-base font-semibold text-ink">Posted by</h2>
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-control bg-status-blue-bg text-[15px] font-semibold text-brand-600">
                {trip.postedBy.name[0]}
              </div>
              <div>
                <p className="font-semibold text-ink">{trip.postedBy.name}</p>
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Identity &amp; documents verified
                </p>
                <RatingSummaryBadge
                  subjectType="USER"
                  subjectId={trip.postedBy.id}
                  size="sm"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Reviews */}
          <Card>
            <ReviewsList subjectType="USER" subjectId={trip.postedBy.id} title="Driver reviews" />
          </Card>
        </div>

        {/* Right column — contact card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-3.5">
            <Card padding="lg" className="shadow-md">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[26px] font-semibold tracking-tight text-ink">
                  {currency} {price}
                </span>
                <span className="text-[13px] text-text-muted">/seat</span>
              </div>
              <p className="mt-1 text-[13px] text-text-muted">
                {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} available
              </p>

              <div className="mt-5 space-y-2.5">
                {trip.availableSeats > 0 ? (
                  <Link href={`/carpool/${routeSlug}/${trip.id}/inquire`} className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      Request seats
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="lg" className="w-full" disabled>
                    Full — no seats left
                  </Button>
                )}
                <WhatsAppButton
                  phone={trip.contactNumber}
                  message={whatsappMessage}
                  label="WhatsApp the driver"
                />
                <p className="mt-2.5 text-center text-xs text-text-faint">
                  The driver accepts or declines your request — you&apos;ll be notified either way
                </p>
              </div>

              <div className="mt-4 border-t border-border-subtle pt-4 text-center">
                <p className="mb-1 text-xs text-text-faint">Or call</p>
                <a
                  href={`tel:${trip.contactNumber}`}
                  className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-600"
                >
                  {trip.contactNumber}
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
