import type { MetadataRoute } from 'next';
import { getVehicleUrl } from '../lib/utils/vehicleUrl';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentalmarket.ae';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

async function fetchJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// The public /listings endpoint caps `limit` at 100 (a deliberate anti-abuse
// limit shared by every paginated endpoint — not something to raise just for
// the sitemap's convenience), so a single limit=500 request silently 400s.
// That was true of the *previous* version of this function too: it requested
// limit=500, the backend rejected it, fetchJson's catch swallowed the error,
// and every individual vehicle page silently vanished from the sitemap.
// Paginate properly instead, capped at 20 pages (2,000 vehicles) as a sanity
// backstop against something going wrong, not a real expected ceiling.
async function fetchVehicleUrls(): Promise<{ path: string; updatedAt: string }[]> {
  type Vehicle = {
    slug: string;
    make: string;
    model: string;
    showroom: { city: string } | null;
    updatedAt: string;
  };
  const PAGE_SIZE = 100;
  const MAX_PAGES = 20;
  const results: { path: string; updatedAt: string }[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await fetchJson<{ data: Vehicle[]; meta: { hasNextPage: boolean } }>(
      `/listings?limit=${PAGE_SIZE}&page=${page}&sort=newest`,
      3600,
    );
    if (!data?.data?.length) break;
    for (const v of data.data) {
      results.push({ path: getVehicleUrl(v, v.showroom?.city), updatedAt: v.updatedAt });
    }
    if (!data.meta?.hasNextPage) break;
  }

  return results;
}

// /providers has no enforced max `limit` today (unlike /listings), but
// paginating properly here too means this doesn't silently break the same
// way if that ever changes — same reasoning as fetchVehicleUrls above.
async function fetchProviders(): Promise<{ slug: string; updatedAt: string }[]> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 20;
  const results: { slug: string; updatedAt: string }[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await fetchJson<{
      data: { slug: string; updatedAt: string }[];
      meta: { hasNextPage: boolean };
    }>(`/providers?limit=${PAGE_SIZE}&page=${page}`, 3600);
    if (!data?.data?.length) break;
    results.push(...data.data);
    if (!data.meta?.hasNextPage) break;
  }

  return results;
}

async function fetchCities(): Promise<string[]> {
  const data = await fetchJson<{ data: string[] }>('/listings/meta/cities', 3600);
  return data?.data ?? [];
}

function toSlug(make: string, model?: string): string {
  const combined = model ? `${make} ${model}` : make;
  return combined.trim().toLowerCase().replace(/\s+/g, '-');
}

// City+make(-model) pages (/rent-a-car/[city]/[makeModel]) are gated behind
// real inventory (see that page's notFound() check) — mirror the same gate
// here so the sitemap never links a combination that 404s. Not exhaustive
// (only combos present in the first 100 listings per city are counted), but
// every entry it does produce is backed by real, currently-live inventory.
async function fetchCityMakeModelSlugs(cities: string[]): Promise<{ city: string; slug: string }[]> {
  const perCity = await Promise.all(
    cities.map(async (city) => {
      const data = await fetchJson<{ data: { make: string; model: string }[] }>(
        `/listings?city=${encodeURIComponent(city)}&limit=100`,
        3600,
      );
      const seen = new Map<string, { city: string; slug: string }>();
      for (const v of data?.data ?? []) {
        const make = v.make.toLowerCase();
        const model = v.model?.toLowerCase();
        // Both the make-only and make+model pages are real, distinct,
        // linkable landing pages — include both when a model is known.
        seen.set(`${city}/${make}`, { city, slug: toSlug(make) });
        if (model) seen.set(`${city}/${make}/${model}`, { city, slug: toSlug(make, model) });
      }
      return Array.from(seen.values());
    }),
  );
  return perCity.flat();
}

