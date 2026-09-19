import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { fetchListings, fetchDistinctCities, fetchPriceIndex, fetchAllProviders } from '../../../../lib/api/server';
import { VehicleCard } from '../../../../components/listings/VehicleCard';
import type { ListingVehicleCard } from '../../../../lib/api/listings.api';
import { parsePageParam, withPageParam } from '../../../../lib/utils/pagination';
import { Pagination } from '../../../../components/ui';

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

// Real, city-flavored subset of the same vetted facts used on the sitewide
// /faq page — not new claims. Deliberately excludes anything unverifiable
// (e.g. security deposit amounts, self-drive-vs-with-driver as a toggle) that
// no part of the product actually models today.
function buildCityFaqs(displayName: string): { question: string; answer: string }[] {
  return [
    {
      question: `How do I rent a car in ${displayName}?`,
      answer: `Browse the vehicles listed above, open one you like, and send a free booking request directly from the listing. The provider will get in touch to confirm pickup, dates, and payment.`,
    },
    {
      question: 'Do I need to pay online to book?',
      answer: "No. KerayeGo doesn't process payments on the platform — rental payments are arranged directly between you and the provider.",
    },
    {
      question: `Are the vehicles in ${displayName} verified?`,
      answer: 'Every rental listing is reviewed by our team before it appears on the site, and vehicle photos carry a KerayeGo watermark so you know you’re looking at the real listing.',
    },
    {
      question: 'Can I cancel a booking request?',
      answer: "Yes — you can cancel a booking request you've sent from your dashboard, as long as it hasn't already been completed.",
    },
    {
      question: 'How do I contact the provider?',
      answer: 'Every listing has a direct WhatsApp button so you can message the provider yourself.',
    },
  ];
}

interface PageProps {
  params: { city: string };
  searchParams: { page?: string | string[] };
}

