import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { fetchListings, fetchDistinctMakes } from '../../../../../lib/api/server';
import { VehicleCard } from '../../../../../components/listings/VehicleCard';
import type { ListingVehicleCard } from '../../../../../lib/api/listings.api';
import { parsePageParam, withPageParam } from '../../../../../lib/utils/pagination';
import { CITY_PROFILES } from '../../../../../lib/config/cityProfiles';
import { countWord, describeRates, formatPKR, joinList } from '../../../../../lib/utils/copy';
import { Transmission } from '../../../../../types/enums';
import { Pagination } from '../../../../../components/ui';

// FAQ entries for a make/model-in-city page. Prices and long-term rates only
// appear when the listings actually back them (`complete` = every matching
// car is in this batch, so min/max are true for the whole page type); the
// booking answer reuses the same vetted facts as the city page and /faq.
function buildMakeFaqs(opts: {
  vehicleName: string;
  cityName: string;
  complete: boolean;
  minPrice: number;
  maxPrice: number;
  count: number;
  longTerm: 'all' | 'some' | 'none';
}): { question: string; answer: string }[] {
  const { vehicleName, cityName, complete, minPrice, maxPrice, count, longTerm } = opts;
  return [
    ...(complete && count > 0
      ? [
          {
            question: `How much does it cost to rent a ${vehicleName} in ${cityName}?`,
            answer:
              count === 1
                ? `The ${vehicleName} listed in ${cityName} right now costs ${formatPKR(minPrice)} a day.`
                : minPrice === maxPrice
                  ? `All ${countWord(count)} ${vehicleName} cars listed in ${cityName} right now cost ${formatPKR(minPrice)} a day.`
                  : `Right now, ${vehicleName} rentals in ${cityName} on KerayeGo cost between ${formatPKR(minPrice)} and ${formatPKR(maxPrice)} a day, depending on the car and the provider.`,
          },
        ]
      : []),
    ...(longTerm !== 'none'
      ? [
          {
            question: `Can I rent a ${vehicleName} in ${cityName} by the week or month?`,
            answer: `Yes. ${count === 1 ? 'This listing shows' : longTerm === 'all' ? 'Every listing here shows' : 'Some listings here show'} a weekly or monthly price as well as the daily one. Open ${count === 1 ? 'it' : 'the car you like'} to see the rates, or message the provider to agree on a longer rental.`,
          },
        ]
      : []),
    {
      question: `Does the ${vehicleName} come with a driver?`,
      answer: `Yes. Every car on KerayeGo, including the ${vehicleName} listings in ${cityName}, is rented with the provider's own driver. KerayeGo doesn't offer self-drive rentals.`,
    },
    {
      question: `How do I book a ${vehicleName} in ${cityName}?`,
      answer:
        "Open the listing you like and send a free booking request. The provider gets in touch to confirm pickup, dates and payment, checks the documents they need from you (such as your CNIC) before confirming, and you can also message them on WhatsApp straight from the listing. Nothing is paid online.",
    },
  ];
}

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
  const region = CITY_PROFILES[city]?.region;

  return {
    title:
      page > 1
        ? `${vehicleName} for Rent in ${cityName} - Page ${page}`
        : `${vehicleName} for Rent in ${cityName} — Compare Prices`,
    description: `Rent a ${vehicleName} in ${cityName}${region ? `, ${region}` : ''} from verified providers. Compare daily and weekly prices, message the owner directly, and book with no hidden fees.`,
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
  const profile = CITY_PROFILES[city] ?? null;

  // Summary of the listings above, for the page-1 copy and FAQ. `complete`
  // means this batch is every matching car, so min/max/years are true for the
  // whole page rather than just what's on screen.
  const complete = total <= vehicles.length;
  const prices = vehicles.map((v) => Number(v.pricePerDay)).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const years = vehicles.map((v) => v.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const modelLabels = models.map((m) => toDisplayName(m));
  const manualCount = vehicles.filter((v) => v.transmission === Transmission.MANUAL).length;
  const weeklyCount = vehicles.filter((v) => v.pricePerWeek).length;
  const monthlyCount = vehicles.filter((v) => v.pricePerMonth).length;
  const rates = describeRates({
    total: vehicles.length,
    automatic: vehicles.length - manualCount,
    manual: manualCount,
    hourly: vehicles.filter((v) => v.pricePer6Hours || v.pricePer12Hours).length,
    weekly: weeklyCount,
    monthly: monthlyCount,
  });
  const carWord = total === 1 ? 'car' : 'cars';

  let priceSentence: string;
  if (total === 1) {
    priceSentence = `There's one ${vehicleName} for rent in ${cityName} right now, at ${formatPKR(minPrice)} a day.`;
  } else if (complete) {
    priceSentence =
      minPrice === maxPrice
        ? `There are ${countWord(total)} ${vehicleName} ${carWord} for rent in ${cityName} right now, all at ${formatPKR(minPrice)} a day.`
        : `There are ${countWord(total)} ${vehicleName} ${carWord} for rent in ${cityName} right now, priced from ${formatPKR(minPrice)} to ${formatPKR(maxPrice)} a day.`;
  } else {
    priceSentence = `There are ${total.toLocaleString()} ${vehicleName} ${carWord} for rent in ${cityName}. On this page, daily prices run from ${formatPKR(minPrice)} to ${formatPKR(maxPrice)}.`;
  }
  const detailSentences = [
    !modelName && modelLabels.length >= 2 ? `Models listed include ${joinList(modelLabels)}.` : '',
    vehicles.length >= 2
      ? minYear === maxYear
        ? `They're all ${minYear} models.`
        : `Model years go from ${minYear} to ${maxYear}.`
      : '',
    vehicles.length >= 2 ? rates.transmission : '',
    rates.hourly,
    rates.longTerm,
  ].filter(Boolean);

  const makeFaqs = buildMakeFaqs({
    vehicleName,
    cityName,
    complete,
    minPrice,
    maxPrice,
    count: total,
    longTerm:
      weeklyCount + monthlyCount === 0
        ? 'none'
        : weeklyCount === vehicles.length && monthlyCount === vehicles.length
          ? 'all'
          : 'some',
  });
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: makeFaqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

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
      {page === 1 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

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
          {cityName}, {profile ? `${profile.region}, ` : ''}Pakistan
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
          {!modelName && models.length > 0 && ` Popular models: ${modelLabels.join(', ')}.`}
        </p>
      </div>

      <h2 className="sr-only">
        {vehicleName} cars for rent in {cityName}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle, i) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} priority={i === 0} />
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

      {/* Page 1 only — the same copy on every ?page=N would just be duplicate content. */}
      {page === 1 && (
        <>
          <section className="mt-14 border-t border-border-subtle pt-8">
            <h2 className="text-sm font-semibold text-ink">
              Renting a {vehicleName} in {cityName}
            </h2>
            <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-text-muted">
              <p>{priceSentence}</p>
              {detailSentences.length > 0 && <p>{detailSentences.join(' ')}</p>}
              <p>
                Want to see what else is available? Browse{' '}
                <Link
                  href={`/rent-a-car/${encodeURIComponent(city)}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  all cars for rent in {cityName}
                </Link>
                .
              </p>
            </div>
          </section>

          <div className="mt-14 border-t border-border-subtle pt-8">
            <h2 className="text-sm font-semibold text-ink">Frequently asked questions</h2>
            <div className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
              {makeFaqs.map(({ question, answer }) => (
                <details key={question} className="group p-4 open:bg-surface-hover/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
                    {question}
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-faint transition-transform duration-200 group-open:rotate-90" />
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
