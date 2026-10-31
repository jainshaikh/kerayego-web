'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { EmptyState, ErrorState, Pagination } from '../../../../components/ui';
import { BookingRequestCard } from '../../../../components/ops/bookings/BookingRequestCard';
import { cn } from '../../../../lib/utils/cn';
import { apiErrorMessage } from '../../../../lib/ops/apiError';
import {
  BOOKING_FILTERS,
  bookingFilterSearch,
  emptyListCopy,
  filterCount,
  filterLabel,
  parseBookingFilter,
  type BookingFilter,
} from '../../../../lib/ops/bookingDisplay';
import { useIncomingBookingCounts, useIncomingBookingRequests } from '../../../../hooks/useBookingRequests';

// The business's Bookings (/provider/inquiries — business admin and manager,
// can('manageBookings')), ported from the KerayeGo Partner app's
// app/(business)/bookings/index.tsx: status chips with counts (New, Contacted
// and "Needs a driver" — GET /provider/inquiries/counts), every status
// including In Progress / Completed / Cancelled, and each request opening its
// detail page with the contact details, status actions and driver. The chip
// lives in the URL (?status=… or ?needsDriver=true) so a link can open it.
export default function ProviderInquiriesPage() {
  return (
    <Suspense>
      <ProviderInquiries />
    </Suspense>
  );
}

function ProviderInquiries() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseBookingFilter(searchParams.get('status'), searchParams.get('needsDriver'));
  const pageParam = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const list = useIncomingBookingRequests(filter, page);
  const counts = useIncomingBookingCounts();

  const setFilter = (next: BookingFilter) => router.replace(`${pathname}${bookingFilterSearch(next)}`, { scroll: false });
  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next > 1) params.set('page', String(next));
    else params.delete('page');
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`);
  };

  const requests = list.data?.data ?? [];
  const meta = list.data?.meta;
  const empty = emptyListCopy(filter);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
        <p className="mt-1 text-sm text-text-muted">Rental requests customers sent for your cars.</p>
      </div>

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter booking requests">
        {BOOKING_FILTERS.map((option) => {
          const selected = option === filter;
          const count = filterCount(option, counts.data);
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(option)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border-strong bg-surface text-slate-700 hover:border-brand-600',
              )}
            >
              {filterLabel(option)}
              {count ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px]',
                    selected
                      ? 'bg-white/25 text-white'
                      : option === 'NEEDS_DRIVER'
                        ? 'bg-status-amber-bg text-status-amber-fg'
                        : 'bg-surface-hover text-text-muted',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {list.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-card border border-border-subtle bg-surface p-5">
              <div className="flex gap-3">
                <div className="h-16 w-20 flex-shrink-0 rounded-media bg-surface-hover" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded-control bg-surface-hover" />
                  <div className="h-3 w-60 rounded-control bg-surface-hover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState description={apiErrorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} title={empty.title} description={empty.description} />
      ) : (
        <>
          {meta ? (
            <p className="mb-2 text-xs text-text-muted">{meta.total === 1 ? '1 request' : `${meta.total} requests`}</p>
          ) : null}
          <div className={cn('space-y-3', list.isPlaceholderData && 'opacity-70 transition-opacity')}>
            {requests.map((request) => (
              <BookingRequestCard key={request.id} booking={request} />
            ))}
          </div>
        </>
      )}

      {meta && meta.totalPages > 1 ? (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} className="mt-6" />
      ) : null}
    </div>
  );
}
