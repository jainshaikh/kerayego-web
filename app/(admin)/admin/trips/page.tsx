'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAdminTrips, useSuspendTrip, useReactivateTrip } from '../../../../hooks/useAdmin';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import {
  AdminEmptyRow,
  AdminPageHeader,
  AdminRow,
  AdminSkeletonRows,
  AdminTable,
  AdminTableFooter,
  StatusTabs,
} from '../../../../components/admin';
import { Avatar, Button } from '../../../../components/ui';
import { getCurrencyCode } from '../../../../lib/utils/currency';
import { formatTripDateTime } from '../../../../lib/utils/datetime';

const STATUS_TABS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'All', value: '' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

export default function AdminTripsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const { data, isFetching } = useAdminTrips(page, statusFilter || undefined);
  const suspend = useSuspendTrip();
  const reactivate = useReactivateTrip();

  const trips = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Intercity Trips"
        subtitle={
          meta
            ? `${meta.total.toLocaleString()} trip${meta.total !== 1 ? 's' : ''}`
            : 'Trips go live automatically once posted with an approved vehicle'
        }
      />

      <StatusTabs
        tabs={STATUS_TABS}
        value={statusFilter}
        onChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
      />

      <AdminTable
        busy={isFetching}
        columns={[
          'Route',
          'Posted by',
          'Vehicle',
          'Departure',
          'Price/seat',
          'Status',
          { label: 'Actions', align: 'right' },
        ]}
      >
        {isFetching && trips.length === 0 ? (
          <AdminSkeletonRows colSpan={7} />
        ) : trips.length === 0 ? (
          <AdminEmptyRow colSpan={7}>No trips found</AdminEmptyRow>
        ) : (
          trips.map((trip) => (
            <AdminRow key={trip.id} onOpen={() => router.push(`/admin/trips/${trip.id}`)}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/trips/${trip.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 font-medium capitalize text-ink transition-colors hover:text-brand-700"
                >
                  {trip.originCity}
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-brand-600" />
                  {trip.destinationCity}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="text-ink-soft flex items-center gap-2.5">
                  <Avatar name={trip.postedBy.name} size="sm" />
                  {trip.postedBy.name}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {trip.isReturnTrip && trip.fleetVehicle ? (
                  <>
                    {trip.fleetVehicle.make} {trip.fleetVehicle.model}
                    <span className="ml-1 text-text-faint">
                      · {trip.providerProfile?.businessName ?? 'Business car'}
                    </span>
                  </>
                ) : trip.userVehicle ? (
                  <>
                    {trip.userVehicle.make} {trip.userVehicle.model}
                    <span className="ml-1 font-mono uppercase text-text-faint">
                      {trip.userVehicle.plateNumber}
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-muted">
                {formatTripDateTime(trip.departureAt)} PKT
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-ink">
                {getCurrencyCode(trip.userVehicle?.country)} {Number(trip.pricePerSeat).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={trip.status} size="sm" />
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end">
                  {trip.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="danger-outline"
                      loading={suspend.isPending}
                      onClick={() => suspend.mutate(trip.id)}
                    >
                      Suspend
                    </Button>
                  ) : trip.status === 'SUSPENDED' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={reactivate.isPending}
                      onClick={() => reactivate.mutate(trip.id)}
                    >
                      Reactivate
                    </Button>
                  ) : (
                    <span className="text-xs text-text-faint">—</span>
                  )}
                </div>
              </td>
            </AdminRow>
          ))
        )}
      </AdminTable>

      {meta && (
        <AdminTableFooter
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
