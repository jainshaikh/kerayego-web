import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

// Rewritten 2026-11-03 to cover the platform as built (business teams,
// drivers, carpool, live location, WhatsApp codes/updates, account deletion);
// published 2026-11-07 (draft banner and noindex removed) at the owner's
// request. The company name is the one SECP reserved on 2026-11-02 and is not
// incorporated yet — ENTITY_STATUS says so; change it to "a company
// registered in Pakistan" (and the same constant in /privacy) once the SECP
// certificate is issued. Support email/phone are real (given 2026-09-19,
// temporary until an @kerayego.com address exists — that fact itself must
// never appear on the public page). A review by counsel is still advisable,
// especially sections 13–16 (the liability cap amount and the governing-law
// city are business decisions).
const LEGAL_ENTITY_NAME = 'KerayeGo (SMC-Private) Limited';
const ENTITY_STATUS = 'a company being incorporated in Pakistan';
const REGISTERED_ADDRESS =
  'House No. 845/3, Noor Masjid Street, Pinjrapole, Hyderabad, Sindh 71000, Pakistan';
const GOVERNING_LAW_CITY = 'Hyderabad, Sindh';
const LIABILITY_CAP = 'PKR 10,000';
const SUPPORT_EMAIL = 'jainshaikh@gmail.com';
const SUPPORT_PHONE_DISPLAY = '+92 331 3693668';
const SUPPORT_PHONE_TEL = '+923313693668';
const LAST_UPDATED = 'November 7, 2026';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms that govern your use of KerayeGo — our vehicle rental and intercity carpooling marketplace.',
  alternates: {
    canonical: '/terms',
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>;
}

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

      <h1 className="text-[26px] font-bold tracking-tight text-ink">Terms &amp; Conditions</h1>
      <p className="mt-2 text-xs text-text-faint">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 space-y-7 text-sm leading-relaxed text-text-muted">
        <Section title="1. Who we are and accepting these terms">
          <p>
            KerayeGo is operated by {LEGAL_ENTITY_NAME} (&ldquo;KerayeGo&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;), {ENTITY_STATUS}, with its registered office at{' '}
            {REGISTERED_ADDRESS}.
          </p>
          <p>
            These Terms &amp; Conditions apply to the KerayeGo website, the KerayeGo app and the
            KerayeGo Partner app (together, the &ldquo;Platform&rdquo;). By creating an account or
            using the Platform you agree to these terms and to our{' '}
            <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree, do not use the Platform.
          </p>
        </Section>

        <Section title="2. What KerayeGo is — and is not">
          <p>
            KerayeGo is a <strong>technology platform</strong> that helps people find each other.
            We do not own or operate vehicles, we do not provide transport, we do not employ drivers,
            and we are not a party to any rental or ride arranged through the Platform.
          </p>
          <List>
            <li>
              <strong>Vehicle rental:</strong> rental businesses (&ldquo;Providers&rdquo;) list
              vehicles and customers send booking requests. Every rental comes with a driver supplied
              by the Provider — KerayeGo does not offer self-drive rentals. When a Provider accepts a
              request, the rental is an agreement between the customer and the Provider only.
            </li>
            <li>
              <strong>Carpooling:</strong> any user can post an intercity trip in their own vehicle
              (&ldquo;Trip Driver&rdquo;) and other users (&ldquo;Riders&rdquo;) can request seats.
              When a Trip Driver accepts a seat request, the ride is an arrangement between the Trip
              Driver and the Rider only.
            </li>
          </List>
          <p>
            Providers, their drivers and Trip Drivers are independent of KerayeGo. They are not our
            employees, agents or representatives, and we do not control how they drive, how they
            maintain their vehicles or how they behave.
          </p>
        </Section>

        <Section title="3. Your account">
          <List>
            <li>You must be at least 18 years old and able to enter a binding contract in Pakistan.</li>
            <li>
              The information you give us — name, email, mobile number, documents — must be true,
              current and your own. One person may hold one account, and a mobile number can belong to
              only one account.
            </li>
            <li>
              You sign in with your mobile number and a one-time code sent to it on WhatsApp (or, if
              you choose, a code sent to your email). Never share these codes; anyone who has them can
              use your account. You are responsible for everything done through your account.
            </li>
            <li>
              Tell us straight away if you think someone else has accessed your account.
            </li>
          </List>
        </Section>

        <Section title="4. Verification and its limits">
          <p>
            We may ask for a CNIC, a driving licence, vehicle registration papers, business documents
            or other information, and we review listings, businesses and drivers before they go live.
            These checks are limited to the documents and information submitted to us at the time.
          </p>
          <p>
            <strong>
              Verification is not a guarantee, endorsement or background check.
            </strong>{' '}
            We do not guarantee the identity, honesty, driving skill, conduct or criminal record of
            any user, or the condition, safety, insurance or legal status of any vehicle. Always use
            your own judgement before booking, riding or handing over anything of value.
          </p>
        </Section>

        <Section title="5. Rental businesses (Providers)">
          <p>If you list vehicles as a Provider, you are solely responsible for:</p>
          <List>
            <li>
              holding every licence, permit, registration, token tax and insurance your vehicles and
              business legally need;
            </li>
            <li>keeping each vehicle safe, roadworthy and as described in its listing;</li>
            <li>
              the drivers you assign — that they are licensed for the vehicle, fit to drive, and
              behave lawfully and respectfully — and the managers you add to your team;
            </li>
            <li>
              checking the customer&rsquo;s documents before you confirm a booking, and honouring the
              bookings you accept;
            </li>
            <li>
              your prices, deposits, fuel and mileage terms, payments and refunds, and any taxes on
              your income.
            </li>
          </List>
          <p>
            As the business owner, you are responsible for what your team does on the Platform under
            your business.
          </p>
        </Section>

        <Section title="6. Drivers">
          <p>
            If you drive for a Provider, or post a trip as a Trip Driver, you confirm that you hold a
            valid driving licence for the vehicle, that you are medically fit to drive, and that you
            will never drive under the influence of alcohol or drugs, while overly tired, or in breach
            of traffic law. Drivers working for a Provider must also accept the driver agreements shown
            in the KerayeGo Partner app.
          </p>
          <p>
            Trip Drivers are responsible for their own vehicle being roadworthy, registered, insured
            and lawful to use for the trip, and for any income or tax that results from it.
          </p>
        </Section>

        <Section title="7. Customers and Riders">
          <List>
            <li>Give accurate pickup details and be on time.</li>
            <li>
              Check that the driver and vehicle match what the app shows before you get in. If they
              don&rsquo;t, don&rsquo;t get in, and report it to us.
            </li>
            <li>Treat drivers, other passengers and vehicles with respect, and follow the law.</li>
            <li>Pay the Provider or Trip Driver what you agreed with them.</li>
          </List>
        </Section>

        <Section title="8. Prices and payments">
          <p>
            All prices on the Platform are in Pakistani Rupees (PKR) and are set by Providers and Trip
            Drivers, not by KerayeGo. KerayeGo does not currently collect or hold payments for rentals
            or rides: you pay the other party directly, and any deposit, refund or payment dispute is
            between you and them. KerayeGo does not currently charge customers or riders to use the
            Platform. If we introduce fees, we will tell you before they apply to you.
          </p>
        </Section>

        <Section title="9. Cancellations and no-shows">
          <p>
            You can cancel a booking request or seat request in the app, subject to the cancellation
            rules shown in the app at that time. Any cancellation charge, refund or compensation for
            the rental or ride itself is between you and the Provider or Trip Driver. Repeated late
            cancellations or no-shows may lead us to restrict your account.
          </p>
        </Section>

        <Section title="10. Live location, chat and notifications">
          <List>
            <li>
              During a job or trip, the Platform can share the driver&rsquo;s live location with the
              customer or riders and the Provider, and can ask customers and riders to share theirs
              with their driver around pickup time. Location is shared only for that job or trip.
            </li>
            <li>
              We send booking and trip updates by push notification, email and — if your mobile number
              is verified — WhatsApp. You can turn WhatsApp updates off in Settings or by replying STOP;
              sign-in and verification codes are always sent.
            </li>
            <li>
              In-app chat and contact details shared through the Platform may only be used for the
              rental or ride you arranged — not for spam, marketing or harassment.
            </li>
          </List>
        </Section>

        <Section title="11. Safety and emergencies">
          <p>
            <strong>KerayeGo is not an emergency service.</strong> In an emergency call the police on{' '}
            <strong>15</strong> or Rescue on <strong>1122</strong> first. Location sharing and in-app
            features can stop working (for example with no signal or a flat battery) and must not be
            relied on for your safety. Please report any accident, unsafe driving, harassment or other
            incident to us as soon as you safely can; we may restrict accounts while we look into it
            and we cooperate with lawful requests from the authorities.
          </p>
        </Section>

        <Section title="12. Things you must not do">
          <List>
            <li>post a fraudulent, misleading or duplicate listing, trip or business;</li>
            <li>
              upload a document or photo that isn&rsquo;t genuinely yours or your vehicle&rsquo;s, or
              impersonate anyone;
            </li>
            <li>
              arrange a rental or ride through KerayeGo and then use it to carry anything illegal or
              to commit any offence;
            </li>
            <li>harass, threaten, defraud or discriminate against another user;</li>
            <li>
              use another user&rsquo;s contact details or location for anything other than the
              rental or ride;
            </li>
            <li>
              interfere with the Platform, try to get around verification or blocks, or scrape, copy
              or reuse our content (including vehicle photos) without permission.
            </li>
          </List>
        </Section>

        <Section title="13. Reviews and content">
          <p>
            Reviews and ratings must reflect a genuine experience. A driver&rsquo;s rating stays
            with that driver, including if they later use a new account. We may remove content that is
            fake, abusive, unlawful or breaks these terms. You keep ownership of what you upload (such
            as vehicle photos), but you allow KerayeGo to store, display and use it to run and promote
            your listing on the Platform.
          </p>
        </Section>

        <Section title="14. Disclaimers">
          <p>
            The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the
            fullest extent the law allows, KerayeGo gives no promise or warranty that the Platform
            will be uninterrupted or error-free, that a vehicle, trip or seat will be available, that
            listings are accurate, or about the quality, safety, legality or suitability of any
            vehicle, rental, ride, Provider, driver, Trip Driver, customer or rider.
          </p>
        </Section>

        <Section title="15. Limitation of liability">
          <p>To the fullest extent permitted by the law of Pakistan:</p>
          <List>
            <li>
              KerayeGo is <strong>not liable</strong> for the acts, omissions, conduct or driving of
              any Provider, driver, Trip Driver, customer, rider or other user, or for any injury,
              death, loss, theft or damage to people, vehicles or property that results from a rental,
              ride or meeting arranged through the Platform;
            </li>
            <li>
              KerayeGo is not liable for any indirect or consequential loss, or for loss of profit,
              income, business, data or opportunity;
            </li>
            <li>
              KerayeGo&rsquo;s total liability to you for any claim connected with the Platform is
              limited to the greater of the fees you paid to KerayeGo in the 12 months before the
              claim arose, or {LIABILITY_CAP}.
            </li>
          </List>
          <p>
            Nothing in these terms limits any liability that cannot be limited or excluded under
            Pakistani law.
          </p>
        </Section>

        <Section title="16. Your responsibility to us (indemnity)">
          <p>
            You agree to compensate KerayeGo, its owners, directors and staff for any claim, loss,
            fine or reasonable legal cost that arises because you broke these terms or the law, because
            of your vehicle, your driving or your team&rsquo;s conduct, or because of any dispute
            between you and another user.
          </p>
        </Section>

        <Section title="17. Disputes between users">
          <p>
            If something goes wrong between you and another user, try to resolve it with them first.
            You can report it to us and we may — but are not obliged to — help, for example by sharing
            booking details with you or the authorities, or by restricting an account. Any
            compensation is a matter between the users involved.
          </p>
        </Section>

        <Section title="18. Suspension, blocking and closing accounts">
          <p>
            We may warn, suspend, restrict or close an account, remove a listing or trip, or block a
            person or vehicle from the Platform if we reasonably believe someone has broken these
            terms or the law, given false information, failed verification or put others at risk.
          </p>
          <p>
            You can ask to delete your account in the app or on the website. Deletion takes effect
            after a 72-hour waiting period (signing back in during that time cancels it) and only when
            you have no active booking, job or trip. Some records may be kept afterwards where the law
            requires it or to deal with disputes, as explained in our Privacy Policy.
          </p>
        </Section>

        <Section title="19. Third-party services">
          <p>
            The Platform relies on third-party services, including Google Maps, Google and Firebase
            services, WhatsApp, email providers, and cloud hosting and storage. Your use of them
            through KerayeGo is also subject to their own terms, and we are not responsible for their
            availability or actions.
          </p>
        </Section>

        <Section title="20. Intellectual property">
          <p>
            The KerayeGo name, logo, apps, website and software belong to {LEGAL_ENTITY_NAME}. You may
            not copy, modify or use them except to use the Platform as intended.
          </p>
        </Section>

        <Section title="21. Changes to these terms">
          <p>
            We may update these terms as the Platform changes. We will update the &ldquo;Last
            updated&rdquo; date above and, for significant changes, tell you in the app or by email.
            If you keep using the Platform after a change takes effect, you accept the updated terms.
          </p>
        </Section>

        <Section title="22. Governing law and disputes">
          <p>
            These terms are governed by the laws of Pakistan. If you have a complaint about KerayeGo,
            please contact us first so we can try to resolve it. Any dispute that cannot be resolved
            within 30 days is subject to the exclusive jurisdiction of the courts at{' '}
            {GOVERNING_LAW_CITY}.
          </p>
        </Section>

        <Section title="23. Contact us">
          <p>Questions about these terms, or any other legal or general enquiry, can be sent to KerayeGo at:</p>
          <List>
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
            <li>Post: {REGISTERED_ADDRESS}</li>
          </List>
        </Section>
      </div>
    </div>
  );
}
