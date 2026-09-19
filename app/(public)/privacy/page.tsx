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
  title: 'Privacy Policy',
  description:
    'How KerayeGo collects, uses, and protects your information when you use our car rental and carpooling marketplace.',
  alternates: {
    canonical: '/privacy',
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
    { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: '/privacy' },
  ],
};

export default function PrivacyPolicyPage() {
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
        <span className="font-semibold text-ink">Privacy Policy</span>
      </nav>

      <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <strong>Draft — not yet in effect.</strong> Bracketed fields below are placeholders
          pending real business details, and this page is set to <code>noindex</code> until
          they&rsquo;re filled in and the page has been reviewed.
        </p>
      </div>

      <h1 className="text-[26px] font-bold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-2 text-xs text-text-faint">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 space-y-7 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">1. Who we are</h2>
          <p>
            KerayeGo is a car rental and intercity carpooling marketplace operated by{' '}
            {LEGAL_ENTITY_NAME}, registered at {REGISTERED_ADDRESS}. This policy explains what
            information we collect through the KerayeGo website and mobile app, how we use it,
            and the choices you have.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">2. Information we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account information</strong> — your name, email address, and phone number
              when you register.
            </li>
            <li>
              <strong>Identity and verification documents</strong> — if you register a personal
              vehicle for carpooling, we collect your CNIC (front and back) and driving license to
              verify you before your vehicle can be used. If you register as a rental provider, we
              collect your business/showroom details and any documents needed to review your
              listings.
            </li>
            <li>
              <strong>Listing content</strong> — vehicle details and photos you upload. Photos are
              watermarked with the KerayeGo logo before publishing.
            </li>
            <li>
              <strong>Location</strong> — if you allow it, your device&rsquo;s approximate location, used
              to show you nearby listings and pre-select your city. This is stored in a
              browser cookie you control; declining simply means no city is pre-selected for you.
            </li>
            <li>
              <strong>Booking and trip activity</strong> — booking requests, carpool trip posts and
              seat requests, reviews you write, and messages sent through in-app chat during a live
              trip.
            </li>
            <li>
              <strong>Usage data</strong> — pages visited and actions like signing up, viewing a
              listing, starting a booking, or posting a trip, collected through Google Analytics.
            </li>
            <li>
              <strong>Cookies</strong> — we use cookies to keep you signed in, remember your role
              and email-verification status, and remember your preferred city and location.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">3. How we use your information</h2>
          <p>We use the information above to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>operate the marketplace — create your account, publish your listings, and process booking and trip requests;</li>
            <li>review rental listings and verify carpool vehicles/drivers before they go live;</li>
            <li>show you relevant listings based on your city or location;</li>
            <li>send you booking/trip-related emails and notifications;</li>
            <li>understand how the platform is used, so we can improve it; and</li>
            <li>comply with legal obligations and enforce our Terms &amp; Conditions.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">4. How we share your information</h2>
          <p>
            When you send or accept a booking or a carpool seat request, the other party sees the
            information needed to coordinate with you directly (e.g. your name and contact
            details) — that direct contact, typically over WhatsApp, is how pickup, dates, and
            payment are arranged. We also share information with the service providers that help
            us run KerayeGo — cloud storage and hosting for photos and the site itself, Google
            (Maps and Analytics), and email delivery. We do not sell your personal information. We
            may disclose information if required by law or to protect the rights, safety, or
            property of KerayeGo, our users, or the public.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">5. Payments</h2>
          <p>
            KerayeGo does not process rental or carpool payments on the platform. Any payment is
            arranged directly between you and the provider or driver, and we do not collect or
            store your payment details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">6. Data retention</h2>
          <p>
            We keep your account and booking information for as long as your account is active,
            and as needed to resolve disputes, enforce our agreements, and meet legal obligations.
            You can ask us to delete your account at any time (see Section 8).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">7. Data security</h2>
          <p>
            We use industry-standard measures — including encrypted connections (HTTPS) and access
            controls — to protect your information. No method of transmission or storage is
            completely secure, so we can&rsquo;t guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">8. Your choices</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>You can review and update your account information from your dashboard.</li>
            <li>
              You can request that we delete your account and associated personal data by
              contacting us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-700 hover:underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </li>
            <li>You can allow or block location access at any time from your browser or device settings.</li>
            <li>You can clear cookies or block non-essential ones from your browser settings.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">9. Children</h2>
          <p>
            KerayeGo is not directed at children. You must be old enough to lawfully enter a
            rental or carpool arrangement in your country to use the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">10. International use</h2>
          <p>
            KerayeGo operates in Pakistan today, with Saudi Arabia and the UAE planned next. Your
            information may be stored or processed on servers outside the country you&rsquo;re in.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">11. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. We&rsquo;ll update the &ldquo;Last
            updated&rdquo; date above when we do.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">12. Contact us</h2>
          <p>For privacy-related questions or requests, contact KerayeGo at:</p>
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
