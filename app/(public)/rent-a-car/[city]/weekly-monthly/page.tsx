import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarRange, ChevronRight, MapPin, Smartphone } from 'lucide-react';
import { fetchWeeklyMonthlyListings } from '../../../../../lib/api/server';
import { VehicleCard } from '../../../../../components/listings/VehicleCard';
import { AppDownloadButtons } from '../../../../../components/common/AppDownloadButtons';
import { Pagination } from '../../../../../components/ui';
import { HAS_MOBILE_APP } from '../../../../../lib/config/apps';
import { CITY_PROFILES } from '../../../../../lib/config/cityProfiles';
import { countWord } from '../../../../../lib/utils/copy';
import { parsePageParam, withPageParam } from '../../../../../lib/utils/pagination';
import { cityHubUrl, weeklyMonthlyCityUrl } from '../../../../../lib/utils/vehicleUrl';

// A city's weekly & monthly page (owner decision 2026-11-11, plan A84, A79,
// A85): the cars a business switched on for weekly & monthly rental, apart
// from the hourly & daily ones on the city hub. There is no price for a week
// or a month — the customer asks in the KerayeGo app (with the driver's hours
// a day, days a week and roughly how many km a month) and the business calls
// to agree it, so nothing here shows or quotes a price. A car can be on both
// pages. Static segment: Next resolves it before the sibling [makeModel].
// 404 when the city has no such cars (no thin pages) — which includes a
// backend deployed before 2026-11-11 (fetchWeeklyMonthlyListings → null).

const PAGE_SIZE = 24;

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

function buildFaqs(displayName: string): { question: string; answer: string }[] {
  return [
    {
      question: `How much does a monthly car rental cost in ${displayName}?`,
      answer: `There's no set price for a week or a month on KerayeGo. It depends on how many hours a day you need the driver, how many days a week and how far you'll go, so you ask for a price in the KerayeGo app and the business calls you to agree it.`,
    },
    {
      question: 'Does a weekly or monthly rental come with a driver?',
      answer: `Yes. Every car on KerayeGo, including the weekly and monthly ones in ${displayName}, comes with the provider's own driver. KerayeGo doesn't offer self-drive rentals.`,
    },
    {
      question: 'How do I ask for a weekly or monthly price?',
      answer:
        'Open the car in the KerayeGo app and ask for a price. Choose a week (up to 4) or a month (up to 12), the start date, where the rental starts and where the car is handed back, how many passengers, the driver’s hours a day and days a week, and roughly how many kilometres a month. The business then calls you; nothing is paid online.',
    },
    {
      question: 'Can I rent a car for just a few days instead?',
      answer: `Yes. For 6 hours, 12 hours or 1 to 6 days, each car has its own price — browse the cars for rent in ${displayName} and book in the KerayeGo app. For 7 days or more, ask for a weekly or monthly price.`,
    },
  ];
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city).toLowerCase();
  const displayName = toDisplayName(city);
  const region = CITY_PROFILES[city]?.region;
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = parsePageParam(rawPage) ?? 1;
  // Same request as the page body (deduped by Next's fetch memoization).
  const res = await fetchWeeklyMonthlyListings(city, page, PAGE_SIZE);
  if (!res || (res.meta?.total ?? 0) === 0) notFound();

  return {
    title:
      page > 1
        ? `Weekly & Monthly Car Rental in ${displayName} - Page ${page}`
        : `Monthly Car Rental in ${displayName} — Weekly & Monthly Cars with Driver`,
    description: `Rent a car with a driver in ${displayName}${region ? `, ${region}` : ''} by the week or the month. No fixed prices: ask for a price in the KerayeGo app and agree it with the business.`,
    keywords: [
      `monthly car rental ${city}`,
      `monthly car rental in ${displayName}`,
      `weekly car rental ${displayName}`,
      `car on monthly basis ${displayName}`,
      `car with driver monthly ${displayName}`,
    ],
    alternates: { canonical: withPageParam(weeklyMonthlyCityUrl(city), page) },
    openGraph: {
      title: `Weekly & Monthly Car Rental in ${displayName}`,
      description: `Cars with drivers in ${displayName} you can rent by the week or the month.`,
    },
  };
}

