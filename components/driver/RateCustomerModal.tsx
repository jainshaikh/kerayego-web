'use client';

import { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button, Modal, RatingStars, Textarea } from '../ui';
import type { RateableBooking } from '../../types/driver.types';
import { useRateDriverCustomer } from '../../hooks/useDriverJobs';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import { formatDate } from '../../lib/driver/fields';
import { RATING_COMMENT_MAX_LENGTH, starLabel } from '../../lib/driver/jobs';

// "Rate your customer" for a completed job — the web twin of kerayego-partner's
// RateCustomerSheet: 1–5 stars and an optional comment → POST /reviews,
// private (only KerayeGo sees it, A24). ×, a click outside and "Later" all
// just close it. The app also opens it by itself right after End job; the web
// has no End job, so it opens only from the job's "Rate customer" button.
// Mount it only while open, keyed by the booking, so each starts blank.
export function RateCustomerModal({ booking, onClose }: { booking: RateableBooking; onClose: () => void }) {
  const rate = useRateDriverCustomer();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rated, setRated] = useState(false);

  const subtitle = booking.vehicle?.title
    ? `${booking.user.name} · ${booking.vehicle.title}`
    : `${booking.user.name} · rental completed ${formatDate(booking.updatedAt)}`;

  const submit = () => {
    if (rating < 1) {
      setError('Click a star to rate this customer');
      return;
    }
    if (comment.length > RATING_COMMENT_MAX_LENGTH) {
      setError(`Keep your comment to ${RATING_COMMENT_MAX_LENGTH} characters or fewer`);
      return;
    }
    setError(null);
    rate.mutate(
      { bookingId: booking.id, customerId: booking.user.id, rating, comment },
      {
        onSuccess: () => setRated(true),
        onError: (err) => setError(getApiErrorMessage(err, 'Could not save your rating. Please try again.')),
      },
    );
  };

  const onOpenChange = (open: boolean) => {
    if (!open && !rate.isPending) onClose();
  };

  if (rated) {
    return (
      <Modal open onOpenChange={onOpenChange} title="Thank you" description={subtitle}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="text-sm text-ink">
            Your rating of {booking.user.name} is saved. It stays private: only KerayeGo sees it.
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Rate your customer"
      description={subtitle}
      footer={
        <>
          <Button variant="ghost" disabled={rate.isPending} onClick={onClose}>
            Later
          </Button>
          <Button loading={rate.isPending} onClick={submit}>
            Submit rating
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2.5 rounded-control bg-surface-hover p-3 text-[13px] text-text-muted">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Private: the customer never sees this rating. Only KerayeGo sees it, and it is never shown on any profile.</p>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-slate-700">How was {booking.user.name}?</p>
          <div className="flex items-center gap-3">
            <RatingStars value={rating} onChange={setRating} size="lg" />
            <span className="text-sm text-text-muted">{starLabel(rating)}</span>
          </div>
        </div>
        <Textarea
          label="Comment (optional)"
          placeholder="Anything KerayeGo should know about this customer"
          rows={3}
          maxLength={RATING_COMMENT_MAX_LENGTH}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          helper={`${comment.length}/${RATING_COMMENT_MAX_LENGTH}`}
        />
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}
