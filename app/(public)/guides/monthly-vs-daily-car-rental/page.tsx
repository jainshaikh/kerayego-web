import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { GuideByline } from '../../../../components/common/GuideByline';
import { fetchDistinctCities, fetchWeeklyMonthlyCount } from '../../../../lib/api/server';
import { weeklyMonthlyCityUrl } from '../../../../lib/utils/vehicleUrl';

// Rewritten 2026-11-12 for the rental booking redesign (plan §3c): hours and
// days have the car's own price; weeks and months have none — "price to
// agree" (A79), asked for in the KerayeGo app with the driver's hours a day,
// days a week and km a month (A85), on each city's weekly & monthly page
// (A84). Never quote or estimate a week or month price here, and never say
// what the driver costs (root CLAUDE.md, product rules).

const DESCRIPTION =
  'How renting a car with a driver by the hour or day compares with weekly and monthly rental on KerayeGo: set prices for hours and days, a price you agree for weeks and months.';

export const metadata: Metadata = {
  title: 'Monthly vs. Daily Car Rental in Pakistan',
  description: DESCRIPTION,
  keywords: [
    'monthly car rental Pakistan',
    'daily car rental Pakistan',
    'weekly car rental Pakistan',
    'car with driver monthly Pakistan',
  ],
  alternates: {
    canonical: '/guides/monthly-vs-daily-car-rental',
  },
  openGraph: {
    title: 'Monthly vs. Daily Car Rental in Pakistan',
    description: DESCRIPTION,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: '/guides' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Monthly vs. Daily Car Rental',
      item: '/guides/monthly-vs-daily-car-rental',
    },
  ],
};

function cityName(city: string): string {
  return city
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Cities with at least one car offered for weekly & monthly rental — each has its own page. */
async function weeklyMonthlyCities(): Promise<string[]> {
  const cities = (await fetchDistinctCities())?.data ?? [];
  const counts = await Promise.all(cities.map((city) => fetchWeeklyMonthlyCount(city)));
  return cities.filter((_, i) => counts[i] > 0).map((city) => city.toLowerCase());
}

export default async function MonthlyVsDailyCarRentalGuidePage() {
  const cities = await weeklyMonthlyCities();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-5 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <Link href="/guides" className="hover:text-slate-700">
          Guides
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">Monthly vs. Daily Car Rental</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Monthly vs. Daily Car Rental in Pakistan
        </h1>
        <GuideByline
          title="Monthly vs. Daily Car Rental in Pakistan"
          path="/guides/monthly-vs-daily-car-rental"
          published="2026-09-19"
          updated="2026-11-12"
        />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          On KerayeGo every car comes with the provider&rsquo;s own driver. You can rent it for 6
          hours, 12 hours or 1 to 6 days at the car&rsquo;s own price. For a week or a month there
          is no set price: you ask for one, and the business agrees it with you. Here is how the two
          work and which one fits your trip.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">Hours and days: a set price</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Each car lists its own price for a day, and some for 6 or 12 hours as well. You choose the
          package, the start time and your pickup and drop-off points in the KerayeGo app, and it
          checks that the trip fits in the time you picked before you send the request. A day
          package can be 1 to 6 days. If you need the car for 7 days or more, ask for a weekly or
          monthly price instead.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">Weeks and months: a price you agree</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Long rentals differ too much for one fixed price: how many hours a day you need the
          driver, how many days a week, and how far you&rsquo;ll go. So a weekly or monthly rental
          has no price on KerayeGo. You send a request with those details, and the business calls
          you to agree a price that suits both of you. Only cars the business has offered for
          weekly and monthly rental can be asked for this way.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">How to ask for a weekly or monthly price</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
          <li>Open a car offered for weekly and monthly rental in the KerayeGo app.</li>
          <li>Choose a week (1 to 4) or a month (1 to 12) and the start date.</li>
          <li>Add where the rental starts, where the car is handed back, and how many passengers.</li>
          <li>
            Say how many hours a day you need the driver, how many days a week, and roughly how many
            kilometres a month.
          </li>
          <li>
            The business calls you to agree the price and checks the documents it needs, such as your
            CNIC. Nothing is paid online.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">Which one should you choose?</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          For a trip, an event or a few busy days, book hours or days at the listed price — you know
          the cost before you send the request. If you need a car and driver most days for weeks, ask
          for a weekly or monthly price, then compare it with the car&rsquo;s day price for the days
          you would actually use it.
        </p>
      </section>

      {cities.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold text-ink">Where to find weekly and monthly cars</h2>
          <p className="mb-3 text-sm leading-relaxed text-text-muted">
            Each city has its own page of cars offered by the week or the month:
          </p>
          <div className="flex flex-wrap gap-2.5">
            {cities.map((city) => (
              <Link
                key={city}
                href={weeklyMonthlyCityUrl(city)}
                className="inline-flex h-9 items-center rounded-control border border-border-subtle bg-page px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                Weekly &amp; monthly in {cityName(city)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Ready to compare cars?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Browse cars and their prices, or read the full guide on renting a car in Pakistan.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/rent-a-car"
            className="inline-flex h-[38px] items-center rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg"
          >
            Browse vehicles
          </Link>
          <Link
            href="/guides/how-to-rent-a-car-in-pakistan"
            className="inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            How to rent a car in Pakistan
          </Link>
        </div>
      </div>
    </div>
  );
}
