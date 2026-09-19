import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { fetchAllProviders, fetchDistinctCities } from '../../../lib/api/server';
import { ProvidersView } from '../../../components/providers/ProvidersView';
import type { ProvidersListResponse } from '../../../lib/api/providers.api';
import { USER_LOCATION_COOKIE, DEFAULT_NEARBY_RADIUS_KM, parseUserLocation } from '../../../lib/utils/userLocation';
import { parsePageParam, withPageParam } from '../../../lib/utils/pagination';

interface PageProps {
  searchParams: { page?: string; city?: string };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = parsePageParam(rawPage) ?? 1;
  const title = 'Verified Car Rental Providers in Pakistan';

  return {
    title: page > 1 ? `${title} - Page ${page}` : title,
    description:
      'Browse verified vehicle rental providers across Karachi, Lahore, Islamabad, and other cities in Pakistan. Every provider is reviewed before listing.',
    keywords: ['car rental companies Pakistan', 'verified car rental providers', 'vehicle hire providers'],
    alternates: {
      canonical: withPageParam('/providers', page),
    },
  };
}

export default async function ProvidersPage({ searchParams }: PageProps) {
  const city = searchParams.city;

  if (searchParams.page === '1') {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === 'page' || value === undefined) return;
      params.set(key, value);
    });
    redirect(params.size ? `/providers?${params}` : '/providers');
  }

  const page = parsePageParam(searchParams.page);
  if (page === null) notFound();

  const location = parseUserLocation(cookies().get(USER_LOCATION_COOKIE)?.value);

  const [providersRes, citiesRes] = await Promise.all([
    fetchAllProviders(page, 12, city, location?.lat, location?.lng, location ? DEFAULT_NEARBY_RADIUS_KM : undefined),
    fetchDistinctCities(),
  ]);

  if (page > 1 && page > (providersRes?.meta?.totalPages ?? 1)) {
    notFound();
  }

  const initialData: ProvidersListResponse | null = providersRes
    ? { data: providersRes.data, meta: providersRes.meta as ProvidersListResponse['meta'] }
    : null;
  const cities = citiesRes?.data ?? [];
  const cityLabel = city ? city.charAt(0).toUpperCase() + city.slice(1) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {cityLabel
            ? `Rental Providers in ${cityLabel}`
            : location
              ? `Rental Providers near ${location.label}`
              : 'Rental Providers'}
        </h1>
        <p className="mt-2 text-slate-500">
          {initialData?.meta
            ? `${initialData.meta.total} verified provider${initialData.meta.total !== 1 ? 's' : ''} ${cityLabel ? `in ${cityLabel}` : location ? `near ${location.label}` : 'across Pakistan'}`
            : 'Browse verified rental providers'}
        </p>
      </div>

      <ProvidersView initialData={initialData} cities={cities} initialLocation={location} />
    </div>
  );
}
