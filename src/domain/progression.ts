import { getExercise } from '../data/exercises';
import { uid } from '../lib/format';
import type { Exercise, ExerciseEntry, PR, PRKind, Session, SetLog } from '../types';

/** Sets with zero reps are placeholders, not work. */
export const isWorkingSet = (s: SetLog) => s.reps > 0;

export function completedSets(entry: ExerciseEntry): SetLog[] {
  return entry.sets.filter(isWorkingSet);
}

/**
 * Load moved by one set. Unilateral work counts both sides; bodyweight
 * movements use the athlete's last logged bodyweight as the base load so
 * hanging knee raises do not silently contribute nothing.
 */
export function setVolume(ex: Exercise, set: SetLog, bodyweight = 0): number {
  const base = ex.usesBodyweight ? bodyweight + set.weight : set.weight;
  const load = ex.inverseLoad ? Math.max(0, bodyweight - set.weight) : base;
  return load * set.reps * (ex.unilateral ? 2 : 1);
}

export function entryVolume(entry: ExerciseEntry, bodyweight = 0): number {
  const ex = getExercise(entry.exerciseId);
  return completedSets(entry).reduce((sum, s) => sum + setVolume(ex, s, bodyweight), 0);
}

export function sessionVolume(session: Session, bodyweight = 0): number {
  return session.entries.reduce((sum, e) => sum + entryVolume(e, bodyweight), 0);
}

export function sessionSetCount(session: Session): number {
  return session.entries.reduce((n, e) => n + completedSets(e).length, 0);
}

/** Epley, capped — an estimate past ~12 reps stops being informative. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  const r = Math.min(reps, 12);
  return Math.round(weight * (1 + r / 30) * 10) / 10;
}

export function bestE1rm(entry: ExerciseEntry): number {
  const ex = getExercise(entry.exerciseId);
  if (!ex.trackE1RM) return 0;
  return completedSets(entry).reduce((best, s) => Math.max(best, e1rm(s.weight, s.reps)), 0);
}

/** Heaviest load in an entry — or lightest assistance for inverse-load lifts. */
export function topWeight(entry: ExerciseEntry): number {
  const ex = getExercise(entry.exerciseId);
  const sets = completedSets(entry);
  if (!sets.length) return 0;
  const weights = sets.map((s) => s.weight);
  return ex.inverseLoad ? Math.min(...weights) : Math.max(...weights);
}

export function totalReps(entry: ExerciseEntry): number {
  return completedSets(entry).reduce((n, s) => n + s.reps, 0);
}

export function isBetterLoad(ex: Exercise, a: number, b: number): boolean {
  return ex.inverseLoad ? a < b : a > b;
}

// ── History lookups ─────────────────────────────────────────────────────────

export interface HistoryPoint {
  session: Session;
  entry: ExerciseEntry;
}

export function isCompleted(s: Session) {
  return Boolean(s.finishedAt);
}

/** Newest-first history for one exercise across finished sessions. */
export function historyFor(
  sessions: Session[],
  exerciseId: string,
  excludeSessionId?: string,
): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  for (const session of sessions) {
    if (!isCompleted(session)) continue;
    if (session.id === excludeSessionId) continue;
    for (const entry of session.entries) {
      if (entry.exerciseId === exerciseId && completedSets(entry).length) {
        out.push({ session, entry });
      }
    }
  }
  return out.sort((a, b) => (a.session.date < b.session.date ? 1 : -1));
}

export function lastPerformance(
  sessions: Session[],
  exerciseId: string,
  excludeSessionId?: string,
): HistoryPoint | null {
  return historyFor(sessions, exerciseId, excludeSessionId)[0] ?? null;
}

// ── Personal records ────────────────────────────────────────────────────────

export interface ExerciseBests {
  weight: number;
  /** Most reps in a single set, paired with the load it happened at. */
  reps: number;
  repsAtWeight: number;
  volume: number;
  e1rm: number;
}

