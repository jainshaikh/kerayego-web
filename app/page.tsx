import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { BadgeCheck, MessageSquare, Tag, Zap, ArrowRight } from 'lucide-react';
import {
  fetchFeaturedListings,
  fetchDistinctCities,
  fetchListings,
  fetchAllProviders,
} from '../lib/api/server';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { VehicleCard } from '../components/listings/VehicleCard';
import type { ListingVehicleCard } from '../lib/api/listings.api';
import { HeroSearch } from '../components/home/HeroSearch';
import { HeroStats, type HeroStat } from '../components/home/HeroStats';
import { HeroCollage } from '../components/home/HeroCollage';
import { Reveal } from '../components/common/Reveal';
import { Logo } from '../components/common/Logo';
import { USER_LOCATION_COOKIE, DEFAULT_NEARBY_RADIUS_KM, parseUserLocation } from '../lib/utils/userLocation';

export const metadata: Metadata = {
  title: 'KerayeGo — Car Rental & Intercity Ride Sharing in Pakistan',
  description:
    'Browse hundreds of rental vehicles from verified providers across Karachi, Lahore, and Islamabad. Compare prices, check availability, and send inquiries in seconds.',
  openGraph: {
    title: 'KerayeGo — Find Your Perfect Car',
    description: 'Verified rental providers. No hidden fees. Book in minutes.',
  },
};

const TRUST_SIGNALS = [
  {
    Icon: BadgeCheck,
    title: 'Verified providers',
    sub: 'Every licence and trade permit is reviewed before listing.',
  },
  {
    Icon: MessageSquare,
    title: 'Free to inquire',
    sub: 'Message the owner directly. No payment until confirmed.',
  },
  {
    Icon: Tag,
    title: 'Transparent pricing',
    sub: 'Real daily and weekly rates. No hidden fees at handover.',
  },
  {
    Icon: Zap,
    title: 'Fast response',
    sub: 'Most providers reply the same day, often within an hour.',
  },
];

