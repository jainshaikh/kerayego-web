'use client';

import { ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../../ui';
import { StatusBadge } from '../../common/StatusBadge';
import { cn } from '../../../lib/utils/cn';
import { apiErrorMessage } from '../../../lib/ops/apiError';
import {
  driverPickerSections,
  ineligibleReasonText,
  licenceExpiryLabel,
  type DriverPickerRow,
} from '../../../lib/ops/driverAssignment';
import { useEligibleDrivers } from '../../../hooks/useBookingRequests';
import type { EligibleDriver } from '../../../types/booking-requests.types';
import { DriverAvatar } from './BookingBits';

const VERIFICATION_LABELS: Record<string, string> = {
  UNVERIFIED: 'Unverified',
  PENDING_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

interface DriverPickerListProps {
  bookingId: string;
  /** Fetches only while shown. */
  active: boolean;
  currentDriverId?: string | null;
  onSelect: (driver: EligibleDriver) => void;
  /** The driver being saved (spinner on that row; every row waits). */
  savingDriverId?: string | null;
  /** Shown above the list, e.g. a failed save. */
  error?: string | null;
  /** "Invite a driver" — left out when this dashboard can't invite drivers. */
  onInviteDriver?: () => void;
}

// The business's drivers for one booking (GET /booking-requests/:id/eligible-drivers):
// photo, name, verification, licence expiry. Eligible ones can be picked; the
// rest are greyed out with the backend's reasons. Ported from the KerayeGo
// Partner app's DriverPickerList.
export function DriverPickerList({
  bookingId,
  active,
  currentDriverId,
  onSelect,
  savingDriverId,
  error,
  onInviteDriver,
}: DriverPickerListProps) {
  const query = useEligibleDrivers(bookingId, active);

  if (query.isPending) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your drivers…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-red-700">{apiErrorMessage(query.error)}</p>
        <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (query.data.length === 0) {
    return (
      <div className="space-y-3 py-2">
        <p className="font-semibold text-ink">No drivers yet</p>
        <p className="text-sm text-text-muted">
          Invite a driver to your team. Once KerayeGo has verified them, you can give them bookings.
        </p>
        {onInviteDriver ? (
          <Button size="sm" onClick={onInviteDriver}>
            Invite a driver
          </Button>
        ) : null}
      </div>
    );
  }

  const sections = driverPickerSections(query.data, currentDriverId);
  const saving = !!savingDriverId;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => query.refetch()}
          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-ink"
        >
          <RefreshCw className={cn('h-3 w-3', query.isFetching && 'animate-spin')} /> Refresh
        </button>
      </div>
      {error ? <p className="whitespace-pre-line text-sm text-red-700">{error}</p> : null}

      {sections.eligible.length > 0 ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Available</p>
          {sections.eligible.map((row) => (
            <DriverRow
              key={row.driver.userId}
              row={row}
              saving={savingDriverId === row.driver.userId}
              disabled={saving}
              onPress={() => onSelect(row.driver)}
            />
          ))}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">None of your drivers can take this booking right now.</p>
          {onInviteDriver ? (
            <Button variant="secondary" size="sm" onClick={onInviteDriver}>
              Invite a driver
            </Button>
          ) : null}
        </div>
      )}

      {sections.ineligible.length > 0 ? (
        <>
          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Can’t take this booking</p>
          {sections.ineligible.map((row) => (
            <DriverRow key={row.driver.userId} row={row} saving={false} disabled onPress={() => undefined} />
          ))}
        </>
      ) : null}
    </div>
  );
}

function DriverRow({
  row,
  saving,
  disabled,
  onPress,
}: {
  row: DriverPickerRow;
  saving: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { driver, selectable, isCurrent } = row;
  const blocked = !selectable || disabled;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={blocked}
      aria-label={selectable ? `Assign ${driver.name}` : `${driver.name}, ${isCurrent ? 'current driver' : ineligibleReasonText(driver)}`}
      className={cn(
        'flex w-full items-center gap-3 rounded-control border border-border-subtle bg-surface p-3 text-left transition-colors',
        selectable ? 'hover:border-brand-600 hover:bg-surface-hover' : 'cursor-not-allowed opacity-55',
        disabled && selectable && 'cursor-wait',
      )}
    >
      <DriverAvatar uri={driver.avatarUrl} name={driver.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-ink">{driver.name}</span>
          <StatusBadge status={driver.verificationStatus} size="sm" label={VERIFICATION_LABELS[driver.verificationStatus]} />
          {isCurrent ? <StatusBadge status="CONTACTED" size="sm" label="Current driver" /> : null}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{licenceExpiryLabel(driver.licenseExpiry)}</p>
        {!driver.eligible ? <p className="mt-0.5 text-xs text-red-700">{ineligibleReasonText(driver)}</p> : null}
      </div>
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
      ) : selectable ? (
        <ChevronRight className="h-4 w-4 text-text-faint" />
      ) : null}
    </button>
  );
}
