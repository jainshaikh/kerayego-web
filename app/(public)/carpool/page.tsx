import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchTripRouteGroups, fetchTripMetaCities } from '../../../lib/api/server';
import { RouteGroupCard } from '../../../components/trips/RouteGroupCard';
import { EmptyState } from '../../../components/ui';
import { Route as RouteIcon } from 'lucide-react';
import type { TripRouteGroup, TripMetaCities } from '../../../lib/api/trips.api';

function toDisplayName(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const metadata: Metadata = {
  title: 'Carpool — Share a Ride Between Cities',
  description:
    'Carpool and share a ride between cities in Pakistan. Browse drivers heading to your destination on your date and contact them directly on WhatsApp — no fees, no middleman.',
  keywords: [
    'carpool Pakistan',
    'share a ride',
    'share your ride',
    'intercity carpool',
    'ride sharing Pakistan',
    'find a ride between cities',
  ],
  alternates: {
    canonical: '/carpool',
  },
};

export default async function CarpoolPage() {
  const [routesRes, citiesRes] = await Promise.all([fetchTripRouteGroups(), fetchTripMetaCities()]);

  const routes: TripRouteGroup[] = routesRes?.data ?? [];
  const cities: TripMetaCities = citiesRes?.data ?? { origins: [], destinations: [] };
  const totalTrips = routes.reduce((sum, r) => sum + r.tripCount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
          Ride sharing
        </p>
        <h1 className="text-[30px] font-bold tracking-[-0.04em] text-ink">Carpool</h1>
        <p className="mt-2 text-sm text-text-muted">
          {totalTrips > 0
            ? `${totalTrips.toLocaleString()} upcoming trips across ${routes.length} route${routes.length !== 1 ? 's' : ''} — find a ride and connect with the driver on WhatsApp`
            : 'Going from one city to another? Find a driver already headed your way.'}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Share a ride between cities — connect directly, no fees.
        </p>
        <p className="mt-2 text-xs text-text-faint">
          First time carpooling?{' '}
          <Link href="/guides/carpool-safety-pakistan" className="font-semibold text-brand-700 hover:underline">
            Read our safety guide
          </Link>
          .
        </p>
      </div>

      {routes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <RouteGroupCard key={`${route.originCity}-to-${route.destinationCity}`} route={route} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={RouteIcon}
          title="No trips posted yet"
          description="Check back soon, or be the first to post a trip."
        />
      )}

      {cities.origins.length > 0 && (
        <div className="mt-14 border-t border-border-subtle pt-8">
          <h2 className="text-sm font-semibold text-ink">Browse by city</h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {cities.origins.map((city) => (
              <Link
                key={city}
                href={`/carpool/${city}`}
                className="inline-flex h-9 items-center rounded-control border border-border-subtle bg-page px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                {toDisplayName(city)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
