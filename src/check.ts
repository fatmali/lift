// Quick domain checks (node --experimental-strip-types check.ts)
import { setsForWeek, phaseForWeek } from './data/program.ts';
import { weekSchedule, weekStreak, weekCompletion } from './domain/schedule.ts';
import {
  readyToProgress,
  prsForSession,
  e1rm,
  setVolume,
  loadDecision,
} from './domain/progression.ts';
import { getExercise } from './data/exercises.ts';
import type { ExerciseEntry, Session } from './types.ts';

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
};

const entry = (
  exerciseId: string,
  targetSets: number,
  repMin: number,
  repMax: number,
  sets: [number, number][],
): ExerciseEntry => ({
  slotId: 'a1',
  exerciseId,
  targetSets,
  repMin,
  repMax,
  sets: sets.map(([weight, reps], i) => ({
    id: `s${i}`,
    weight,
    reps,
    rir: null,
    completedAt: 1,
  })),
});

const session = (id: string, date: string, week: number, entries: ExerciseEntry[]): Session => ({
  id,
  dayId: 'lowerA',
  week,
  date,
  startedAt: 1,
  finishedAt: 2,
  entries,
});

// ── Deload ─────────────────────────────────────────────────────────────────
check('week 1 keeps 4 sets', setsForWeek(4, 1), 4);
check('week 12 deloads 4 sets to 2', setsForWeek(4, 12), 2);
check('week 12 is the deload phase', phaseForWeek(12).deload, true);
check('week 5 is intensification', phaseForWeek(5).name, 'Intensification');

// ── Double progression ─────────────────────────────────────────────────────
const topped = entry('hip-thrust', 4, 8, 10, [
  [50, 10],
  [50, 10],
  [50, 10],
  [50, 10],
]);
check('all sets at top of range flags progression', readyToProgress(topped, '2026-08-11')?.suggested, 52.5);

const notTopped = entry('hip-thrust', 4, 8, 10, [
  [50, 10],
  [50, 10],
  [50, 9],
  [50, 8],
]);
check('one short set does not flag', readyToProgress(notTopped, '2026-08-11'), null);

const mixedWeights = entry('hip-thrust', 4, 8, 10, [
  [50, 10],
  [52.5, 10],
  [50, 10],
  [50, 10],
]);
check('mixed loads do not flag', readyToProgress(mixedWeights, '2026-08-11'), null);

const incomplete = entry('hip-thrust', 4, 8, 10, [
  [50, 10],
  [50, 10],
]);
check('unfinished exercise does not flag', readyToProgress(incomplete, '2026-08-11'), null);

// Assisted pull-up progresses by *removing* assistance.
const assisted = entry('assisted-pull-up', 3, 8, 10, [
  [20, 10],
  [20, 10],
  [20, 10],
]);
check('assisted lift suggests less assistance', readyToProgress(assisted, '2026-08-11')?.suggested, 17.5);

// ── PRs ────────────────────────────────────────────────────────────────────
const w1 = session('s1', '2026-08-11', 1, [
  entry('hip-thrust', 4, 8, 10, [
    [50, 10],
    [50, 9],
    [50, 8],
    [50, 8],
  ]),
]);
const w2 = session('s2', '2026-08-18', 2, [
  entry('hip-thrust', 4, 8, 10, [
    [55, 10],
    [55, 10],
    [55, 10],
    [55, 10],
  ]),
]);
check('first session sets no PRs', prsForSession(w1, [w1], 'kg').length, 0);
const kinds = prsForSession(w2, [w1, w2], 'kg').map((p) => p.kind);
check('second session records weight PR', kinds.includes('weight'), true);
check('second session records volume PR', kinds.includes('volume'), true);

// ── The load decision ──────────────────────────────────────────────────────
const hist = (sets: [number, number][], targetSets = 4) => ({
  session: session('h', '2026-08-11', 1, []),
  entry: entry('hip-thrust', targetSets, 8, 10, sets),
});
const today = entry('hip-thrust', 4, 8, 10, []);

