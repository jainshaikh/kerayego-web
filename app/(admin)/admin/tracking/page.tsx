'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Navigation, Car, User, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAdminTrackingLookup } from '../../../../hooks/useAdmin';
import { AdminPageHeader } from '../../../../components/admin';
import { Button, Card, ErrorState } from '../../../../components/ui';

export default function AdminTrackingLookupPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const { data: result, isLoading, isError, error, refetch } = useAdminTrackingLookup({
    query: activeQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveQuery(searchInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Emergency & Audit Lookup (A39)"
        title="Vehicle & Driver Tracking Lookup"
        subtitle="Look up current or last known location for a specific vehicle, driver, or booking."
      />

      {/* Search Input Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by vehicle title/slug, driver name, phone number, or booking ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-subtle bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </Card>

      {/* Results Section */}
      {isLoading ? (
        <Card className="p-8 text-center text-text-faint">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mb-2" />
          <p>Looking up location records...</p>
        </Card>
      ) : isError ? (
        <ErrorState
          title="Lookup failed"
          description={(error as any)?.message || 'No tracking records found for query.'}
          onRetry={() => refetch()}
        />
      ) : result ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              result.isCurrentlyActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  result.isCurrentlyActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div>
                <p className="font-semibold text-sm">
                  {result.isCurrentlyActive ? 'LIVE NOW — Active Rental Job' : 'LAST KNOWN LOCATION'}
                </p>
                <p className="text-xs opacity-80">
                  {result.isCurrentlyActive
                    ? `Driver is currently on trip. Last synced: ${result.lastSeenText}`
                    : `Trip status: ${result.booking.status}. Last reported: ${result.lastSeenText}`}
                </p>
              </div>
            </div>

            {result.lastLocation ? (
              <a
                href={`https://www.google.com/maps?q=${result.lastLocation.lat},${result.lastLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/80 dark:bg-black/30 border border-current shadow-sm hover:opacity-90"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehicle Card */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-text-faint text-xs font-semibold uppercase tracking-wider">
                <Car className="h-4 w-4" />
                <span>Vehicle</span>
              </div>
              <p className="font-semibold text-ink text-base">{result.vehicle.title}</p>
              <p className="text-xs text-text-faint">
                {result.vehicle.year} • {result.vehicle.make} {result.vehicle.model}
              </p>
              <p className="text-xs font-mono text-text-faint">Slug: {result.vehicle.slug}</p>
            </Card>

            {/* Driver Card */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-text-faint text-xs font-semibold uppercase tracking-wider">
                <User className="h-4 w-4" />
                <span>Assigned Driver</span>
              </div>
              {result.driver ? (
                <>
                  <p className="font-semibold text-ink text-base">{result.driver.name}</p>
                  <p className="text-xs text-text-faint">Phone: {result.driver.phone || 'N/A'}</p>
                  <p className="text-xs text-text-faint">
                    License: {result.driver.licenseCategory || 'N/A'} ({result.driver.licenseNumber || 'Verified'})
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-faint italic">No driver assigned to this booking.</p>
              )}
            </Card>

            {/* Business & Booking Card */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-text-faint text-xs font-semibold uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                <span>Business & Booking</span>
              </div>
              <p className="font-semibold text-ink text-base">{result.business.businessName}</p>
              <p className="text-xs text-text-faint">
                Customer: {result.customer.name} ({result.customer.phone || 'No phone'})
              </p>
              <Link
                href={`/admin/providers/${result.business.id}`}
                className="text-xs text-brand-600 hover:underline block pt-1"
              >
                View Business Profile →
              </Link>
            </Card>
          </div>

          {/* Telemetry Details */}
          {result.lastLocation ? (
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2 font-medium text-sm text-ink">
                  <Navigation className="h-4 w-4 text-brand-500" />
                  <span>GPS Telemetry Coordinates</span>
                </div>
                <span className="text-xs text-text-faint font-mono">
                  Timestamp: {new Date(result.lastLocation.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-1">
                <div>
                  <span className="text-xs text-text-faint block">Latitude</span>
                  <span className="font-mono font-medium">{result.lastLocation.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-xs text-text-faint block">Longitude</span>
                  <span className="font-mono font-medium">{result.lastLocation.lng.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-xs text-text-faint block">Speed</span>
                  <span className="font-mono font-medium">
                    {result.lastLocation.speedKmh !== null ? `${result.lastLocation.speedKmh} km/h` : 'Stationary'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-faint block">Compass Heading</span>
                  <span className="font-mono font-medium">
                    {result.lastLocation.headingDeg !== null ? `${result.lastLocation.headingDeg}°` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Breadcrumb Fixes Count */}
              {result.recentRouteFixes?.length > 0 ? (
                <div className="pt-3 border-t border-border-subtle text-xs text-text-faint">
                  {result.recentRouteFixes.length} route fix points recorded in 30-day retention log (A30).
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>
      ) : activeQuery ? (
        <Card className="p-8 text-center text-text-faint">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
          <p className="font-medium">No location or booking records found for &ldquo;{activeQuery}&rdquo;</p>
          <p className="text-xs mt-1">Make sure the vehicle or driver has been assigned to a booking with GPS tracking.</p>
        </Card>
      ) : (
        <Card className="p-12 text-center text-text-faint space-y-2">
          <MapPin className="h-10 w-10 mx-auto text-text-faint/50" />
          <p className="font-medium text-ink">Search for a vehicle or driver above</p>
          <p className="text-xs max-w-md mx-auto">
            Per decision A39, KerayeGo admin does not display an all-vehicle live map. Use this lookup to pinpoint
            active trips or find the last known location when handling safety or dispute incidents.
          </p>
        </Card>
      )}
    </div>
  );
}
