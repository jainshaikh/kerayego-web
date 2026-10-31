'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminProviderActivityLogs, useDeleteBusinessActivityLog } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import type {
  ActivityLogActorRole,
  ActivityLogCategory,
  ActivityLogEntry,
} from '../../lib/api/admin.api';
import { cn } from '../../lib/utils/cn';
import { Button, Card, PillToggle } from '../ui';

// What the business's own people (business admin, managers, drivers) did —
// not KerayeGo admin actions, which live in the admin audit log. Business
// admins can only view their log and nobody can edit an entry; a SUPER_ADMIN
// can delete one (A45), and that deletion is itself recorded permanently.

const PAGE_SIZE = 30;
const MIN_REASON = 5; // DeleteItemDto: @MinLength(5)
const MAX_REASON = 500; // DeleteItemDto: @MaxLength(500)

const ROLE_LABEL: Record<ActivityLogActorRole, string> = {
  BUSINESS_ADMIN: 'Business admin',
  MANAGER: 'Manager',
  DRIVER: 'Driver',
};

const ROLE_TONE: Record<ActivityLogActorRole, string> = {
  BUSINESS_ADMIN: 'bg-status-violet-bg text-status-violet-fg border-status-violet-border',
  MANAGER: 'bg-status-blue-bg text-status-blue-fg border-status-blue-border',
  DRIVER: 'bg-status-teal-bg text-status-teal-fg border-status-teal-border',
};

const CATEGORIES: Array<{ value: ActivityLogCategory; label: string; tone: string }> = [
  { value: 'BOOKINGS', label: 'Bookings', tone: 'bg-status-blue-bg text-status-blue-fg border-status-blue-border' },
  { value: 'JOBS', label: 'Jobs', tone: 'bg-status-emerald-bg text-status-emerald-fg border-status-emerald-border' },
  { value: 'FLEET', label: 'Fleet', tone: 'bg-status-amber-bg text-status-amber-fg border-status-amber-border' },
  { value: 'TEAM', label: 'Team', tone: 'bg-status-violet-bg text-status-violet-fg border-status-violet-border' },
  { value: 'BUSINESS', label: 'Business', tone: 'bg-status-slate-bg text-status-slate-fg border-status-slate-border' },
];

const pill =
  'inline-flex items-center whitespace-nowrap rounded-full border px-[9px] py-[3px] text-[11px] font-semibold tracking-wide';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
}

function CategoryTag({ category }: { category: ActivityLogCategory }) {
  const c = CATEGORIES.find((x) => x.value === category);
  return <span className={cn(pill, c?.tone ?? CATEGORIES[4].tone)}>{c?.label ?? category}</span>;
}

function Actor({ actor }: { actor: ActivityLogEntry['actor'] }) {
  if (!actor) return <span className="italic text-text-muted">System</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="font-medium text-ink">{actor.name}</span>
      {actor.role && <span className={cn(pill, ROLE_TONE[actor.role])}>{ROLE_LABEL[actor.role]}</span>}
    </span>
  );
}

interface BusinessActivityCardProps {
  providerId: string;
  /** The summary's latest entries; undefined while the summary loads or if it failed. */
  recentActivity: ActivityLogEntry[] | undefined;
  recentLoading: boolean;
  recentError: boolean;
}

