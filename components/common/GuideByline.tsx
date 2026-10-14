// Byline + Article JSON-LD for /guides pages. Google's guidance on helpful and
// AI-assisted content (updated 2026-10-01) stresses accurate attribution, so
// guides are credited to KerayeGo as an organization — never to an invented
// person — with real published/updated dates, kept by hand per page: bump
// `updated` whenever a guide's content changes.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.kerayego.com';

interface GuideBylineProps {
  title: string;
  /** Canonical path of the guide, e.g. "/guides/how-carpooling-works". */
  path: string;
  /** ISO dates (YYYY-MM-DD). */
  published: string;
  updated: string;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function GuideByline({ title, path, published, updated }: GuideBylineProps) {
  const organization = { '@type': 'Organization', name: 'KerayeGo', url: SITE_URL };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    datePublished: published,
    dateModified: updated,
    author: organization,
    publisher: organization,
    mainEntityOfPage: `${SITE_URL}${path}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <p className="mt-2 text-xs text-text-faint">
        By the KerayeGo team · Updated <time dateTime={updated}>{formatDate(updated)}</time>
      </p>
    </>
  );
}