const flat = loadDecision(today, hist([[50, 10], [50, 10], [50, 10], [50, 10]]), undefined, 'kg');
check('topping the range offers a jump and a hold', flat?.options.map((o) => o.id), ['jump', 'hold']);
check('the jump is one equipment increment', flat?.options[0].weight, 52.5);
check('the jump is what is suggested', flat?.options[0].recommended, true);
check('nothing is applied until chosen', flat?.options[1].weight, 50);

const tired = loadDecision(
  today,
  hist([[50, 10], [50, 10], [50, 10], [50, 10]]),
  { energy: 'low', soreness: 'medium' },
  'kg',
);
check('turning up flat suggests holding instead', tired?.options.find((o) => o.recommended)?.id, 'hold');

const mid = loadDecision(today, hist([[50, 10], [50, 9], [50, 8], [50, 8]]), undefined, 'kg');
check('a normal session asks nothing at all', mid, null);

const heavy = loadDecision(today, hist([[60, 7], [60, 6], [60, 5], [60, 5]]), undefined, 'kg');
check('falling short suggests backing off', heavy?.options[0].id, 'backoff');
check('the back-off is one increment down', heavy?.options[0].weight, 57.5);

check('a first session asks for a starting weight',
  loadDecision(entry('back-squat', 4, 6, 8, []), null, undefined, 'kg')?.options[0].id, 'start');

const assistedChoice = loadDecision(
  entry('assisted-pull-up', 3, 8, 10, []),
  { session: session('h2', '2026-08-11', 1, []), entry: entry('assisted-pull-up', 3, 8, 10, [[20, 10], [20, 10], [20, 10]]) },
  undefined,
  'kg',
);
check('progress on an assisted lift removes assistance', assistedChoice?.options[0].weight, 17.5);

// ── Volume / e1RM ──────────────────────────────────────────────────────────
check('epley estimate', e1rm(100, 5), 116.7);
check(
  'unilateral sets count both legs',
  setVolume(getExercise('bulgarian-split-squat'), { id: 'x', weight: 20, reps: 10, rir: null, completedAt: 1 }),
  400,
);
check(
  'bodyweight movements use body weight as load',
  setVolume(getExercise('hanging-knee-raise'), { id: 'x', weight: 0, reps: 10, rir: null, completedAt: 1 }, 62),
  620,
);

// ── Schedule ───────────────────────────────────────────────────────────────
const BLOCK_START = '2026-08-10'; // Monday of week 1
const lateSession: Session = {
  ...session('s3', '2026-08-14', 1, [entry('hip-thrust', 3, 8, 10, [[50, 10]])]),
  dayId: 'lowerA',
};
const schedule = weekSchedule(1, BLOCK_START, [lateSession], '2026-08-15');
check(
  'Tuesday trained on Friday still counts',
  schedule.find((s) => s.day.id === 'lowerA')?.status,
  'done',
);
check(
  'untrained past day reads as missed',
  schedule.find((s) => s.day.id === 'upper')?.status,
  'missed',
);
check(
  "the day being viewed reads as today",
  schedule.find((s) => s.day.id === 'lowerB')?.status,
  'today',
);
check(
  'a future day reads as upcoming',
  weekSchedule(1, BLOCK_START, [lateSession], '2026-08-12').find((s) => s.day.id === 'lowerB')
    ?.status,
  'upcoming',
);

const twoSessions: Session[] = [
  session('a', '2026-08-11', 1, [entry('hip-thrust', 3, 8, 10, [[50, 10]])]),
  { ...session('b', '2026-08-13', 1, [entry('lat-pulldown', 3, 8, 10, [[40, 10]])]), dayId: 'upper' },
];
check('two of three sessions completes the week', weekCompletion(1, BLOCK_START, twoSessions, '2026-08-16').done, 2);
check('two sessions start a streak', weekStreak(BLOCK_START, twoSessions, '2026-08-16'), 1);
check('an empty week has no streak', weekStreak(BLOCK_START, [], '2026-08-16'), 0);

if (failures) throw new Error(`${failures} check(s) failed`);
console.log('\nAll checks passed');
