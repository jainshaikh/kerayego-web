'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { withPageParam } from '../../lib/utils/pagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  /**
   * Preferred for any publicly-crawlable listing: builds a real URL per page
   * number, rendered as a Next.js `<Link>` so pagination is discoverable by
   * Googlebot (SEO Phase 2 §5.4) instead of only reachable via a JS click.
   *
   * `Pagination` is a Client Component, so this **must** come from another
   * Client Component (e.g. a `useCallback` built from `useSearchParams`/
   * `usePathname`, as `VehiclesView`/`ProvidersView`/`TripsView` do) — a plain
   * function can't be serialized across the Server->Client Component boundary.
   * A Server Component page should pass `basePath` instead.
   */
  hrefForPage?: (page: number) => string;
  /**
   * For a Server Component page rendering this directly (a plain string
   * crosses the RSC boundary fine, unlike a function): builds each page's
   * `href` internally via `withPageParam(basePath, page)`. Ignored when
   * `hrefForPage` is given.
   */
  basePath?: string;
  /**
   * Fallback for authenticated/private surfaces (dashboards, admin tables)
   * with no SEO value, where a plain client-side page change is fine. Ignored
   * when `hrefForPage`/`basePath` is given.
   */
  onPageChange?: (page: number) => void;
  className?: string;
}

const tileCls =
  'flex h-9 w-9 items-center justify-center rounded-control border border-border-subtle bg-surface text-sm font-medium font-mono text-slate-700 transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40';

export function Pagination({ page, totalPages, hrefForPage, basePath, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = hrefForPage ?? (basePath !== undefined ? (p: number) => withPageParam(basePath, p) : undefined);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const tileClsFor = (p: number) => cn(tileCls, p === page && 'border-brand-600 bg-brand-600 text-white hover:bg-brand-600');

  const renderTile = (p: number, disabled: boolean, content: React.ReactNode) => {
    if (buildHref) {
      if (disabled) {
        return (
          <span className={cn(tileClsFor(p), 'cursor-not-allowed opacity-40')} aria-disabled="true">
            {content}
          </span>
        );
      }
      return (
        <Link href={buildHref(p)} className={tileClsFor(p)} aria-current={p === page ? 'page' : undefined}>
          {content}
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={tileClsFor(p)}
        disabled={disabled}
        onClick={() => onPageChange?.(p)}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)}>
      {renderTile(page - 1, page <= 1, <ChevronLeft className="h-4 w-4" />)}
      {pages.map((p, i) => (
        <div key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="px-1 text-sm text-text-faint">…</span> : null}
          {renderTile(p, false, p)}
        </div>
      ))}
      {renderTile(page + 1, page >= totalPages, <ChevronRight className="h-4 w-4" />)}
    </div>
  );
}
