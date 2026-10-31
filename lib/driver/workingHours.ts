import type { DriverWorkingHours, WeekdayKey } from '../../types/driver.types';

// The driver's working days and hours (step 5) — a port of kerayego-partner's
// features/driver/setup/workingHours.ts. The contract's `workingHours` is
// { mon … sun: { start: 'HH:mm', end: 'HH:mm' } | null } (null = day off) —
// GET always has all seven days and PATCH replaces the whole week. An end
// before the start is a shift past midnight, so only equal times are refused.

export const WEEKDAYS: readonly WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_NAMES: Record<WeekdayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export interface WorkingDayDraft {
  working: boolean;
  start: string;
  end: string;
}

export type WorkingWeekDraft = Record<WeekdayKey, WorkingDayDraft>;

/** The hours a day gets when first turned on: 9 AM to 6 PM. */
export const DEFAULT_WORKING_DAY = { start: '09:00', end: '18:00' } as const;

export function isTimeOfDay(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** "9:00 AM". */
export function formatTimeOfDay(time: string): string {
  if (!isTimeOfDay(time)) return time;
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function workingWeekFromApi(hours: DriverWorkingHours | null | undefined): WorkingWeekDraft {
  const week = {} as WorkingWeekDraft;
  for (const day of WEEKDAYS) {
    const saved = hours?.[day];
    week[day] = saved
      ? { working: true, start: saved.start, end: saved.end }
      : { working: false, ...DEFAULT_WORKING_DAY };
  }
  return week;
}

export function workingWeekToApi(week: WorkingWeekDraft): DriverWorkingHours {
  const hours = {} as DriverWorkingHours;
  for (const day of WEEKDAYS) {
    const draft = week[day];
    hours[day] = draft.working ? { start: draft.start, end: draft.end } : null;
  }
  return hours;
}

export function workingDayError(day: WorkingDayDraft): string | null {
  if (!day.working) return null;
  if (!isTimeOfDay(day.start) || !isTimeOfDay(day.end)) return 'Choose a start and an end time.';
  if (day.start === day.end) return 'The end time must be different from the start time.';
  return null;
}

/** Copies one day's hours to every working day. */
export function withSameHoursEveryDay(week: WorkingWeekDraft, from: WeekdayKey): WorkingWeekDraft {
  const { start, end } = week[from];
  const next = { ...week };
  for (const day of WEEKDAYS) if (next[day].working) next[day] = { ...next[day], start, end };
  return next;
}

/** "9:00 AM – 6:00 PM", "8:00 PM – 4:00 AM (next day)". */
export function workingDaySummary(day: WorkingDayDraft): string {
  if (!day.working) return 'Day off';
  const overnight = day.end < day.start ? ' (next day)' : '';
  return `${formatTimeOfDay(day.start)} – ${formatTimeOfDay(day.end)}${overnight}`;
}
