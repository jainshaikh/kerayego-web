'use client';

import { Button, Card } from '../../ui';
import { useSubmitForReview } from '../../../hooks/useProviderProfile';
import type { ProviderProfileWithMeta } from '../../../lib/api/providers.api';
import { SUBMIT_MIN_COMPLETENESS, submitForReviewState } from '../../../lib/workspace/businessStatus';

// "Submit for review" (POST /providers/me/submit-for-review), offered while
// the business is PENDING or REJECTED — kerayego-partner SubmitForReviewCard.
// It explains the backend's conditions up front and only enables the button
// once they are met. Success and failure are toasted by useSubmitForReview.
export function SubmitForReviewCard({ business }: { business: ProviderProfileWithMeta }) {
  const submit = useSubmitForReview();
  const state = submitForReviewState(business);
  if (state.kind === 'hidden') return null;
  const title = state.resubmit ? 'Submit again' : 'Submit for review';

  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-sm text-text-muted">
        KerayeGo checks every business before its cars can be listed. To submit, you need at least one showroom, a
        profile that is at least {SUBMIT_MIN_COMPLETENESS}% complete and the owner&apos;s CNIC number.
      </p>
      {state.kind === 'blocked' ? (
        <ul className="space-y-1">
          {state.reasons.map((reason) => (
            <li key={reason} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
      <Button onClick={() => submit.mutate()} disabled={state.kind !== 'ready'} loading={submit.isPending}>
        {title}
      </Button>
    </Card>
  );
}