export default async function WeeklyMonthlyCityPage({ params, searchParams }: PageProps) {
  const city = decodeURIComponent(params.city).toLowerCase();
  const displayName = toDisplayName(city);
  const basePath = weeklyMonthlyCityUrl(city);

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  if (rawPage === '1') permanentRedirect(basePath);
  const page = parsePageParam(rawPage);
  if (page === null) notFound();

  const res = await fetchWeeklyMonthlyListings(city, page, PAGE_SIZE);
  const vehicles = res?.data ?? [];
  const total = res?.meta?.total ?? 0;
  const totalPages = res?.meta?.totalPages ?? 0;
  if (total === 0 || (page > 1 && page > totalPages)) notFound();

  const faqs = buildFaqs(displayName);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
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
      { '@type': 'ListItem', position: 3, name: displayName, item: cityHubUrl(city) },
      { '@type': 'ListItem', position: 4, name: 'Weekly & monthly', item: basePath },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {page === 1 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link href="/rent-a-car" className="hover:text-slate-700">
          Rent a Car
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link href={cityHubUrl(city)} className="hover:text-slate-700">
          {displayName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">Weekly &amp; monthly</span>
      </nav>

      <div className="mb-7">
        <div className="mb-2 flex items-center gap-1.5 text-sm text-brand-700">
          <MapPin className="h-4 w-4" />
          {displayName}, Pakistan
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Weekly &amp; Monthly Car Rental in {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          {total === 1
            ? `One car with a driver in ${displayName} can be rented by the week or the month.`
            : `${countWord(total, true)} cars with drivers in ${displayName} can be rented by the week or the month.`}{' '}
          There&rsquo;s no set price: you ask for one in the KerayeGo app, and the business calls you to
          agree it. Need a car for 6 hours, 12 hours or a few days?{' '}
          <Link href={cityHubUrl(city)} className="font-semibold text-brand-700 hover:underline">
            See every car for rent in {displayName}
          </Link>
          .
        </p>
      </div>

      <h2 className="sr-only">Cars for weekly and monthly rent in {displayName}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle, i) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} priority={i === 0} priceMode="toAgree" />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} basePath={basePath} className="mt-8" />

      {/* How asking works — the request is sent in the app (plan A82, A85). */}
      <section className="mt-12 rounded-card border border-border-subtle bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <CalendarRange className="h-5 w-5 text-brand-700" />
          How to ask for a weekly or monthly price
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
          <li>Open the car you like in the KerayeGo app and choose a week or a month.</li>
          <li>
            Say when it starts, where the rental starts and where the car is handed back, and how many
            passengers.
          </li>
          <li>
            Add the driver&rsquo;s hours a day, the days a week and roughly how many kilometres a month,
            so the business can work out a fair price.
          </li>
          <li>
            The business calls you to agree the price and checks the documents it needs from you, such as
            your CNIC. Nothing is paid online.
          </li>
        </ol>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <Smartphone className="h-4 w-4 text-brand-700" />
          {HAS_MOBILE_APP
            ? 'Get the KerayeGo app:'
            : 'The KerayeGo app is coming soon to Google Play and the App Store.'}
        </div>
        {HAS_MOBILE_APP && <AppDownloadButtons className="mt-3 !justify-start" />}
      </section>

      {page === 1 && (
        <section className="mt-14 border-t border-border-subtle pt-8">
          <h2 className="text-sm font-semibold text-ink">Frequently asked questions</h2>
          <div className="mt-3 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group p-4 open:bg-surface-hover/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
                  {question}
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-faint transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-muted">
            Weighing a long rental against renting by the day? Read our guide to{' '}
            <Link href="/guides/monthly-vs-daily-car-rental" className="font-semibold text-brand-700 hover:underline">
              monthly vs daily car rental
            </Link>
            . Only need a seat for a trip between cities?{' '}
            <Link href={`/carpool/${encodeURIComponent(city)}`} className="font-semibold text-brand-700 hover:underline">
              Find a carpool from {displayName}
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
