import { getExercise } from '../data/exercises';
import { BLOCK_WEEKS, phaseForWeek } from '../data/program';
import { formatShort } from '../lib/date';
import type { MuscleGroup, PR, Session } from '../types';
import {
  bestE1rm,
  completedSets,
  entryVolume,
  isCompleted,
  progressionQueue,
  sessionVolume,
  topWeight,
  totalReps,
} from './progression';
import { sessionsInWeek, weekCompletion } from './schedule';

export interface SeriesPoint {
  date: string;
  week: number;
  label: string;
  topWeight: number;
  e1rm: number;
  volume: number;
  reps: number;
  bestSet: string;
  /** Rep string as logged, e.g. "10/10/9/8". */
  sets: string;
}

export function exerciseSeries(sessions: Session[], exerciseId: string): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const s of sessions) {
    if (!isCompleted(s)) continue;
    for (const entry of s.entries) {
      if (entry.exerciseId !== exerciseId) continue;
      const sets = completedSets(entry);
      if (!sets.length) continue;
      const best = sets.reduce((a, b) => (b.reps > a.reps ? b : a));
      points.push({
        date: s.date,
        week: s.week,
        label: formatShort(s.date),
        topWeight: topWeight(entry),
        e1rm: bestE1rm(entry),
        volume: Math.round(entryVolume(entry)),
        reps: totalReps(entry),
        bestSet: `${best.reps} × ${best.weight}`,
        sets: sets.map((x) => x.reps).join('/'),
      });
    }
  }
  return points.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Direct working sets per muscle group over a set of sessions. */
export function setsByMuscle(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    for (const entry of s.entries) {
      const ex = getExercise(entry.exerciseId);
      const n = completedSets(entry).length;
      if (!n) continue;
      counts[ex.primary] = (counts[ex.primary] ?? 0) + n;
    }
  }
  return counts;
}

export interface WeekSummary {
  week: number;
  workouts: number;
  scheduled: number;
  volume: number;
  sets: number;
  prs: PR[];
  strongest: { name: string; detail: string } | null;
  mostImproved: { name: string; detail: string } | null;
  focus: string;
  hasData: boolean;
}

export function weekSummary(
  week: number,
  blockStart: string,
  sessions: Session[],
  prs: PR[],
  bodyweight: number,
  unit: string,
  now: string,
): WeekSummary {
  const weekSessions = sessionsInWeek(week, blockStart, sessions);
  const prev = sessionsInWeek(week - 1, blockStart, sessions);
  const { done, total } = weekCompletion(week, blockStart, sessions, now);
  const volume = weekSessions.reduce((sum, s) => sum + sessionVolume(s, bodyweight), 0);
  const sets = weekSessions.reduce(
    (n, s) => n + s.entries.reduce((m, e) => m + completedSets(e).length, 0),
    0,
  );
  const weekPRs = prs.filter((p) => weekSessions.some((s) => s.id === p.sessionId));

  // Strongest lift of the week — highest estimated 1RM on a tracked compound.
  let strongest: WeekSummary['strongest'] = null;
  let bestScore = 0;
  for (const s of weekSessions) {
    for (const entry of s.entries) {
      const ex = getExercise(entry.exerciseId);
      const score = ex.trackE1RM ? bestE1rm(entry) : 0;
      if (score > bestScore) {
        bestScore = score;
        strongest = { name: ex.name, detail: `${topWeight(entry)} ${unit} · est. 1RM ${score}` };
      }
    }
  }

  // Most improved — biggest jump in per-exercise volume against last week.
  let mostImproved: WeekSummary['mostImproved'] = null;
  if (prev.length) {
    const volFor = (list: Session[]) => {
      const map: Record<string, number> = {};
      for (const s of list) {
        for (const e of s.entries) {
          map[e.exerciseId] = (map[e.exerciseId] ?? 0) + entryVolume(e, bodyweight);
        }
      }
      return map;
    };
    const nowVol = volFor(weekSessions);
    const prevVol = volFor(prev);
    let bestDelta = 0;
    for (const [id, v] of Object.entries(nowVol)) {
      const before = prevVol[id];
      if (!before) continue;
      const delta = (v - before) / before;
      if (delta > bestDelta) {
        bestDelta = delta;
        mostImproved = {
          name: getExercise(id).name,
          detail: `+${Math.round(delta * 100)}% volume`,
        };
      }
    }
  }

  return {
    week,
    workouts: done,
    scheduled: total,
    volume: Math.round(volume),
    sets,
    prs: weekPRs,
    strongest,
    mostImproved,
    focus: nextWeekFocus(week, done, total, sessions, weekSessions),
    hasData: weekSessions.length > 0,
  };
}

const ARM_TARGET = 5;

function nextWeekFocus(
  week: number,
  done: number,
  total: number,
  allSessions: Session[],
  weekSessions: Session[],
): string {
  const next = Math.min(BLOCK_WEEKS, week + 1);
  const phase = phaseForWeek(next);
  if (phase.deload) return 'Deload week. Cut the sets, keep the technique, sleep more.';
  if (done < total) {
    return `Hit all ${total} sessions next week. Consistency is the lift that compounds.`;
  }
  const ready = progressionQueue(allSessions).slice(0, 2);
  if (ready.length) {
    const names = ready.map((r) => getExercise(r.exerciseId).name).join(' and ');
    return `Add load on ${names} — you topped the rep range.`;
  }
  const muscle = setsByMuscle(weekSessions);
  const arms = (muscle.biceps ?? 0) + (muscle.triceps ?? 0);
  if (weekSessions.length >= 3 && arms < ARM_TARGET * 2) {
    return 'Arm work slipped. Keep biceps and triceps at 5–8 quality sets each.';
  }
  return `${phase.name}: ${phase.intent}`;
}

export function muscleWeeklyTargets(): { group: MuscleGroup; label: string; target: number }[] {
  return [
    { group: 'glutes', label: 'Glutes', target: 12 },
    { group: 'quads', label: 'Quads', target: 8 },
    { group: 'hamstrings', label: 'Hamstrings', target: 8 },
    { group: 'back', label: 'Back', target: 10 },
    { group: 'shoulders', label: 'Delts', target: 10 },
    { group: 'biceps', label: 'Biceps', target: 5 },
    { group: 'triceps', label: 'Triceps', target: 5 },
    { group: 'core', label: 'Core', target: 6 },
  ];
}
