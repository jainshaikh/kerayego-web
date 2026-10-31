import { cn } from '../../../lib/utils/cn';
import { formatDateTime, statusHistoryItems } from '../../../lib/ops/bookingDisplay';
import type { BookingRequest } from '../../../types/booking-requests.types';
import { SectionCard } from './BookingBits';

// The request's timeline, newest first, with the note sent with each change
// (the customer can read those notes too). Who made a change isn't returned.
export function StatusHistoryCard({ booking }: { booking: Pick<BookingRequest, 'statusHistory' | 'createdAt'> }) {
  const items = statusHistoryItems(booking);
  return (
    <SectionCard title="Status history">
      <ol className="space-y-0">
        {items.map((item, index) => (
          <li key={item.key} className="flex gap-3">
            <div className="flex w-2.5 flex-col items-center">
              <span className={cn('mt-1.5 h-2.5 w-2.5 rounded-full', index === 0 ? 'bg-brand-600' : 'bg-border-strong')} />
              {index < items.length - 1 ? <span className="mt-1 w-0.5 flex-1 bg-border-subtle" /> : null}
            </div>
            <div className={cn('flex-1', index < items.length - 1 && 'pb-3')}>
              <p className="text-sm text-ink">{item.title}</p>
              <p className="text-xs text-text-muted">{formatDateTime(item.at)}</p>
              {item.note ? <p className="mt-0.5 text-sm text-text-muted">“{item.note}”</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
