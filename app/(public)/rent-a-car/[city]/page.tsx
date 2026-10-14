import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import {
  fetchListings,
  fetchDistinctCities,
  fetchPriceIndex,
  fetchAllProviders,
  type PriceIndexBucket,
} from '../../../../lib/api/server';
import { VehicleCard } from '../../../../components/listings/VehicleCard';
import type { ListingVehicleCard } from '../../../../lib/api/listings.api';
import { parsePageParam, withPageParam } from '../../../../lib/utils/pagination';
import { CITY_PROFILES } from '../../../../lib/config/cityProfiles';
import { countWord, describeRates, formatPKR, joinList } from '../../../../lib/utils/copy';
import { Transmission } from '../../../../types/enums';
import { Pagination } from '../../../../components/ui';

// Real, city-flavored subset of the same vetted facts used on the sitewide
// /faq page — not new claims. Deliberately excludes anything unverifiable
// (e.g. security deposit amounts) that no part of the product models today.
// "With a driver, never self-drive" is company policy (user, 2026-10-14), not
// a listing field — keep it phrased as policy, never as a per-car option. The pricing and long-term
// answers are only included when live data backs them; `cityFaqs` are the
// hand-written ones from CITY_PROFILES.
function buildCityFaqs(
  displayName: string,
  pricing: PriceIndexBucket | null,
  hasLongTermRates: boolean,
  cityFaqs: { question: string; answer: string }[],
): { question: string; answer: string }[] {
  return [
    ...(pricing
      ? [
          {
            question: `How much does it cost to rent a car in ${displayName}?`,
            answer:
              pricing.count === 1
                ? `There's one car listed in ${displayName} right now, at ${formatPKR(pricing.minPrice)} a day.`
                : `Right now, daily rent in ${displayName} on KerayeGo runs from ${formatPKR(pricing.minPrice)} to ${formatPKR(pricing.maxPrice)}. Half of the ${countWord(pricing.count)} listed cars cost ${formatPKR(pricing.medianPrice)} a day or less. What you pay depends on the car and how long you keep it.`,
          },
        ]
      : []),
    ...(hasLongTermRates
      ? [
          {
            question: `Can I rent a car in ${displayName} for a week or a month?`,
            answer: `Yes. Some providers in ${displayName} show weekly or monthly prices next to the daily rate, so check the listing of the car you like. If you need it for longer than that, message the provider and agree on it with them directly.`,
          },
        ]
      : []),
    {
      question: `Can I rent a car without a driver in ${displayName}?`,
      answer: `No. Every car on KerayeGo in ${displayName} comes with the provider's own driver. KerayeGo doesn't offer self-drive rentals anywhere.`,
    },
    ...cityFaqs,
    {
      question: `How do I rent a car in ${displayName}?`,
      answer: `Browse the vehicles listed above, open one you like, and send a free booking request directly from the listing. The provider will get in touch to confirm pickup, dates and payment, and will check the documents they need from you, such as your CNIC, before confirming.`,
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
  const region = CITY_PROFILES[city]?.region;
  const basePath = `/rent-a-car/${encodeURIComponent(city)}`;
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = parsePageParam(rawPage) ?? 1;

  // Same request as the page body (deduped by Next's fetch memoization). A city
  // with no listings yet (e.g. a profiled Sindh city before any provider joins)
  // stays out of the index until its first car goes live — same rule as the
  // carpool route pages.
  const listingsRes = await fetchListings({ city, page: String(page), limit: '24' });
  const hasListings = (listingsRes?.meta?.total ?? 0) > 0;

  return {
    robots: { index: hasListings, follow: true },
    title:
      page > 1
        ? `Rent a Car in ${displayName} - Page ${page}`
        : `Rent a Car in ${displayName} — Compare Cars & Prices`,
    description: `Rent a car in ${displayName}${region ? `, ${region}` : ''} from verified providers. Compare car rental prices and daily or weekly rates, message the owner directly, and book with no hidden fees.`,
    keywords: [
      `rent a car in ${city}`,
      `rent a car ${displayName}`,
      `car rental ${displayName}`,
      `car rental in ${city}`,
      `car hire ${displayName}`,
      `car for rent in ${city}`,
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
  const liveCities = (citiesRes?.data ?? []).map((c) => c.toLowerCase());
  const profile = CITY_PROFILES[city] ?? null;
  // Any /rent-a-car/<slug> used to render an empty 200 page. Only a city we
  // either have listings for or have written a profile for gets a page.
  if (total === 0 && !profile && !liveCities.includes(city)) {
    notFound();
  }
  const otherCities = liveCities.filter((c) => c !== city).slice(0, 8);
  // Live cities in the same province, for the "elsewhere in Sindh" links.
  const sameRegionCities = profile
    ? liveCities.filter((c) => c !== city && CITY_PROFILES[c]?.region === profile.region)
    : [];
  const cityPricing = priceIndexRes?.data?.byCity.find((b) => b.city.toLowerCase() === city) ?? null;
  const providerCount = providersRes?.meta?.total ?? 0;

  // Derived from the same fetched batch, not a separate endpoint — a real
  // (if partial, up to one page) reflection of what's actually in this city,
  // not a fabricated list. Makes are ordered by how often they appear.
  const makeCounts = new Map<string, { label: string; count: number }>();
  for (const v of vehicles) {
    const key = v.make.toLowerCase();
    const entry = makeCounts.get(key);
    if (entry) entry.count += 1;
    else makeCounts.set(key, { label: toDisplayName(key), count: 1 });
  }
  const makesByCount = Array.from(makeCounts.entries()).sort((a, b) => b[1].count - a[1].count);
  const popularMakes = makesByCount.map(([key]) => key).slice(0, 8);
  const topMakeLabels = makesByCount.map(([, { label }]) => label).slice(0, 3);
  const manualCount = vehicles.filter((v) => v.transmission === Transmission.MANUAL).length;
  const autoCount = vehicles.length - manualCount;
  const weeklyCount = vehicles.filter((v) => v.pricePerWeek).length;
  const monthlyCount = vehicles.filter((v) => v.pricePerMonth).length;
  const hourlyCount = vehicles.filter((v) => v.pricePer6Hours || v.pricePer12Hours).length;
  const makesPhrase =
    topMakeLabels.length === 1
      ? `${topMakeLabels[0]} comes up most often`
      : `${joinList(topMakeLabels)} come up most often`;
  const makesSentence =
    total > vehicles.length
      ? `Among the ${countWord(vehicles.length)} cars on this page, ${makesPhrase}.`
      : `${makesPhrase.charAt(0).toUpperCase()}${makesPhrase.slice(1)} here.`;
  const {
    transmission: transmissionSentence,
    hourly: hourlySentence,
    longTerm: longTermSentence,
  } = describeRates({
    total: vehicles.length,
    automatic: autoCount,
    manual: manualCount,
    hourly: hourlyCount,
    weekly: weeklyCount,
    monthly: monthlyCount,
  });

  const [aboutFirst, ...aboutRest] = profile?.about ?? [];
  const providerPhrase =
    providerCount === 0
      ? ''
      : providerCount === 1
        ? ' from a verified provider'
        : ` from ${countWord(providerCount)} verified providers`;
  const browseSentence =
    total === 1
      ? `On KerayeGo there's one car for rent in ${displayName} right now${providerPhrase}. You can message the owner before you book.`
      : `On KerayeGo you can browse ${countWord(total)} cars for rent in ${displayName}${providerPhrase}, compare their prices side by side, and message the owner before you book.`;

  const cityFaqs = buildCityFaqs(displayName, cityPricing, weeklyCount + monthlyCount > 0, profile?.faqs ?? []);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cityFaqs.map(({ question, answer }) => ({
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
      { '@type': 'ListItem', position: 3, name: displayName, item: `/rent-a-car/${encodeURIComponent(city)}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {total > 0 && (
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
          {displayName}, {profile ? `${profile.region}, ` : ''}Pakistan
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Rent a Car in {displayName}
        </h1>
        {total > 0 ? (
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Looking for a car for rent in {displayName}? Browse cars with drivers from verified
            local providers, compare real daily and weekly rates, and send a free inquiry — no
            payment until you&rsquo;re ready to book.
            {` ${total.toLocaleString()} vehicle${total === 1 ? '' : 's'} currently available.`}
          </p>
        ) : (
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            {profile && `${profile.context} `}
            There aren&rsquo;t any cars listed for rent in {displayName} on KerayeGo yet.
          </p>
        )}

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
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-ink">No cars in {displayName} yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Do you rent out cars in {displayName}? List them on KerayeGo and you&rsquo;ll be among
            the first providers people here can find.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/register?role=PROVIDER" className="text-brand-700 hover:underline">
              List your car
            </Link>
            <Link href="/guides/how-to-list-your-car-for-rent" className="text-brand-700 hover:underline">
              How listing works
            </Link>
          </div>
          {sameRegionCities.length > 0 ? (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-600">Need a car now? These {profile?.region} cities have cars listed:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                {sameRegionCities.map((c) => (
                  <Link
                    key={c}
                    href={`/rent-a-car/${encodeURIComponent(c)}`}
                    className="inline-flex h-9 items-center rounded-control border border-border-subtle bg-page px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
                  >
                    Rent a car in {toDisplayName(c)}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              href="/rent-a-car"
              className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              Browse all vehicles
            </Link>
          )}
        </div>
      )}

      {/* Page 1 only — the same copy on every ?page=N would just be duplicate content. */}
      {page === 1 && vehicles.length > 0 && (
        <section className="mt-14 border-t border-border-subtle pt-8">
          <h2 className="text-sm font-semibold text-ink">Car rental in {displayName}</h2>
          <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-text-muted">
            {/* City background first (context + any hand-written paragraphs),
                then what's on KerayeGo — so "It's…" in the about copy always
                follows the sentence naming the city. */}
            <p>
              {profile && `${profile.context} `}
              {aboutFirst ?? browseSentence}
            </p>
            {aboutRest.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {aboutFirst && <p>{browseSentence}</p>}
            {cityPricing && (
              <p>
                {cityPricing.count === 1
                  ? `The car listed here costs ${formatPKR(cityPricing.minPrice)} a day.`
                  : `Daily rent in ${displayName} starts at ${formatPKR(cityPricing.minPrice)}. Half the cars cost ${formatPKR(cityPricing.medianPrice)} a day or less, and the most expensive one listed right now is ${formatPKR(cityPricing.maxPrice)}.`}{' '}
                You can{' '}
                <Link href="/rent-a-car/price-index" className="font-semibold text-brand-700 hover:underline">
                  compare {displayName} with other cities
                </Link>{' '}
                in our price index.
              </p>
            )}
            {vehicles.length >= 3 && (
              <p>
                {makesSentence} {transmissionSentence}
                {hourlySentence && ` ${hourlySentence}`}
                {longTermSentence && (
                  <>
                    {' '}
                    {longTermSentence} Our guide to{' '}
                    <Link
                      href="/guides/monthly-vs-daily-car-rental"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      monthly vs daily car rental
                    </Link>{' '}
                    shows how to compare the two.
                  </>
                )}
              </p>
            )}
            {(sameRegionCities.length > 0 || (profile?.routes?.length ?? 0) > 0) && (
              <p>
                {sameRegionCities.length > 0 && (
                  <>
                    Also in {profile?.region}:{' '}
                    {sameRegionCities.map((c, i) => (
                      <span key={c}>
                        {i > 0 && ', '}
                        <Link
                          href={`/rent-a-car/${encodeURIComponent(c)}`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          rent a car in {toDisplayName(c)}
                        </Link>
                      </span>
                    ))}
                    .{' '}
                  </>
                )}
                {profile?.routes && profile.routes.length > 0 && (
                  <>
                    Only need a seat, not a whole car? Try the{' '}
                    {profile.routes.map((r, i) => (
                      <span key={r.href}>
                        {i > 0 && ' or '}
                        <Link href={r.href} className="font-semibold text-brand-700 hover:underline">
                          {r.label}
                        </Link>
                      </span>
                    ))}
                    . New to it? Here&rsquo;s{' '}
                    <Link
                      href="/guides/how-carpooling-works"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      how carpooling works
                    </Link>
                    .
                  </>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {/* The shared FAQ answers assume there are cars listed above. */}
      {total > 0 && (
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
      )}

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
