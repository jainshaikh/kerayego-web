import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Rent a Car in Pakistan',
  description:
    'A step-by-step guide to renting a car on KerayeGo: browsing listings, sending a booking request, and what happens next.',
  keywords: [
    'how to rent a car in Pakistan',
    'KerayeGo rental guide',
    'car rental guide Pakistan',
  ],
  alternates: {
    canonical: '/guides/how-to-rent-a-car-in-pakistan',
  },
  openGraph: {
    title: 'How to Rent a Car in Pakistan',
    description:
      'A step-by-step guide to renting a car on KerayeGo: browsing listings, sending a booking request, and what happens next.',
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
      name: 'How to Rent a Car in Pakistan',
      item: '/guides/how-to-rent-a-car-in-pakistan',
    },
  ],
};

export default function HowToRentACarInPakistanGuidePage() {
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
        <span className="font-semibold text-ink">How to Rent a Car in Pakistan</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          How to Rent a Car in Pakistan
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          This guide walks through renting a car on KerayeGo from start to finish — browsing
          listings, sending a booking request, and what happens next.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">1. Browse vehicles</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Head to{' '}
          <Link href="/rent-a-car" className="font-semibold text-brand-700 hover:underline">
            Rent a Car
          </Link>{' '}
          and filter by city, make, or price to find a vehicle that fits what you need.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">2. Check the listing</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Open a vehicle you like to see its real daily rate — and weekly or monthly rate if the
          provider has set one, see our companion guide on{' '}
          <Link
            href="/guides/monthly-vs-daily-car-rental"
            className="font-semibold text-brand-700 hover:underline"
          >
            daily vs. monthly pricing
          </Link>{' '}
          — along with photos and provider details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">3. Send a free booking request</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Send an inquiry directly from the listing page. This doesn&rsquo;t cost anything and
          doesn&rsquo;t require any payment.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">4. Hear back from the provider</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          The provider will get in touch — usually over WhatsApp, since every listing has a direct
          WhatsApp button — to confirm pickup, exact dates, and payment. Payment is arranged
          directly between you and the provider; KerayeGo doesn&rsquo;t process payments on the
          platform.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-base font-semibold text-ink">5. Change your mind?</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          You can cancel a booking request you&rsquo;ve sent from your dashboard, as long as it
          hasn&rsquo;t already been completed.
        </p>
      </section>

      <p className="text-sm leading-relaxed text-text-muted">
        Ready to find a vehicle?{' '}
        <Link href="/rent-a-car" className="font-semibold text-brand-700 hover:underline">
          Browse cars for rent
        </Link>{' '}
        or check the{' '}
        <Link href="/faq" className="font-semibold text-brand-700 hover:underline">
          FAQ
        </Link>{' '}
        for more on how KerayeGo works.
      </p>
    </div>
  );
}
