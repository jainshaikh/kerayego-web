import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchProviderBySlug, fetchDistinctCities, fetchAllProviders } from '../../../../lib/api/server';
import { ProviderVehiclesSection } from '../../../../components/providers/ProviderVehiclesSection';
import { ProviderCard } from '../../../../components/providers/ProviderCard';
import { RatingSummaryBadge } from '../../../../components/common/RatingSummaryBadge';
import { ReviewsList } from '../../../../components/common/ReviewsList';
import { parsePageParam, withPageParam } from '../../../../lib/utils/pagination';
import { Pagination } from '../../../../components/ui';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string | string[] };
}

function toDisplayName(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Provider profile slugs and city names share this one dynamic segment (Next
// doesn't allow two different param names — [slug] and [city] — at the same
// route position), so we tell them apart by real data: is this string one of
// the known cities? If so it's the city hub; otherwise it's a provider slug.
async function isKnownCity(value: string): Promise<boolean> {
  const res = await fetchDistinctCities();
  const cities = res?.data ?? [];
  return cities.some((c) => c.toLowerCase() === value.toLowerCase());
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug).toLowerCase();

  if (await isKnownCity(slug)) {
    const cityName = toDisplayName(slug);
    const rawPage = Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page;
    const page = parsePageParam(rawPage) ?? 1;
    const res = await fetchAllProviders(1, 1, slug);
    const total = res?.meta?.total ?? 0;
    return {
      title:
        page > 1
          ? `Rental Providers in ${cityName} - Page ${page}`
          : `Rental Providers in ${cityName} — Verified Companies`,
      description: `Browse verified vehicle rental providers in ${cityName}, Pakistan. Every provider is reviewed before listing.`,
      keywords: [
        `car rental companies ${cityName}`,
        `rental providers ${cityName}`,
        `verified car rental ${cityName}`,
      ],
      alternates: { canonical: withPageParam(`/providers/${slug}`, page) },
      openGraph: {
        title: `Rental Providers in ${cityName}`,
        description: `Verified vehicle rental providers in ${cityName}, Pakistan.`,
      },
      robots: { index: total > 0, follow: true },
    };
  }

  const res = await fetchProviderBySlug(params.slug);
  // notFound() here (not fallback metadata) catches a bad slug at the
  // metadata step too, matching the vehicle detail page's fix (see its longer
  // note — app/(public)/rent-a-car/[city]/[makeModel]/[slug]/page.tsx). This
  // route has no loading.tsx ancestor, so the page component's own
  // notFound() below already sets a real 404 on its own; this fetch is
  // deduped against that identical call via Next's request memoization, so
  // adding it here is free.
  if (!res?.data) notFound();
  const p = res.data;
  const city = p.showrooms?.[0]?.city;
  return {
    // No manual "| KerayeGo" — see the note in vehicles/[slug]/page.tsx.
    title: city
      ? `${p.businessName} — Car Rental in ${city.charAt(0).toUpperCase() + city.slice(1)}`
      : `${p.businessName} — Vehicle Rentals`,
    description:
      p.businessDescription ??
      `Browse cars for rent from ${p.businessName}${city ? ` in ${city}` : ''}. Verified provider on KerayeGo.`,
    alternates: {
      canonical: `/providers/${params.slug}`,
    },
    openGraph: {
      title: p.businessName,
      description:
        p.businessDescription ??
        `Browse cars for rent from ${p.businessName}${city ? ` in ${city}` : ''}. Verified provider on KerayeGo.`,
      images: p.logoUrl ? [{ url: p.logoUrl, alt: p.businessName }] : undefined,
    },
  };
}

async function ProviderCityHubPage({ city, page }: { city: string; page: number }) {
  const cityName = toDisplayName(city);
  const res = await fetchAllProviders(page, 24, city);
  const providers = res?.data ?? [];
  const total = res?.meta?.total ?? 0;
  const totalPages = res?.meta?.totalPages ?? 0;

  if (page > 1 && page > totalPages) notFound();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Providers', item: '/providers' },
      { '@type': 'ListItem', position: 3, name: cityName, item: `/providers/${city}` },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-5 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/providers" className="hover:text-slate-600">
          Providers
        </Link>
        <span>/</span>
        <span className="text-slate-700">{cityName}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Rental Providers in {cityName}</h1>
        <p className="mt-2 text-slate-500">
          {total > 0
            ? `${total} verified provider${total !== 1 ? 's' : ''} in ${cityName}`
            : `No providers listed in ${cityName} yet — check back soon, or browse other cities.`}
        </p>
      </div>

      {providers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={`/providers/${city}`} className="mt-10" />
        </>
      ) : (
        <Link href="/providers" className="text-sm font-semibold text-primary hover:underline">
          Browse all providers
        </Link>
      )}
    </div>
  );
}

