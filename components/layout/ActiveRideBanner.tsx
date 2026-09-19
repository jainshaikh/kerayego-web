'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radio, X } from 'lucide-react';
import { useMyActiveRide } from '../../hooks/useTrips';

interface ActiveRideBannerProps {
  basePath: string; // e.g. '/dashboard' or '/provider'
}

// Mobile force-redirects onto an active ride screen — that's hostile on
// desktop, so this is a dismissible banner instead. Dismissal is plain
// component state (not persisted), which is enough since this layout stays
// mounted across client-side navigation within the route group.
export function ActiveRideBanner({ basePath }: ActiveRideBannerProps) {
  const { data: activeRide } = useMyActiveRide();
  const [dismissed, setDismissed] = useState(false);

  if (!activeRide || dismissed) return null;

  const href =
    activeRide.role === 'driver'
      ? `${basePath}/trips/${activeRide.tripId}`
      : `${basePath}/trip-inquiries/${activeRide.tripInquiryId}`;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-status-violet-border bg-status-violet-bg px-6 py-2.5 text-sm text-status-violet-fg md:px-8">
      <Link href={href} className="flex min-w-0 items-center gap-2 font-semibold hover:underline">
        <Radio className="h-4 w-4 flex-shrink-0" />
        You have a trip in progress — open it
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-shrink-0 rounded-control p-1 transition-colors hover:bg-status-violet-border/40"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
