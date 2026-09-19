import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Car, BadgeCheck, MessageCircle, Ban, CheckCircle2, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trust & Safety',
  description:
    'How KerayeGo keeps its car rental and carpool marketplace safe — listing review, identity verification, and how to stay safe when meeting a provider or driver.',
  keywords: [
    'KerayeGo safety',
    'KerayeGo trust and safety',
    'car rental safety Pakistan',
    'carpool safety Pakistan',
  ],
  alternates: {
    canonical: '/safety',
  },
  openGraph: {
    title: 'Trust & Safety — KerayeGo',
    description:
      'How KerayeGo keeps its car rental and carpool marketplace safe — listing review, identity verification, and safe meetups.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Trust & Safety', item: '/safety' },
  ],
};

export default function SafetyPage() {
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
        <span className="font-semibold text-ink">Trust &amp; Safety</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Trust &amp; Safety</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          KerayeGo is a marketplace that connects renters and riders directly with providers and
          drivers. Safety here means both what KerayeGo verifies before a listing goes live, and
          sensible precautions for the real-world meetup that follows.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">Rental listings</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Every vehicle rental listing is reviewed by KerayeGo&rsquo;s team before it appears
            publicly on the site. Vehicle photos carry a KerayeGo watermark, so you know
            you&rsquo;re looking at the real listing, not a copy.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">Carpool vehicles and drivers</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Personal vehicles registered for carpooling go through CNIC (national ID) and
            driving-license verification before they can be used on the platform.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">Staying in touch</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Every listing has a direct WhatsApp button so you can message the provider or driver
            yourself. For an active carpool trip, chat and — where a driver has enabled it — live
            location sharing are also available in the app.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">No online payments</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            KerayeGo doesn&rsquo;t process rental or carpool payments on the platform — they&rsquo;re
            arranged directly between you and the other party. This means there&rsquo;s no payment
            held by KerayeGo to dispute, but also that you should use the same judgment you would
            with any in-person transaction.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">A few practical tips</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            General good-sense tips — not a KerayeGo-enforced policy:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-muted">
            <li>Meet in a safe, public place where possible.</li>
            <li>Look over the vehicle before handing over payment.</li>
            <li>
              Keep the conversation on WhatsApp or in-app chat rather than moving off the record
              before you&rsquo;re comfortable.
            </li>
            <li>Trust your judgment, and walk away from anything that feels off.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">Reviews</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Reviews are written by real users after a rental or ride, and KerayeGo may remove a
            review that&rsquo;s fabricated or abusive.
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <p className="text-sm text-text-muted">
          Have more questions about how KerayeGo works? Check the{' '}
          <Link href="/faq" className="font-semibold text-brand-700 hover:underline">
            FAQ
          </Link>{' '}
          or read more{' '}
          <Link href="/about" className="font-semibold text-brand-700 hover:underline">
            about KerayeGo
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