export function bestsFor(history: HistoryPoint[]): ExerciseBests {
  const ex = history.length ? getExercise(history[0].entry.exerciseId) : null;
  const bests: ExerciseBests = { weight: 0, reps: 0, repsAtWeight: 0, volume: 0, e1rm: 0 };
  if (!ex) return bests;
  if (ex.inverseLoad) bests.weight = Number.POSITIVE_INFINITY;

  for (const { entry } of history) {
    const sets = completedSets(entry);
    for (const s of sets) {
      if (isBetterLoad(ex, s.weight, bests.weight)) bests.weight = s.weight;
      // A rep PR only counts at the same load or heavier.
      if (s.reps > bests.reps || (s.reps === bests.reps && isBetterLoad(ex, s.weight, bests.repsAtWeight))) {
        if (s.reps > bests.reps) {
          bests.reps = s.reps;
          bests.repsAtWeight = s.weight;
        } else {
          bests.repsAtWeight = s.weight;
        }
      }
    }
    bests.volume = Math.max(bests.volume, entryVolume(entry));
    bests.e1rm = Math.max(bests.e1rm, bestE1rm(entry));
  }
  if (bests.weight === Number.POSITIVE_INFINITY) bests.weight = 0;
  return bests;
}

/**
 * PRs set inside `session`, measured against everything logged before it.
 * Computed rather than stored so history stays the single source of truth.
 */
export function prsForSession(session: Session, allSessions: Session[], unit: string): PR[] {
  const prs: PR[] = [];
  for (const entry of session.entries) {
    const sets = completedSets(entry);
    if (!sets.length) continue;
    const ex = getExercise(entry.exerciseId);
    const prior = historyFor(allSessions, entry.exerciseId, session.id).filter(
      (h) => h.session.date <= session.date,
    );
    const before = bestsFor(prior);
    const hadHistory = prior.length > 0;

    const push = (kind: PR['kind'], value: number, previous: number | null, detail: string) => {
      prs.push({
        id: uid('pr_'),
        exerciseId: entry.exerciseId,
        kind,
        value,
        previous,
        detail,
        date: session.date,
        sessionId: session.id,
      });
    };

    const top = topWeight(entry);
    if (hadHistory && before.weight > 0 && isBetterLoad(ex, top, before.weight)) {
      push(
        'weight',
        top,
        before.weight,
        ex.inverseLoad ? `${top} ${unit} assistance` : `${top} ${unit}`,
      );
    }

    const bestSet = sets.reduce((a, b) => (b.reps > a.reps ? b : a));
    const beatsRepPR =
      bestSet.reps > before.reps &&
      (before.reps === 0 || !isBetterLoad(ex, before.repsAtWeight, bestSet.weight));
    if (hadHistory && beatsRepPR) {
      push('reps', bestSet.reps, before.reps, `${bestSet.reps} reps @ ${bestSet.weight} ${unit}`);
    }

    const vol = entryVolume(entry);
    if (hadHistory && before.volume > 0 && vol > before.volume * 1.001) {
      push('volume', Math.round(vol), Math.round(before.volume), `${Math.round(vol)} ${unit}`);
    }

    const est = bestE1rm(entry);
    if (hadHistory && ex.trackE1RM && before.e1rm > 0 && est > before.e1rm) {
      push('e1rm', est, before.e1rm, `est. 1RM ${est} ${unit}`);
    }
  }
  return prs;
}

