import type { CircuitWorkoutDay } from '../types';

/**
 * The starting week — three functional days. This is only a seed: the
 * athlete's live plan lives in the store from first run, and every field
 * here (focus, day, mode, rounds, length, exercises) is editable in Plan.
 */
export const DEFAULT_CIRCUIT_PLAN: CircuitWorkoutDay[] = [
  {
    id: 'day-lower-a',
    weekday: 2, // Tuesday
    focus: 'Glutes + Quads',
    mode: 'functional',
    rounds: 3,
    minutes: 45,
    exerciseIds: [
      'goblet-squat',
      'romanian-deadlift-fn',
      'reverse-lunge',
      'hip-thrust-fn',
      'lateral-band-walk',
      'dead-bug',
    ],
  },
  {
    id: 'day-upper',
    weekday: 4, // Thursday
    focus: 'Shoulders + Back + Arms',
    mode: 'functional',
    rounds: 3,
    minutes: 45,
    exerciseIds: [
      'single-arm-shoulder-press',
      'bent-over-row',
      'lateral-raise-fn',
      'hammer-curl-fn',
      'farmer-carry',
      'plank-fn',
    ],
  },
  {
    id: 'day-lower-b',
    weekday: 6, // Saturday
    focus: 'Glutes + Hamstrings',
    mode: 'functional',
    rounds: 3,
    minutes: 50,
    exerciseIds: [
      'romanian-deadlift-fn',
      'kettlebell-swing',
      'hip-thrust-fn',
      'step-up-fn',
      'walking-lunge-fn',
      'dead-bug',
    ],
  },
];

/** The workout scheduled on `weekday`, if any. */
export function workoutOn(
  plan: CircuitWorkoutDay[],
  weekday: number,
): CircuitWorkoutDay | undefined {
  return plan.find((d) => d.weekday === weekday);
}

/** The next scheduled day strictly after `weekday`, wrapping the week. */
export function nextWorkoutAfter(
  plan: CircuitWorkoutDay[],
  weekday: number,
): CircuitWorkoutDay | undefined {
  const sorted = plan.slice().sort((a, b) => a.weekday - b.weekday);
  return sorted.find((d) => d.weekday > weekday) ?? sorted[0];
}

/** The first weekday with nothing scheduled, starting from Monday. */
export function firstFreeWeekday(plan: CircuitWorkoutDay[]): number {
  const used = new Set(plan.map((d) => d.weekday));
  return [1, 2, 3, 4, 5, 6, 0].find((d) => !used.has(d)) ?? 1;
}
