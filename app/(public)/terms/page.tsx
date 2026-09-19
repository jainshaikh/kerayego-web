import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, AlertTriangle } from 'lucide-react';

// DRAFT — not yet published for real. Support email/phone are real (given
// 2026-09-19, temporary until an @kerayego.com address exists — that fact
// itself must never appear on the public page). The remaining bracketed
// values are still placeholders for facts only the business owner can supply
// (legal entity name/structure, registered address, governing-law city).
// Have those confirmed and this copy reviewed (ideally by counsel) before
// flipping `metadata.robots.index` to true and removing the banner below.
const LEGAL_ENTITY_NAME = '[Legal entity name — TBD]';
const REGISTERED_ADDRESS = '[Registered business address — TBD]';
const GOVERNING_LAW_CITY = '[Governing-law city, Pakistan — TBD]';
const SUPPORT_EMAIL = 'jainshaikh@gmail.com';
const SUPPORT_PHONE_DISPLAY = '+92 331 3693668';
const SUPPORT_PHONE_TEL = '+923313693668';
const LAST_UPDATED = 'September 19, 2026';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms that govern your use of KerayeGo — our car rental and intercity carpooling marketplace.',
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: false,
    follow: true,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Terms & Conditions', item: '/terms' },
  ],
};

export default function TermsPage() {
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
        <span className="font-semibold text-ink">Terms &amp; Conditions</span>
      </nav>

      <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <strong>Draft — not yet in effect.</strong> Bracketed fields below are placeholders
          pending real business details, and this page is set to <code>noindex</code> until
          they&rsquo;re filled in and the page has been reviewed.
        </p>
      </div>

      <h1 className="text-[26px] font-bold tracking-tight text-ink">Terms &amp; Conditions</h1>
      <p className="mt-2 text-xs text-text-faint">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 space-y-7 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">1. Acceptance of these terms</h2>
          <p>
            These Terms &amp; Conditions govern your use of KerayeGo, operated by{' '}
            {LEGAL_ENTITY_NAME}. By creating an account or using the site or app, you agree to
            them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">2. What KerayeGo is</h2>
          <p>
            KerayeGo is a marketplace, not a vehicle rental company or transport operator. On the
            rental side, providers list vehicles and users send booking requests directly to them.
            On the carpool side, any user can post an intercity trip in their own vehicle, and
            others can request a seat. KerayeGo connects these parties — the rental or ride itself
            is an agreement between you and the provider, driver, or rider you&rsquo;re dealing with.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">3. Eligibility and your account</h2>
          <p>
            You must be able to legally enter a binding agreement in your country to use KerayeGo,
            and any information you provide when registering must be accurate. You&rsquo;re responsible
            for keeping your account credentials secure and for activity on your account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">4. Listings and verification</h2>
          <p>
            Rental listings go through a review before they&rsquo;re published. Personal vehicles
            registered for carpooling require CNIC and driving-license verification. This review
            is a quality check on what&rsquo;s submitted to us — it isn&rsquo;t a guarantee of a vehicle&rsquo;s
            condition, a provider&rsquo;s conduct, or a driver&rsquo;s behavior, and you should still exercise
            your own judgment before meeting anyone or handing over a vehicle or payment.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">5. Payments</h2>
          <p>
            KerayeGo does not process payments for rentals or carpool rides. Price, deposits, fuel,
            mileage, and any other payment terms are agreed directly between you and the other
            party. We aren&rsquo;t responsible for payment disputes between users, though you&rsquo;re welcome
            to report a problem to us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">6. Cancellations</h2>
          <p>
            You can cancel a booking request or a carpool seat request you&rsquo;ve sent, as long as it
            hasn&rsquo;t already been completed, from your dashboard. Any cancellation fee or refund tied
            to the underlying rental or ride itself is between you and the provider or driver,
            since KerayeGo isn&rsquo;t part of that payment.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">7. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>post a fraudulent, misleading, or duplicate listing;</li>
            <li>upload a document or photo that isn&rsquo;t genuinely yours or your vehicle&rsquo;s;</li>
            <li>harass, threaten, or discriminate against another user;</li>
            <li>use the platform for anything unlawful; or</li>
            <li>scrape, copy, or reuse KerayeGo&rsquo;s content — including vehicle photos — without permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">8. Reviews</h2>
          <p>
            Reviews must reflect a genuine experience on the platform. We may remove a review that
            is fabricated, abusive, or otherwise violates these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">9. Intellectual property</h2>
          <p>
            KerayeGo&rsquo;s name, branding, and software belong to {LEGAL_ENTITY_NAME}. You keep
            ownership of the content you upload (like vehicle photos), but you grant KerayeGo a
            license to display it on the platform for the purpose of your listing.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">10. Third-party services</h2>
          <p>
            KerayeGo uses third-party services to operate — including Google Maps, Google
            Analytics, WhatsApp (for direct contact between users), and cloud hosting/storage
            providers. Your use of those services through KerayeGo is also subject to their own
            terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">11. Disclaimers and limitation of liability</h2>
          <p>
            KerayeGo is provided &ldquo;as is.&rdquo; We don&rsquo;t guarantee a vehicle&rsquo;s availability or condition,
            a driver&rsquo;s or rider&rsquo;s conduct, or that a listing is fully accurate beyond our review
            process. To the maximum extent permitted by law, {LEGAL_ENTITY_NAME} is not liable for
            indirect or incidental damages, or for the acts or omissions of a provider, driver, or
            rider you interact with through the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">12. Suspension and termination</h2>
          <p>
            We may suspend or terminate an account that violates these terms, submits fraudulent
            information, or fails verification.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">13. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. We&rsquo;ll update the &ldquo;Last
            updated&rdquo; date above when we do.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">14. Governing law</h2>
          <p>
            These terms are governed by the laws of Pakistan, and any dispute will be subject to
            the exclusive jurisdiction of the courts of {GOVERNING_LAW_CITY}.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">15. Contact us</h2>
          <p>Questions about these terms, or any other legal or general enquiry, can be sent to KerayeGo at:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Email:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-700 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              Phone:{' '}
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="font-semibold text-brand-700 hover:underline">
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
