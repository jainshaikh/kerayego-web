'use client';

import { EligibleReviewsList } from '../../../../components/reviews/EligibleReviewsList';

export default function DashboardReviewsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Rate your rides</h1>
        <p className="mt-1 text-sm text-text-muted">
          Rate completed rentals and departed trips — your car and driver ratings are shown
          publicly; ratings you receive from drivers are for our own records only.
        </p>
      </div>
      <EligibleReviewsList />
    </div>
  );
}
