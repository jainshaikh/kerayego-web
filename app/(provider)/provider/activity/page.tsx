'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, History, Lock } from 'lucide-react';
import { Button, EmptyState, ErrorState, PillToggle, Select } from '../../../../components/ui';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { useActivityLogActors, useActivityLogInfinite } from '../../../../hooks/useActivityLogs';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import type { ActivityLogEntry } from '../../../../lib/api/activity-logs.api';
import {
  ACTIVITY_CATEGORY_FILTERS,
  activityRowHref,
  actorName,
  actorRoleLabel,
  categoryParam,
  emptyActivityCopy,
  formatActivityTime,
  groupActivityByDay,
  type ActivityCategoryFilter,
} from '../../../../lib/activity/activityDisplay';
import { cn } from '../../../../lib/utils/cn';

// The business activity log — kerayego-partner app/(business)/business/activity.tsx
// (plan A26, A33): what the business admin, managers and drivers did, newest
// first, grouped by day (Asia/Karachi). Business admin only
// (can('viewActivityLogs'), the layout guards it). View only: nothing here
// edits or deletes an entry.

const ROLE_TONE: Record<string, string> = {
  BUSINESS_ADMIN: 'bg-status-violet-bg text-status-violet-fg border-status-violet-border',
  MANAGER: 'bg-status-blue-bg text-status-blue-fg border-status-blue-border',
  DRIVER: 'bg-status-teal-bg text-status-teal-fg border-status-teal-border',
};

function isForbidden(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}

function AdminOnly() {
  return (
    <EmptyState
      icon={Lock}
      title="Only the business admin can see the activity log"
      description="It shows what everyone in the business has done. Ask your business admin if you need something from it."
    />
  );
}

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const name = actorName(entry.actor);
  const role = entry.actor?.role ?? null;
  const roleLabel = actorRoleLabel(role);
  const href = activityRowHref(entry);

  const content = (
    <div className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface px-4 py-3 shadow-xs">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{name}</span>
          {roleLabel && role ? (
            <span
              className={cn(
                'inline-flex items-center whitespace-nowrap rounded-full border px-[9px] py-[2px] text-[11px] font-semibold',
                ROLE_TONE[role],
              )}
            >
              {roleLabel}
            </span>
          ) : null}
          <span className="ml-auto text-xs text-text-muted">{formatActivityTime(entry.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{entry.summary}</p>
      </div>
      {href ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-faint" /> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-shadow hover:shadow-sm">
      {content}
    </Link>
  ) : (
    content
  );
}

export default function ProviderActivityPage() {
  const { can } = useWorkspace();
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Activity log</h1>
        <p className="mt-1 text-sm text-text-muted">
          Everything your team does in the business. Entries can&apos;t be edited or deleted.
        </p>
      </div>
      {can('viewActivityLogs') ? <ActivityLog /> : <AdminOnly />}
    </div>
  );
}

function ActivityLog() {
  const [category, setCategory] = useState<ActivityCategoryFilter>('ALL');
  const [personId, setPersonId] = useState<string>('');
  const actors = useActivityLogActors();
  const person = actors.data?.find((a) => a.id === personId) ?? null;

  const list = useActivityLogInfinite({ category: categoryParam(category), actorUserId: personId || undefined });
  const entries = list.data?.pages.flatMap((page) => page.data) ?? [];
  // "Today" / "Yesterday" are relative to when the list was last loaded.
  const sections = groupActivityByDay(entries, list.dataUpdatedAt || Date.now());
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = list;

  let body: React.ReactNode;
  if (list.isPending) {
    body = (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-surface-hover" />
        ))}
      </div>
    );
  } else if (list.isError && !isFetchNextPageError) {
    // The backend has the final say: a 403 means this person isn't the business admin after all.
    body = isForbidden(list.error) ? (
      <AdminOnly />
    ) : (
      <ErrorState
        title="We couldn't load the activity log"
        description={getApiErrorMessage(list.error, 'Something went wrong while fetching it.')}
        onRetry={() => void list.refetch()}
      />
    );
  } else if (entries.length === 0) {
    const empty = emptyActivityCopy(category, person ? actorName(person) : undefined);
    body = <EmptyState icon={History} title={empty.title} description={empty.description} />;
  } else {
    body = (
      <div className={cn('space-y-5', list.isRefetching && !isFetchingNextPage && 'opacity-60')}>
        {sections.map((section) => (
          <section key={section.key} className="space-y-2">
            <h2 className="sticky top-0 z-[1] bg-page py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {section.title}
            </h2>
            {section.data.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </section>
        ))}
        {isFetchNextPageError ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-xs text-red-700">
              {getApiErrorMessage(list.error, "Couldn't load more entries.")}
            </p>
            <Button size="sm" variant="ghost" onClick={() => void fetchNextPage()}>
              Try again
            </Button>
          </div>
        ) : hasNextPage ? (
          <div className="flex justify-center">
            <Button variant="secondary" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_CATEGORY_FILTERS.map((option) => (
          <PillToggle
            key={option.value}
            active={category === option.value}
            onClick={() => setCategory(option.value)}
            className="px-3 py-1.5 text-xs"
          >
            {option.label}
          </PillToggle>
        ))}
      </div>

      <div className="max-w-xs">
        <Select
          label="Person"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          disabled={actors.isPending || actors.isError}
          helper={
            actors.isError
              ? "Couldn't load the people in the log."
              : 'Current and past team members.'
          }
        >
          <option value="">Everyone</option>
          {(actors.data ?? []).map((actor) => {
            const role = actorRoleLabel(actor.role);
            return (
              <option key={actor.id} value={actor.id}>
                {actorName(actor)}
                {role ? ` · ${role}` : ''}
              </option>
            );
          })}
        </Select>
      </div>

      {body}
    </div>
  );
}
