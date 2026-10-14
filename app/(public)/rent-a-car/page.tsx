import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { fetchListings, fetchDistinctMakes, fetchDistinctCities, fetchPriceIndex } from '../../../lib/api/server';
import { cityLabel, countWord, formatPKR } from '../../../lib/utils/copy';
import { VehiclesView } from '../../../components/listings/VehiclesView';
import type { ListingsResponse } from '../../../lib/api/listings.api';
import { USER_LOCATION_COOKIE, DEFAULT_NEARBY_RADIUS_KM, parseUserLocation } from '../../../lib/utils/userLocation';
import { parsePageParam, withPageParam } from '../../../lib/utils/pagination';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const parsedPage = parsePageParam(rawPage);
  const page = parsedPage ?? 1;

  return {
    title:
      page > 1 ? `Rent a Car — Browse Vehicles Near You - Page ${page}` : 'Rent a Car — Browse Vehicles Near You',
    description:
      'Find a car for rent in Karachi, Lahore, Islamabad, and other cities in Pakistan. Compare verified providers by make, price, and location — book in minutes.',
    keywords: ['cars for rent', 'car rental search', 'rent a car near me', 'vehicle hire Pakistan'],
    alternates: {
      canonical: withPageParam('/rent-a-car', page),
    },
  };
}

export default async function RentACarPage({ searchParams }: PageProps) {
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  if (rawPage === '1') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page') continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value !== undefined) {
        params.append(key, value);
      }
    }
    redirect(params.size ? `/rent-a-car?${params}` : '/rent-a-car');
  }
  const page = parsePageParam(rawPage);
  if (page === null) {
    notFound();
  }

  const location = parseUserLocation(cookies().get(USER_LOCATION_COOKIE)?.value);
  const effectiveSearchParams = location
    ? {
        ...searchParams,
        lat: String(location.lat),
        lng: String(location.lng),
        radiusKm: String(DEFAULT_NEARBY_RADIUS_KM),
      }
    : searchParams;

  // Parallel server-side data fetch
  const [listingsRes, makesRes, citiesRes, priceIndexRes] = await Promise.all([
    fetchListings(effectiveSearchParams),
    fetchDistinctMakes(),
    fetchDistinctCities(),
    fetchPriceIndex(),
  ]);

  if (page > 1 && page > (listingsRes?.meta?.totalPages ?? 1)) {
    notFound();
  }

  const initialData: ListingsResponse | null = listingsRes
    ? { data: listingsRes.data, meta: listingsRes.meta as ListingsResponse['meta'] }
    : null;

  const makes = makesRes?.data ?? [];
  const cities = citiesRes?.data ?? [];
  const overallPricing = priceIndexRes?.data?.overall ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">Rent a Car</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {initialData?.meta.total
              ? `${initialData.meta.total.toLocaleString()} vehicles available from verified providers`
              : 'Find the perfect vehicle for your needs'}
          </p>
        </div>
        <Link
          href="/rent-a-car/price-index"
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          See real rental price data →
        </Link>
      </div>

      {/* Listings with filters — Suspense boundary for streaming */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        }
      >
        <VehiclesView
          initialData={initialData}
          makes={makes}
          cities={cities}
          initialLocation={location}
        />
      </Suspense>

      {/* Page 1 only — answers the broad "rent a car" / "car rental" / "near me"
          searches this hub ranks for, using live data, without repeating on
          every ?page=N. */}
      {page === 1 && cities.length > 0 && (
        <section className="mt-14 border-t border-border-subtle pt-8">
          <h2 className="text-sm font-semibold text-ink">Car rental in Pakistan</h2>
          <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-text-muted">
            <p>
              KerayeGo brings together cars for rent from verified local providers in{' '}
              {countWord(cities.length)} cities across Pakistan, so you can compare models and daily
              prices in one place instead of calling round showrooms.
              {overallPricing &&
                ` Right now, half of the ${overallPricing.count.toLocaleString()} cars listed cost ${formatPKR(overallPricing.medianPrice)} a day or less.`}{' '}
              <Link href="/rent-a-car/price-index" className="font-semibold text-brand-700 hover:underline">
                See prices by city and make
              </Link>
              .
            </p>
            <p>
              Looking for a car near you? Tap the location button in the search box above, or search
              by area, and you&rsquo;ll see cars listed within {DEFAULT_NEARBY_RADIUS_KM} km. Or go
              straight to your city:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {cities.map((c) => (
                <Link
                  key={c}
                  href={`/rent-a-car/${encodeURIComponent(c)}`}
                  className="inline-flex h-9 items-center rounded-control border border-border-subtle bg-page px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
                >
                  Rent a car in {cityLabel(c)}
                </Link>
              ))}
            </div>
            <p>
              Every car comes with the provider&rsquo;s own driver; KerayeGo doesn&rsquo;t offer
              self-drive. Booking is free: send a request from the car&rsquo;s listing and the
              provider gets in touch to confirm pickup, dates and payment with you directly, after
              checking the documents they need, such as your CNIC. Nothing is paid online.
              New to it? Read{' '}
              <Link
                href="/guides/how-to-rent-a-car-in-pakistan"
                className="font-semibold text-brand-700 hover:underline"
              >
                how to rent a car in Pakistan
              </Link>
              .
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
