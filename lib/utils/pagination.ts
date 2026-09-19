/**
 * Shared pagination helpers for crawlable, self-canonicalizing paginated
 * public pages (SEO Phase 2 — see docs/KerayeGo_SEO_Phase_2_Execution_Plan.md
 * §5). Keeping this in one place means every listing surface treats `page`
 * consistently instead of each route re-inventing the parsing/canonical rules.
 */

/**
 * Parses a raw `?page=` value.
 * - `undefined` (param absent) -> 1
 * - a valid positive integer string -> that integer
 * - anything else (non-numeric, "0", negative, decimals, leading zeros) -> null,
 *   meaning the caller should treat the request as invalid (404), per the
 *   plan's "handle invalid page parameters predictably" rule.
 */
export function parsePageParam(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  return Number(raw);
}

/**
 * Canonical URL for a paginated page: the bare path on page 1 (no `?page=1`
 * duplicate), `${basePath}?page=N` after. Deliberately takes only the base
 * path — not the full current query string — so that utility/faceted filters
 * (sort, price range, transmission, make, ...) never become their own
 * canonical target (Phase 3 faceted-navigation rule); only the page number
 * survives into the canonical.
 */
export function withPageParam(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}