export default async function ProviderDetailOrCityPage({ params, searchParams }: PageProps) {
  const slug = decodeURIComponent(params.slug).toLowerCase();
  if (await isKnownCity(slug)) {
    const rawPage = Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page;
    if (rawPage === '1') redirect(`/providers/${slug}`);
    const page = parsePageParam(rawPage);
    if (page === null) notFound();
    return <ProviderCityHubPage city={slug} page={page} />;
  }

  const res = await fetchProviderBySlug(params.slug);
  if (!res?.data) notFound();

  const provider = res.data;
  const showrooms = provider.showrooms ?? [];
  const primaryShowroom = showrooms[0] ?? null;
  const vehicleCount = provider._count?.vehicles ?? 0;
  const initial = provider.businessName?.trim()?.[0]?.toUpperCase() ?? '?';

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: provider.businessName,
    description: provider.businessDescription ?? undefined,
    image: provider.logoUrl ?? undefined,
    address: primaryShowroom
      ? {
          '@type': 'PostalAddress',
          streetAddress: primaryShowroom.area ?? undefined,
          addressLocality: primaryShowroom.city,
          addressCountry: 'PK',
        }
      : undefined,
    telephone: primaryShowroom?.contactNumber ?? undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/providers" className="hover:text-slate-600">
          Providers
        </Link>
        <span>/</span>
        <span className="truncate text-slate-700">{provider.businessName}</span>
      </nav>

      {/* Provider header */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Logo */}
          <div className="flex-shrink-0">
            {provider.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.logoUrl}
                alt={provider.businessName}
                className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary">
                {initial}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{provider.businessName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Verified
              </span>
              {provider.isFeatured && (
                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Featured
                </span>
              )}
              <RatingSummaryBadge subjectType="PROVIDER" subjectId={provider.id} size="sm" />
            </div>

            {provider.businessDescription && (
              <p className="mt-2 text-sm text-slate-600">{provider.businessDescription}</p>
            )}

            {/* Showrooms summary */}
            {showrooms.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {showrooms.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {s.name}
                      {s.area && `, ${s.area}`}
                      {' — '}
                      {s.city.charAt(0).toUpperCase() + s.city.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          {primaryShowroom && (primaryShowroom.whatsappNumber || primaryShowroom.contactNumber) && (
            <div className="flex flex-col gap-2 sm:items-end">
              {primaryShowroom.whatsappNumber && (
                <a
                  href={`https://wa.me/${primaryShowroom.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in renting a vehicle from ${provider.businessName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5c]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {primaryShowroom.contactNumber && (
                <a
                  href={`tel:${primaryShowroom.contactNumber}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {primaryShowroom.contactNumber}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="mt-5 flex items-center gap-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <span>
            <strong className="font-semibold text-slate-800">{vehicleCount}</strong> vehicle
            {vehicleCount !== 1 ? 's' : ''}
          </span>
          <span>
            <strong className="font-semibold text-slate-800">{showrooms.length}</strong> showroom
            {showrooms.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Vehicle listings — client component for filtering */}
      <ProviderVehiclesSection providerSlug={params.slug} providerName={provider.businessName} />

      {/* Reviews */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <ReviewsList subjectType="PROVIDER" subjectId={provider.id} title="Reviews" />
      </div>
    </div>
  );
}