export function allPRs(sessions: Session[], unit: string): PR[] {
  const finished = sessions.filter(isCompleted).sort((a, b) => (a.date < b.date ? -1 : 1));
  return finished
    .flatMap((s) => prsForSession(s, finished, unit))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Headline order: a heavier bar beats more reps beats an estimate. */
const PR_RANK: PRKind[] = ['weight', 'reps', 'e1rm', 'volume'];

export interface PRGroup {
  key: string;
  exerciseId: string;
  date: string;
  sessionId: string;
  kinds: PRKind[];
  headline: PR;
}

/**
 * One lift beating three record types in a session is one achievement, not
 * three. Group them so the celebration stays proportional to the work.
 */
export function groupPRs(prs: PR[]): PRGroup[] {
  const groups = new Map<string, PRGroup>();
  for (const pr of prs) {
    const key = `${pr.sessionId}:${pr.exerciseId}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        key,
        exerciseId: pr.exerciseId,
        date: pr.date,
        sessionId: pr.sessionId,
        kinds: [pr.kind],
        headline: pr,
      });
      continue;
    }
    existing.kinds.push(pr.kind);
    if (PR_RANK.indexOf(pr.kind) < PR_RANK.indexOf(existing.headline.kind)) {
      existing.headline = pr;
    }
  }
  return [...groups.values()].map((g) => ({
    ...g,
    kinds: [...g.kinds].sort((a, b) => PR_RANK.indexOf(a) - PR_RANK.indexOf(b)),
  }));
}

// ── Double progression ──────────────────────────────────────────────────────

export interface ProgressionSignal {
  exerciseId: string;
  weight: number;
  suggested: number;
  repMax: number;
  sets: number;
  date: string;
}

/**
 * Ready to progress = every prescribed set hit the top of the rep range at the
 * same load. We surface it and stop there — the athlete decides the jump.
 */
export function readyToProgress(entry: ExerciseEntry, date: string): ProgressionSignal | null {
  const sets = completedSets(entry);
  if (sets.length < entry.targetSets) return null;
  const ex = getExercise(entry.exerciseId);
  const relevant = sets.slice(0, entry.targetSets);
  if (!relevant.every((s) => s.reps >= entry.repMax)) return null;
  const weights = new Set(relevant.map((s) => s.weight));
  if (weights.size !== 1) return null;
  const weight = relevant[0].weight;
  const suggested = ex.inverseLoad
    ? Math.max(0, weight - ex.step)
    : Math.round((weight + ex.step) * 100) / 100;
  return {
    exerciseId: entry.exerciseId,
    weight,
    suggested,
    repMax: entry.repMax,
    sets: entry.targetSets,
    date,
  };
}

/** Latest signal per exercise, most recent session first. */
export function progressionQueue(sessions: Session[]): ProgressionSignal[] {
  const seen = new Set<string>();
  const out: ProgressionSignal[] = [];
  const finished = sessions.filter(isCompleted).sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const s of finished) {
    for (const entry of s.entries) {
      if (seen.has(entry.exerciseId)) continue;
      seen.add(entry.exerciseId);
      const signal = readyToProgress(entry, s.date);
      if (signal) out.push(signal);
    }
  }
  return out;
}

// ── Feedback copy ───────────────────────────────────────────────────────────

export function progressionMessage(
  entry: ExerciseEntry,
  previous: ExerciseEntry | null,
  hasPR: boolean,
  unit: string,
): { tone: 'pr' | 'up' | 'flat' | 'down' | 'new'; text: string } {
  const sets = completedSets(entry);
  if (!sets.length) return { tone: 'flat', text: 'Nothing logged.' };
  if (hasPR) return { tone: 'pr', text: 'New PR 🔥' };
  if (!previous || !completedSets(previous).length) {
    return { tone: 'new', text: "Baseline set. Now there's a number to beat." };
  }

  const ex = getExercise(entry.exerciseId);
  const nowTop = topWeight(entry);
  const prevTop = topWeight(previous);
  const nowReps = totalReps(entry);
  const prevReps = totalReps(previous);

  if (isBetterLoad(ex, nowTop, prevTop)) {
    const delta = Math.abs(nowTop - prevTop);
    return {
      tone: 'up',
      text: ex.inverseLoad
        ? `−${delta} ${unit} assistance from last time`
        : `+${delta} ${unit} from last time`,
    };
  }
  if (nowTop === prevTop && nowReps > prevReps) {
    const delta = nowReps - prevReps;
    return { tone: 'up', text: `+${delta} rep${delta === 1 ? '' : 's'} from last time` };
  }
  if (nowTop === prevTop && nowReps === prevReps) {
    return { tone: 'flat', text: 'Matched last session. Beat it next time.' };
  }
  if (isBetterLoad(ex, prevTop, nowTop) || nowReps < prevReps) {
    return { tone: 'down', text: 'Lighter than last time. Some days are like that.' };
  }
  return { tone: 'flat', text: 'Same weight. Try to beat it next session.' };
}

/**
 * Gentle nudge if compound work is repeatedly taken to failure. Not a
 * diagnosis — just a note that RIR 0 every session is a cost, not a virtue.
 */
export function failureFlag(sessions: Session[]): { count: number; total: number } | null {
  const recent = sessions
    .filter(isCompleted)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 4);
  let zero = 0;
  let total = 0;
  for (const s of recent) {
    for (const entry of s.entries) {
      if (getExercise(entry.exerciseId).kind !== 'compound') continue;
      for (const set of completedSets(entry)) {
        if (set.rir === null) continue;
        total += 1;
        if (set.rir === 0) zero += 1;
      }
    }
  }
  if (total < 8 || zero / total < 0.4) return null;
  return { count: zero, total };
}