// Providers don't have their own distinct-cities endpoint, so this reuses the
// listings city list as the candidate set (showrooms feed both) and gates
// each on actually having at least one provider before including it.
async function fetchProviderCities(cities: string[]): Promise<string[]> {
  const results = await Promise.all(
    cities.map(async (city) => {
      const data = await fetchJson<{ meta: { total: number } }>(
        `/providers?city=${encodeURIComponent(city)}&limit=1`,
        3600,
      );
      return (data?.meta?.total ?? 0) > 0 ? city : null;
    }),
  );
  return results.filter((c): c is string => c !== null);
}

// Same gating logic as /carpool/[route] itself (that page's generateMetadata
// sets noindex when a route currently has zero trips) — only include routes
// (and origin-only city hubs) with at least one live trip in this sample of
// the newest 100 (the API's enforced max `limit` — a higher value 400s, which
// is exactly the bug this whole function's sibling, fetchVehicleUrls, had).
async function fetchCarpoolEntries(): Promise<{ routes: { origin: string; destination: string }[]; cities: string[] }> {
  const data = await fetchJson<{ data: { originCity: string; destinationCity: string }[] }>(
    '/trips?limit=100&sort=newest',
    300,
  );
  const routeSeen = new Map<string, { origin: string; destination: string }>();
  const citySeen = new Set<string>();
  for (const trip of data?.data ?? []) {
    const origin = trip.originCity.toLowerCase();
    const destination = trip.destinationCity.toLowerCase();
    routeSeen.set(`${origin}-to-${destination}`, { origin, destination });
    citySeen.add(origin);
  }
  return { routes: Array.from(routeSeen.values()), cities: Array.from(citySeen) };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicleUrls, providers, cities] = await Promise.all([
    fetchVehicleUrls(),
    fetchProviders(),
    fetchCities(),
  ]);

  const [cityMakeModelSlugs, providerCities, carpool] = await Promise.all([
    fetchCityMakeModelSlugs(cities),
    fetchProviderCities(cities),
    fetchCarpoolEntries(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/rent-a-car`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/rent-a-car/price-index`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/providers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/carpool`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/safety`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/guides/how-to-rent-a-car-in-pakistan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guides/monthly-vs-daily-car-rental`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guides/how-to-list-your-car-for-rent`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guides/carpool-safety-pakistan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // City landing pages — the main long-tail SEO target ("rent a car in
  // Karachi" etc.). Individual trip pages are deliberately excluded: trips
  // are short-lived (a specific date/route) and churn too fast for a
  // sitemap entry to stay meaningful, unlike vehicles/providers which persist.
  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/rent-a-car/${encodeURIComponent(city)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Real per-item timestamps (from the backend's `updatedAt`) rather than
  // "now" on every build — a vehicle nobody's touched in weeks shouldn't
  // claim to have changed today just because the sitemap regenerated.
  const vehicleRoutes: MetadataRoute.Sitemap = vehicleUrls.map(({ path, updatedAt }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const providerRoutes: MetadataRoute.Sitemap = providers.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/providers/${slug}`,
    lastModified: new Date(updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const providerCityRoutes: MetadataRoute.Sitemap = providerCities.map((city) => ({
    url: `${BASE_URL}/providers/${encodeURIComponent(city)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const cityMakeModelRoutes: MetadataRoute.Sitemap = cityMakeModelSlugs.map(({ city, slug }) => ({
    url: `${BASE_URL}/rent-a-car/${encodeURIComponent(city)}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  const carpoolCityRoutes: MetadataRoute.Sitemap = carpool.cities.map((city) => ({
    url: `${BASE_URL}/carpool/${encodeURIComponent(city)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const carpoolRouteRoutes: MetadataRoute.Sitemap = carpool.routes.map(({ origin, destination }) => ({
    url: `${BASE_URL}/carpool/${origin}-to-${destination}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...cityRoutes,
    ...vehicleRoutes,
    ...providerRoutes,
    ...providerCityRoutes,
    ...cityMakeModelRoutes,
    ...carpoolCityRoutes,
    ...carpoolRouteRoutes,
  ];
}
