import type { ActivityActor, ActivityLogCategory, ActivityLogEntry } from '../api/activity-logs.api';
import { BUSINESS_ROLE_LABELS } from '../team/teamGroups';
import { BusinessRole } from '../../types/enums';

// Pure display helpers for the business activity log page
// (/provider/activity) — kerayego-partner features/activity-logs/activityDisplay.ts.

/** A chip: every entry, or one category (the `category` query value). */
export type ActivityCategoryFilter = 'ALL' | ActivityLogCategory;

export const ACTIVITY_CATEGORY_FILTERS: readonly { value: ActivityCategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'BOOKINGS', label: 'Bookings' },
  { value: 'JOBS', label: 'Jobs' },
  { value: 'FLEET', label: 'Fleet' },
  { value: 'TEAM', label: 'Team' },
  { value: 'BUSINESS', label: 'Business' },
];

export function categoryParam(filter: ActivityCategoryFilter): ActivityLogCategory | undefined {
  return filter === 'ALL' ? undefined : filter;
}

/** What the list says when nothing matches the filters. */
export function emptyActivityCopy(
  filter: ActivityCategoryFilter,
  personName?: string,
): { title: string; description: string } {
  if (filter === 'ALL' && !personName) {
    return {
      title: 'No activity yet',
      description: 'What you, your managers and your drivers do in the business will show up here.',
    };
  }
  return {
    title: 'Nothing here',
    description: personName
      ? `No matching activity by ${personName}. Try another person or category.`
      : 'No activity in this category yet.',
  };
}

/** Shown when the backend sends no actor (an entry the system wrote). */
export const SYSTEM_ACTOR_NAME = 'KerayeGo';

export function actorName(actor: Pick<ActivityActor, 'name'> | null): string {
  return actor?.name?.trim() || SYSTEM_ACTOR_NAME;
}

/** "Business admin", "Manager" or "Driver" — never a bare "Admin". Null for an unknown role. */
export function actorRoleLabel(role: string | null | undefined): string | null {
  if (!role || !(Object.values(BusinessRole) as string[]).includes(role)) return null;
  return BUSINESS_ROLE_LABELS[role as BusinessRole];
}

/**
 * The page a row opens: a BOOKING its booking, a VEHICLE its car; anything
 * else none (not a link).
 */
export function activityRowHref(entry: Pick<ActivityLogEntry, 'entityType' | 'entityId'>): string | null {
  if (!entry.entityId) return null;
  if (entry.entityType === 'BOOKING') return `/provider/inquiries/${entry.entityId}`;
  if (entry.entityType === 'VEHICLE') return `/provider/vehicles/${entry.entityId}/edit`;
  return null;
}

// ─── Dates in Asia/Karachi ──────────────────────────────────────────────────
// Pakistan is a fixed UTC+5 with no daylight saving, so the business's day is
// a plain offset — the same answer in every browser time zone. These match the
// backend's summaries ("5 Nov 2026").

const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function karachiClock(time: string | number | Date): Date {
  return new Date(new Date(time).getTime() + KARACHI_OFFSET_MS);
}

/** "2026-11-05" — the Karachi calendar day of an instant. */
export function karachiDayKey(time: string | number | Date): string {
  return karachiClock(time).toISOString().slice(0, 10);
}

/** A day heading: "Today", "Yesterday", or "5 Nov 2026". */
export function activityDayLabel(dayKey: string, now: number | Date): string {
  if (dayKey === karachiDayKey(now)) return 'Today';
  if (dayKey === karachiDayKey(new Date(now).getTime() - DAY_MS)) return 'Yesterday';
  const [year, month, day] = dayKey.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** The time on a row, Karachi clock: "9:05 AM". */
export function formatActivityTime(time: string | number | Date): string {
  const clock = karachiClock(time);
  const hours = clock.getUTCHours();
  const minutes = String(clock.getUTCMinutes()).padStart(2, '0');
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

export interface ActivityDaySection<T> {
  key: string;
  title: string;
  data: T[];
}

/** One section per Karachi day, keeping the backend's newest-first order across loaded pages. */
export function groupActivityByDay<T extends Pick<ActivityLogEntry, 'createdAt'>>(
  entries: readonly T[],
  now: number | Date,
): ActivityDaySection<T>[] {
  const sections: ActivityDaySection<T>[] = [];
  const byKey = new Map<string, ActivityDaySection<T>>();
  for (const entry of entries) {
    const key = karachiDayKey(entry.createdAt);
    let section = byKey.get(key);
    if (!section) {
      section = { key, title: activityDayLabel(key, now), data: [] };
      byKey.set(key, section);
      sections.push(section);
    }
    section.data.push(entry);
  }
  return sections;
}
