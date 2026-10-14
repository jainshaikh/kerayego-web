import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AppDownloadButtons } from '../../../../components/common/AppDownloadButtons';
import { GuideByline } from '../../../../components/common/GuideByline';

// Every statement here is checked against the trips / trip-inquiries /
// reviews modules in kerayego-backend (verified 2026-10-14) — seat requests
// hold nothing until accepted, unanswered requests expire after 24 h or 2 h
// before departure, the per-seat price is flat whatever stops a rider picks,
// nothing is paid on the platform. Don't add features the product doesn't
// have (women-only trips, SOS, in-app payment) when editing.
export const metadata: Metadata = {
  title: 'How Carpooling Works in Pakistan',
  description:
    'How intercity carpooling works on KerayeGo: find a driver going your way, request a seat, pick your pickup point, and split the cost of the trip. No booking fees.',
  keywords: [
    'how carpooling works',
    'carpool in Pakistan',
    'intercity carpool',
    'ride sharing between cities Pakistan',
    'benefits of carpooling',
  ],
  alternates: {
    canonical: '/guides/how-carpooling-works',
  },
  openGraph: {
    title: 'How Carpooling Works in Pakistan',
    description:
      'Find a driver going your way, request a seat, pick your pickup point, and split the cost of the trip.',
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
      name: 'How Carpooling Works',
      item: '/guides/how-carpooling-works',
    },
  ],
};

const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: 'Find a trip going your way',
    body: (
      <>
        Open{' '}
        <Link href="/carpool" className="font-semibold text-brand-700 hover:underline">
          Carpool
        </Link>{' '}
        and pick a route or the city you&rsquo;re leaving from. You&rsquo;ll only see trips that
        haven&rsquo;t left yet and still have seats free. You don&rsquo;t need an account to look
        around.
      </>
    ),
  },
  {
    title: 'Check the details',
    body: 'Each trip shows the departure date and time (Pakistan time), the pickup and drop-off points, the price per seat, how many seats are left, the car, and reviews other riders have left for the driver.',
  },
  {
    title: 'Request your seats',
    body: 'Sign in, choose how many seats you need, and pick the pickup point and drop-off point that suit you from the ones the driver listed. You can add a short note too, for example where exactly you’ll be waiting. Sending a request is free.',
  },
  {
    title: 'Wait for the driver to answer',
    body: 'The driver accepts or declines your request. Your seats are only held once they accept, so until then the trip can still fill up. If a request isn’t answered, it expires on its own after 24 hours, or two hours before departure if that comes sooner. Keep an eye on your trip requests in your account.',
  },
  {
    title: 'Confirm the pickup',
    body: 'Once you’re accepted, you can see the driver’s phone number. Give them a call or a WhatsApp message to confirm where and when they’ll pick you up. You pay the driver directly, the way you agree between you.',
  },
  {
    title: 'Travel, then leave a review',
    body: 'When the driver starts the trip, accepted riders can chat with them and follow their location if they’re sharing it. After the trip you can rate the driver and the car. Those ratings show on the driver’s future trips, which helps the next rider decide.',
  },
];

export default function HowCarpoolingWorksGuidePage() {
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
        <span className="font-semibold text-ink">How Carpooling Works</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          How Carpooling Works in Pakistan
        </h1>
        <GuideByline
          title="How Carpooling Works in Pakistan"
          path="/guides/how-carpooling-works"
          published="2026-10-14"
          updated="2026-10-14"
        />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          Lots of people drive between cities with empty seats in their car. On KerayeGo, those
          drivers post their trip and set a price per seat, and anyone heading the same way can ask
          to come along. You get a seat in a private car, the driver gets help with the cost of a
          trip they were making anyway.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-ink">Why people carpool</h2>
        <ul className="space-y-2.5 text-sm leading-relaxed text-text-muted">
          <li>
            <span className="font-semibold text-ink">You pay for a seat, not a whole car.</span>{' '}
            The driver sets one price per seat for the route, so the cost of the trip is shared
            between everyone in the car.
          </li>
          <li>
            <span className="font-semibold text-ink">No booking fee.</span> KerayeGo doesn&rsquo;t
            take payment or a commission. What you pay goes to the driver.
          </li>
          <li>
            <span className="font-semibold text-ink">Pickup points that suit you.</span> Drivers
            can list several pickup and drop-off points in each city, and you choose the ones that
            are easiest for you. The price per seat stays the same whichever you pick.
          </li>
          <li>
            <span className="font-semibold text-ink">Checked drivers.</span> Before a car can be
            used for carpooling, our team checks the owner&rsquo;s CNIC, driving licence and the
            car&rsquo;s registration.
          </li>
          <li>
            <span className="font-semibold text-ink">Fewer cars on the road.</span> One car with
            four people in it instead of four cars making the same journey.
          </li>
        </ul>
      </section>

      <h2 className="mb-4 text-base font-semibold text-ink">Joining a trip, step by step</h2>
      <ol className="mb-10 space-y-6">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <h3 className="mb-1.5 text-sm font-semibold text-ink">
              {i + 1}. {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mb-10">
        <h2 className="mb-2 text-base font-semibold text-ink">If your plans change</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          You can withdraw a request that hasn&rsquo;t been answered yet at any time. If the
          driver has already accepted you, you can still cancel up until the departure time, and
          your seats go back on offer for other riders. It&rsquo;s kind to let the driver know too.
          If the driver cancels the trip, your request is cancelled automatically and you&rsquo;ll
          see that in your trip requests.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-base font-semibold text-ink">Driving yourself?</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          If you&rsquo;re the one with the car and the empty seats, see{' '}
          <Link href="/guides/how-to-offer-a-ride" className="font-semibold text-brand-700 hover:underline">
            how to offer a ride on KerayeGo
          </Link>
          . And whichever side you&rsquo;re on, our{' '}
          <Link href="/guides/carpool-safety-pakistan" className="font-semibold text-brand-700 hover:underline">
            carpool safety guide
          </Link>{' '}
          is worth a read before your first trip.
        </p>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Where are you headed?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          See the trips drivers have posted between cities right now.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/carpool"
            className="inline-flex h-[38px] items-center rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg"
          >
            Find a carpool trip
          </Link>
          <Link
            href="/guides/how-to-offer-a-ride"
            className="inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Offer a ride
          </Link>
        </div>
        {/* Hidden until the store links are configured (lib/config/apps.ts). */}
        <AppDownloadButtons className="mt-3" />
      </section>
    </div>
  );
}
