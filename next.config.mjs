/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        // AWS S3 — matches https://<bucket>.s3.<region>.amazonaws.com/...
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            // geolocation=(self) — the "Use my location" nearby-search feature
            // (HeroSearch, VehiclesView, ProvidersView) needs this. camera=(self) — a
            // driver's live identity selfie in the web driver setup (plan A59, A69).
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // The original Vercel production alias still serves the full site with
      // a 200. Canonicals already point at www.kerayego.com, but a permanent
      // redirect is the unambiguous signal and stops it showing in search.
      // Exact host only — preview deployments (other *.vercel.app hosts) keep
      // working. Query strings are carried over automatically.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'rentalmarket.vercel.app' }],
        destination: 'https://www.kerayego.com/:path*',
        statusCode: 301,
      },
      {
        source: '/provider',
        destination: '/provider/dashboard',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      // URL rename, 2026-08-28: /car-rental -> /rent-a-car, /trips -> /carpool
      // hub. Both were only briefly live pre-launch (not yet indexed), but
      // these cost nothing and protect anyone who bookmarked/shared a link
      // during that window.
      {
        source: '/car-rental/:path*',
        destination: '/rent-a-car/:path*',
        permanent: true,
      },
      {
        source: '/trips',
        destination: '/carpool',
        permanent: true,
      },
      // URL rename, 2026-08-28: /vehicles -> /rent-a-car (nav + browse-all
      // page). Individual /vehicles/:slug deep links can't be mapped here —
      // the new URL needs the vehicle's city/make/model — so they're handled
      // by app/vehicles/[slug]/route.ts, which looks the vehicle up and 301s
      // (some were still in Google's index per Search Console).
      {
        source: '/vehicles',
        destination: '/rent-a-car',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
