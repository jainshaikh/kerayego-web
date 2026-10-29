import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Mail } from 'lucide-react';
import { DeleteAccountForm } from '../../../components/account/DeleteAccountForm';

// Google Play requires a public web page where people can request deletion of their
// account and data (PROVIDER_APP_PLAN.md A16, A17, A20, A51). Same support email as
// /contact, /privacy and /terms.
const SUPPORT_EMAIL = 'jainshaikh@gmail.com';

const TITLE = 'Delete your KerayeGo account';
const DESCRIPTION =
  'How to delete your KerayeGo account and data: what is deleted, what is kept, the 72-hour window, and how to cancel.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: '/delete-account',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Delete account', item: '/delete-account' },
  ],
};

export default function DeleteAccountPage() {
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
        <span className="font-semibold text-ink">Delete account</span>
      </nav>

      <h1 className="text-[26px] font-bold tracking-tight text-ink">{TITLE}</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        You can ask us to delete your KerayeGo account and your personal data at any time, from
        this page or from the KerayeGo and KerayeGo Partner apps. We wait 72 hours before deleting
        anything, so you can change your mind.
      </p>

      <div className="mt-6 space-y-7 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">Request deletion</h2>
          <DeleteAccountForm />
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">Before you start</h2>
          <p>
            You can&rsquo;t delete your account while something is still in progress. Finish or
            cancel any upcoming or active bookings, carpool trips and seat requests first. If you
            own a business, its open bookings must be finished or cancelled too. If anything is
            still active, we&rsquo;ll tell you what it is when you ask.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">What is deleted</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your profile and account details, including your name.</li>
            <li>Your contact details: email address and phone number.</li>
            <li>Your saved cars.</li>
            <li>Your personal cars, with their photos and documents.</li>
            <li>Your driver details and documents. You are removed from every business you drive for.</li>
            <li>
              If you own a business: the business itself, its cars, showrooms, photos and documents.
              Its managers and drivers keep their own accounts.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">What is kept</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Reviews you wrote stay up, shown as written by &ldquo;Deleted user&rdquo;.</li>
            <li>
              Booking and trip history stays for the other people involved, without your name.
            </li>
            <li>
              Car plate numbers, their reviews and ride counts stay with the car, so its history
              shows again if the same car is listed later.
            </li>
            <li>Records we are required to keep by law, and safety records.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">The 72-hour window and how to cancel</h2>
          <p>
            When you ask, you are signed out everywhere and we email you a confirmation. Your
            account is deleted 72 hours later. To cancel before then, either:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>sign in again on the website or in either app, or</li>
            <li>open the &ldquo;Cancel deletion&rdquo; link in the email we sent you.</li>
          </ul>
          <p className="mt-2">Once your account has been deleted, it can&rsquo;t be brought back.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">Delete from the apps</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-ink">KerayeGo app:</strong> open your Profile and tap
              &ldquo;Delete account&rdquo;.
            </li>
            <li>
              <strong className="text-ink">KerayeGo Partner app</strong> (businesses, managers and
              drivers): open your profile from your dashboard and tap &ldquo;Delete account&rdquo;.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">Can&rsquo;t sign in?</h2>
          <div className="flex items-center gap-3.5 rounded-xl border border-border-subtle bg-surface p-5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control border border-brand-100 bg-brand-50 text-brand-700">
              <Mail className="h-5 w-5" />
            </span>
            <p>
              Email us from the address on your account at{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Delete my KerayeGo account')}`}
                className="font-semibold text-brand-700 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              and we&rsquo;ll help you delete it.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
