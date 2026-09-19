import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { fetchListings, fetchDistinctMakes } from '../../../../../lib/api/server';
import { VehicleCard } from '../../../../../components/listings/VehicleCard';
import type { ListingVehicleCard } from '../../../../../lib/api/listings.api';
import { parsePageParam, withPageParam } from '../../../../../lib/utils/pagination';
import { Pagination } from '../../../../../components/ui';

interface PageProps {
  params: { city: string; makeModel: string };
  searchParams: { page?: string | string[] };
}

function toDisplayName(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// The URL segment is "toyota" (make only) or "toyota-corolla" (make+model).
// Makes are usually one word and models can be multi-word ("land cruiser
// prado"), so a plain split can't tell them apart on its own — instead we
// check the known makes list (already fetched elsewhere in the app) for the
// longest one that's a prefix of the slug, and treat everything after it as
// the model. Falls back to treating the whole slug as the make if no known
// make matches, which keeps old make-only links working unchanged.
async function splitMakeModel(slug: string): Promise<{ make: string; model?: string }> {
  const candidate = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ').trim();
  const makesRes = await fetchDistinctMakes();
  const makes = (makesRes?.data ?? []).map((m) => m.toLowerCase()).sort((a, b) => b.length - a.length);

  for (const make of makes) {
    if (candidate === make || candidate.startsWith(`${make} `)) {
      const model = candidate.slice(make.length).trim();
      return { make, model: model || undefined };
    }
  }
  return { make: candidate };
}

function toSlug(make: string, model?: string): string {
  const combined = model ? `${make} ${model}` : make;
  return combined.trim().replace(/\s+/g, '-');
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city).toLowerCase();
  const cityName = toDisplayName(city);
  const { make, model } = await splitMakeModel(params.makeModel);
  const makeName = toDisplayName(make);
  const modelName = model ? toDisplayName(model) : null;
  const vehicleName = modelName ? `${makeName} ${modelName}` : makeName;

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = parsePageParam(rawPage) ?? 1;
  const basePath = `/rent-a-car/${encodeURIComponent(city)}/${toSlug(make, model)}`;

  return {
    title:
      page > 1
        ? `${vehicleName} for Rent in ${cityName} - Page ${page}`
        : `${vehicleName} for Rent in ${cityName} — Compare Prices`,
    description: `Find ${vehicleName} vehicles for rent in ${cityName} from verified providers. Compare daily and weekly rates, message the owner directly, and book with no hidden fees.`,
    keywords: [
      `${vehicleName.toLowerCase()} rent ${city}`,
      `${vehicleName} for rent ${cityName}`,
      `rent a ${vehicleName} in ${cityName}`,
      `${vehicleName} rental ${cityName}`,
    ],
    alternates: {
      canonical: withPageParam(basePath, page),
    },
    openGraph: {
      title: `${vehicleName} for Rent in ${cityName}`,
      description: `Compare ${vehicleName} vehicles for rent in ${cityName} from verified local providers.`,
    },
  };
}

export default async function CityMakeModelCarRentalPage({ params, searchParams }: PageProps) {
  const city = decodeURIComponent(params.city).toLowerCase();
  const cityName = toDisplayName(city);
  const { make, model } = await splitMakeModel(params.makeModel);
  const makeName = toDisplayName(make);
  const modelName = model ? toDisplayName(model) : null;
  const vehicleName = modelName ? `${makeName} ${modelName}` : makeName;
  const basePath = `/rent-a-car/${encodeURIComponent(city)}/${toSlug(make, model)}`;

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  if (rawPage === '1') redirect(basePath);
  const page = parsePageParam(rawPage);
  if (page === null) notFound();

  const listingsRes = await fetchListings({ city, make, ...(model ? { model } : {}), limit: '24', page: String(page) });
  const vehicles: ListingVehicleCard[] = listingsRes?.data ?? [];
  const total = listingsRes?.meta?.total ?? 0;

  // Real-inventory gate (source: KerayeGo_SEO_Master_Reference.md §13/§68) —
  // zero matching vehicles is exactly the "doorway page" pattern that
  // reference warns against. Don't render a thin page. For page > 1, an
  // out-of-range page number is likewise a 404.
  const totalPages = listingsRes?.meta?.totalPages ?? 0;
  if (page > 1 ? page > totalPages : total === 0) notFound();

  const models = Array.from(new Set(vehicles.map((v) => v.model))).slice(0, 6);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Rent a Car', item: '/rent-a-car' },
      { '@type': 'ListItem', position: 3, name: cityName, item: `/rent-a-car/${encodeURIComponent(city)}` },
      {
        '@type': 'ListItem',
        position: 4,
        name: vehicleName,
        item: `/rent-a-car/${encodeURIComponent(city)}/${toSlug(make, model)}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link href={`/rent-a-car/${encodeURIComponent(city)}`} className="hover:text-slate-700">
          {cityName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">{vehicleName}</span>
      </nav>

      {/* Header */}
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-1.5 text-sm text-brand-700">
          <MapPin className="h-4 w-4" />
          {cityName}, Pakistan
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          {vehicleName} for Rent in {cityName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Browse {vehicleName} vehicles for rent in {cityName} from verified local providers.
          Compare real daily and weekly rates, and send a free inquiry — no payment until
          you&rsquo;re ready to book.
          {' '}
          {total.toLocaleString()} vehicle{total === 1 ? '' : 's'} currently available.
          {!modelName && models.length > 0 && ` Popular models: ${models.join(', ')}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} basePath={basePath} className="mt-8" />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/rent-a-car/${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          All vehicles in {cityName}
        </Link>
        <Link
          href={`/rent-a-car?city=${encodeURIComponent(city)}&make=${encodeURIComponent(make)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          More filters &amp; sort options
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
