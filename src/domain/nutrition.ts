import { MEAL_PLAN, PROTEIN_TARGET_G } from '../data/nutrition';
import { fromISODate, parseTime } from '../lib/date';
import type { CircuitAppState, Meal } from '../types';

export { PROTEIN_TARGET_G };

export function mealsOn(date: string): Meal[] {
  return MEAL_PLAN[fromISODate(date).getDay()] ?? [];
}

/** Protein actually logged today, against the daily target. */
export function proteinOn(state: Pick<CircuitAppState, 'loggedMeals'>, date: string): number {
  return mealsOn(date)
    .filter((m) => state.loggedMeals[`${date}-${m.id}`])
    .reduce((n, m) => n + m.protein, 0);
}

export function isMealLogged(
  state: Pick<CircuitAppState, 'loggedMeals'>,
  date: string,
  mealId: string,
): boolean {
  return !!state.loggedMeals[`${date}-${mealId}`];
}

/** The next meal still to come today, by clock time. */
export function nextMeal(
  state: Pick<CircuitAppState, 'loggedMeals'>,
  date: string,
  now: Date,
): Meal | undefined {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return mealsOn(date).find(
    (m) => !isMealLogged(state, date, m.id) && parseTime(m.time) >= minutes,
  );
}

export interface FastState {
  /** Milliseconds elapsed since the fast began. */
  elapsedMs: number;
  targetMs: number;
  /** True once the eating window has opened, or the fast was ended by hand. */
  complete: boolean;
  eatFrom: string;
}

/**
 * The current fast, derived from the configured window rather than tracked
 * as a stopwatch — the phone does not need to be open for a fast to run.
 * No claims are made about what the fast does; it is a clock, not a cure.
 */
export function fastState(
  state: Pick<CircuitAppState, 'fasting' | 'fastBrokenAt'>,
  date: string,
  now: Date,
): FastState {
  const { eatFrom, eatUntil } = state.fasting;
  const startedYesterday = new Date(now);
  startedYesterday.setHours(0, 0, 0, 0);
  const untilMin = parseTime(eatUntil);
  const fromMin = parseTime(eatFrom);

  // The fast begins at eatUntil the previous evening and runs to eatFrom.
  const begin = new Date(startedYesterday);
  begin.setDate(begin.getDate() - 1);
  begin.setMinutes(untilMin);

  const open = new Date(startedYesterday);
  open.setMinutes(fromMin);

  const broken = state.fastBrokenAt[date];
  const end = broken ?? Math.min(now.getTime(), open.getTime());

  return {
    elapsedMs: Math.max(0, end - begin.getTime()),
    targetMs: Math.max(0, open.getTime() - begin.getTime()),
    complete: !!broken || now.getTime() >= open.getTime(),
    eatFrom,
  };
}

/** "12h 42m" */
export function formatFast(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${`${m}`.padStart(2, '0')}m`;
}

/** The fasting window as a ratio label, e.g. "14:10". */
export function fastingRatio(state: Pick<CircuitAppState, 'fasting'>): string {
  const from = parseTime(state.fasting.eatFrom);
  const until = parseTime(state.fasting.eatUntil);
  const eating = Math.round(((until - from + 1440) % 1440) / 60);
  return `${24 - eating}:${eating}`;
}
