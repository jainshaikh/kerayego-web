import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { GuideByline } from '../../../../components/common/GuideByline';

export const metadata: Metadata = {
  title: 'Carpool Safety in Pakistan',
  description:
    'What KerayeGo verifies before a personal vehicle can be used for carpooling, and how to stay safe on a shared intercity ride.',
  keywords: [
    'carpool safety Pakistan',
    'KerayeGo carpool guide',
    'intercity carpool safety',
    'is carpooling safe Pakistan',
  ],
  alternates: {
    canonical: '/guides/carpool-safety-pakistan',
  },
  openGraph: {
    title: 'Carpool Safety in Pakistan — KerayeGo Guide',
    description:
      'What KerayeGo verifies before a personal vehicle can be used for carpooling, and how to stay safe on a shared intercity ride.',
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
      name: 'Carpool Safety in Pakistan',
      item: '/guides/carpool-safety-pakistan',
    },
  ],
};

export default function CarpoolSafetyGuidePage() {
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
        <span className="font-semibold text-ink">Carpool Safety in Pakistan</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Carpool Safety in Pakistan
        </h1>
        <GuideByline
          title="Carpool Safety in Pakistan"
          path="/guides/carpool-safety-pakistan"
          published="2026-09-19"
          updated="2026-10-14"
        />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          Carpooling on KerayeGo means a driver posts an intercity trip in their own vehicle with
          available seats, and other users request a seat on that trip. Here&rsquo;s what&rsquo;s
          actually in place to help you travel safely, and a few things worth doing yourself
          before you go.
        </p>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-700" />
          <h2 className="text-base font-semibold text-ink">Vehicle and driver verification</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Before a personal vehicle can be used for carpooling, our team checks the owner&rsquo;s
          CNIC (national ID, front and back), driving licence and the vehicle&rsquo;s registration.
          Only an approved vehicle can be used to post a trip.
        </p>
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-brand-700" />
          <h2 className="text-base font-semibold text-ink">Staying in touch during the trip</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Once the driver starts the trip, they and each accepted rider can message each other in
          in-app chat, and accepted riders can follow the driver&rsquo;s live location while the
          driver shares it. Nobody else can see it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">No online payment</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          KerayeGo doesn&rsquo;t process carpool payments — the fare is agreed directly between
          the driver and rider, so treat it the same way you would any in-person arrangement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-ink">Before you go</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-text-muted">
          <li>
            Confirm the pickup point and time with the driver by phone or WhatsApp before the day.
          </li>
          <li>Share your trip plan with someone you trust.</li>
          <li>Trust your own judgment if anything feels off before you get in the vehicle.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-base font-semibold text-ink">Changed your mind?</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          You can withdraw a seat request at any time while the driver hasn&rsquo;t answered it.
          Once you&rsquo;ve been accepted, you can still cancel up until the departure time.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          New to carpooling? See{' '}
          <Link href="/guides/how-carpooling-works" className="font-semibold text-brand-700 hover:underline">
            how carpooling works
          </Link>
          , or if you&rsquo;re driving,{' '}
          <Link href="/guides/how-to-offer-a-ride" className="font-semibold text-brand-700 hover:underline">
            how to offer a ride
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Ready to travel?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Find a carpool trip on your route, or read more about safety on KerayeGo.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/carpool"
            className="inline-flex h-[38px] items-center rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg"
          >
            Find a carpool trip
          </Link>
          <Link
            href="/safety"
            className="inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            KerayeGo safety
          </Link>
        </div>
      </section>
    </div>
  );
}
