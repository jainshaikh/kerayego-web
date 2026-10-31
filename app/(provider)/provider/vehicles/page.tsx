'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Car, Plus, Search } from 'lucide-react';
import { useMyVehicles } from '../../../../hooks/useVehicles';
import { useProviderProfile } from '../../../../hooks/useProviderProfile';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { Card, EmptyState, ErrorState, Pagination, SegmentedTabs, buttonVariants } from '../../../../components/ui';
import { AddCarGate } from '../../../../components/ops/fleet/AddCarGate';
import { cn } from '../../../../lib/utils/cn';
import { formatPrice } from '../../../../lib/ops/bookingDisplay';
import { VEHICLE_STATUS_LABELS, addCarBlockers, vehicleCurrency } from '../../../../lib/ops/fleetRules';
import { FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '../../../../lib/ops/vehicleForm';
import type { FleetListFilters, FleetVehicleListItem, FleetVehicleStatus } from '../../../../types/fleet.types';
import type { Showroom } from '../../../../types/api.types';

// The business's Fleet (/provider/vehicles), ported from the KerayeGo Partner
// app's app/(business)/fleet/index.tsx: status tabs, search, and each car with
// its cover, specs, day price in its showroom's currency and status. Everyone
// in the business sees the fleet; only the business admin adds cars
// (can('manageFleet')), so a manager gets no Add car and no "you can't add
// cars yet" steps they couldn't take anyway.

const STATUS_TABS: { value: string; label: string; status?: FleetVehicleStatus }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'APPROVED', label: 'Live', status: 'APPROVED' },
  { value: 'PENDING_REVIEW', label: 'Under Review', status: 'PENDING_REVIEW' },
  { value: 'DRAFT', label: 'Draft', status: 'DRAFT' },
  { value: 'REJECTED', label: 'Rejected', status: 'REJECTED' },
  { value: 'ARCHIVED', label: 'Archived', status: 'ARCHIVED' },
];

const TRANSMISSION_LABELS: Record<string, string> = Object.fromEntries(TRANSMISSION_OPTIONS.map((o) => [o.value, o.label]));
const FUEL_LABELS: Record<string, string> = Object.fromEntries(FUEL_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export default function ProviderVehiclesPage() {
  const router = useRouter();
  const { can } = useWorkspace();
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const business = useProviderProfile();
  const managesFleet = can('manageFleet');
  const blockers = managesFleet && business.isSuccess ? addCarBlockers(business.data) : [];
  const canAddCar = managesFleet && business.isSuccess && blockers.length === 0;

  const active = STATUS_TABS.find((t) => t.value === tab);
  const filters: FleetListFilters = { ...(active?.status && { status: active.status }), ...(search.trim() && { search }) };
  const list = useMyVehicles(filters, page);

  const vehicles = list.data?.data ?? [];
  const meta = list.data?.meta;
  const showrooms = business.data?.showrooms ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Fleet</h1>
          <p className="mt-1 text-sm text-text-muted">
            Your rental cars{meta ? ` · ${meta.total} ${meta.total === 1 ? 'car' : 'cars'}` : ''}
          </p>
        </div>
        {canAddCar ? (
          <Link href="/provider/vehicles/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Add car
          </Link>
        ) : null}
      </div>

      {blockers.length > 0 ? <AddCarGate blockers={blockers} /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            type="search"
            placeholder="Search by title, make, or model…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-control border border-border-strong bg-surface py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/18"
          />
        </div>
        <div className="overflow-x-auto">
          <SegmentedTabs
            options={STATUS_TABS}
            value={tab}
            onChange={(value) => {
              setTab(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {list.isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-card border border-border-subtle bg-surface p-4">
              <div className="flex gap-4">
                <div className="h-20 w-28 flex-shrink-0 rounded-media bg-surface-hover" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded-control bg-surface-hover" />
                  <div className="h-3 w-24 rounded-control bg-surface-hover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title={
            search.trim()
              ? 'No cars match your search'
              : tab === 'ALL'
                ? 'No cars listed yet'
                : `No ${active?.label.toLowerCase()} cars`
          }
          description={
            !managesFleet
              ? 'Cars the business admin lists will appear here.'
              : canAddCar
                ? 'Add your rental cars to start receiving booking requests from customers.'
                : 'Follow the steps above to prepare your business for listing cars.'
          }
          action={
            canAddCar && !search.trim() ? { label: 'Add car', onClick: () => router.push('/provider/vehicles/new') } : undefined
          }
        />
      ) : (
        <div className={cn('space-y-3', list.isFetching && 'opacity-70 transition-opacity')}>
          {vehicles.map((vehicle) => (
            <FleetVehicleRow key={vehicle.id} vehicle={vehicle} showrooms={showrooms} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} className="mt-6" />
      ) : null}
    </div>
  );
}

function FleetVehicleRow({ vehicle, showrooms }: { vehicle: FleetVehicleListItem; showrooms: Showroom[] }) {
  const cover = vehicle.images[0];
  const requests = vehicle._count?.bookingRequests ?? 0;
  return (
    <Link href={`/provider/vehicles/${vehicle.id}/edit`} className="block rounded-card">
      <Card hover className="flex items-start gap-4">
        <div className="flex h-20 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-media bg-surface-hover text-text-faint">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt={vehicle.title} className="h-full w-full object-cover" />
          ) : (
            <Car className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 font-semibold text-ink">{vehicle.title}</p>
            <StatusBadge status={vehicle.status} size="sm" label={VEHICLE_STATUS_LABELS[vehicle.status]} />
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            {TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission} · {FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType} ·{' '}
            {vehicle.seatingCapacity} seats
          </p>
          <p className="mt-1.5 font-mono text-sm font-semibold text-ink">
            {formatPrice(vehicle.pricePerDay, vehicleCurrency(vehicle, showrooms))}
            <span className="font-sans text-xs font-normal text-text-faint"> / day</span>
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {cover ? '' : 'No photos yet · '}
            {requests} booking {requests === 1 ? 'request' : 'requests'}
          </p>
          {vehicle.rejectionReason && vehicle.status === 'REJECTED' ? (
            <p className="mt-1 line-clamp-2 text-xs text-red-700">Reason: {vehicle.rejectionReason}</p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
