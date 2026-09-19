import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, FileText, Clock, Car, CheckCircle2, MessageSquare, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to List Your Car for Rent',
  description:
    'The real steps to become a KerayeGo provider and list your first vehicle for rent in Pakistan.',
  keywords: [
    'list car for rent Pakistan',
    'become a KerayeGo provider',
    'how to rent out your car',
  ],
  alternates: {
    canonical: '/guides/how-to-list-your-car-for-rent',
  },
  openGraph: {
    title: 'How to List Your Car for Rent on KerayeGo',
    description:
      'The real steps to become a KerayeGo provider and list your first vehicle for rent in Pakistan.',
  },
};

const STEPS = [
  {
    icon: Building2,
    heading: '1. Register as a provider',
    body: (
      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
        Create a KerayeGo account with the provider role at{' '}
        <Link href="/register?role=PROVIDER" className="font-semibold text-brand-700 hover:underline">
          /register?role=PROVIDER
        </Link>
        .
      </p>
    ),
  },
  {
    icon: FileText,
    heading: '2. Complete your provider profile',
    body: (
      <>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
          Fill out the short provider profile wizard — it&rsquo;s five tabs:
        </p>
        <ol className="mt-2 space-y-1 text-sm leading-relaxed text-text-muted">
          <li>1. Business Info</li>
          <li>2. Upload Logo</li>
          <li>3. Showroom</li>
          <li>4. Documents</li>
          <li>5. Submit</li>
        </ol>
      </>
    ),
  },
  {
    icon: Clock,
    heading: '3. Wait for approval',
    body: (
      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
        Your provider profile is reviewed before you can start listing vehicles.
      </p>
    ),
  },
  {
    icon: Car,
    heading: '4. Add your vehicle',
    body: (
      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
        Once approved, add a vehicle with photos and pricing — day, week, month, whichever you
        want to offer. See our companion guide on{' '}
        <Link
          href="/guides/monthly-vs-daily-car-rental"
          className="font-semibold text-brand-700 hover:underline"
        >
          daily vs. monthly car rental pricing
        </Link>{' '}
        if you&rsquo;re not sure which to pick.
      </p>
    ),
  },
  {
    icon: CheckCircle2,
    heading: '5. Your listing goes live after review',
    body: (
      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
        Like every rental listing on KerayeGo, it&rsquo;s reviewed by the team before it appears
        publicly.
      </p>
    ),
  },
  {
    icon: MessageSquare,
    heading: '6. Respond to booking requests',
    body: (
      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
        Renters send you free booking requests. You get in touch to confirm pickup, dates, and
        payment directly with them.
      </p>
    ),
  },
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: '/guides' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'How to List Your Car for Rent',
      item: '/guides/how-to-list-your-car-for-rent',
    },
  ],
};

export default function HowToListYourCarForRentPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
        <span className="font-semibold text-ink">How to List Your Car for Rent</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          How to List Your Car for Rent on KerayeGo
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          KerayeGo lets you list your own vehicle for rent as a provider. Here&rsquo;s the real
          process, from creating an account to your first live listing.
        </p>
      </div>

      <div className="space-y-8">
        {STEPS.map(({ icon: Icon, heading, body }) => (
          <section key={heading}>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-brand-700" />
              <h2 className="text-base font-semibold text-ink">{heading}</h2>
            </div>
            {body}
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Ready to list your vehicle?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Register as a provider and start the process today.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/register?role=PROVIDER"
            className="inline-flex h-[38px] items-center rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg"
          >
            Become a provider
          </Link>
          <Link
            href="/about"
            className="inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Learn more about KerayeGo
          </Link>
        </div>
      </section>
    </div>
  );
}
