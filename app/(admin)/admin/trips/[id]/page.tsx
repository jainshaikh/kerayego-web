'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminTripDetail, useSuspendTrip, useReactivateTrip } from '../../../../../hooks/useAdmin';
import { StatusBadge } from '../../../../../components/common/StatusBadge';
import { getCurrencyCode } from '../../../../../lib/utils/currency';
import { formatTripDateTime } from '../../../../../lib/utils/datetime';

export default function AdminTripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: trip, isLoading, isError } = useAdminTripDetail(id);
  const suspend = useSuspendTrip();
  const reactivate = useReactivateTrip();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-4 bg-slate-100 rounded w-24" />
        <div className="h-40 bg-white rounded-xl border border-slate-200" />
        <div className="h-48 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Trip not found</p>
        <Link href="/admin/trips" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin/trips" className="hover:text-slate-600">Trips</Link>
        <span>/</span>
        <span className="truncate text-slate-700">{trip.originCity} → {trip.destinationCity}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {trip.originCity.charAt(0).toUpperCase() + trip.originCity.slice(1)}
                {' → '}
                {trip.destinationCity.charAt(0).toUpperCase() + trip.destinationCity.slice(1)}
              </h1>
              <StatusBadge status={trip.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Departs {formatTripDateTime(trip.departureAt, { dateStyle: 'full', timeStyle: 'short' })} PKT
            </p>
            {trip.cancelReason && (
              <p className="text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-2 mt-3 inline-block">
                Cancelled: {trip.cancelReason}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {trip.status === 'ACTIVE' && (
              <button
                onClick={() => suspend.mutate(trip.id)}
                disabled={suspend.isPending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {suspend.isPending ? 'Suspending…' : 'Suspend'}
              </button>
            )}
            {trip.status === 'SUSPENDED' && (
              <button
                onClick={() => reactivate.mutate(trip.id)}
                disabled={reactivate.isPending}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              >
                {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Seats available" value={trip.availableSeats} />
        <StatCard label="Price/seat" value={`${getCurrencyCode(trip.userVehicle?.country)} ${Number(trip.pricePerSeat).toLocaleString()}`} />
        <StatCard label="Posted" value={new Date(trip.createdAt).toLocaleDateString('en-AE', { dateStyle: 'medium' })} />
        <StatCard label="Contact" value={trip.contactNumber} />
      </div>

      {/* Route + vehicle + poster */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Route</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-400">Pickup point</p>
              <p className="text-slate-700">{trip.pickupPoint}</p>
            </div>
            {trip.dropoffPoint && (
              <div>
                <p className="text-xs text-slate-400">Drop-off point</p>
                <p className="text-slate-700">{trip.dropoffPoint}</p>
              </div>
            )}
            {trip.notes && (
              <div>
                <p className="text-xs text-slate-400">Notes</p>
                <p className="text-slate-700">{trip.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {trip.isReturnTrip && trip.fleetVehicle ? (
            // Return trip (A48): a business's fleet car, userVehicle is null.
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle (business return trip)</h2>
                <StatusBadge status={trip.fleetVehicle.status} size="sm" />
              </div>
              <p className="font-medium text-slate-800">
                {trip.fleetVehicle.make} {trip.fleetVehicle.model}{trip.fleetVehicle.year ? ` (${trip.fleetVehicle.year})` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {trip.fleetVehicle.title}
                {trip.providerProfile ? ` · ${trip.providerProfile.businessName}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <Link
                  href={`/admin/vehicles/${trip.fleetVehicle.id}`}
                  className="inline-block text-sm font-semibold text-primary hover:underline"
                >
                  View fleet vehicle →
                </Link>
                {trip.providerProfile && (
                  <Link
                    href={`/admin/providers/${trip.providerProfile.id}`}
                    className="inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    View business →
                  </Link>
                )}
              </div>
            </>
          ) : trip.userVehicle ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</h2>
                <StatusBadge status={trip.userVehicle.status} size="sm" />
              </div>
              <p className="font-medium text-slate-800">
                {trip.userVehicle.make} {trip.userVehicle.model}{trip.userVehicle.year ? ` (${trip.userVehicle.year})` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {trip.userVehicle.color && `${trip.userVehicle.color} · `}Plate {trip.userVehicle.plateNumber}
              </p>
              <Link
                href={`/admin/user-vehicles/${trip.userVehicle.id}`}
                className="inline-block mt-3 text-sm font-semibold text-primary hover:underline"
              >
                View vehicle & documents →
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vehicle</h2>
              <p className="text-sm text-slate-500">No vehicle on record.</p>
            </>
          )}
        </div>
      </div>

      {/* Poster */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Posted by</h2>
        <p className="font-semibold text-slate-900">{trip.postedBy.name}</p>
        <div className="mt-1 text-sm text-slate-500 space-x-3">
          <span>{trip.postedBy.email}</span>
          {trip.postedBy.phone && <span>{trip.postedBy.phone}</span>}
        </div>
        <Link
          href={`/admin/users/${trip.postedBy.id}`}
          className="inline-block mt-3 text-sm font-semibold text-primary hover:underline"
        >
          View user profile →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
