import { cn } from '../../lib/utils/cn';

// Single frozen status→tone mapping (4321-Drive design system, "Status semantics").
// Wire values (the `status` string this receives) never change — only the label
// and tone below may. Do not add a second status-color map anywhere else; extend
// this one instead (see PROJECT_DESIGN_REFERENCE.md §7.4).
type StatusTone = 'amber' | 'blue' | 'emerald' | 'red' | 'slate' | 'violet' | 'teal';

const TONE_BY_STATUS: Record<string, StatusTone> = {
  pending: 'amber',
  pending_review: 'blue',
  approved: 'emerald',
  rejected: 'red',
  suspended: 'red',
  draft: 'slate',
  archived: 'slate',
  active: 'emerald',
  in_progress: 'violet',
  contacted: 'violet',
  accepted: 'emerald',
  cancelled: 'slate',
  expired: 'slate',
  completed: 'teal',
};

const TONE_STYLES: Record<StatusTone, string> = {
  amber: 'bg-status-amber-bg text-status-amber-fg border-status-amber-border',
  blue: 'bg-status-blue-bg text-status-blue-fg border-status-blue-border',
  emerald: 'bg-status-emerald-bg text-status-emerald-fg border-status-emerald-border',
  red: 'bg-status-red-bg text-status-red-fg border-status-red-border',
  slate: 'bg-status-slate-bg text-status-slate-fg border-status-slate-border',
  violet: 'bg-status-violet-bg text-status-violet-fg border-status-violet-border',
  teal: 'bg-status-teal-bg text-status-teal-fg border-status-teal-border',
};

const LABEL_MAP: Record<string, string> = {
  PENDING: 'Pending',
  PENDING_REVIEW: 'Under Review',
  PENDING_VERIFICATION: 'Unverified',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
  ACTIVE: 'Active',
  IN_PROGRESS: 'In Progress',
  CONTACTED: 'Contacted',
  ACCEPTED: 'Accepted',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
  /** Override the display label in a specific context (e.g. PENDING → "New" in
   * an inbox) while keeping the frozen tone for that status. */
  label?: string;
}

export function StatusBadge({ status, size = 'md', className, label: labelOverride }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const tone = TONE_BY_STATUS[key];
  const styles = tone ? TONE_STYLES[tone] : 'bg-page text-slate-600 border-border-subtle';
  const label = labelOverride ?? LABEL_MAP[status] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold tracking-wide',
        size === 'sm' ? 'px-[9px] py-[3px] text-[11px]' : 'px-[11px] py-[6px] text-xs',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
