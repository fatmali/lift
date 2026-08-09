/**
 * Core domain types for Lift.
 *
 * Design note: every logged entity carries a stable `id` and an ISO `date`,
 * and nothing is stored in a derived form. PRs, volume, streaks and readiness
 * to progress are all computed from the raw set log. That keeps the schema
 * additive — a future HealthKit / Apple Watch import can write `SetLog`s with
 * a different `source` without any migration.
 */

export type MuscleGroup =
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'calves'
  | 'core';

export type ExerciseKind = 'compound' | 'isolation';

export type LoadType =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'assisted';

export interface Exercise {
  id: string;
  name: string;
  /** Shown under the name in the logger — one line, no lectures. */
  cue: string;
  kind: ExerciseKind;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  loadType: LoadType;
  /** Logged per side; volume counts both sides. */
  unilateral?: boolean;
  /** Load is assistance — less weight is better (assisted pull-up). */
  inverseLoad?: boolean;
  /** Body weight is the base load; added weight is optional. */
  usesBodyweight?: boolean;
  /** Smallest sensible jump on this equipment, in kg. */
  step: number;
  /** Estimated 1RM is only meaningful on heavy-ish compounds. */
  trackE1RM: boolean;
}

/** A prescribed movement inside a training day. */
export interface ProgramSlot {
  slotId: string;
  /** First entry is the default; the athlete's last pick is remembered. */
  variants: string[];
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  /** Section label for the day, e.g. "Back". */
  section?: string;
}

export type DayId = 'lowerA' | 'upper' | 'lowerB';

export interface WorkoutDay {
  id: DayId;
  name: string;
  focus: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  short: string;
  slots: ProgramSlot[];
}

export interface Phase {
  name: string;
  weeks: number[];
  rirLabel: string;
  intent: string;
  deload?: boolean;
}

/** RIR: 4 means "4 or more". null = not reported. */
export type Rir = 0 | 1 | 2 | 3 | 4 | null;

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
  rir: Rir;
  completedAt: number;
  /** Reserved for future imports (Apple Watch, CSV). */
  source?: 'manual' | 'import';
}

export interface ExerciseEntry {
  slotId: string;
  exerciseId: string;
  targetSets: number;
  repMin: number;
  repMax: number;
  sets: SetLog[];
  notes?: string;
  skipped?: boolean;
}

export type Level = 'low' | 'medium' | 'high';

export interface Readiness {
  energy: Level;
  soreness: Level;
  sleepHours?: number;
  stress?: Level;
}

export interface Session {
  id: string;
  dayId: DayId;
  week: number;
  date: string;
  startedAt: number;
  finishedAt?: number;
  entries: ExerciseEntry[];
  readiness?: Readiness;
  notes?: string;
}

export type PRKind = 'weight' | 'reps' | 'volume' | 'e1rm';

export interface PR {
  id: string;
  exerciseId: string;
  kind: PRKind;
  value: number;
  previous: number | null;
  /** Context, e.g. "10 reps @ 60 kg". */
  detail: string;
  date: string;
  sessionId: string;
}

export type CardioType = 'easy' | 'run' | 'padel' | 'boxing' | 'other';

export interface CardioSession {
  id: string;
  date: string;
  type: CardioType;
  minutes: number;
  effort: Level;
  notes?: string;
}

export interface Measurement {
  id: string;
  date: string;
  bodyweight?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  arm?: number;
}

export type Pose = 'front' | 'side' | 'back';

export interface PhotoMeta {
  id: string;
  date: string;
  pose: Pose;
  week: number;
  /** IndexedDB key for the image blob — never leaves the device. */
  blobKey: string;
}

export interface RecoveryLog {
  /** One entry per calendar day. */
  date: string;
  sleepHours?: number;
  energy?: Level;
  soreness?: Level;
  stress?: Level;
}

export interface ReminderPrefs {
  enabled: boolean;
  /** "HH:MM" — evening nudge the day before. */
  eveningBefore: string;
  eveningBeforeOn: boolean;
  /** "HH:MM" — day-of nudge. */
  dayOf: string;
  dayOfOn: boolean;
  /** Missed-session check, day-of, later. */
  missedOn: boolean;
  missedAt: string;
  /** Sunday week wrap-up. */
  weeklyOn: boolean;
  weeklyAt: string;
}

export interface Settings {
  unit: 'kg' | 'lb';
  blockStart: string;
  restCompound: number;
  restIsolation: number;
  autoStartRest: boolean;
  sound: boolean;
  vibrate: boolean;
  askReadiness: boolean;
  reminders: ReminderPrefs;
  /** Per-exercise rest overrides, seconds. */
  restOverrides: Record<string, number>;
}