function toDisplayName(city: string): string {
  return city
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateStaticParams() {
  const res = await fetchDistinctCities();
  return (res?.data ?? []).map((city) => ({ city }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city).toLowerCase();
  const displayName = toDisplayName(city);
  const basePath = `/rent-a-car/${encodeURIComponent(city)}`;
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = parsePageParam(rawPage) ?? 1;

  return {
    title:
      page > 1
        ? `Rent a Car in ${displayName} - Page ${page}`
        : `Rent a Car in ${displayName} — Compare Cars & Prices`,
    description: `Find a car for rent in ${displayName} from verified providers. Compare daily and weekly rates, message the owner directly, and book with no hidden fees.`,
    keywords: [
      `rent a car in ${city}`,
      `rent a car ${displayName}`,
      `car rental ${displayName}`,
      `car for rent in ${city}`,
      `vehicle hire ${displayName}`,
    ],
    alternates: {
      canonical: withPageParam(basePath, page),
    },
    openGraph: {
      title: `Rent a Car in ${displayName}`,
      description: `Compare cars for rent in ${displayName} from verified local providers.`,
    },
  };
}

export default async function CityCarRentalPage({ params, searchParams }: PageProps) {
  const city = decodeURIComponent(params.city).toLowerCase();
  const displayName = toDisplayName(city);
  const basePath = `/rent-a-car/${encodeURIComponent(city)}`;

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  if (rawPage === '1') {
    redirect(basePath);
  }
  const page = parsePageParam(rawPage);
  if (page === null) {
    notFound();
  }

  const [listingsRes, citiesRes, priceIndexRes, providersRes] = await Promise.all([
    fetchListings({ city, page: String(page), limit: '24' }),
    fetchDistinctCities(),
    fetchPriceIndex(),
    fetchAllProviders(1, 1, city),
  ]);

  const vehicles: ListingVehicleCard[] = listingsRes?.data ?? [];
  const total = listingsRes?.meta?.total ?? 0;
  const totalPages = listingsRes?.meta?.totalPages ?? 0;
  if (page > 1 && page > totalPages) {
    notFound();
  }
  const otherCities = (citiesRes?.data ?? []).filter((c) => c.toLowerCase() !== city).slice(0, 8);
  const cityPricing = priceIndexRes?.data?.byCity.find((b) => b.city.toLowerCase() === city) ?? null;
  const providerCount = providersRes?.meta?.total ?? 0;
  const cityFaqs = buildCityFaqs(displayName);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cityFaqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  // Derived from the same fetched batch, not a separate endpoint — a real
  // (if partial) reflection of what's actually in this city, not a fabricated
  // list. Links to /rent-a-car/[city]/[make(-model)], which does its own
  // fresh fetch.
  const popularMakes = Array.from(new Set(vehicles.map((v) => v.make.toLowerCase()))).slice(0, 8);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Rent a Car', item: '/rent-a-car' },
      { '@type': 'ListItem', position: 3, name: displayName, item: `/rent-a-car/${encodeURIComponent(city)}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link href="/rent-a-car" className="hover:text-slate-700">
          Rent a Car
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-1.5 text-sm text-brand-700">
          <MapPin className="h-4 w-4" />
          {displayName}, Pakistan
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Rent a Car in {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Looking for a car for rent in {displayName}? Browse vehicles from verified local
          providers, compare real daily and weekly rates, and send a free inquiry — no payment
          until you&rsquo;re ready to book.
          {total > 0 && ` ${total.toLocaleString()} vehicle${total === 1 ? '' : 's'} currently available.`}
        </p>

        {(cityPricing || providerCount > 0) && (
          <div className="mt-4 flex flex-wrap gap-2.5 text-xs">
            {cityPricing && (
              <span className="inline-flex items-center rounded-control border border-border-subtle bg-surface px-3 py-1.5 font-medium text-ink">
                {formatPKR(cityPricing.minPrice)}–{formatPKR(cityPricing.maxPrice)}/day · median{' '}
                {formatPKR(cityPricing.medianPrice)}
              </span>
            )}
            {providerCount > 0 && (
              <Link
                href={`/providers/${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-surface px-3 py-1.5 font-medium text-ink transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {providerCount} verified provider{providerCount === 1 ? '' : 's'} in {displayName}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {vehicles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} basePath={basePath} className="mt-8" />

          <div className="mt-8 text-center">
            <Link
              href={`/rent-a-car?city=${city}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              More filters &amp; sort options for {displayName}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-600">
            No vehicles listed in {displayName} yet — check back soon, or browse other cities.
          </p>
          <Link
            href="/rent-a-car"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Browse all vehicles
          </Link>
        </div>
      )}

      <div className="mt-14 border-t border-border-subtle pt-8">
        <h2 className="text-sm font-semibold text-ink">Frequently asked questions</h2>
        <div className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
          {cityFaqs.map(({ question, answer }) => (
            <details key={question} className="group p-4 open:bg-surface-hover/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
                {question}
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-faint transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-faint">
          New to renting on KerayeGo?{' '}
          <Link href="/guides/how-to-rent-a-car-in-pakistan" className="font-semibold text-brand-700 hover:underline">
            Read our step-by-step guide
          </Link>
          .
        </p>
      </div>

      {popularMakes.length > 0 && (
        <div className="mt-14 border-t border-border-subtle pt-8">
          <h2 className="text-sm font-semibold text-ink">Popular makes in {displayName}</h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {popularMakes.map((make) => (
              <Link
                key={make}
                href={`/rent-a-car/${encodeURIComponent(city)}/${encodeURIComponent(make)}`}
                className="inline-flex h-9 items-center rounded-control border border-border-subtle bg-page px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                {make.charAt(0).toUpperCase() + make.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {otherCities.length > 0 && (
        <div className="mt-14 border-t border-border-subtle pt-8">
          <h2 className="text-sm font-semibold text-ink">Car rental in other cities</h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {otherCities.map((c) => (
              <Link
                key={c}
                href={`/rent-a-car/${encodeURIComponent(c)}`}
                className="inline-flex h-9 items-center rounded-control border border-border-subtle bg-page px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                {toDisplayName(c)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