export function BusinessActivityCard({ providerId, recentActivity, recentLoading, recentError }: BusinessActivityCardProps) {
  const { isSuperAdmin } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<ActivityLogCategory | undefined>(undefined);
  const [deleting, setDeleting] = useState<ActivityLogEntry | null>(null);
  const [reason, setReason] = useState('');

  const all = useAdminProviderActivityLogs(providerId, { page, limit: PAGE_SIZE, category }, showAll);
  const deleteEntry = useDeleteBusinessActivityLog();

  const totalPages = all.data?.meta.totalPages ?? 0;
  // A deletion can empty the last page — step back to the new last page.
  useEffect(() => {
    if (showAll && totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [showAll, totalPages, page]);

  const entries = showAll ? all.data?.data : recentActivity;
  const loading = showAll ? all.isLoading : recentLoading;
  const failed = showAll ? all.isError : recentError;

  const pickCategory = (value: ActivityLogCategory | undefined) => {
    setCategory(value);
    setPage(1);
  };

  const openDelete = (entry: ActivityLogEntry) => {
    setReason('');
    setDeleting(entry);
  };

  const confirmDelete = async () => {
    if (!deleting || reason.trim().length < MIN_REASON) return;
    try {
      await deleteEntry.mutateAsync({ id: deleting.id, reason: reason.trim() });
    } catch {
      return; // toasted by the hook; keep the modal open
    }
    setDeleting(null);
  };

  const emptyText =
    showAll && category
      ? `No ${CATEGORIES.find((c) => c.value === category)?.label.toLowerCase()} activity for this business.`
      : 'No activity recorded for this business yet.';

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Business activity</h2>
          <p className="mt-1 text-xs text-text-muted">
            What this business&rsquo;s admins, managers and drivers did. {showAll ? 'Newest first.' : 'Latest entries.'}
          </p>
        </div>
        {showAll ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowAll(false);
              pickCategory(undefined);
            }}
          >
            Show latest only
          </Button>
        ) : (
          (recentActivity?.length ?? 0) > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setShowAll(true)}>
              Show all
            </Button>
          )
        )}
      </div>

      {showAll && (
        <div className="mb-4 flex flex-wrap gap-2">
          <PillToggle active={!category} onClick={() => pickCategory(undefined)} className="px-3 py-1.5 text-xs">
            All
          </PillToggle>
          {CATEGORIES.map((c) => (
            <PillToggle
              key={c.value}
              active={category === c.value}
              onClick={() => pickCategory(c.value)}
              className="px-3 py-1.5 text-xs"
            >
              {c.label}
            </PillToggle>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-control bg-surface-hover" />
          ))}
        </div>
      ) : failed ? (
        <p className="py-6 text-center text-sm text-text-muted">Couldn&rsquo;t load the activity log.</p>
      ) : !entries || entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">{emptyText}</p>
      ) : (
        <div className={cn('overflow-x-auto', showAll && all.isFetching && 'opacity-60')}>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-subtle font-medium uppercase text-text-faint">
              <tr>
                <th className="pb-2 pr-4">When</th>
                <th className="pb-2 pr-4">Who</th>
                <th className="pb-2 pr-4">What</th>
                <th className="pb-2 pr-4">Category</th>
                {isSuperAdmin && <th className="pb-2 text-right">Delete</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {entries.map((entry) => (
                <tr key={entry.id} className="align-top text-ink">
                  <td className="whitespace-nowrap py-2.5 pr-4 text-text-muted">{formatWhen(entry.createdAt)}</td>
                  <td className="py-2.5 pr-4">
                    <Actor actor={entry.actor} />
                  </td>
                  <td className="min-w-[220px] py-2.5 pr-4 leading-relaxed">{entry.summary}</td>
                  <td className="py-2.5 pr-4">
                    <CategoryTag category={entry.category} />
                  </td>
                  {isSuperAdmin && (
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openDelete(entry)}
                        aria-label="Delete entry"
                        title="Delete entry"
                        className="rounded-control p-1.5 text-text-faint transition-colors hover:bg-status-red-bg hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAll && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <Button size="sm" variant="secondary" disabled={page <= 1 || all.isFetching} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages} · {all.data?.meta.total.toLocaleString()} entries
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages || all.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete entry modal (SUPER_ADMIN only) */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setDeleting(null)}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDeleting(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ×
            </button>
            <h2 className="mb-1 pr-8 text-lg font-semibold text-slate-900">Delete activity entry</h2>
            <p className="mb-3 text-sm text-slate-500">
              <strong className="text-slate-700">{deleting.actor?.name ?? 'System'}</strong> {deleting.summary}
              <span className="block text-xs text-slate-400">{formatWhen(deleting.createdAt)}</span>
            </p>
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The entry is removed from the business&rsquo;s activity log. The deletion, your reason and a copy of the
              entry are recorded permanently in the KerayeGo audit log, which nobody can delete.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={MAX_REASON}
                placeholder="Why is this entry being deleted?"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {reason.trim().length < MIN_REASON && (
                <p className="mt-1 text-xs text-red-500">At least {MIN_REASON} characters</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteEntry.isPending || reason.trim().length < MIN_REASON}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteEntry.isPending ? 'Deleting…' : 'Delete entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