export interface AppState {
  settings: Settings;
  sessions: Session[];
  activeSessionId: string | null;
  /** slotId -> chosen exercise id */
  variantChoice: Record<string, string>;
  cardio: CardioSession[];
  measurements: Measurement[];
  photos: PhotoMeta[];
  recovery: RecoveryLog[];
  /** Dismissed coaching hints, so nothing nags twice. */
  dismissed: string[];
}

/**
 * Circuit (functional) training — the redesigned default experience.
 *
 * "Open the app. See what you're doing today. Start. Move through the
 * workout. Check things off. Done." A circuit day is a fixed list of
 * exercises repeated for a number of rounds; the athlete checks each one
 * off rather than logging discrete sets. Weight or band level is a
 * secondary control that remembers the last value used, and timed
 * exercises carry their own countdown so nobody has to watch a clock.
 *
 * This is deliberately a separate model from the strength `Session` above
 * rather than a variant of it — the interaction (checkbox, not reps typed
 * in) and the unit of progress (a round, not a set) are different enough
 * that forcing one schema to cover both would bend the strength side out
 * of shape for no benefit.
 */
export type CircuitLoadKind = 'load' | 'band' | 'time';

export interface CircuitExercise {
  id: string;
  name: string;
  /** One short line, shown under the name — no lectures. */
  cue: string;
  kind: CircuitLoadKind;
  /** Drives the muscle-focus balance shown in Progress. */
  muscles: MuscleGroup[];
  /** Long form, shown on the exercise's own screen, e.g. "20 total · 10 a side". */
  prescription: string;
  /** Short form, shown in list rows, e.g. "20 total". */
  line: string;
  /** 'load' only. */
  unit?: 'kg' | 'lb';
  step?: number;
  defaultWeight?: number;
  /** 'time' only, seconds per round. */
  seconds?: number;
  /** Static coaching nudge shown under the weight stepper, if any. */
  suggestion?: string;
}

/**
 * Functional days run as rounds; strength days hand off to the set-by-set
 * logger. The mode is a property of the day, so one week can hold both.
 */
export type WorkoutMode = 'functional' | 'strength';

export interface CircuitWorkoutDay {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** The muscle-group headline — this is what Today shows, not a slot name. */
  focus: string;
  mode: WorkoutMode;
  rounds: number;
  minutes: number;
  exerciseIds: string[];
}

/** The athlete's last-used weight or band for an exercise, remembered globally. */
export type CircuitLoad = { kind: 'load'; weight: number } | { kind: 'band'; bandIndex: number };

export interface CircuitSession {
  id: string;
  workoutId: string;
  /** Copied at start, so history survives the plan being edited later. */
  focus: string;
  date: string;
  startedAt: number;
  finishedAt?: number;
  rounds: number;
  /** The round currently being worked, 1-indexed. */
  currentRound: number;
  /** `${round}-${exerciseId}` keys that have been checked off. */
  completed: Record<string, true>;
  /** The loads actually used, snapshotted when the session is filed. */
  loadsUsed?: Record<string, CircuitLoad>;
}

/** A meal in the weekly plan. */
export interface Meal {
  id: string;
  time: string;
  name: string;
  kcal: number;
  protein: number;
  recipeId?: string;
}

export interface Recipe {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  prepMin: number;
  cookMin: number;
  ingredients: string[];
  method: string[];
  /** "Chicken" -> ["Tilapia", "Lean beef", …] — swaps that keep the numbers. */
  swaps: { component: string; options: string[] }[];
}

export interface ShoppingItem {
  name: string;
  qty: string;
}

export interface ShoppingGroup {
  title: string;
  items: ShoppingItem[];
}

export interface FastingWindow {
  /** "HH:MM" the eating window opens. */
  eatFrom: string;
  /** "HH:MM" the eating window closes and the fast begins. */
  eatUntil: string;
}

export interface CircuitAppState {
  /** The athlete's own plan — seeded from the default, then editable. */
  plan: CircuitWorkoutDay[];
  sessions: CircuitSession[];
  activeSessionId: string | null;
  loads: Record<string, CircuitLoad>;
  /** `${date}-${mealId}` for meals ticked off. */
  loggedMeals: Record<string, true>;
  /** `${group}/${name}` for shopping items in the basket. */
  bought: Record<string, true>;
  fasting: FastingWindow;
  /** date -> epoch ms the fast was actually broken, when ended by hand. */
  fastBrokenAt: Record<string, number>;
}
