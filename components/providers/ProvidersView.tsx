'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { providersApi, type ProvidersListResponse } from '../../lib/api/providers.api';
import { ProviderCard } from './ProviderCard';
import { Pagination, Select } from '../ui';
import { LocationSearch } from '../maps/LocationSearch';
import { ResultsMap } from '../maps/ResultsMap';
import { DEFAULT_NEARBY_RADIUS_KM, clearUserLocation, type UserLocation } from '../../lib/utils/userLocation';

interface ProvidersViewProps {
  initialData: ProvidersListResponse | null;
  cities: string[];
  /** Seeded from the `userLocation` cookie server-side, same pattern the old `defaultCity` used. */
  initialLocation?: UserLocation | null;
}

export function ProvidersView({ initialData, cities, initialLocation }: ProvidersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState<UserLocation | null>(initialLocation ?? null);
  // LocationSearch keeps its own internal "current" display state, seeded
  // once from the cookie on mount — it has no way to know when the parent
  // clears location out from under it (e.g. picking a city). Bumping this
  // key forces LocationSearch to remount and re-read the now-cleared cookie,
  // so its "Near ..." display doesn't go stale.
  const [locationKey, setLocationKey] = useState(0);

  const city = searchParams.get('city') || undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  const updateParam = (key: string, value: string | number | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    if (key !== 'page') params.set('page', '1');
    router.push(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false });
  };

  const hrefForPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    const qs = params.toString();
    return qs ? `${pathname}${qs ? `?${qs}` : ''}` : pathname;
  };

  // "City" and "Near me" are alternative ways to narrow the list, not
  // combinable filters — otherwise picking a city (or "All cities") while a
  // location is still set from an earlier visit silently keeps restricting
  // results to that old location, which looks like the city filter is broken.
  const handleCityChange = (value: string | undefined) => {
    updateParam('city', value);
    if (location) {
      clearUserLocation();
      setLocation(null);
      setLocationKey((k) => k + 1);
    }
  };

  const handleLocationChange = (next: UserLocation | null) => {
    setLocation(next);
    if (next && city) updateParam('city', undefined);
  };

  // `initialData` is a one-time SSR snapshot computed for whatever location
  // was active at render time (initialLocation) — once the visitor changes
  // location client-side, that snapshot no longer matches the new query key.
  // React Query treats non-undefined `initialData` as fresh for `staleTime`
  // regardless of which key it's attached to, so without this guard a
  // location change would silently keep showing the stale SSR result until
  // an actual page reload recomputed it from scratch.
  const matchesInitialLocation = location === (initialLocation ?? null);

  const { data, isFetching } = useQuery({
    queryKey: ['providers', city, page, location],
    queryFn: () =>
      providersApi.getAllPublic(page, 12, city, location?.lat, location?.lng, location ? DEFAULT_NEARBY_RADIUS_KM : undefined),
    initialData: matchesInitialLocation ? initialData ?? undefined : undefined,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const providers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      {cities.length > 0 && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-[220px]">
            <Select label="City" value={city ?? ''} onChange={(e) => handleCityChange(e.target.value || undefined)}>
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          {city && (
            <button
              onClick={() => handleCityChange(undefined)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear city filter
            </button>
          )}
        </div>
      )}

      <LocationSearch key={locationKey} className="mb-6" onLocationChange={handleLocationChange} />

      {location && providers.length > 0 && (
        <ResultsMap
          className="mb-6 h-72 w-full overflow-hidden rounded-2xl border border-slate-200"
          center={{ lat: location.lat, lng: location.lng }}
          radiusKm={DEFAULT_NEARBY_RADIUS_KM}
          pins={providers
            .filter((p) => p.showrooms?.[0]?.mapLat != null && p.showrooms?.[0]?.mapLng != null)
            .map((p) => ({
              id: p.id,
              lat: p.showrooms[0].mapLat as number,
              lng: p.showrooms[0].mapLng as number,
              label: p.businessName,
            }))}
        />
      )}

      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700">
            {city ? `No providers in ${city.charAt(0).toUpperCase() + city.slice(1)} yet` : 'No providers yet'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {city ? (
              <button onClick={() => handleCityChange(undefined)} className="hover:underline">
                Browse all cities
              </button>
            ) : (
              'Check back soon'
            )}
          </p>
        </div>
      ) : (
        <div className={isFetching ? 'pointer-events-none opacity-70 transition-opacity' : undefined}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} hrefForPage={hrefForPage} className="mt-10" />
          )}
        </div>
      )}
    </div>
  );
}
