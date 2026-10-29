'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useMyEligibleReviews, useCreateReview } from '../../hooks/useReviews';
import type {
  EligibleBooking,
  EligibleTrip,
  ReviewContext,
  ReviewSubjectType,
} from '../../lib/api/reviews.api';
import { Button, Card, EmptyState, Modal, RatingStars, Textarea } from '../ui';

interface RateTarget {
  subjectType: ReviewSubjectType;
  subjectId: string;
  label: string;
}

// After a rental the customer rates the car and, when the booking had an
// assigned driver, that driver — never the business (A18, A24). Mirrors
// reviews.service.ts createForBooking()'s allowed entries for a customer.
function rentalTargets(b: EligibleBooking): RateTarget[] {
  const targets: RateTarget[] = [];
  if (b.vehicle) targets.push({ subjectType: 'VEHICLE', subjectId: b.vehicle.id, label: 'The car' });
  if (b.assignedDriverId) {
    const name = b.assignedDriver?.driverProfile?.fullName ?? b.assignedDriver?.name;
    targets.push({
      subjectType: 'USER',
      subjectId: b.assignedDriverId,
      label: name ? `The driver (${name})` : 'The driver',
    });
  }
  return targets;
}

// A rider rates the car and the driver. A normal trip's car is the poster's own
// (USER_VEHICLE); a return trip runs in a business's fleet car (VEHICLE) — A48.
// Mirrors reviews.service.ts createForTrip()'s allowed entries for a rider.
function riderTripTargets(t: EligibleTrip): RateTarget[] {
  const targets: RateTarget[] = [];
  if (t.trip.isReturnTrip && t.trip.fleetVehicleId) {
    targets.push({ subjectType: 'VEHICLE', subjectId: t.trip.fleetVehicleId, label: 'The car' });
  } else if (t.trip.userVehicleId) {
    targets.push({ subjectType: 'USER_VEHICLE', subjectId: t.trip.userVehicleId, label: 'The car' });
  }
  if (t.trip.postedByUserId) {
    targets.push({ subjectType: 'USER', subjectId: t.trip.postedByUserId, label: 'The driver' });
  }
  return targets;
}

interface PendingRating {
  context: ReviewContext;
  contextId: string;
  title: string;
  targets: RateTarget[];
}

function RateModal({ pending, onClose }: { pending: PendingRating | null; onClose: () => void }) {
  const createReview = useCreateReview();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  if (!pending) return null;

  const allRated = pending.targets.every((t) => (ratings[t.subjectId] ?? 0) > 0);

  const handleSubmit = async () => {
    const entries = pending.targets.map((t) => ({
      subjectType: t.subjectType,
      subjectId: t.subjectId,
      rating: ratings[t.subjectId] ?? 0,
      comment: comments[t.subjectId]?.trim() || undefined,
    }));
    try {
      await createReview.mutateAsync({ context: pending.context, contextId: pending.contextId, entries });
    } catch {
      return; // useCreateReview already toasts the backend's message
    }
    setRatings({});
    setComments({});
    onClose();
  };

  return (
    <Modal open={!!pending} onOpenChange={(open) => !open && onClose()} title={pending.title}>
      <div className="space-y-5">
        {pending.targets.map((t) => (
          <div key={t.subjectId}>
            <p className="mb-1.5 text-sm font-medium text-ink">{t.label}</p>
            <RatingStars
              value={ratings[t.subjectId] ?? 0}
              onChange={(v) => setRatings((r) => ({ ...r, [t.subjectId]: v }))}
            />
            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Add a comment (optional)"
              value={comments[t.subjectId] ?? ''}
              onChange={(e) => setComments((c) => ({ ...c, [t.subjectId]: e.target.value }))}
            />
          </div>
        ))}
        <Button
          className="w-full"
          disabled={!allRated || createReview.isPending}
          loading={createReview.isPending}
          onClick={handleSubmit}
        >
          Submit rating
        </Button>
      </div>
    </Modal>
  );
}

// Shared by both the customer dashboard and the provider portal — the same
// person can be a customer on one ride and a provider/driver on another, so
// both roles' pending ratings are shown together, exactly like the trips feature.
export function EligibleReviewsList() {
  const { data, isLoading } = useMyEligibleReviews();
  const [pending, setPending] = useState<PendingRating | null>(null);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-card border border-border-subtle bg-surface" />;
  }

  const hasAny =
    data &&
    (data.bookingsAsCustomer.length > 0 ||
      data.bookingsAsProvider.length > 0 ||
      data.tripsAsRider.length > 0 ||
      data.tripsAsDriver.length > 0);

  if (!hasAny) {
    return (
      <EmptyState
        icon={Star}
        title="Nothing to rate right now"
        description="Completed rentals and departed trips you haven't rated yet will show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {data!.bookingsAsCustomer.length > 0 && (
        <Section title="Rentals you can rate">
          {data!.bookingsAsCustomer.map((b) => (
            <Row
              key={b.id}
              label={b.vehicle?.title ?? 'Vehicle rental'}
              onRate={() =>
                setPending({
                  context: 'BOOKING_REQUEST',
                  contextId: b.id,
                  title: `Rate: ${b.vehicle?.title ?? 'your rental'}`,
                  targets: rentalTargets(b),
                })
              }
            />
          ))}
        </Section>
      )}

      {data!.bookingsAsProvider.length > 0 && (
        <Section title="Customers you can rate" note="Private — never shown publicly">
          {data!.bookingsAsProvider.map((b) => (
            <Row
              key={b.id}
              label={b.user?.name ?? 'Customer'}
              onRate={() =>
                setPending({
                  context: 'BOOKING_REQUEST',
                  contextId: b.id,
                  title: `Rate customer: ${b.user?.name ?? ''}`,
                  targets: [{ subjectType: 'USER', subjectId: b.user!.id, label: 'The customer' }],
                })
              }
            />
          ))}
        </Section>
      )}

      {data!.tripsAsRider.length > 0 && (
        <Section title="Trips you can rate">
          {data!.tripsAsRider.map((t) => (
            <Row
              key={t.id}
              label={`${t.trip.originCity} → ${t.trip.destinationCity}`}
              onRate={() =>
                setPending({
                  context: 'TRIP_INQUIRY',
                  contextId: t.id,
                  title: `Rate your trip: ${t.trip.originCity} → ${t.trip.destinationCity}`,
                  targets: riderTripTargets(t),
                })
              }
            />
          ))}
        </Section>
      )}

      {data!.tripsAsDriver.length > 0 && (
        <Section title="Riders you can rate" note="Private — never shown publicly">
          {data!.tripsAsDriver.map((t) => (
            <Row
              key={t.id}
              label={t.user?.name ?? 'Rider'}
              onRate={() =>
                setPending({
                  context: 'TRIP_INQUIRY',
                  contextId: t.id,
                  title: `Rate rider: ${t.user?.name ?? ''}`,
                  targets: [{ subjectType: 'USER', subjectId: t.user!.id, label: 'The rider' }],
                })
              }
            />
          ))}
        </Section>
      )}

      <RateModal pending={pending} onClose={() => setPending(null)} />
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {note && <span className="text-xs text-text-faint">{note}</span>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, onRate }: { label: string; onRate: () => void }) {
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <span className="truncate text-sm font-medium text-ink">{label}</span>
      <Button size="sm" variant="secondary" onClick={onRate}>
        Rate
      </Button>
    </Card>
  );
}
