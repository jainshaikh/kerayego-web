import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Car, Users, ShieldCheck, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'KerayeGo is a two-sided mobility marketplace in Pakistan: rent a car from a verified provider, or post and join intercity carpool trips. Learn how it works and where we operate.',
  keywords: ['about KerayeGo', 'KerayeGo car rental', 'KerayeGo carpool Pakistan'],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About KerayeGo',
    description:
      'A two-sided mobility marketplace in Pakistan — car rental and intercity carpooling, in one place.',
  },
};

const CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Hyderabad',
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'About Us', item: '/about' },
  ],
};

export default function AboutPage() {
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
        <span className="font-semibold text-ink">About Us</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">About KerayeGo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          KerayeGo is a two-sided mobility marketplace built for Pakistan. On one side, verified
          providers list vehicles for rent, and travelers book directly with them. On the other,
          anyone can post or join an intercity carpool trip in their own vehicle. One platform,
          two ways to get where you&rsquo;re going.
        </p>
      </div>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <Car className="h-5 w-5 text-brand-700" />
          <h2 className="mt-3 text-base font-semibold text-ink">Car rental</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
            Browse vehicles by city, make, and price from providers across Pakistan, compare real
            daily rates, and send a booking request directly from the listing — no middleman.
          </p>
          <Link
            href="/rent-a-car"
            className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Browse vehicles
          </Link>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <Users className="h-5 w-5 text-brand-700" />
          <h2 className="mt-3 text-base font-semibold text-ink">Intercity carpooling</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
            Driving between cities anyway? Post your trip and offer seats. Traveling and want to
            split the cost? Find a route and request a seat.
          </p>
          <Link
            href="/carpool"
            className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Find a ride
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-700" />
          <h2 className="text-base font-semibold text-ink">Trust & safety</h2>
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            Every rental listing goes through review before it appears publicly on KerayeGo — we
            don&rsquo;t publish a vehicle sight unseen.
          </li>
          <li>
            Personal vehicles registered for carpooling go through CNIC and driving-license
            verification.
          </li>
          <li>
            Vehicle photos carry a KerayeGo watermark, so you can tell you&rsquo;re looking at the real
            listing.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-700" />
          <h2 className="text-base font-semibold text-ink">Where we operate</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          KerayeGo is live across {CITIES.length} cities in Pakistan today, with providers and
          carpool routes in:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <Link
              key={city}
              href={`/rent-a-car/${city.toLowerCase()}`}
              className="rounded-control border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              {city}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          We&rsquo;re expanding beyond Pakistan into Saudi Arabia and the UAE next.
        </p>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Get started</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Rent a car, post a ride, or list your own vehicle — it only takes a few minutes.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex h-[38px] items-center rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg"
          >
            Create an account
          </Link>
          <Link
            href="/register?role=PROVIDER"
            className="inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Become a provider
          </Link>
        </div>
      </section>
    </div>
  );
}
