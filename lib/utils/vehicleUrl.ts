// Builds a vehicle's canonical public URL: /rent-a-car/[city]/[make-model]/[slug].
// The city/make-model segments are cosmetic context, not a lookup key — the
// detail page always resolves the vehicle by `slug` alone, so an imprecise
// city here (e.g. no showroom city available, as in an authenticated
// dashboard context that only has the vehicle's make/model) degrades
// gracefully rather than breaking the link.
export function getVehicleUrl(
  vehicle: { slug: string; make: string; model: string },
  city?: string | null,
): string {
  const citySlug = (city ?? 'pakistan').toLowerCase().trim().replace(/\s+/g, '-');
  const makeModelSlug = `${vehicle.make} ${vehicle.model}`.toLowerCase().trim().replace(/\s+/g, '-');
  return `/rent-a-car/${encodeURIComponent(citySlug)}/${encodeURIComponent(makeModelSlug)}/${vehicle.slug}`;
}

/**
 * A city's rental hub, /rent-a-car/[city] — the city as the backend stores it
 * (lower-case), URL-encoded, the same way the hubs, homepage and sitemap
 * build it.
 */
export function cityHubUrl(city: string): string {
  return `/rent-a-car/${encodeURIComponent(city.toLowerCase().trim())}`;
}

/** A city's weekly & monthly page (plan A84): cars offered by the week or month, no prices. */
export function weeklyMonthlyCityUrl(city: string): string {
  return `${cityHubUrl(city)}/weekly-monthly`;
}
