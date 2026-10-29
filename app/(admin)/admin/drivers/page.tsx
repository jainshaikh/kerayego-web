'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminDrivers } from '../../../../hooks/useAdmin';
import { DriverVerificationStatus } from '../../../../types/enums';
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
import { Button } from '../../../../components/ui';
import { DriverPhoto, formatDate, isExpired } from '../../../../components/admin/DriverPhoto';

// GET /admin/drivers has no "all" filter — omitting status means PENDING_REVIEW.
const STATUS_TABS = [
  { label: 'Under Review', value: DriverVerificationStatus.PENDING_REVIEW },
  { label: 'Verified', value: DriverVerificationStatus.VERIFIED },
  { label: 'Rejected', value: DriverVerificationStatus.REJECTED },
  { label: 'Not submitted', value: DriverVerificationStatus.UNVERIFIED },
];

export default function AdminDriversPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DriverVerificationStatus>(
    DriverVerificationStatus.PENDING_REVIEW,
  );

  const { data, isFetching, isError } = useAdminDrivers(page, statusFilter);
  const drivers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Moderation"
        title="Driver Verifications"
        subtitle={
          meta
            ? `${meta.total.toLocaleString()} driver${meta.total !== 1 ? 's' : ''}`
            : "Review provider drivers' identity and driving licence"
        }
      />

      <StatusTabs
        tabs={STATUS_TABS}
        value={statusFilter}
        onChange={(v) => {
          setStatusFilter(v as DriverVerificationStatus);
          setPage(1);
        }}
      />

      <AdminTable
        busy={isFetching}
        columns={[
          'Driver',
          'City',
          'Licence expiry',
          'Submitted',
          'Status',
          { label: 'Actions', align: 'right' },
        ]}
      >
        {isFetching && drivers.length === 0 ? (
          <AdminSkeletonRows colSpan={6} />
        ) : isError ? (
          <AdminEmptyRow colSpan={6}>Could not load drivers</AdminEmptyRow>
        ) : drivers.length === 0 ? (
          <AdminEmptyRow colSpan={6}>No drivers found</AdminEmptyRow>
        ) : (
          drivers.map((driver) => {
            const name = driver.fullName || driver.user.name;
            const expired = isExpired(driver.licenseExpiry);
            const href = `/admin/drivers/${driver.userId}`;
            return (
              <AdminRow key={driver.userId} onOpen={() => router.push(href)}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <DriverPhoto url={driver.avatarUrl} name={name} size="sm" />
                    <span className="min-w-0">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate font-medium text-ink transition-colors hover:text-brand-700"
                      >
                        {name}
                      </Link>
                      <span className="block truncate text-xs text-text-faint">
                        {driver.user.phone ?? driver.user.email}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted">{driver.city ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                  {driver.licenseExpiry ? (
                    <span className={expired ? 'font-semibold text-red-700' : 'text-text-muted'}>
                      {formatDate(driver.licenseExpiry)}
                      {expired && (
                        <span className="ml-1.5 rounded-full bg-status-red-bg px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase">
                          Expired
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-text-faint">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-faint">
                  {driver.submittedAt ? formatDate(driver.submittedAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={driver.verificationStatus} size="sm" />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end">
                    {/* No blind approve/reject from the list — the decision needs
                        the documents, which only the detail page shows. */}
                    <Button
                      size="sm"
                      variant={
                        driver.verificationStatus === DriverVerificationStatus.PENDING_REVIEW
                          ? 'primary'
                          : 'secondary'
                      }
                      onClick={() => router.push(href)}
                    >
                      {driver.verificationStatus === DriverVerificationStatus.PENDING_REVIEW
                        ? 'Review'
                        : 'View'}
                    </Button>
                  </div>
                </td>
              </AdminRow>
            );
          })
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
