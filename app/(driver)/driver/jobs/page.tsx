'use client';

import { useState } from 'react';
import { Briefcase, CalendarDays, Car, Loader2, MapPin, Smartphone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, EmptyState, ErrorState } from '../../../../components/ui';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { RateCustomerModal } from '../../../../components/driver/RateCustomerModal';
import { ReturnTripModal } from '../../../../components/driver/ReturnTripModal';
import { useDriverActionError } from '../../../../hooks/useDriverProfile';
import { useDriverEligibleReviews, useMyDriverJobs, useRespondToDriverJob } from '../../../../hooks/useDriverJobs';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import { formatDate, formatDateTime } from '../../../../lib/driver/fields';
import {
  findPendingCustomerRating,
  JOB_ANSWER_LABELS,
  JOB_STATUS_LABELS,
  jobState,
} from '../../../../lib/driver/jobs';
import type { DriverAssignedJob, RateableBooking } from '../../../../types/driver.types';

const PARTNER_APP_NOTE =
  'Start and end jobs in the KerayeGo Partner app on your phone. Your location is shared with the business only from the app while a job is in progress.';

// The driver's assigned jobs (kerayego-partner app/(driver)/(tabs)/driver/jobs.tsx):
// Accept / Decline a job a business assigned (Decline works even while the
// account is on hold; Accept is refused with the hold message), the job's
// customer, car, dates and pickup, its state as text, "Rate customer" for a
// completed job whose customer is unrated, and "Post return trip" for a
// completed one-way job. No Start/End, "Picked up customer", live location or
// customer location here — the on-trip session is in the Partner app only.
export default function DriverJobsPage() {
  const jobsQuery = useMyDriverJobs();
  const eligibleQuery = useDriverEligibleReviews();
  const respondJob = useRespondToDriverJob();
  const showActionError = useDriverActionError();
  const [returnBookingId, setReturnBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState<RateableBooking | null>(null);

  const respond = (job: DriverAssignedJob, response: 'ACCEPT' | 'DECLINE') => {
    respondJob.mutate(
      { bookingId: job.id, response },
      {
        onSuccess: () =>
          toast.success(response === 'ACCEPT' ? 'Job accepted' : 'Job declined', {
            description:
              response === 'ACCEPT'
                ? 'You are assigned to this rental job.'
                : 'The business has been notified to assign another driver.',
          }),
        onError: (err) => showActionError(err, 'Action failed'),
      },
    );
  };

  const jobs = jobsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Jobs</h1>
        <p className="mt-1 text-sm text-text-muted">Rental jobs businesses have assigned to you.</p>
      </div>

      <div className="mb-5 flex gap-3 rounded-card border border-status-blue-border bg-status-blue-bg p-4 text-sm text-status-blue-fg">
        <Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>{PARTNER_APP_NOTE}</p>
      </div>

      {jobsQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
        </div>
      ) : jobsQuery.isError ? (
        <ErrorState
          title="We couldn't load your jobs"
          description={getApiErrorMessage(jobsQuery.error, 'Something went wrong while loading this page.')}
          onRetry={() => void jobsQuery.refetch()}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No assigned jobs"
          description="When a rental business assigns you to a booking, it will appear here for you to accept or decline."
        />
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => {
            const state = jobState(job);
            // Until the customer is rated (then the backend drops it from the list).
            const pendingRating = state.isCompleted ? findPendingCustomerRating(eligibleQuery.data, job.id) : null;
            const answer = job.driverJobStatus && job.driverJobStatus !== 'ACCEPTED' ? job.driverJobStatus : null;
            const responding = respondJob.isPending && respondJob.variables?.bookingId === job.id;
            const route = job.isOneWay && job.dropoffCity ? `${job.pickupCity ?? ''} → ${job.dropoffCity}` : null;

            return (
              <li key={job.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-ink">{job.vehicle.title}</h2>
                      <p className="mt-0.5 text-[13px] text-text-muted">Business: {job.providerProfile.businessName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status] ?? job.status} size="sm" />
                      {answer ? (
                        <StatusBadge
                          status={answer === 'PENDING' ? 'PENDING' : 'DECLINED'}
                          label={JOB_ANSWER_LABELS[answer]}
                          size="sm"
                        />
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                    <Detail icon={UserRound} label="Customer">
                      {job.user.name} ({job.user.phone || 'No phone'})
                    </Detail>
                    <Detail icon={Car} label="Car">
                      {job.vehicle.make} {job.vehicle.model} {job.vehicle.year}
                    </Detail>
                    <Detail icon={CalendarDays} label="Pickup">
                      {formatDate(job.requestedFromDate)}
                    </Detail>
                    <Detail icon={CalendarDays} label="Return">
                      {formatDate(job.requestedToDate)}
                    </Detail>
                    {job.pickupLocation ? (
                      <Detail icon={MapPin} label="Location">
                        {job.pickupLocation}
                      </Detail>
                    ) : null}
                    {route ? (
                      <Detail icon={MapPin} label="One way">
                        {route}
                        {job.dropoffLocation ? ` (${job.dropoffLocation})` : ''}
                      </Detail>
                    ) : null}
                  </dl>

                  {state.isInProgress ? (
                    <p className="mt-4 text-sm font-medium text-status-violet-fg">
                      In progress{job.startedAt ? ` since ${formatDateTime(job.startedAt)}` : ''}. End the job in the
                      KerayeGo Partner app.
                    </p>
                  ) : null}
                  {state.isCompleted ? (
                    <p className="mt-4 text-sm font-medium text-status-teal-fg">
                      Completed{job.completedAt ? ` ${formatDateTime(job.completedAt)}` : ''}.
                    </p>
                  ) : null}
                  {state.awaitingStart ? (
                    <p className="mt-4 flex gap-2 text-[13px] text-text-muted">
                      <Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      {PARTNER_APP_NOTE}
                    </p>
                  ) : null}

                  {state.isPendingResponse || pendingRating || state.canPostReturnTrip ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border-subtle pt-4">
                      {state.isPendingResponse ? (
                        <>
                          <Button
                            size="sm"
                            loading={responding && respondJob.variables?.response === 'ACCEPT'}
                            disabled={respondJob.isPending}
                            onClick={() => respond(job, 'ACCEPT')}
                          >
                            Accept job
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={responding && respondJob.variables?.response === 'DECLINE'}
                            disabled={respondJob.isPending}
                            onClick={() => respond(job, 'DECLINE')}
                          >
                            Decline
                          </Button>
                        </>
                      ) : null}
                      {pendingRating ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label={`Rate ${pendingRating.user.name}`}
                          onClick={() => setRating(pendingRating)}
                        >
                          Rate customer
                        </Button>
                      ) : null}
                      {state.canPostReturnTrip ? (
                        <Button size="sm" variant="secondary" onClick={() => setReturnBookingId(job.id)}>
                          Post return trip
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ReturnTripModal bookingId={returnBookingId} onClose={() => setReturnBookingId(null)} />
      {rating ? <RateCustomerModal key={rating.id} booking={rating} onClose={() => setRating(null)} /> : null}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Car;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-2">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
      <div className="min-w-0">
        <dt className="text-[12px] font-medium uppercase tracking-wide text-text-faint">{label}</dt>
        <dd className="text-ink">{children}</dd>
      </div>
    </div>
  );
}
