import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Monthly vs. Daily Car Rental in Pakistan',
  description:
    "How KerayeGo's daily, weekly, and monthly car rental pricing works, and how to compare them.",
  keywords: [
    'monthly car rental Pakistan',
    'daily car rental Pakistan',
    'weekly car rental price',
    'KerayeGo pricing guide',
  ],
  alternates: {
    canonical: '/guides/monthly-vs-daily-car-rental',
  },
  openGraph: {
    title: 'Monthly vs. Daily Car Rental in Pakistan',
    description:
      "How KerayeGo's daily, weekly, and monthly car rental pricing works, and how to compare them.",
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

export default function MonthlyVsDailyCarRentalGuidePage() {
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
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          On KerayeGo, a provider can price a vehicle by the day, week, or month — and sometimes
          by the 6- or 12-hour block for shorter trips. Renting for longer often works out
          cheaper per day than booking the same vehicle one day at a time.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">
          Not every vehicle has every option
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Because each provider sets their own pricing, one vehicle might only have a daily rate
          while another lists day, week, and month rates. Check the pricing section on a
          vehicle&rsquo;s own listing page to see exactly which durations that provider offers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">How to compare</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          When a vehicle does list more than one duration, compare the per-day cost at each
          length — for example, divide the weekly or monthly rate by 7 or by the number of days —
          to see whether a longer booking is actually cheaper for your trip.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">
          How to ask about a longer rental
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">
          If a vehicle only shows a daily rate but you need it for a week or a month, send a
          booking request and ask the provider directly — pricing for longer stays is something
          you can always ask about even if it isn&rsquo;t listed.
        </p>
      </section>

      <div className="mt-10 rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Ready to compare vehicles?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Browse vehicles and their pricing directly, or read the full guide on renting a car in
          Pakistan.
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
