import { DAY_BY_ID, REMINDER_COPY } from '../data/program';
import { isCompleted } from '../domain/progression';
import { nextSlot, scheduleAround, weekCompletion, currentWeek } from '../domain/schedule';
import type { AppState } from '../types';
import { WEEKDAY_LONG, addDays, fromISODate, parseTime, today as todayISO } from './date';
import { notify } from './notify';

export interface ScheduledReminder {
  at: number;
  tag: string;
  title: string;
  body: string;
}

const atTime = (date: string, time: string): number => {
  const d = fromISODate(date);
  d.setMinutes(parseTime(time));
  return d.getTime();
};

/**
 * Reminders are computed, never stored — so completing a session silently
 * removes its nudge instead of firing a stale one.
 */
export function buildQueue(state: AppState, from = Date.now()): ScheduledReminder[] {
  const { reminders } = state.settings;
  if (!reminders.enabled) return [];
  const now = todayISO();
  const out: ScheduledReminder[] = [];
  const slots = scheduleAround(state.settings.blockStart, state.sessions, now);

  for (const slot of slots) {
    const done = slot.session && isCompleted(slot.session);
    const copyDay = REMINDER_COPY[`day-${slot.day.id}`];
    const copyBefore = REMINDER_COPY[`before-${slot.day.id}`];

    if (reminders.eveningBeforeOn && !done) {
      out.push({
        at: atTime(addDays(slot.date, -1), reminders.eveningBefore),
        tag: `before-${slot.date}`,
        title: copyBefore.title,
        body: copyBefore.body,
      });
    }
    if (reminders.dayOfOn && !done) {
      out.push({
        at: atTime(slot.date, reminders.dayOf),
        tag: `day-${slot.date}`,
        title: copyDay.title,
        body: copyDay.body,
      });
    }
    if (reminders.missedOn && !done) {
      const upcoming = nextSlot(state.settings.blockStart, state.sessions, addDays(slot.date, 1));
      const nextName = upcoming
        ? `${WEEKDAY_LONG[fromISODate(upcoming.date).getDay()]}`
        : 'the next one';
      out.push({
        at: atTime(slot.date, reminders.missedAt),
        tag: `missed-${slot.date}`,
        title: 'Missed today. No drama.',
        body: `Your next session is ${nextName} → ${
          upcoming ? DAY_BY_ID[upcoming.day.id].name : 'coming up'
        }.`,
      });
    }
  }

  if (reminders.weeklyOn) {
    // Sunday wrap-up for the week that just ran.
    for (let i = 0; i <= 7; i += 1) {
      const date = addDays(now, i);
      if (fromISODate(date).getDay() !== 0) continue;
      const week = currentWeek(state.settings.blockStart, date);
      const { done, total } = weekCompletion(week, state.settings.blockStart, state.sessions, date);
      out.push({
        at: atTime(date, reminders.weeklyAt),
        tag: `weekly-${date}`,
        title: `Week ${week} wrapped`,
        body: `${done}/${total} sessions logged. Open Lift for the summary.`,
      });
      break;
    }
  }

  return out.filter((r) => r.at > from).sort((a, b) => a.at - b.at);
}

let timers: number[] = [];

/** Schedules everything inside the horizon; re-run whenever state changes. */
export function scheduleReminders(state: AppState, horizonHours = 14): void {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const horizon = now + horizonHours * 3600_000;
  for (const reminder of buildQueue(state, now)) {
    if (reminder.at > horizon) break;
    timers.push(
      window.setTimeout(() => {
        void notify(reminder.title, reminder.body, reminder.tag);
      }, reminder.at - now),
    );
  }
}
