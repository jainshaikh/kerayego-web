/**
 * Server-side fetch utility for Next.js Server Components.
 * Uses native fetch() with Next.js cache semantics — not Axios.
 * Only import this from Server Components (no 'use client').
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

interface FetchOptions {
  /** Seconds the response may be reused from Next's Data Cache (default 60). */
  revalidate?: number;
  tags?: string[];
  /**
   * Never cache: `cache: 'no-store'`. (Until 2026-11-10 "no cache" was spelled
   * `revalidate: false`, which this function turned into `revalidate: undefined`
   * — and with no `cache` option Next 14 then *auto-caches* the fetch with no
   * expiry, so vehicle detail pages were cached indefinitely.)
   */
  noStore?: boolean;
}

async function serverFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T | null> {
  const { revalidate = 60, tags, noStore = false } = options;
  const headers = { 'Content-Type': 'application/json' };

  try {
    const res = await fetch(
      `${API_BASE}${path}`,
      noStore ? { cache: 'no-store', headers } : { next: { revalidate, tags }, headers },
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json as T;
  } catch {
    return null;
  }
}

export interface ServerListingsResponse {
  success: boolean;
  data: import('../api/listings.api').ListingVehicleCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ServerVehicleDetailResponse {
  success: boolean;
  data: import('../api/listings.api').ListingVehicleDetail;
}

export async function fetchListings(searchParams: Record<string, string | string[] | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (val) qs.set(key, Array.isArray(val) ? val[0] : val);
  }
  const path = `/listings${qs.size ? `?${qs}` : ''}`;
  return serverFetch<ServerListingsResponse>(path, { revalidate: 60 });
}

/**
 * A city's cars offered for weekly & monthly rental (plan A84,
 * `GET /listings?weeklyMonthly=true`): "price to agree", no prices. Null when
 * the backend can't answer — including a backend deployed before 2026-11-11,
 * which rejects the unknown filter (400); the `offersWeeklyMonthly` check also
 * guards against one that would ignore it and return every car.
 */
export async function fetchWeeklyMonthlyListings(city: string, page = 1, limit = 24) {
  const res = await fetchListings({ city, weeklyMonthly: 'true', page: String(page), limit: String(limit) });
  if (!res) return null;
  if (res.data.some((vehicle) => vehicle.offersWeeklyMonthly !== true)) return null;
  return res;
}

/** How many cars in a city are offered for weekly & monthly rental — 0 when unknown. */
export async function fetchWeeklyMonthlyCount(city: string): Promise<number> {
  const res = await fetchWeeklyMonthlyListings(city, 1, 1);
  return res?.meta?.total ?? 0;
}

export async function fetchVehicleBySlug(slug: string) {
  // Never cached: each SSR render increments viewCount, and price, status and
  // booked-until must be current. generateMetadata and the page make the same
  // GET in one render, which React de-duplicates — one request, one view.
  return serverFetch<ServerVehicleDetailResponse>(`/listings/${slug}`, { noStore: true });
}

export async function fetchFeaturedListings(
  limit = 8,
  city?: string,
  lat?: number,
  lng?: number,
  radiusKm?: number,
) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (city) qs.set('city', city);
  if (lat !== undefined && lng !== undefined) {
    qs.set('lat', String(lat));
    qs.set('lng', String(lng));
    if (radiusKm !== undefined) qs.set('radiusKm', String(radiusKm));
  }
  return serverFetch<{ success: boolean; data: import('../api/listings.api').ListingVehicleCard[] }>(
    `/listings/featured?${qs}`,
    { revalidate: 300, tags: ['featured-listings'] },
  );
}

export async function fetchDistinctMakes() {
  return serverFetch<{ success: boolean; data: string[] }>('/listings/meta/makes', { revalidate: 3600 });
}

export async function fetchDistinctCities() {
  return serverFetch<{ success: boolean; data: string[] }>('/listings/meta/cities', { revalidate: 3600 });
}

export interface PriceIndexBucket {
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  medianPrice: number;
}

export interface PriceIndexData {
  generatedAt: string;
  overall: PriceIndexBucket | null;
  byCity: (PriceIndexBucket & { city: string })[];
  byMake: (PriceIndexBucket & { make: string })[];
}

export async function fetchPriceIndex() {
  return serverFetch<{ success: boolean; data: PriceIndexData }>('/listings/meta/price-index', {
    revalidate: 3600,
  });
}

// One stored snapshot per calendar month (Asia/Karachi), oldest first, at most
// 24. A month only exists once the backend's daily snapshot job has run in it;
// past months freeze at their last day's figures.
export interface PriceIndexHistoryEntry {
  month: string; // "YYYY-MM"
  generatedAt: string;
  overall: PriceIndexBucket;
  byCity: (PriceIndexBucket & { city: string })[];
}

export async function fetchPriceIndexHistory() {
  return serverFetch<{ success: boolean; data: PriceIndexHistoryEntry[] }>('/listings/meta/price-index/history', {
    revalidate: 3600,
  });
}

export interface ServerProvidersResponse {
  success: boolean;
  data: import('./providers.api').PublicProviderCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ServerProviderDetailResponse {
  success: boolean;
  data: import('./providers.api').PublicProviderDetail;
}

export async function fetchAllProviders(
  page = 1,
  limit = 12,
  city?: string,
  lat?: number,
  lng?: number,
  radiusKm?: number,
) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (city) qs.set('city', city);
  if (lat !== undefined && lng !== undefined) {
    qs.set('lat', String(lat));
    qs.set('lng', String(lng));
    if (radiusKm !== undefined) qs.set('radiusKm', String(radiusKm));
  }
  return serverFetch<ServerProvidersResponse>(`/providers?${qs}`, {
    revalidate: 120,
    tags: ['providers'],
  });
}

export async function fetchProviderBySlug(slug: string) {
  return serverFetch<ServerProviderDetailResponse>(`/providers/${slug}`, {
    revalidate: 60,
    tags: [`provider-${slug}`],
  });
}

export interface ServerTripsResponse {
  success: boolean;
  data: import('../api/trips.api').TripCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ServerTripDetailResponse {
  success: boolean;
  data: import('../api/trips.api').TripDetail;
}

export async function fetchTrips(searchParams: Record<string, string | string[] | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (val) qs.set(key, Array.isArray(val) ? val[0] : val);
  }
  const path = `/trips${qs.size ? `?${qs}` : ''}`;
  // Short cache — trip availability (seats/status) is time-sensitive
  return serverFetch<ServerTripsResponse>(path, { revalidate: 30 });
}

export async function fetchTripById(id: string) {
  return serverFetch<ServerTripDetailResponse>(`/trips/${id}`, { revalidate: 30 });
}

export async function fetchTripMetaCities() {
  return serverFetch<{ success: boolean; data: import('../api/trips.api').TripMetaCities }>(
    '/trips/meta/cities',
    { revalidate: 300 },
  );
}

export async function fetchTripRouteGroups() {
  return serverFetch<{ success: boolean; data: import('../api/trips.api').TripRouteGroup[] }>(
    '/trips/meta/routes',
    { revalidate: 60 },
  );
}

export async function fetchRatingSummary(
  subjectType: import('../api/reviews.api').ReviewSubjectType,
  subjectId: string,
) {
  return serverFetch<{ success: boolean; data: import('../api/reviews.api').RatingSummary }>(
    `/reviews/summary?subjectType=${subjectType}&subjectId=${subjectId}`,
    { revalidate: 300 },
  );
}
