import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description:
    'Answers to common questions about renting a car and carpooling on KerayeGo — booking, payment, verification, cancellations, and how to list your own vehicle.',
  keywords: [
    'KerayeGo FAQ',
    'how does KerayeGo work',
    'car rental Pakistan questions',
    'carpool Pakistan FAQ',
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'KerayeGo FAQ',
    description: 'Answers to common questions about renting a car and carpooling on KerayeGo.',
  },
};

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is KerayeGo?',
    answer:
      "KerayeGo is a two-sided mobility marketplace for Pakistan. On one side, verified providers list vehicles for rent; on the other, anyone can post or join an intercity carpool trip in their own vehicle.",
  },
  {
    question: 'How do I rent a car on KerayeGo?',
    answer:
      'Browse available vehicles on the Rent a Car page, filter by city, make, or price, and open a listing you like. Send a booking request directly from the vehicle page — the provider will get in touch to confirm pickup, dates, and payment.',
  },
  {
    question: 'Do I need to pay online to book a car?',
    answer:
      "No. KerayeGo doesn't process payments on the platform today. Rental and carpool payments are arranged directly between you and the provider or driver.",
  },
  {
    question: 'How does carpooling work on KerayeGo?',
    answer:
      'Drivers post a trip with their route, date, and available seats. Riders browse routes between cities and send a request to join. Once the driver accepts, both sides coordinate pickup directly.',
  },
  {
    question: 'Do I need an account to book a car or join a ride?',
    answer:
      'Browsing is open to everyone, but sending a booking request, joining a carpool trip, or listing a vehicle requires a free KerayeGo account.',
  },
  {
    question: 'Are the vehicles on KerayeGo verified?',
    answer:
      "Every rental listing is reviewed before it appears on the site. Personal vehicles registered for carpooling go through CNIC and driving-license verification, and vehicle photos carry a KerayeGo watermark so you know you're looking at the real listing.",
  },
  {
    question: 'Can I cancel a booking or a ride request?',
    answer:
      "Yes — you can cancel a rental booking request or a carpool seat request you've sent from your dashboard, as long as it hasn't already been completed.",
  },
  {
    question: 'Which cities does KerayeGo cover?',
    answer:
      'KerayeGo is live in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, and Hyderabad, with expansion to Saudi Arabia and the UAE planned next.',
  },
  {
    question: 'How do I list my vehicle for rent, or offer rides as a driver?',
    answer:
      'To list a vehicle for rent, register as a provider and add your vehicle from your provider dashboard. To offer carpool rides, any registered user can post a trip from the Carpool section — no separate provider account needed.',
  },
  {
    question: 'How do I contact a provider or a fellow traveler?',
    answer:
      "Every listing has a direct WhatsApp button to message the provider or driver. For anything account-related, sign in and use your dashboard.",
  },
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: '/faq' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-5 flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-border-strong" />
        <span className="font-semibold text-ink">FAQ</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Common questions about renting a car and carpooling on KerayeGo.
        </p>
      </div>

      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
        {FAQS.map(({ question, answer }) => (
          <details key={question} className="group p-4 open:bg-surface-hover/40 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
              {question}
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-faint transition-transform duration-200 group-open:rotate-90" />
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-text-muted">
        Still have a question?{' '}
        <Link href="/about" className="font-semibold text-brand-700 hover:underline">
          Learn more about KerayeGo
        </Link>
        .
      </div>
    </div>
  );
}
