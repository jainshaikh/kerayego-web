'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { TripCard, TripCardSkeleton } from './TripCard';
import {
  tripsApi,
  type TripFilters,
  type TripsResponse,
  type TripMetaCities,
} from '../../lib/api/trips.api';
import { cn } from '../../lib/utils/cn';
import { Button, Card, DebouncedInput, EmptyState, Input, Pagination, Select } from '../ui';

const SORT_OPTS = [
  { value: 'departure_asc', label: 'Soonest departure' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newly posted' },
];

interface TripsViewProps {
  initialData: TripsResponse | null;
  cities: TripMetaCities;
  /** Fixes this filter and hides its select — used by /carpool/[route], which is already scoped to a city by the URL. */
  lockedOriginCity?: string;
  /** Same as lockedOriginCity, for the destination side. Only set for a full two-city route (e.g. /carpool/hyderabad-to-karachi). */
  lockedDestinationCity?: string;
}

function parseSearchParams(searchParams: URLSearchParams, lockedOriginCity?: string, lockedDestinationCity?: string): TripFilters {
  return {
    originCity: lockedOriginCity ?? searchParams.get('originCity') ?? undefined,
    destinationCity: lockedDestinationCity ?? searchParams.get('destinationCity') ?? undefined,
    date: searchParams.get('date') || undefined,
    minSeats: searchParams.get('minSeats') ? Number(searchParams.get('minSeats')) : undefined,
    sort: (searchParams.get('sort') as TripFilters['sort']) || 'departure_asc',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
    pickupPoint: searchParams.get('pickupPoint') || undefined,
    dropoffPoint: searchParams.get('dropoffPoint') || undefined,
    vehicleSearch: searchParams.get('vehicleSearch') || undefined,
  };
}

export function TripsView({ initialData, cities, lockedOriginCity, lockedDestinationCity }: TripsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const filters = parseSearchParams(searchParams, lockedOriginCity, lockedDestinationCity);
  // `initialData` is a one-time SSR snapshot computed for whatever filters
  // were in the URL at render time — captured once here so it can be scoped
  // to exactly that combination. React Query treats non-undefined
  // `initialData` as fresh for `staleTime` regardless of which query key it's
  // attached to, so without this guard, changing ANY filter (a new query
  // key) would silently keep showing the original unfiltered SSR result
  // until an actual page reload recomputed it from scratch.
  const [initialFilters] = useState(filters);
  const matchesInitialFilters = JSON.stringify(filters) === JSON.stringify(initialFilters);

  const updateFilter = useCallback(
    // 'replace' is for text fields committed via DebouncedInput — see the
    // identical note in VehiclesView.tsx's updateFilter.
    (key: string, value: string | number | undefined, method: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      if (key !== 'page') params.set('page', '1');
      router[method](`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const { data, isFetching } = useQuery({
    queryKey: ['trips', filters],
    queryFn: () => tripsApi.getAll(filters),
    initialData: matchesInitialFilters ? initialData ?? undefined : undefined,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const trips = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = filters.page ?? 1;

  const hasActiveFilters = !!(
    (!lockedOriginCity && filters.originCity) ||
    (!lockedDestinationCity && filters.destinationCity) ||
    filters.date ||
    filters.minSeats ||
    filters.priceMin ||
    filters.priceMax ||
    filters.pickupPoint ||
    filters.dropoffPoint ||
    filters.vehicleSearch
  );

  const clearFilters = () => router.push(pathname, { scroll: false });

  const hrefForPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const routeHref = (originCity: string, destinationCity: string) =>
    `/carpool/${originCity.toLowerCase()}-to-${destinationCity.toLowerCase()}/`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
      {/* Filter sidebar — desktop. Sticky below the 68px navbar. */}
      <aside className="hidden w-[236px] flex-shrink-0 lg:block">
        <div className="sticky top-[92px]">
          <FilterPanel
            filters={filters}
            cities={cities}
            onUpdate={updateFilter}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
            lockedOriginCity={lockedOriginCity}
            lockedDestinationCity={lockedDestinationCity}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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

            <p className="text-sm text-text-muted">
              {isFetching && !meta ? (
                'Loading…'
              ) : meta ? (
                <>
                  <b className="font-mono font-semibold text-ink">{meta.total.toLocaleString()}</b>{' '}
                  trip{meta.total !== 1 ? 's' : ''}
                </>
              ) : (
                ''
              )}
            </p>
          </div>

          <Select
            value={filters.sort ?? 'departure_asc'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="w-auto"
            aria-label="Sort trips"
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
          <Card className="mb-4 lg:hidden">
            <FilterPanel
              filters={filters}
              cities={cities}
              onUpdate={updateFilter}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
              lockedOriginCity={lockedOriginCity}
              lockedDestinationCity={lockedDestinationCity}
            />
          </Card>
        )}

        {/* Grid */}
        {isFetching && trips.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No trips found"
            description="Try a different city, date, or clear your filters."
            action={
              hasActiveFilters
                ? { label: 'Clear all filters', onClick: clearFilters, variant: 'secondary' }
                : undefined
            }
          />
        ) : (
          <>
            <div
              className={cn(
                'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3',
                isFetching && 'pointer-events-none opacity-70 transition-opacity',
              )}
            >
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  href={`${routeHref(trip.originCity, trip.destinationCity)}${trip.id}`}
                />
              ))}
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              hrefForPage={hrefForPage}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
}

interface FilterPanelProps {
  filters: TripFilters;
  cities: TripMetaCities;
  onUpdate: (key: string, value: string | number | undefined, method?: 'push' | 'replace') => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  lockedOriginCity?: string;
  lockedDestinationCity?: string;
}

function FilterPanel({
  filters,
  cities,
  onUpdate,
  hasActiveFilters,
  onClear,
  lockedOriginCity,
  lockedDestinationCity,
}: FilterPanelProps) {
  const groupLabelCls = 'mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted';

  return (
    <Card className="space-y-[18px] bg-page">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">Filters</p>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            Reset
          </button>
        )}
      </div>

      {!lockedDestinationCity && (
        <Select
          label="Going to"
          value={filters.destinationCity ?? ''}
          onChange={(e) => onUpdate('destinationCity', e.target.value || undefined)}
        >
          <option value="">Any city</option>
          {cities.destinations.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>
      )}

      {!lockedOriginCity && (
        <Select
          label="Leaving from"
          value={filters.originCity ?? ''}
          onChange={(e) => onUpdate('originCity', e.target.value || undefined)}
        >
          <option value="">Any city</option>
          {cities.origins.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>
      )}

      <Input
        type="date"
        label="Departure date"
        value={filters.date ?? ''}
        onChange={(e) => onUpdate('date', e.target.value || undefined)}
      />

      <Select
        label="Min seats needed"
        value={filters.minSeats ?? ''}
        onChange={(e) => onUpdate('minSeats', e.target.value ? Number(e.target.value) : undefined)}
      >
        <option value="">Any</option>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </Select>

      <div>
        <div className={groupLabelCls}>Price per seat</div>
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

      <DebouncedInput
        label="Vehicle"
        placeholder="Make or model"
        value={filters.vehicleSearch ?? ''}
        onCommit={(text) => onUpdate('vehicleSearch', text || undefined, 'replace')}
      />

      <DebouncedInput
        label="Pickup point"
        placeholder="Search pickup point"
        value={filters.pickupPoint ?? ''}
        onCommit={(text) => onUpdate('pickupPoint', text || undefined, 'replace')}
      />

      <DebouncedInput
        label="Drop-off point"
        placeholder="Search drop-off point"
        value={filters.dropoffPoint ?? ''}
        onCommit={(text) => onUpdate('dropoffPoint', text || undefined, 'replace')}
      />
    </Card>
  );
}
