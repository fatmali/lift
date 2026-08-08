import { BLOCK_WEEKS, DAY_BY_ID, PROGRAM } from '../data/program';
import { addDays, daysBetween, nextWeekday, startOfWeek, today as todayISO } from '../lib/date';
import type { DayId, Session, WorkoutDay } from '../types';
import { isCompleted } from './progression';

/**
 * Week 1 starts on the week containing the next occurrence of the block's
 * first training day. Backdating to the Monday just gone would open the app
 * with sessions already marked missed, which is a poor way to begin.
 */
export function defaultBlockStart(from: string = todayISO()): string {
  const firstTrainingDay = Math.min(...PROGRAM.map((d) => d.weekday));
  return startOfWeek(nextWeekday(firstTrainingDay, from));
}

/** False until the block's first week actually begins. */
export function hasBlockStarted(blockStart: string, date: string = todayISO()): boolean {
  return currentWeek(blockStart, date) >= 1;
}

/** Monday-offset of a day's weekday (Tue = 1, Thu = 3, Sat = 5). */
const mondayOffset = (weekday: number) => (weekday + 6) % 7;

export function blockWeekOf(date: string, blockStart: string): number {
  return Math.floor(daysBetween(startOfWeek(blockStart), startOfWeek(date)) / 7) + 1;
}

export function currentWeek(blockStart: string, date = todayISO()): number {
  return blockWeekOf(date, blockStart);
}

/** Clamped for display; the raw value can run past the block. */
export function displayWeek(blockStart: string, date = todayISO()): number {
  return Math.min(BLOCK_WEEKS, Math.max(1, currentWeek(blockStart, date)));
}

export function weekStartDate(week: number, blockStart: string): string {
  return addDays(startOfWeek(blockStart), (week - 1) * 7);
}

export function dateForDay(week: number, dayId: DayId, blockStart: string): string {
  const day = DAY_BY_ID[dayId];
  return addDays(weekStartDate(week, blockStart), mondayOffset(day.weekday));
}

export interface ScheduledSlot {
  day: WorkoutDay;
  date: string;
  week: number;
  session: Session | null;
  status: 'done' | 'today' | 'upcoming' | 'missed' | 'active';
}

export function weekSchedule(
  week: number,
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): ScheduledSlot[] {
  const start = weekStartDate(week, blockStart);
  const end = addDays(start, 6);
  return PROGRAM.map((day) => {
    const date = dateForDay(week, day.id, blockStart);
    const session =
      sessions.find((s) => s.date === date && s.dayId === day.id) ??
      // Shifting a session to another day of the same week still counts —
      // training Tuesday's workout on Friday is not a missed workout.
      sessions.find(
        (s) => s.dayId === day.id && s.date >= start && s.date <= end && isCompleted(s),
      ) ??
      null;
    let status: ScheduledSlot['status'];
    if (session && isCompleted(session)) status = 'done';
    else if (session) status = 'active';
    else if (date === now) status = 'today';
    else if (date < now) status = 'missed';
    else status = 'upcoming';
    return { day, date, week, session, status };
  });
}

export function scheduleAround(
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): ScheduledSlot[] {
  const week = currentWeek(blockStart, now);
  return [week - 1, week, week + 1]
    .filter((w) => w >= 1 && w <= BLOCK_WEEKS)
    .flatMap((w) => weekSchedule(w, blockStart, sessions, now));
}

export function todaysSlot(
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): ScheduledSlot | null {
  return scheduleAround(blockStart, sessions, now).find((s) => s.date === now) ?? null;
}

export function nextSlot(
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): ScheduledSlot | null {
  const upcoming = scheduleAround(blockStart, sessions, now)
    .filter((s) => s.date > now || (s.date === now && s.status !== 'done'))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  return upcoming[0] ?? null;
}

/** The next session *after* the one on `now` — used on the completion screen. */
export function slotAfter(
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): ScheduledSlot | null {
  return (
    scheduleAround(blockStart, sessions, now)
      .filter((s) => s.date > now)
      .sort((a, b) => (a.date < b.date ? -1 : 1))[0] ?? null
  );
}

export function missedSlots(
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): ScheduledSlot[] {
  return scheduleAround(blockStart, sessions, now).filter((s) => s.status === 'missed');
}

export function weekCompletion(
  week: number,
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): { done: number; total: number } {
  const slots = weekSchedule(week, blockStart, sessions, now);
  return { done: slots.filter((s) => s.status === 'done').length, total: slots.length };
}

/**
 * Consecutive weeks with at least two sessions logged. Two-of-three keeps the
 * streak resilient to real life while still meaning something.
 */
export const STREAK_THRESHOLD = 2;

export function weekStreak(blockStart: string, sessions: Session[], now = todayISO()): number {
  const week = currentWeek(blockStart, now);
  let streak = 0;
  // The in-progress week only extends a streak, it never breaks one.
  const thisWeek = weekCompletion(week, blockStart, sessions, now);
  if (thisWeek.done >= STREAK_THRESHOLD) streak += 1;
  for (let w = week - 1; w >= 1; w -= 1) {
    const { done } = weekCompletion(w, blockStart, sessions, now);
    if (done >= STREAK_THRESHOLD) streak += 1;
    else break;
  }
  return streak;
}

export function sessionsInWeek(week: number, blockStart: string, sessions: Session[]): Session[] {
  const start = weekStartDate(week, blockStart);
  const end = addDays(start, 6);
  return sessions.filter((s) => isCompleted(s) && s.date >= start && s.date <= end);
}

export function adherence(
  blockStart: string,
  sessions: Session[],
  now = todayISO(),
): { done: number; scheduled: number } {
  const week = currentWeek(blockStart, now);
  let scheduled = 0;
  let done = 0;
  for (let w = 1; w <= Math.min(week, BLOCK_WEEKS); w += 1) {
    for (const slot of weekSchedule(w, blockStart, sessions, now)) {
      if (slot.date > now) continue;
      scheduled += 1;
      if (slot.status === 'done') done += 1;
    }
  }
  return { done, scheduled };
}
