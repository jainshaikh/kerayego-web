import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Mail, Phone } from 'lucide-react';
import { WhatsAppButton } from '../../../components/ui';

const SUPPORT_EMAIL = 'jainshaikh@gmail.com';
const SUPPORT_PHONE_DISPLAY = '+92 331 3693668';
const SUPPORT_PHONE_TEL = '+923313693668';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with KerayeGo by email, phone, or WhatsApp.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us — KerayeGo',
    description: 'Get in touch with KerayeGo by email, phone, or WhatsApp.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'Contact Us', item: '/contact' },
  ],
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-5 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">Contact Us</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Contact Us</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
          Have a question about renting a car, carpooling, or listing your own vehicle? Reach us
          directly using any of the options below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3.5 rounded-xl border border-border-subtle bg-surface p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control border border-brand-100 bg-brand-50 text-brand-700">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-text-faint">Email</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border-subtle bg-surface p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control border border-brand-100 bg-brand-50 text-brand-700">
            <Phone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-text-faint">Phone</p>
            <a
              href={`tel:${SUPPORT_PHONE_TEL}`}
              className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
            >
              {SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <p className="mb-3 text-xs text-text-faint">WhatsApp</p>
          <WhatsAppButton phone={SUPPORT_PHONE_TEL} label="Chat with us on WhatsApp" />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-text-muted">
        Looking for a quick answer?{' '}
        <Link href="/faq" className="font-semibold text-brand-700 hover:underline">
          Check the FAQ
        </Link>
        .
      </p>
    </div>
  );
}
