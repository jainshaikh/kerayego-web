import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

// Rewritten 2026-11-07 to match the platform as built (phone + WhatsApp
// sign-in, WhatsApp updates, live location, driver verification, account
// deletion) and published (draft banner and noindex removed) at the owner's
// request. The company name is the one SECP reserved on 2026-11-02 and is not
// incorporated yet — ENTITY_STATUS says so; change it to "a company
// registered in Pakistan" (and the same constant in /terms) once the SECP
// certificate is issued. Support email/phone are real (given 2026-09-19,
// temporary until an @kerayego.com address exists — that fact itself must
// never appear on the public page). Keep the service providers in section 6
// in step with the backend's integrations.
const LEGAL_ENTITY_NAME = 'KerayeGo (SMC-Private) Limited';
const ENTITY_STATUS = 'a company being incorporated in Pakistan';
const REGISTERED_ADDRESS =
  'House No. 845/3, Noor Masjid Street, Pinjrapole, Hyderabad, Sindh 71000, Pakistan';
const SUPPORT_EMAIL = 'jainshaikh@gmail.com';
const SUPPORT_PHONE_DISPLAY = '+92 331 3693668';
const SUPPORT_PHONE_TEL = '+923313693668';
const LAST_UPDATED = 'November 7, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How KerayeGo collects, uses, shares and protects your information on our vehicle rental and intercity carpooling platform.',
  alternates: {
    canonical: '/privacy',
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="mt-2 list-disc space-y-1.5 pl-5">{children}</ul>;
}

function EmailLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-700 hover:underline">
      {SUPPORT_EMAIL}
    </a>
  );
}

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

      <h1 className="text-[26px] font-bold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-2 text-xs text-text-faint">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 space-y-7 text-sm leading-relaxed text-text-muted">
        <Section title="1. Who we are">
          <p>
            KerayeGo is a vehicle rental and intercity carpooling platform operated by{' '}
            {LEGAL_ENTITY_NAME} (&ldquo;KerayeGo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;),{' '}
            {ENTITY_STATUS}, with its registered office at {REGISTERED_ADDRESS}.
          </p>
          <p>
            This policy explains what information we collect through the KerayeGo website, the
            KerayeGo app and the KerayeGo Partner app (together, the &ldquo;Platform&rdquo;), how we
            use and share it, how long we keep it, and the choices you have. It should be read with
            our{' '}
            <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>
            <strong className="text-ink">Account information.</strong> Your mobile number, name and
            email address, and whether you use KerayeGo as a customer, a rental business, a
            business manager or a driver. Your mobile number is how you sign in.
          </p>
          <p>
            <strong className="text-ink">Sign-in codes.</strong> When you sign in or confirm your
            number we send you a 6-digit code on WhatsApp (or, if you choose, by email). We store
            only a scrambled (hashed) form of each code, never the code itself.
          </p>
          <p>
            <strong className="text-ink">Verification information.</strong> We check people before
            they can offer rides or rentals:
          </p>
          <List>
            <li>
              <strong>Carpool drivers</strong> — your CNIC (front and back), driving licence and
              vehicle registration, before your vehicle can be used for trips.
            </li>
            <li>
              <strong>Rental businesses</strong> — business and showroom details, licences and
              proof of vehicle ownership, and the details and photos of the vehicles you list.
            </li>
            <li>
              <strong>Business drivers</strong> — your CNIC number and expiry, CNIC images, driving
              licence (front and back), a live selfie we compare with your CNIC, a police character
              certificate, date of birth, residential address, an emergency contact, your driving
              experience and the services you offer, and (optionally) a payout account. Your CNIC
              number, date of birth, address and payout account are never shown to customers.
            </li>
          </List>
          <p>
            <strong className="text-ink">Listings and photos.</strong> Vehicle details and photos you
            upload. Photos are watermarked with the KerayeGo logo before they are published.
          </p>
          <p>
            <strong className="text-ink">Bookings, trips and reviews.</strong> Booking requests,
            carpool trips you post, seat requests, trip events (such as pick-up and drop-off), reviews
            and ratings, and messages you send in the in-app chat during a carpool trip.
          </p>
          <p>
            <strong className="text-ink">Location.</strong> Only when you allow it on your device:
          </p>
          <List>
            <li>your approximate location, to show nearby vehicles and trips and pre-select your city;</li>
            <li>
              a <strong>carpool driver&rsquo;s</strong> live location, shared with their riders while
              a trip is in progress;
            </li>
            <li>
              a <strong>carpool rider&rsquo;s</strong> or <strong>rental customer&rsquo;s</strong>{' '}
              live location, shared with their driver from shortly before the pick-up time until
              pick-up — you can pause this at any time;
            </li>
            <li>
              a <strong>business driver&rsquo;s</strong> live location, shared with their business
              while they are driving a job, until the job ends.
            </li>
          </List>
          <p>
            Live sharing can continue while the app is in the background, with a visible
            notification or indicator on your phone, and stops when the trip or job ends or the app is
            closed.
          </p>
          <p>
            <strong className="text-ink">Device information.</strong> A push-notification token for
            your device, so we can send you notifications in the apps.
          </p>
          <p>
            <strong className="text-ink">Usage information and cookies.</strong> Pages visited and
            actions such as signing up, viewing a listing or posting a trip, collected through Google
            Analytics on the website. Cookies keep you signed in and remember your preferred city and
            location.
          </p>
        </Section>

        <Section title="3. How we use your information">
          <List>
            <li>to create and run your account and sign you in;</li>
            <li>to publish listings and trips and to handle booking and seat requests;</li>
            <li>
              to verify drivers, businesses and vehicles, and to keep the Platform safe — including
              stopping people we have banned from coming back with a new account;
            </li>
            <li>to show you vehicles and trips near you;</li>
            <li>to share live location during trips and jobs, as described above;</li>
            <li>to send you sign-in codes and updates by WhatsApp, email and push notification;</li>
            <li>to answer your questions and handle reports and disputes;</li>
            <li>to understand how the Platform is used so we can improve it; and</li>
            <li>to meet our legal obligations and enforce our Terms &amp; Conditions.</li>
          </List>
        </Section>

        <Section title="4. WhatsApp messages">
          <p>
            We use the WhatsApp Business Platform, provided by Meta, to send messages to the mobile
            number on your account:
          </p>
          <List>
            <li>
              <strong>Sign-in and verification codes</strong> — sent whenever you ask for one. They
              are needed to sign in, so they can&rsquo;t be switched off.
            </li>
            <li>
              <strong>Booking and trip updates</strong> — for example when a booking is confirmed or
              declined, a seat request is accepted, or a job is assigned to you. You can turn these
              off in your account settings, or by replying <strong>STOP</strong> to any of them.
            </li>
          </List>
          <p>
            We never send marketing messages on WhatsApp without your permission. Meta processes these
            messages under its own terms and privacy policy.
          </p>
        </Section>

        <Section title="5. What other users see">
          <List>
            <li>
              When a booking or seat request is accepted, the customer and the business or driver see
              each other&rsquo;s name and the contact details needed to arrange the trip directly.
            </li>
            <li>
              A business sees the name, photo, contact details, city, driving experience, licence
              type and expiry, and verification status of the drivers in its team, and their live
              location while they drive a job for it. It does not see their identity documents.
            </li>
            <li>
              Reviews you write are public, shown with your name.
            </li>
          </List>
        </Section>

        <Section title="6. Service providers we share information with">
          <p>We use trusted companies to run the Platform. They only process your information for us:</p>
          <List>
            <li>Amazon Web Services — storage of photos and documents;</li>
            <li>Google Cloud — hosting of our servers;</li>
            <li>Neon — our database;</li>
            <li>Vercel — hosting of the website;</li>
            <li>Google Maps and Google Analytics — maps, places and website statistics;</li>
            <li>Google Firebase — push notifications in the apps;</li>
            <li>Meta (WhatsApp Business Platform) — sign-in codes and updates on WhatsApp;</li>
            <li>Resend — emails.</li>
          </List>
          <p>
            We do <strong>not</strong> sell your personal information. We may disclose information if
            the law requires it, or to protect the rights, safety or property of KerayeGo, our users
            or the public.
          </p>
        </Section>

        <Section title="7. Payments">
          <p>
            KerayeGo does not process rental or carpool payments. Prices are shown in Pakistani Rupees
            (PKR) and you pay the business or driver directly. We do not collect or store card
            details. A driver&rsquo;s optional payout account is stored for future use and only ever
            shown back to them masked.
          </p>
        </Section>

        <Section title="8. How long we keep your information">
          <List>
            <li>We keep your account information while your account is open.</li>
            <li>Sign-in codes expire after 10 minutes and are deleted within a day.</li>
            <li>
              A customer&rsquo;s shared live location is cleared at pick-up, or when the trip ends or
              is cancelled. A business driver&rsquo;s route during a job is kept with that booking&rsquo;s
              records, for safety and to resolve disputes.
            </li>
            <li>
              When you delete your account, your personal information is deleted after 72 hours,
              except for the items listed on our{' '}
              <Link href="/delete-account" className="font-semibold text-brand-700 hover:underline">
                account deletion page
              </Link>{' '}
              — such as reviews (shown as &ldquo;Deleted user&rdquo;), booking and trip history
              without your name, a one-way scrambled form of a driver&rsquo;s CNIC used only to keep
              banned people off the Platform, and records the law requires us to keep.
            </li>
          </List>
        </Section>

        <Section title="9. How we protect your information">
          <p>
            We use encrypted connections (HTTPS), access controls, private storage for documents, and
            hashing for sign-in codes and CNIC checks. Only authorised KerayeGo staff can see
            verification documents. No system is completely secure, so we can&rsquo;t guarantee
            absolute security, but we work to protect your information and will act quickly on any
            issue.
          </p>
        </Section>

        <Section title="10. Your choices and rights">
          <List>
            <li>See and update your profile and account details in the website or apps.</li>
            <li>Turn WhatsApp updates on or off in your account settings, or reply STOP.</li>
            <li>Allow, pause or block location access from the app or your device settings.</li>
            <li>Clear or block cookies in your browser settings.</li>
            <li>
              Delete your account at any time from the apps or our{' '}
              <Link href="/delete-account" className="font-semibold text-brand-700 hover:underline">
                account deletion page
              </Link>
              .
            </li>
            <li>
              Ask us for a copy of your information, or to correct it, by emailing <EmailLink />.
            </li>
          </List>
        </Section>

        <Section title="11. Children">
          <p>
            KerayeGo is not meant for anyone under 18, and we do not knowingly collect information
            from children. If you believe a child has created an account, contact us and we will
            delete it.
          </p>
        </Section>

        <Section title="12. Where your information is stored">
          <p>
            KerayeGo serves Pakistan today, with Saudi Arabia and the UAE planned. Our service
            providers store and process information on servers outside Pakistan, including in the
            United States. We only use providers that protect it to the standard described in this
            policy.
          </p>
        </Section>

        <Section title="13. Changes to this policy">
          <p>
            We may update this policy as the Platform changes. We will change the &ldquo;Last
            updated&rdquo; date above, and tell you in the apps or by email about important changes.
          </p>
        </Section>

        <Section title="14. Contact us">
          <p>For privacy questions or requests, contact KerayeGo:</p>
          <List>
            <li>
              Email: <EmailLink />
            </li>
            <li>
              Phone / WhatsApp:{' '}
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="font-semibold text-brand-700 hover:underline">
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </li>
            <li>Post: {REGISTERED_ADDRESS}</li>
          </List>
        </Section>
      </div>
    </div>
  );
}
