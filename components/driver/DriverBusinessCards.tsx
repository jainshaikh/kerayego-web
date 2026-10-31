'use client';

import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { Card } from '../ui';
import { StatusBadge } from '../common/StatusBadge';
import type { DriverLinkedBusiness } from '../../types/driver.types';
import { MEMBERSHIP_STATUS_LABELS } from '../../lib/driver/jobs';

/** A business's logo, or its initial. */
export function BusinessLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an S3 URL; next/image needs every host configured.
      <img src={logoUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-control bg-surface-hover object-cover" />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-control bg-brand-50 text-base font-bold text-brand-700">
      {initial || <Building2 className="h-5 w-5" />}
    </div>
  );
}

/** One membership: logo, name, a line under it, the status, and its buttons. */
export function BusinessMembershipCard({
  member,
  detail,
  note,
  showStatus = true,
  children,
}: {
  member: DriverLinkedBusiness;
  detail?: string;
  note?: string;
  showStatus?: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <BusinessLogo name={member.providerProfile.businessName} logoUrl={member.providerProfile.logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{member.providerProfile.businessName}</p>
          {detail ? <p className="mt-0.5 text-[13px] text-text-muted">{detail}</p> : null}
        </div>
        {showStatus ? (
          <StatusBadge status={member.status} label={MEMBERSHIP_STATUS_LABELS[member.status] ?? member.status} size="sm" />
        ) : null}
      </div>
      {note ? <p className="mt-3 text-[13px] text-text-muted">{note}</p> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">{children}</div>
    </Card>
  );
}
