import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AppDownloadButtons } from '../../../../components/common/AppDownloadButtons';
import { HAS_MOBILE_APP } from '../../../../lib/config/apps';
import { GuideByline } from '../../../../components/common/GuideByline';

// Every statement here is checked against the user-vehicles / trips /
// trip-inquiries / reviews modules in kerayego-backend (verified 2026-10-14):
// a car needs CNIC (both sides), driving licence and registration plus admin
// approval before it can post; the trip itself goes live with no review;
// date/price/route lock once a rider is accepted; no-show needs an ARRIVED at
// the rider's stop and a 5-minute wait; nothing is paid on the platform.
export const metadata: Metadata = {
  title: 'How to Offer a Ride (Post a Carpool Trip)',
  description:
    'Driving between cities with empty seats? Here’s how to register your car, post a carpool trip on KerayeGo, handle seat requests and share the cost of your journey.',
  keywords: [
    'offer a ride Pakistan',
    'post a carpool trip',
    'share ride cost between cities',
    'carpool driver Pakistan',
  ],
  alternates: {
    canonical: '/guides/how-to-offer-a-ride',
  },
  openGraph: {
    title: 'How to Offer a Ride (Post a Carpool Trip)',
    description:
      'Register your car, post your trip, handle seat requests and share the cost of your journey.',
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
      name: 'How to Offer a Ride',
      item: '/guides/how-to-offer-a-ride',
    },
  ],
};

const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: 'Register your car (once)',
    body: 'Add the car you’ll drive under My Vehicles in your account, with its make, model and number plate, and upload four documents: the front and back of your CNIC, your driving licence, and the car’s registration. Our team checks them before the car can be used. If something needs fixing, you can edit the details and send it back for review. You only do this once per car.',
  },
  {
    title: 'Post your trip',
    body: 'Choose your approved car, the city you’re leaving from and the one you’re going to, and the date and time you’ll set off (in Pakistan time). Then list your pickup points and drop-off points (up to ten of each), how many seats you have, your price per seat, and the WhatsApp number riders can reach you on. There’s space for notes too, like whether the car has AC or how much luggage fits. Your trip goes live as soon as you post it.',
  },
  {
    title: 'Answer seat requests',
    body: 'Riders choose how many seats they want and which of your pickup and drop-off points suit them, and can add a message. You’ll see their phone number or email with the request. Accept the ones that work for you and decline the rest (you can give a reason if you like). Seats are only taken off your trip when you accept, and once it’s full it stops showing in search. A request you don’t answer expires after 24 hours, or two hours before departure if that’s sooner.',
  },
  {
    title: 'Agree the details',
    body: 'Riders you accept can see your phone number, so expect a call or WhatsApp to sort out the exact pickup. Riders pay you directly. KerayeGo doesn’t handle the money and doesn’t take a cut.',
  },
  {
    title: 'On the day',
    body: 'Tap Start trip when you set off. That takes the trip out of search, and your accepted riders can then chat with you and follow your location while you share it. As you go, mark when you reach each stop and confirm who you’ve picked up and dropped off. If a rider doesn’t turn up, you can mark them as a no-show once you’ve reached their pickup point and waited at least five minutes. Tap End trip when you arrive.',
  },
];

export default function HowToOfferARideGuidePage() {
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
        <span className="font-semibold text-ink">How to Offer a Ride</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          How to Offer a Ride on KerayeGo
        </h1>
        <GuideByline
          title="How to Offer a Ride on KerayeGo"
          path="/guides/how-to-offer-a-ride"
          published="2026-10-14"
          updated="2026-10-14"
        />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          Driving to another city with seats to spare? Post the trip on KerayeGo, set a price per
          seat, and people going the same way can ask to join you. It helps with the cost of a
          journey you&rsquo;re making anyway. Any KerayeGo account can do this; you don&rsquo;t
          need a business or provider account.
        </p>
      </div>

      <ol className="mb-10 space-y-6">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <h2 className="mb-1.5 text-base font-semibold text-ink">
              {i + 1}. {step.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-ink">Good to know</h2>
        <ul className="space-y-2.5 text-sm leading-relaxed text-text-muted">
          <li>
            <span className="font-semibold text-ink">One price for the whole route.</span> Pickup
            and drop-off points are just meeting places at each end. Every rider pays the same
            price per seat, wherever they get on or off.
          </li>
          <li>
            <span className="font-semibold text-ink">Your WhatsApp number is public.</span> The
            number you put on the trip shows on the trip page so riders can ask questions before
            they request. Your account phone and email are only shared with riders you accept.
          </li>
          <li>
            <span className="font-semibold text-ink">Some things lock once you accept someone.</span>{' '}
            After you&rsquo;ve accepted a rider, you can&rsquo;t change the departure time, price
            or route, and you can&rsquo;t cut the seats below the number already taken.
          </li>
          <li>
            <span className="font-semibold text-ink">Cancelling.</span> You can cancel a trip any
            time before you start it. Every open request on it is cancelled automatically, and
            riders see that you called it off, so it&rsquo;s fair to message the people you&rsquo;d
            accepted as well.
          </li>
          <li>
            <span className="font-semibold text-ink">Reviews.</span> After the trip, riders can
            rate you and your car, and those ratings appear on your future trips. You can rate your
            riders too; those ratings stay private and are only seen by our team.
          </li>
          <li>
            <span className="font-semibold text-ink">Not sure what to charge?</span> Look at what
            other drivers ask on the same route in{' '}
            <Link href="/carpool" className="font-semibold text-brand-700 hover:underline">
              Carpool
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <p className="text-sm leading-relaxed text-text-muted">
          Want to see it from the rider&rsquo;s side? Read{' '}
          <Link href="/guides/how-carpooling-works" className="font-semibold text-brand-700 hover:underline">
            how carpooling works
          </Link>{' '}
          and our{' '}
          <Link href="/guides/carpool-safety-pakistan" className="font-semibold text-brand-700 hover:underline">
            carpool safety guide
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
        <h2 className="text-base font-semibold text-ink">Got empty seats on your next trip?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Register your car once, then post a trip whenever you&rsquo;re driving between cities.
        </p>
        {/* Posting moves to the app once it's live; until then, the web flow. */}
        {HAS_MOBILE_APP ? (
          <AppDownloadButtons className="mt-4" />
        ) : (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/trips/new"
              className="inline-flex h-[38px] items-center rounded-control bg-brand px-5 text-sm font-semibold text-white shadow-coral transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-coral-lg"
            >
              Post a trip
            </Link>
            <Link
              href="/dashboard/my-vehicles/new"
              className="inline-flex h-[38px] items-center rounded-control border border-border-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              Register your car
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
