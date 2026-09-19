import type { Metadata, Viewport } from 'next';
import { Outfit, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '../lib/providers/query-provider';
import { AuthBootstrap } from '../lib/providers/auth-bootstrap';
import { GoogleAnalytics } from '../components/analytics/GoogleAnalytics';
import './globals.css';

// The CSS variable names are unchanged (--font-inter / --font-mono) so
// tailwind.config.ts needs no edit — only the font filling them changed.
const sans = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentalmarket.ae';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'KerayeGo — Car Rental & Intercity Ride Sharing in Pakistan',
    template: '%s | KerayeGo',
  },
  description:
    'Find a car for rent in Karachi, Lahore, Islamabad, Hyderabad, and other cities across Pakistan. Compare verified providers, real daily and weekly rates, and book in minutes — or share a ride and carpool between cities on Intercity Trips.',
  // Pakistan leads the homepage/keyword story since it's the live, seeded
  // market (see prisma/seed.ts) — Saudi Arabia/UAE data coexists (currency
  // display is dynamic per listing, see lib/utils/currency.ts) but isn't the
  // primary SEO target yet. Revisit this file when that market goes live.
  keywords: [
    'car for rent',
    'car rental Pakistan',
    'rent a car in Karachi',
    'car rental Karachi',
    'car rental Hyderabad',
    'car rental Lahore',
    'car rental Islamabad',
    'vehicle hire Pakistan',
    'carpool',
    'share your ride',
    'intercity trips Pakistan',
    'ride sharing Pakistan',
    'book a car online',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    siteName: 'KerayeGo',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Kerayego',
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A0F14',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KerayeGo',
  url: siteUrl,
  areaServed: 'PK',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KerayeGo',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/rent-a-car?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        {/* Sitewide structured data — Organization + WebSite w/ sitelinks search box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <GoogleAnalytics />
        <QueryProvider>
          <AuthBootstrap />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
