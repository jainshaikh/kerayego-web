'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Gauge, MapPinned, Phone, User } from 'lucide-react';
import { Card, EmptyState, ErrorState, buttonVariants } from '../../../../components/ui';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { LiveDriversMap } from '../../../../components/ops/live-map/LiveDriversMap';
import { useDriverRoute, useLiveDrivers } from '../../../../hooks/useLiveMap';
import { cn } from '../../../../lib/utils/cn';
import { apiErrorMessage } from '../../../../lib/ops/apiError';
import { callUrl } from '../../../../lib/ops/bookingDisplay';
import { formatLastSeen, speedLabel } from '../../../../lib/ops/liveMap';
import type { LiveDriverBooking } from '../../../../types/live-map.types';

// Live map (/provider/live-map — can('viewLiveMap'), business admin and
// manager), ported from the KerayeGo Partner app's
// app/(business)/business/live-map.tsx: every driver on an in-progress rental
// job on a map (GET /providers/me/live-drivers, every 10 s while the tab is
// visible), with the list beside it. Picking a driver — in the list or on the
// map — focuses them and draws their recent route (A27, A30). The drivers'
// phones send the positions (Partner app); the web only shows them.

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ?? '';

export default function ProviderLiveMapPage() {
  const router = useRouter();
  const drivers = useLiveDrivers();
  const list = drivers.data ?? [];
  const [selectedState, setSelected] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  // The first driver until one is picked; a picked driver whose job ended falls back too.
  const selectedId =
    selectedState && list.some((d) => d.bookingId === selectedState) ? selectedState : (list[0]?.bookingId ?? null);
  const route = useDriverRoute(selectedId);

  // Re-render every 10 s so "Live now / 45s ago" stays true between polls.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const select = (bookingId: string) => {
    setSelected(bookingId);
    setFocusToken((t) => t + 1);
  };

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Live map</h1>
        <p className="mt-1 text-sm text-text-muted">Your drivers on rental jobs under way, right now.</p>
      </div>
      {drivers.isSuccess ? (
        <span className="inline-flex items-center gap-2 text-xs text-text-muted">
          <span className={cn('h-2 w-2 rounded-full', list.length > 0 ? 'bg-emerald-500' : 'bg-text-faint')} />
          {list.length} active · refreshes every 10 s
        </span>
      ) : null}
    </div>
  );

  if (drivers.isPending) {
    return (
      <div className="space-y-5">
        {header}
        <div className="h-[420px] animate-pulse rounded-card bg-surface-hover" />
      </div>
    );
  }
  if (drivers.isError) {
    return (
      <div className="space-y-5">
        {header}
        <ErrorState description={apiErrorMessage(drivers.error)} onRetry={() => drivers.refetch()} />
      </div>
    );
  }
  if (list.length === 0) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState
          icon={MapPinned}
          title="No live trips active"
          description="When a driver starts an accepted rental job, their car's location and route appear on this map."
          action={{ label: 'View all bookings', onClick: () => router.push('/provider/inquiries') }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {MAPS_KEY ? (
          <LiveDriversMap
            drivers={list}
            selectedBookingId={selectedId}
            focusToken={focusToken}
            route={route.data ?? []}
            onSelect={select}
            className="h-[360px] overflow-hidden rounded-card border border-border-subtle lg:h-[calc(100vh-220px)] lg:min-h-[480px]"
          />
        ) : (
          <div className="flex h-[360px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-strong bg-surface p-6 text-center lg:h-auto">
            <MapPinned className="h-8 w-8 text-text-faint" />
            <p className="text-sm font-semibold text-ink">The map isn’t available here</p>
            <p className="max-w-sm text-xs text-text-muted">
              No Google Maps key is set for this site (NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY). The drivers’ status still
              updates in the list.
            </p>
          </div>
        )}

        <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
          <p className="text-sm font-semibold text-ink">Active drivers ({list.length})</p>
          {list.map((item) => (
            <DriverListCard
              key={item.bookingId}
              item={item}
              selected={item.bookingId === selectedId}
              onSelect={() => select(item.bookingId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverListCard({ item, selected, onSelect }: { item: LiveDriverBooking; selected: boolean; onSelect: () => void }) {
  const lastSeen = formatLastSeen(item.lastLocation?.timestamp);
  const isLive = lastSeen === 'Live now';
  const tel = callUrl(item.driver.phone);

  return (
    <Card
      padding="sm"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn('cursor-pointer space-y-2 transition-colors', selected ? 'border-2 border-brand-600' : 'hover:border-border-strong')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-ink">{item.driver.name}</p>
            {item.driver.licenseCategory ? (
              <StatusBadge status="DRAFT" size="sm" label={item.driver.licenseCategory} />
            ) : null}
          </div>
          <p className="text-xs text-text-muted">
            Car: {item.vehicle.year} {item.vehicle.title || `${item.vehicle.make} ${item.vehicle.model}`}
          </p>
        </div>
        <StatusBadge status={isLive ? 'COMPLETED' : 'PENDING_REVIEW'} size="sm" label={isLive ? 'LIVE' : lastSeen} />
      </div>

      {item.lastLocation ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border-subtle pt-2 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" /> {speedLabel(item.lastLocation.speedKmh)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {lastSeen}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> Renter: {item.customer.name}
          </span>
        </div>
      ) : (
        <p className="text-xs text-text-muted">Waiting for the first GPS signal from the driver’s phone…</p>
      )}

      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {tel ? (
          <a href={tel} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            <Phone className="h-3.5 w-3.5" /> Call driver
          </a>
        ) : null}
        <Link href={`/provider/inquiries/${item.bookingId}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Booking details
        </Link>
      </div>
    </Card>
  );
}
