import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { fetchPriceIndex, fetchPriceIndexHistory } from '../../../../lib/api/server';
import { cn } from '../../../../lib/utils/cn';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.kerayego.com';
const CC_BY_URL = 'https://creativecommons.org/licenses/by/4.0/';

export const metadata: Metadata = {
  title: 'Pakistan Car Rental Price Index — Real Daily Rates by City',
  description:
    'Real, live daily rental prices from KerayeGo\'s marketplace — average, minimum, and maximum rates by city and vehicle make across Pakistan, updated regularly from actual listings.',
  keywords: [
    'car rental price Pakistan',
    'average car rental price',
    'car rental rates by city Pakistan',
    'cheapest city car rental Pakistan',
  ],
  alternates: {
    canonical: '/rent-a-car/price-index',
  },
  openGraph: {
    title: 'Pakistan Car Rental Price Index',
    description: 'Real average, minimum, and maximum daily rental rates by city and vehicle make, from live KerayeGo listings.',
  },
};

function toDisplayName(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

function formatMonth(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function PriceIndexPage() {
  const [res, historyRes] = await Promise.all([fetchPriceIndex(), fetchPriceIndexHistory()]);
  const data = res?.data;
  // null when the endpoint isn't available (e.g. before the snapshots
  // migration is deployed) — the history section then simply doesn't render.
  const history = historyRes?.data ?? null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Rent a Car', item: '/rent-a-car' },
      { '@type': 'ListItem', position: 3, name: 'Price Index', item: '/rent-a-car/price-index' },
    ],
  };

  const generatedAt = data?.generatedAt ? new Date(data.generatedAt) : null;
  const monthLabel = (generatedAt ?? new Date()).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });

  // Dataset markup so the index can surface in Google Dataset Search and is
  // easy to cite. Licence covers the aggregate figures on this page only (not
  // listings or photos) — chosen to encourage attributed reuse and links.
  const datasetJsonLd = data?.overall
    ? {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Pakistan Car Rental Price Index',
        description:
          'Median, average, lowest and highest daily car rental prices in Pakistan by city and vehicle make, computed from approved rental listings on KerayeGo.',
        url: `${SITE_URL}/rent-a-car/price-index`,
        license: CC_BY_URL,
        isAccessibleForFree: true,
        creator: { '@type': 'Organization', name: 'KerayeGo', url: SITE_URL },
        spatialCoverage: 'Pakistan',
        dateModified: data.generatedAt,
        variableMeasured: ['Daily rental price (PKR)'],
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/csv',
            contentUrl: `${SITE_URL}/rent-a-car/price-index/download`,
          },
        ],
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {datasetJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
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
        <span className="font-semibold text-ink">Price Index</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Pakistan Car Rental Price Index
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          How much does it cost to rent a car in Pakistan?
          {data?.overall &&
            ` Right now, half of the ${data.overall.count.toLocaleString()} cars listed on KerayeGo rent for ${formatPKR(data.overall.medianPrice)} a day or less, and daily rates run from ${formatPKR(data.overall.minPrice)} to ${formatPKR(data.overall.maxPrice)}.`}{' '}
          These are real rates computed directly from vehicles currently listed on KerayeGo, not
          estimates. Prices vary by vehicle condition, provider, and season; use this as a
          starting reference, not a quote.
        </p>
        {generatedAt && (
          <p className="mt-2 text-xs text-text-faint">
            Last updated{' '}
            {generatedAt.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {!data?.overall ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-600">Not enough listings yet to publish a price index.</p>
          <Link href="/rent-a-car" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Browse all vehicles
          </Link>
        </div>
      ) : (
        <>
          {/* Overall summary */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatTile
              label="Vehicles tracked"
              value={data.overall.count.toLocaleString()}
              className="col-span-2 sm:col-span-1"
            />
            <StatTile label="Lowest daily rate" value={formatPKR(data.overall.minPrice)} />
            <StatTile label="Median daily rate" value={formatPKR(data.overall.medianPrice)} />
            <StatTile label="Average daily rate" value={formatPKR(data.overall.avgPrice)} />
            <StatTile label="Highest daily rate" value={formatPKR(data.overall.maxPrice)} />
          </div>

          {/* By city */}
          {data.byCity.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 text-lg font-semibold text-ink">Average daily price by city</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-surface-hover text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Vehicles</th>
                      <th className="px-4 py-3">Lowest</th>
                      <th className="px-4 py-3">Median</th>
                      <th className="px-4 py-3">Average</th>
                      <th className="px-4 py-3">Highest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.byCity.map((row) => (
                      <tr key={row.city}>
                        <td className="px-4 py-3 font-medium text-ink">
                          <Link href={`/rent-a-car/${encodeURIComponent(row.city)}`} className="hover:text-brand-700 hover:underline">
                            {toDisplayName(row.city)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{row.count}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(row.minPrice)}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(row.medianPrice)}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-ink">{formatPKR(row.avgPrice)}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(row.maxPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* By make */}
          {data.byMake.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-ink">Average daily price by make</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-surface-hover text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Make</th>
                      <th className="px-4 py-3">Vehicles</th>
                      <th className="px-4 py-3">Lowest</th>
                      <th className="px-4 py-3">Median</th>
                      <th className="px-4 py-3">Average</th>
                      <th className="px-4 py-3">Highest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.byMake.map((row) => (
                      <tr key={row.make}>
                        <td className="px-4 py-3 font-medium text-ink">
                          <Link href={`/rent-a-car?make=${encodeURIComponent(row.make)}`} className="hover:text-brand-700 hover:underline">
                            {toDisplayName(row.make)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{row.count}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(row.minPrice)}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(row.medianPrice)}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-ink">{formatPKR(row.avgPrice)}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(row.maxPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {history && history.length >= 2 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-semibold text-ink">Month by month</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-surface-hover text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Vehicles</th>
                      <th className="px-4 py-3">Median</th>
                      <th className="px-4 py-3">Average</th>
                      <th className="px-4 py-3">Median vs previous month</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {[...history].reverse().map((entry, i, rows) => {
                      const previous = rows[i + 1];
                      const change = previous
                        ? ((entry.overall.medianPrice - previous.overall.medianPrice) / previous.overall.medianPrice) * 100
                        : null;
                      return (
                        <tr key={entry.month}>
                          <td className="px-4 py-3 font-medium text-ink">{formatMonth(entry.month)}</td>
                          <td className="px-4 py-3 text-text-muted">{entry.overall.count}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-ink">
                            {formatPKR(entry.overall.medianPrice)}
                          </td>
                          <td className="px-4 py-3 font-mono text-text-muted">{formatPKR(entry.overall.avgPrice)}</td>
                          <td className="px-4 py-3 font-mono text-text-muted">
                            {change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-text-faint">
                Each month shows the figures recorded on its last day; the current month updates daily.
              </p>
            </section>
          )}
          {history && history.length === 1 && (
            <p className="mt-8 text-sm text-text-muted">
              We started recording these figures every month in {formatMonth(history[0].month)}. A
              month-by-month comparison will appear here from next month.
            </p>
          )}

          {/* Methodology — describes exactly what ListingsService.getPriceIndex()
              does in kerayego-backend; update both together. */}
          <section className="mt-12 border-t border-border-subtle pt-8">
            <h2 className="mb-3 text-lg font-semibold text-ink">How these figures are calculated</h2>
            <ul className="max-w-3xl space-y-2 text-sm leading-relaxed text-text-muted">
              <li>
                Every rental vehicle listed on KerayeGo in Pakistan that our team has approved, from a
                verified provider with an active account, is included, whether or not it happens to be
                booked today.
              </li>
              <li>
                The price used is the daily rate the provider lists. Weekly, monthly and 6- or
                12-hour rates aren&rsquo;t mixed in, and nothing is adjusted for negotiation or
                season. Every car on KerayeGo is rented with the provider&rsquo;s driver; there are no
                self-drive listings.
              </li>
              <li>
                The median is the middle price, so half the cars cost that much or less; the average
                is the plain mean, which a few expensive cars can pull up.
              </li>
              <li>
                A city or make only gets its own row once at least two cars are listed for it.
              </li>
              <li>
                Figures are recalculated from live listings at least every hour, so they move as
                providers add cars or change prices.
              </li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-ink">Using this data</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-muted">
              You&rsquo;re welcome to quote or reuse the figures on this page in articles, research or
              your own site under the{' '}
              <a href={CC_BY_URL} target="_blank" rel="noopener noreferrer license" className="font-semibold text-brand-700 hover:underline">
                Creative Commons Attribution 4.0 licence
              </a>
              , as long as you credit KerayeGo and link back to this page. Suggested citation:
            </p>
            <p className="mt-3 max-w-3xl rounded-control border border-border-subtle bg-surface px-4 py-3 font-mono text-xs text-ink">
              KerayeGo, &ldquo;Pakistan Car Rental Price Index&rdquo;, {monthLabel}.{' '}
              {SITE_URL}/rent-a-car/price-index
            </p>
            <a
              href="/rent-a-car/price-index/download"
              download
              className="mt-4 inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              Download the data (CSV)
            </a>
          </section>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('rounded-control border border-border-subtle bg-surface p-3.5', className)}>
      <div className="mb-1 text-[11px] text-text-faint">{label}</div>
      <div className="font-mono text-[15px] font-semibold text-ink">{value}</div>
    </div>
  );
}
