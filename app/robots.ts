import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.kerayego.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/rent-a-car',
          '/rent-a-car/',
          '/providers',
          '/providers/',
          '/carpool',
          '/carpool/',
        ],
        disallow: [
          '/admin/',
          '/provider/',
          '/dashboard/',
          '/api/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/rent-a-car/*/*/*/inquire',
          '/carpool/*/*/inquire',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