export default async function HomePage() {
  // Set client-side once "Use my location"/Places search resolves a spot —
  // reading it here lets the server-rendered featured section personalize
  // around it, same pattern the old `preferredCity` cookie used.
  const location = parseUserLocation(cookies().get(USER_LOCATION_COOKIE)?.value);

  // Both /listings and /providers return meta.total, so the two headline
  // counters are real numbers — limit=1 keeps the payload tiny since we only
  // want the count. There is no stats endpoint; if you add one, swap these two
  // calls for it rather than fetching a page of rows to read its total.
  const [featuredRes, citiesRes, listingsRes, providersRes] = await Promise.all([
    fetchFeaturedListings(6, undefined, location?.lat, location?.lng, location ? DEFAULT_NEARBY_RADIUS_KM : undefined),
    fetchDistinctCities(),
    fetchListings({ limit: '1' }),
    fetchAllProviders(1, 1),
  ]);

  const featured: ListingVehicleCard[] = featuredRes?.data ?? [];
  const cities: string[] = citiesRes?.data ?? [];

  const vehicleCount = listingsRes?.meta?.total ?? 0;
  const providerCount = providersRes?.meta?.total ?? 0;

  // Only render counters backed by data. The design also showed an
  // "Avg. provider rating" of 4.8 — there is no rating field on the provider
  // model, so it is omitted rather than hardcoded. Add it back here once
  // ratings exist; the component takes any number of stats.
  const heroStats: HeroStat[] = [
    ...(vehicleCount ? [{ value: vehicleCount, suffix: '+', label: 'Vehicles listed' }] : []),
    ...(providerCount ? [{ value: providerCount, label: 'Verified providers' }] : []),
  ];

  // First three featured photos double as the hero collage.
  const collageImages = featured.slice(0, 3).map((v) => v.images?.[0]?.url);

  return (
    <div className="min-h-screen bg-page">
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* Warm ambient wash. Two soft coral/amber pools instead of the old
            blue-on-slate glow — decorative only, hence pointer-events-none. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-48 h-[30rem] w-[30rem] rounded-full bg-brand-600/25 blur-[120px]" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-amber/20 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-28 pt-20 sm:px-6 lg:grid-cols-[1fr_minmax(0,560px)] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
              {providerCount > 0
                ? `${providerCount.toLocaleString()} verified providers across Pakistan`
                : 'Verified providers across Pakistan'}
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-[1.03] tracking-[-0.045em] sm:text-[68px]">
              Find your
              <br />
              {/* The gradient lives on the text here — the one place in the hero
                  it appears, so it reads as emphasis rather than decoration. */}
              <span className="bg-brand bg-clip-text text-transparent">perfect rental</span>
            </h1>

            <p className="mb-9 max-w-xl text-[17px] leading-relaxed text-white/60">
              Compare vehicles from verified providers, see real daily and weekly rates, and message
              the owner directly. No hidden fees, no payment until it&rsquo;s confirmed.
            </p>

            <HeroSearch cities={cities} />

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/rent-a-car"
                className="inline-flex h-[52px] items-center rounded-control bg-brand px-7 text-[15px] font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg active:translate-y-0 active:scale-[0.98]"
              >
                Browse all vehicles
              </Link>
              <Link
                href="/register?role=PROVIDER"
                className="group inline-flex h-[52px] items-center gap-2 rounded-control border border-white/20 px-7 text-[15px] font-semibold text-[white] transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.06] active:translate-y-0"
              >
                List your fleet
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            {heroStats.length > 0 && <HeroStats stats={heroStats} />}
          </div>

          {/* Collage: hidden below lg — it is absolutely positioned at a fixed
              height and has no sensible stacked form. */}
          <HeroCollage images={collageImages} />
        </div>
      </section>

      {/* ── Trust signals ─────────────────────────────────────────────── */}
      <section className="border-b border-border-subtle bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_SIGNALS.map(({ Icon, title, sub }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="group">
                  {/* Icons, not emoji — emoji render differently per platform and
                      cannot inherit the brand colour on hover. */}
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-media border border-brand-100 bg-brand-50 text-brand-700 transition-all duration-200 ease-spring group-hover:-rotate-6 group-hover:scale-105 group-hover:border-transparent group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-[15px] font-semibold text-ink">{title}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured vehicles ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                  Featured
                </p>
                <h2 className="text-[28px] font-bold tracking-[-0.038em] text-ink">
                  {location ? `Hand-picked vehicles near ${location.label}` : 'Hand-picked vehicles'}
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  {location
                    ? 'Chosen from our highest-rated providers near you'
                    : 'Chosen from our highest-rated providers'}
                </p>
              </div>
              <Link
                href="/rent-a-car"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((vehicle, i) => (
              <Reveal key={vehicle.id} delay={i * 70}>
                <VehicleCard vehicle={vehicle} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Browse by city ────────────────────────────────────────────── */}
      {cities.length > 0 && (
        <section className="border-y border-border-subtle bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="text-[22px] font-bold tracking-[-0.035em] text-ink">Browse by city</h2>
              <p className="mt-2 text-sm text-text-muted">
                Pick a city to see what&rsquo;s available right now
              </p>
            </Reveal>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {cities.slice(0, 10).map((city, i) => (
                <Reveal key={city} delay={i * 35}>
                  <Link
                    href={`/rent-a-car/${encodeURIComponent(city)}`}
                    className="inline-flex h-10 items-center rounded-control border border-border-subtle bg-page px-4 text-sm font-medium text-ink transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:border-brand-600 hover:text-brand-700 hover:shadow-sm active:translate-y-0"
                  >
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Provider CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-600/20 blur-[110px]" />
          <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-amber/15 blur-[90px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-[34px] font-bold leading-[1.12] tracking-[-0.04em] text-white">
              Own a fleet? List it here.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-white/55">
              Join hundreds of verified providers reaching thousands of renters across Pakistan.
              Listing is free — you only ever talk to renters who are ready to book.
            </p>
            <Link
              href="/register?role=PROVIDER"
              className="mt-9 inline-flex h-[52px] items-center rounded-control bg-brand px-8 text-[15px] font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg active:translate-y-0 active:scale-[0.98]"
            >
              Get started as a provider
            </Link>
            <p className="mt-4 text-xs text-white/40">
              Not sure how it works?{' '}
              <Link href="/guides/how-to-list-your-car-for-rent" className="font-semibold text-white/70 hover:text-white hover:underline">
                Read the step-by-step guide
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-xs text-text-faint sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Logo className="h-6" />
          </div>
          <p>&copy; {new Date().getFullYear()} KerayeGo. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/rent-a-car" className="transition-colors hover:text-brand-700">
              Browse
            </Link>
            <Link href="/providers" className="transition-colors hover:text-brand-700">
              Providers
            </Link>
            <Link href="/carpool" className="transition-colors hover:text-brand-700">
              Carpool
            </Link>
            <Link href="/rent-a-car/price-index" className="transition-colors hover:text-brand-700">
              Price Index
            </Link>
            <Link href="/about" className="transition-colors hover:text-brand-700">
              About
            </Link>
            <Link href="/faq" className="transition-colors hover:text-brand-700">
              FAQ
            </Link>
            <Link href="/guides" className="transition-colors hover:text-brand-700">
              Guides
            </Link>
            <Link href="/safety" className="transition-colors hover:text-brand-700">
              Safety
            </Link>
            <Link href="/contact" className="transition-colors hover:text-brand-700">
              Contact
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-brand-700">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-brand-700">
              Terms
            </Link>
            <Link href="/login" className="transition-colors hover:text-brand-700">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
