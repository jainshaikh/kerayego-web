import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guides',
  description:
    'Practical guides for renting a car, carpooling, and listing your vehicle on KerayeGo in Pakistan.',
  keywords: [
    'KerayeGo guides',
    'how to rent a car in Pakistan',
    'how to list a car for rent',
    'carpool safety Pakistan',
  ],
  alternates: {
    canonical: '/guides',
  },
  openGraph: {
    title: 'Guides — KerayeGo',
    description:
      'Practical guides for renting a car, carpooling, and listing your vehicle on KerayeGo in Pakistan.',
  },
};

const GUIDES: { title: string; description: string; href: string }[] = [
  {
    title: 'How to Rent a Car in Pakistan',
    description:
      'A step-by-step walkthrough of renting a car on KerayeGo, from browsing listings to sending your first booking request.',
    href: '/guides/how-to-rent-a-car-in-pakistan',
  },
  {
    title: 'Monthly vs. Daily Car Rental',
    description:
      "How KerayeGo's daily, weekly, and monthly rental pricing works, and how to compare them.",
    href: '/guides/monthly-vs-daily-car-rental',
  },
  {
    title: 'How to List Your Car for Rent',
    description: 'The real steps to become a KerayeGo provider and list your first vehicle.',
    href: '/guides/how-to-list-your-car-for-rent',
  },
  {
    title: 'Carpool Safety in Pakistan',
    description:
      'What KerayeGo verifies before a personal vehicle can be used for carpooling, and how to stay safe on a shared ride.',
    href: '/guides/carpool-safety-pakistan',
  },
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: '/guides' },
  ],
};

export default function GuidesPage() {
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
        <span className="font-semibold text-ink">Guides</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Guides</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          Practical, step-by-step guides for renting a car, carpooling, and listing your own
          vehicle on KerayeGo.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <div key={guide.href} className="rounded-xl border border-border-subtle bg-surface p-5">
            <Link
              href={guide.href}
              className="text-base font-semibold text-ink hover:text-brand-700 hover:underline"
            >
              {guide.title}
            </Link>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{guide.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
