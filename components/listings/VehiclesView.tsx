'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Heart, SearchX, SlidersHorizontal } from 'lucide-react';
import { VehicleCard, VehicleCardSkeleton } from './VehicleCard';
import {
  listingsApi,
  type ListingFilters,
  type ListingsResponse,
} from '../../lib/api/listings.api';
import { cn } from '../../lib/utils/cn';
import { Button, Card, DebouncedInput, EmptyState, Pagination, PillToggle, Select } from '../ui';
import { LocationSearch } from '../maps/LocationSearch';
import { ResultsMap } from '../maps/ResultsMap';
import { DEFAULT_NEARBY_RADIUS_KM, clearUserLocation, type UserLocation } from '../../lib/utils/userLocation';
import { useAuth } from '../../hooks/useAuth';
import { useSavedVehicles } from '../../hooks/useSavedVehicles';

const TRANSMISSION_OPTS = [
  { value: '', label: 'Any' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CVT', label: 'CVT' },
];

const FUEL_OPTS = [
  { value: '', label: 'Any' },
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const SORT_OPTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most popular' },
];

interface VehiclesViewProps {
  initialData: ListingsResponse | null;
  makes: string[];
  cities: string[];
  /** Seeded from the `userLocation` cookie server-side, same pattern the old `defaultCity` used. */
  initialLocation?: UserLocation | null;
}

function parseSearchParams(searchParams: URLSearchParams): ListingFilters {
  return {
    search: searchParams.get('search') || undefined,
    make: searchParams.get('make') || undefined,
    fuelType: searchParams.get('fuelType') || undefined,
    transmission: searchParams.get('transmission') || undefined,
    priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
    city: searchParams.get('city') || undefined,
    seats: searchParams.get('seats') ? Number(searchParams.get('seats')) : undefined,
    sort: (searchParams.get('sort') as ListingFilters['sort']) || 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  };
}

export function VehiclesView({ initialData, makes, cities, initialLocation }: VehiclesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [location, setLocation] = useState<UserLocation | null>(initialLocation ?? null);
  // LocationSearch keeps its own internal "current" display state, seeded
  // once from the cookie on mount — it has no way to know when the parent
  // clears location out from under it (e.g. picking a city). Bumping this
  // key forces LocationSearch to remount and re-read the now-cleared cookie,
  // so its "Near ..." display doesn't go stale.
  const [locationKey, setLocationKey] = useState(0);

  const filters = parseSearchParams(searchParams);
  const queryFilters: ListingFilters = location
    ? { ...filters, lat: location.lat, lng: location.lng, radiusKm: DEFAULT_NEARBY_RADIUS_KM }
    : filters;

  const hrefForPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (p > 1) params.set('page', String(p)); else params.delete('page');
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const updateFilter = useCallback(
    // 'replace' is for text fields committed via DebouncedInput — those land
    // one settled value at a time already, but still shouldn't each add a
    // separate back-button stop; 'push' (the default) stays for discrete
    // choices like selects/toggles, where a history entry per change is
    // actually useful.
    (key: string, value: string | number | undefined, method: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      // Reset to page 1 when filter changes (unless it's a page change)
      if (key !== 'page') params.set('page', '1');
      router[method](`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // `initialData` is a one-time SSR snapshot computed for whatever location
  // was active at render time (initialLocation) — once the visitor changes
  // location client-side, that snapshot no longer matches the new query key.
  // React Query treats non-undefined `initialData` as fresh for `staleTime`
  // regardless of which key it's attached to, so without this guard a
  // location change would silently keep showing the stale SSR result until
  // an actual page reload recomputed it from scratch.
  const matchesInitialLocation = location === (initialLocation ?? null);

  const { data, isFetching } = useQuery({
    queryKey: ['listings', queryFilters],
    queryFn: () => listingsApi.getAll(queryFilters),
    initialData: matchesInitialLocation ? initialData ?? undefined : undefined,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: !favoritesOnly,
  });

  const favorites = useSavedVehicles(favoritesPage, 12);

  // getSavedVehicles doesn't compute a saved vehicle's current booking status
  // (that's specific to browse/search) — default to AVAILABLE so it satisfies
  // the shared ListingVehicleCard shape <VehicleCard> renders either way.
  const vehicles = favoritesOnly
    ? (favorites.data?.data.map((entry) => ({
        ...entry.vehicle,
        availability: 'AVAILABLE' as const,
        bookedUntil: null,
      })) ?? [])
    : (data?.data ?? []);
  const meta = favoritesOnly ? favorites.data?.meta : data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = favoritesOnly ? favoritesPage : (filters.page ?? 1);
  const isLoadingResults = favoritesOnly ? favorites.isFetching : isFetching;
  const mapPins = vehicles
    .filter((v) => v.showroom?.mapLat != null && v.showroom?.mapLng != null)
    .map((v) => ({
      id: v.id,
      lat: v.showroom!.mapLat as number,
      lng: v.showroom!.mapLng as number,
      label: v.title,
    }));

  const hasActiveFilters = !!(
    filters.search ||
    filters.make ||
    filters.fuelType ||
    filters.transmission ||
    filters.city ||
    filters.priceMin ||
    filters.priceMax ||
    filters.seats
  );

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
    if (location) {
      clearUserLocation();
      setLocation(null);
      setLocationKey((k) => k + 1);
    }
  };

  // "City" and "Near me" are alternative ways to narrow results, not
  // combinable filters — otherwise picking a city (or "All cities") while a
  // location is still set from an earlier visit silently keeps restricting
  // results to that old location, which looks like the city filter is broken.
  const handleCityChange = (value: string | undefined) => {
    updateFilter('city', value);
    if (location) {
      clearUserLocation();
      setLocation(null);
      setLocationKey((k) => k + 1);
    }
  };

  const handleLocationChange = (next: UserLocation | null) => {
    setLocation(next);
    if (next && filters.city) updateFilter('city', undefined);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
      {/* Filter sidebar — desktop */}
      <aside className="hidden w-[236px] flex-shrink-0 lg:block">
        <FilterPanel
          filters={filters}
          makes={makes}
          cities={cities}
          onUpdate={updateFilter}
          onCityChange={handleCityChange}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          onLocationChange={handleLocationChange}
          locationKey={locationKey}
          location={location}
          mapPins={mapPins}
        />
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Toolbar */}
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
            </Button>

            {isAuthenticated && (
              <PillToggle
                active={favoritesOnly}
                onClick={() => {
                  setFavoritesOnly((v) => !v);
                  setFavoritesPage(1);
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Heart className={cn('h-3.5 w-3.5', favoritesOnly && 'fill-current')} />
                  My favorites
                </span>
              </PillToggle>
            )}

            <p className="text-sm text-text-muted">
              {isLoadingResults ? (
                'Loading…'
              ) : meta ? (
                <>
                  {meta.total.toLocaleString()} vehicle{meta.total !== 1 ? 's' : ''}
                </>
              ) : (
                ''
              )}
            </p>
          </div>

          {/* Sort */}
          <Select
            value={filters.sort ?? 'newest'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="w-auto"
          >
            {SORT_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Mobile filter drawer */}
        {showFilters && (
          <Card className="mb-3.5 lg:hidden">
            <FilterPanel
              filters={filters}
              makes={makes}
              cities={cities}
              onUpdate={updateFilter}
              onCityChange={handleCityChange}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
              onLocationChange={handleLocationChange}
              locationKey={locationKey}
              location={location}
              mapPins={mapPins}
            />
          </Card>
        )}

        {/* Grid */}
        {isLoadingResults && vehicles.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={favoritesOnly ? Heart : SearchX}
            title={favoritesOnly ? 'No favorites yet' : 'Nothing matches those filters'}
            description={
              favoritesOnly
                ? 'Tap the heart on a vehicle to save it here.'
                : 'Try widening the price range or removing a filter.'
            }
            action={
              favoritesOnly
                ? undefined
                : hasActiveFilters
                  ? { label: 'Clear all filters', onClick: clearFilters, variant: 'secondary' }
                  : undefined
            }
          />
        ) : (
          <>
            <div
              className={cn(
                'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3',
                isLoadingResults && 'pointer-events-none opacity-70 transition-opacity',
              )}
            >
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>

            {favoritesOnly ? (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setFavoritesPage(p)}
                className="mt-7"
              />
            ) : (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                hrefForPage={hrefForPage}
                className="mt-7"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface FilterPanelProps {
  filters: ListingFilters;
  makes: string[];
  cities: string[];
  onUpdate: (key: string, value: string | number | undefined, method?: 'push' | 'replace') => void;
  onCityChange: (value: string | undefined) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  onLocationChange: (location: UserLocation | null) => void;
  locationKey: number;
  location: UserLocation | null;
  mapPins: { id: string; lat: number; lng: number; label: string }[];
}

function FilterPanel({
  filters,
  makes,
  cities,
  onUpdate,
  onCityChange,
  hasActiveFilters,
  onClear,
  onLocationChange,
  locationKey,
  location,
  mapPins,
}: FilterPanelProps) {
  const groupLabelCls = 'mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted';

  return (
    <Card className="space-y-[18px]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">Filters</p>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-xs font-semibold text-brand-600 hover:underline">
            Reset
          </button>
        )}
      </div>

      <DebouncedInput
        label="Search"
        placeholder="Make, model, or keyword"
        value={filters.search ?? ''}
        onCommit={(text) => onUpdate('search', text || undefined, 'replace')}
      />

      <Select label="Make" value={filters.make ?? ''} onChange={(e) => onUpdate('make', e.target.value || undefined)}>
        <option value="">All makes</option>
        {makes.map((m) => (
          <option key={m} value={m}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </option>
        ))}
      </Select>

      {cities.length > 0 && (
        <Select label="City" value={filters.city ?? ''} onChange={(e) => onCityChange(e.target.value || undefined)}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>
      )}

      <div>
        <div className={groupLabelCls}>Near me</div>
        <LocationSearch key={locationKey} onLocationChange={onLocationChange} />
        {location && mapPins.length > 0 && (
          <ResultsMap
            className="mt-2.5 h-48 w-full overflow-hidden rounded-media border border-border-subtle"
            center={{ lat: location.lat, lng: location.lng }}
            radiusKm={DEFAULT_NEARBY_RADIUS_KM}
            pins={mapPins}
          />
        )}
      </div>

      <div>
        {/* No single currency applies here — results can span multiple markets; each result card shows its own. */}
        <div className={groupLabelCls}>Price per day</div>
        <div className="flex gap-2">
          <DebouncedInput
            type="number"
            placeholder="Min"
            value={filters.priceMin?.toString() ?? ''}
            onCommit={(text) => onUpdate('priceMin', text ? Number(text) : undefined, 'replace')}
            wrapperClassName="w-1/2"
          />
          <DebouncedInput
            type="number"
            placeholder="Max"
            value={filters.priceMax?.toString() ?? ''}
            onCommit={(text) => onUpdate('priceMax', text ? Number(text) : undefined, 'replace')}
            wrapperClassName="w-1/2"
          />
        </div>
      </div>

      <div>
        <div className={groupLabelCls}>Transmission</div>
        <div className="flex flex-wrap gap-1.5">
          {TRANSMISSION_OPTS.map((opt) => (
            <PillToggle
              key={opt.value}
              active={(filters.transmission ?? '') === opt.value}
              onClick={() => onUpdate('transmission', opt.value || undefined)}
            >
              {opt.label}
            </PillToggle>
          ))}
        </div>
      </div>

      <div>
        <div className={groupLabelCls}>Fuel type</div>
        <div className="flex flex-wrap gap-1.5">
          {FUEL_OPTS.map((opt) => (
            <PillToggle
              key={opt.value}
              active={(filters.fuelType ?? '') === opt.value}
              onClick={() => onUpdate('fuelType', opt.value || undefined)}
            >
              {opt.label}
            </PillToggle>
          ))}
        </div>
      </div>

      <Select
        label="Min seats"
        value={filters.seats ?? ''}
        onChange={(e) => onUpdate('seats', e.target.value ? Number(e.target.value) : undefined)}
      >
        <option value="">Any</option>
        {[2, 4, 5, 7, 8, 9, 12].map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </Select>
    </Card>
  );
}
