import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BANDS, getCircuitExercise } from '../data/circuitExercises';
import { DEFAULT_CIRCUIT_PLAN, firstFreeWeekday } from '../data/circuitProgram';
import { today as todayISO } from '../lib/date';
import { uid } from '../lib/format';
import type {
  CircuitAppState,
  CircuitLoad,
  CircuitSession,
  CircuitWorkoutDay,
  FastingWindow,
} from '../types';
import { idbStorage } from './storage';

const initialState: CircuitAppState = {
  plan: DEFAULT_CIRCUIT_PLAN.map((d) => ({ ...d, exerciseIds: [...d.exerciseIds] })),
  sessions: [],
  activeSessionId: null,
  loads: {},
  loggedMeals: {},
  bought: {},
  // 14:10 — eat from 12:30, fast from 22:30. Supported, never the centrepiece.
  fasting: { eatFrom: '12:30', eatUntil: '22:30' },
  fastBrokenAt: {},
};

interface Actions {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  startSession: (workoutId: string, date?: string) => string;
  resumeOrStart: (workoutId: string, date?: string) => string;
  abandonSession: (id: string) => void;
  setExerciseComplete: (sessionId: string, round: number, exerciseId: string, done: boolean) => void;
  advanceRound: (sessionId: string) => void;
  finishSession: (id: string) => void;
  adjustLoad: (exerciseId: string, delta: number) => void;
  updateWorkout: (id: string, patch: Partial<CircuitWorkoutDay>) => void;
  addWorkout: () => string;
  deleteWorkout: (id: string) => void;
  toggleMeal: (date: string, mealId: string) => void;
  toggleBought: (group: string, name: string) => void;
  setFasting: (patch: Partial<FastingWindow>) => void;
  breakFast: (date: string) => void;
}

export type CircuitStore = CircuitAppState & Actions;

const mutateSession = (
  sessions: CircuitSession[],
  sessionId: string,
  fn: (s: CircuitSession) => CircuitSession,
): CircuitSession[] => sessions.map((s) => (s.id === sessionId ? fn(s) : s));

export const useCircuitStore = create<CircuitStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      startSession: (workoutId, date = todayISO()) => {
        const workout = get().plan.find((d) => d.id === workoutId);
        if (!workout) return '';
        const session: CircuitSession = {
          id: uid('cs_'),
          workoutId,
          focus: workout.focus,
          date,
          startedAt: Date.now(),
          rounds: workout.rounds,
          currentRound: 1,
          completed: {},
        };
        set((state) => ({ sessions: [...state.sessions, session], activeSessionId: session.id }));
        return session.id;
      },

      resumeOrStart: (workoutId, date = todayISO()) => {
        const state = get();
        const existing = state.sessions.find(
          (s) => s.date === date && s.workoutId === workoutId && !s.finishedAt,
        );
        if (existing) {
          set({ activeSessionId: existing.id });
          return existing.id;
        }
        return get().startSession(workoutId, date);
      },

      abandonSession: (id) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === id);
        const empty = session ? Object.keys(session.completed).length === 0 : true;
        set({
          sessions: empty ? state.sessions.filter((s) => s.id !== id) : state.sessions,
          activeSessionId: null,
        });
      },

      setExerciseComplete: (sessionId, round, exerciseId, done) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) => {
            const key = `${round}-${exerciseId}`;
            const completed = { ...s.completed };
            if (done) completed[key] = true;
            else delete completed[key];
            return { ...s, completed };
          }),
        }));
      },

      advanceRound: (sessionId) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) => ({
            ...s,
            currentRound: s.currentRound + 1,
          })),
        }));
      },

      finishSession: (id) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === id);
        const workout = session ? state.plan.find((d) => d.id === session.workoutId) : undefined;
        // Snapshot what was actually lifted, so history survives later edits
        // to the plan or to the current working weights.
        const loadsUsed: Record<string, CircuitLoad> = {};
        for (const exId of workout?.exerciseIds ?? []) {
          const load = state.loads[exId] ?? defaultLoad(exId);
          if (load.kind === 'load' || load.kind === 'band') loadsUsed[exId] = load;
        }
        set({
          sessions: mutateSession(state.sessions, id, (s) => ({
            ...s,
            finishedAt: Date.now(),
            loadsUsed,
          })),
          activeSessionId: null,
        });
      },

      adjustLoad: (exerciseId, delta) => {
        const ex = getCircuitExercise(exerciseId);
        const current = get().loads[exerciseId] ?? defaultLoad(exerciseId);
        let next: CircuitLoad = current;
        if (ex.kind === 'band' && current.kind === 'band') {
          const idx = Math.min(BANDS.length - 1, Math.max(0, current.bandIndex + delta));
          next = { kind: 'band', bandIndex: idx };
        } else if (ex.kind === 'load' && current.kind === 'load') {
          const step = ex.step ?? 2;
          const weight = Math.max(0, Math.round((current.weight + delta * step) * 10) / 10);
          next = { kind: 'load', weight };
        }
        set((state) => ({ loads: { ...state.loads, [exerciseId]: next } }));
      },

      updateWorkout: (id, patch) => {
        set((state) => ({
          plan: state.plan.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        }));
      },

      addWorkout: () => {
        const id = uid('day_');
        const state = get();
        const fresh: CircuitWorkoutDay = {
          id,
          weekday: firstFreeWeekday(state.plan),
          focus: 'New session',
          mode: 'functional',
          rounds: 3,
          minutes: 45,
          exerciseIds: ['goblet-squat', 'bent-over-row', 'plank-fn'],
        };
        set({ plan: [...state.plan, fresh] });
        return id;
      },

      deleteWorkout: (id) => {
        set((state) => ({ plan: state.plan.filter((d) => d.id !== id) }));
      },

      toggleMeal: (date, mealId) => {
        set((state) => {
          const key = `${date}-${mealId}`;
          const loggedMeals = { ...state.loggedMeals };
          if (loggedMeals[key]) delete loggedMeals[key];
          else loggedMeals[key] = true;
          return { loggedMeals };
        });
      },

      toggleBought: (group, name) => {
        set((state) => {
          const key = `${group}/${name}`;
          const bought = { ...state.bought };
          if (bought[key]) delete bought[key];
          else bought[key] = true;
          return { bought };
        });
      },

      setFasting: (patch) => {
        set((state) => ({ fasting: { ...state.fasting, ...patch } }));
      },

      breakFast: (date) => {
        set((state) => ({ fastBrokenAt: { ...state.fastBrokenAt, [date]: Date.now() } }));
      },
    }),
    {
      name: 'lift-circuit-v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        plan: state.plan,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        loads: state.loads,
        loggedMeals: state.loggedMeals,
        bought: state.bought,
        fasting: state.fasting,
        fastBrokenAt: state.fastBrokenAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** The starting weight/band for an exercise that has never been adjusted. */
export function defaultLoad(exerciseId: string): CircuitLoad {
  const ex = getCircuitExercise(exerciseId);
  if (ex.kind === 'band') return { kind: 'band', bandIndex: 1 };
  return { kind: 'load', weight: ex.defaultWeight ?? 0 };
}

export function loadFor(state: Pick<CircuitAppState, 'loads'>, exerciseId: string): CircuitLoad {
  return state.loads[exerciseId] ?? defaultLoad(exerciseId);
}

/** Human label for a load — "14 kg" or "Medium band". */
export function loadLabel(load: CircuitLoad): string {
  return load.kind === 'band' ? `${BANDS[load.bandIndex]} band` : `${load.weight} kg`;
}
