import { getCircuitExercise } from '../data/circuitExercises';
import { addDays } from '../lib/date';
import type { CircuitAppState, CircuitLoad, CircuitSession, MuscleGroup } from '../types';

export function finishedSessions(state: Pick<CircuitAppState, 'sessions'>): CircuitSession[] {
  return state.sessions
    .filter((s) => s.finishedAt)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface LoadMove {
  exerciseId: string;
  name: string;
  from: CircuitLoad;
  to: CircuitLoad;
  /** Positive when the load went up. */
  direction: 1 | 0 | -1;
}

function loadValue(load: CircuitLoad): number {
  return load.kind === 'band' ? load.bandIndex : load.weight;
}

/**
 * What has actually moved, comparing the first logged load for an exercise
 * with the most recent one. Only exercises trained at least twice appear —
 * a single session is a data point, not a trend.
 */
export function loadMoves(state: Pick<CircuitAppState, 'sessions'>): LoadMove[] {
  const first = new Map<string, CircuitLoad>();
  const latest = new Map<string, CircuitLoad>();
  const seen = new Map<string, number>();

  for (const session of finishedSessions(state)) {
    for (const [exId, load] of Object.entries(session.loadsUsed ?? {})) {
      if (!first.has(exId)) first.set(exId, load);
      latest.set(exId, load);
      seen.set(exId, (seen.get(exId) ?? 0) + 1);
    }
  }

  const moves: LoadMove[] = [];
  for (const [exId, from] of first) {
    const to = latest.get(exId);
    if (!to || (seen.get(exId) ?? 0) < 2) continue;
    const delta = loadValue(to) - loadValue(from);
    moves.push({
      exerciseId: exId,
      name: getCircuitExercise(exId).name,
      from,
      to,
      direction: delta > 0 ? 1 : delta < 0 ? -1 : 0,
    });
  }

  // Gains first, then the biggest holds.
  return moves.sort((a, b) => b.direction - a.direction);
}

/** Completed exercise-rounds per muscle group over the trailing window. */
export function muscleBalance(
  state: Pick<CircuitAppState, 'sessions' | 'plan'>,
  since: string,
): { muscle: MuscleGroup; count: number }[] {
  const counts = new Map<MuscleGroup, number>();

  for (const session of finishedSessions(state)) {
    if (session.date < since) continue;
    for (const key of Object.keys(session.completed)) {
      // Keys are `${round}-${exerciseId}`; the id may itself contain dashes.
      const exId = key.slice(key.indexOf('-') + 1);
      const ex = getCircuitExercise(exId);
      for (const m of ex.muscles) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([muscle, count]) => ({ muscle, count }))
    .sort((a, b) => b.count - a.count);
}

export interface Consistency {
  total: number;
  weeks: number;
  /** Most recent first: one entry per session, for the streak strip. */
  recent: CircuitSession[];
}

export function consistency(
  state: Pick<CircuitAppState, 'sessions'>,
  today: string,
  weeks = 4,
): Consistency {
  const since = addDays(today, -7 * weeks);
  const inWindow = finishedSessions(state).filter((s) => s.date >= since);
  return { total: inWindow.length, weeks, recent: inWindow };
}
