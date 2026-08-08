import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getExercise } from '../data/exercises';
import { DAY_BY_ID, setsForWeek } from '../data/program';
import { startOfWeek, today as todayISO } from '../lib/date';
import { uid } from '../lib/format';
import { completedSets, lastPerformance } from '../domain/progression';
import { currentWeek } from '../domain/schedule';
import type {
  AppState,
  CardioSession,
  DayId,
  ExerciseEntry,
  Measurement,
  PhotoMeta,
  Readiness,
  RecoveryLog,
  Rir,
  Session,
  SetLog,
  Settings,
} from '../types';
import { idbStorage, putPhoto, removePhoto } from './storage';

const defaultSettings = (): Settings => ({
  unit: 'kg',
  blockStart: startOfWeek(todayISO()),
  restCompound: 150,
  restIsolation: 90,
  autoStartRest: true,
  sound: true,
  vibrate: true,
  askReadiness: true,
  restOverrides: {},
  reminders: {
    enabled: false,
    eveningBefore: '19:30',
    eveningBeforeOn: true,
    dayOf: '08:00',
    dayOfOn: true,
    missedOn: true,
    missedAt: '20:30',
    weeklyOn: true,
    weeklyAt: '18:00',
  },
});

const initialState: AppState = {
  settings: defaultSettings(),
  sessions: [],
  activeSessionId: null,
  variantChoice: {},
  cardio: [],
  measurements: [],
  photos: [],
  recovery: [],
  dismissed: [],
};

interface Actions {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  startSession: (dayId: DayId, date?: string) => string;
  resumeOrStart: (dayId: DayId, date?: string) => string;
  abandonSession: (id: string) => void;
  finishSession: (id: string) => void;
  setReadiness: (id: string, readiness: Readiness) => void;
  chooseVariant: (slotId: string, exerciseId: string) => void;
  logSet: (sessionId: string, slotId: string, index: number, weight: number, reps: number) => void;
  clearSet: (sessionId: string, slotId: string, index: number) => void;
  setRir: (sessionId: string, slotId: string, index: number, rir: Rir) => void;
  addSetRow: (sessionId: string, slotId: string) => void;
  removeSetRow: (sessionId: string, slotId: string) => void;
  setEntryWeight: (sessionId: string, slotId: string, weight: number) => void;
  setSetWeight: (sessionId: string, slotId: string, index: number, weight: number) => void;
  setEntryNotes: (sessionId: string, slotId: string, notes: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addCardio: (c: Omit<CardioSession, 'id'>) => void;
  deleteCardio: (id: string) => void;
  addMeasurement: (m: Omit<Measurement, 'id'>) => void;
  deleteMeasurement: (id: string) => void;
  addPhoto: (file: Blob, pose: PhotoMeta['pose'], date: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  logRecovery: (log: RecoveryLog) => void;
  dismiss: (key: string) => void;
  importAll: (data: Partial<AppState>) => void;
  resetAll: () => void;
}

export type Store = AppState & Actions;

/** Weight to pre-fill for set `index`, taken straight from last session. */
function prefillWeight(sessions: Session[], exerciseId: string, index: number): number {
  const last = lastPerformance(sessions, exerciseId);
  if (!last) return 0;
  const sets = completedSets(last.entry);
  if (!sets.length) return 0;
  return (sets[index] ?? sets[sets.length - 1]).weight;
}

function buildEntries(state: AppState, dayId: DayId, week: number): ExerciseEntry[] {
  const day = DAY_BY_ID[dayId];
  return day.slots.map((slot) => {
    const exerciseId = state.variantChoice[slot.slotId] ?? slot.variants[0];
    const targetSets = setsForWeek(slot.sets, week);
    const sets: SetLog[] = Array.from({ length: targetSets }, (_, i) => ({
      id: uid('set_'),
      weight: prefillWeight(state.sessions, exerciseId, i),
      reps: 0,
      rir: null,
      completedAt: 0,
      source: 'manual' as const,
    }));
    return {
      slotId: slot.slotId,
      exerciseId,
      targetSets,
      repMin: slot.repMin,
      repMax: slot.repMax,
      sets,
    };
  });
}

const mutateSession = (
  sessions: Session[],
  sessionId: string,
  fn: (s: Session) => Session,
): Session[] => sessions.map((s) => (s.id === sessionId ? fn(s) : s));

const mutateEntry = (
  session: Session,
  slotId: string,
  fn: (e: ExerciseEntry) => ExerciseEntry,
): Session => ({
  ...session,
  entries: session.entries.map((e) => (e.slotId === slotId ? fn(e) : e)),
});

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      startSession: (dayId, date = todayISO()) => {
        const state = get();
        const week = Math.max(1, currentWeek(state.settings.blockStart, date));
        const session: Session = {
          id: uid('s_'),
          dayId,
          week,
          date,
          startedAt: Date.now(),
          entries: buildEntries(state, dayId, week),
        };
        set({ sessions: [...state.sessions, session], activeSessionId: session.id });
        return session.id;
      },

      resumeOrStart: (dayId, date = todayISO()) => {
        const state = get();
        const existing = state.sessions.find(
          (s) => s.date === date && s.dayId === dayId && !s.finishedAt,
        );
        if (existing) {
          set({ activeSessionId: existing.id });
          return existing.id;
        }
        return get().startSession(dayId, date);
      },

      abandonSession: (id) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === id);
        const empty = session ? session.entries.every((e) => !completedSets(e).length) : true;
        set({
          // An untouched session is discarded rather than left as a ghost.
          sessions: empty ? state.sessions.filter((s) => s.id !== id) : state.sessions,
          activeSessionId: null,
        });
      },

      finishSession: (id) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, id, (s) => ({
            ...s,
            finishedAt: Date.now(),
            entries: s.entries.map((e) => ({
              ...e,
              // Drop unlogged placeholder rows so history stays clean.
              sets: e.sets.filter((x) => x.reps > 0),
              skipped: completedSets(e).length === 0,
            })),
          })),
          activeSessionId: null,
        }));
      },

      setReadiness: (id, readiness) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, id, (s) => ({ ...s, readiness })),
          recovery: [
            ...state.recovery.filter((r) => r.date !== state.sessions.find((s) => s.id === id)?.date),
            {
              date: state.sessions.find((s) => s.id === id)?.date ?? todayISO(),
              energy: readiness.energy,
              soreness: readiness.soreness,
              sleepHours: readiness.sleepHours,
              stress: readiness.stress,
            },
          ],
        }));
      },

      chooseVariant: (slotId, exerciseId) => {
        const state = get();
        set({ variantChoice: { ...state.variantChoice, [slotId]: exerciseId } });
        const active = state.activeSessionId;
        if (!active) return;
        set({
          sessions: mutateSession(get().sessions, active, (s) =>
            mutateEntry(s, slotId, (e) =>
              completedSets(e).length
                ? e
                : {
                    ...e,
                    exerciseId,
                    sets: e.sets.map((row, i) => ({
                      ...row,
                      weight: prefillWeight(state.sessions, exerciseId, i),
                    })),
                  },
            ),
          ),
        });
      },

      logSet: (sessionId, slotId, index, weight, reps) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({
              ...e,
              sets: e.sets.map((row, i) =>
                i === index ? { ...row, weight, reps, completedAt: Date.now() } : row,
              ),
            })),
          ),
        }));
      },

      clearSet: (sessionId, slotId, index) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({
              ...e,
              sets: e.sets.map((row, i) =>
                i === index ? { ...row, reps: 0, rir: null, completedAt: 0 } : row,
              ),
            })),
          ),
        }));
      },

      setRir: (sessionId, slotId, index, rir) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({
              ...e,
              sets: e.sets.map((row, i) => (i === index ? { ...row, rir } : row)),
            })),
          ),
        }));
      },

      addSetRow: (sessionId, slotId) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({
              ...e,
              sets: [
                ...e.sets,
                {
                  id: uid('set_'),
                  weight: e.sets[e.sets.length - 1]?.weight ?? 0,
                  reps: 0,
                  rir: null,
                  completedAt: 0,
                  source: 'manual' as const,
                },
              ],
            })),
          ),
        }));
      },

      removeSetRow: (sessionId, slotId) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => {
              const lastIndex = e.sets.length - 1;
              if (lastIndex < 1 || e.sets[lastIndex].reps > 0) return e;
              return { ...e, sets: e.sets.slice(0, lastIndex) };
            }),
          ),
        }));
      },

      setEntryWeight: (sessionId, slotId, weight) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({
              ...e,
              // Only unlogged rows follow the weight control.
              sets: e.sets.map((row) => (row.reps > 0 ? row : { ...row, weight })),
            })),
          ),
        }));
      },

      setSetWeight: (sessionId, slotId, index, weight) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({
              ...e,
              sets: e.sets.map((row, i) => (i === index ? { ...row, weight } : row)),
            })),
          ),
        }));
      },

      setEntryNotes: (sessionId, slotId, notes) => {
        set((state) => ({
          sessions: mutateSession(state.sessions, sessionId, (s) =>
            mutateEntry(s, slotId, (e) => ({ ...e, notes })),
          ),
        }));
      },

      updateSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }));
      },

      addCardio: (c) => set((state) => ({ cardio: [...state.cardio, { ...c, id: uid('c_') }] })),
      deleteCardio: (id) => set((state) => ({ cardio: state.cardio.filter((c) => c.id !== id) })),

      addMeasurement: (m) =>
        set((state) => ({
          measurements: [
            ...state.measurements.filter((x) => x.date !== m.date),
            { ...m, id: uid('m_') },
          ].sort((a, b) => (a.date < b.date ? -1 : 1)),
        })),
      deleteMeasurement: (id) =>
        set((state) => ({ measurements: state.measurements.filter((m) => m.id !== id) })),

      addPhoto: async (file, pose, date) => {
        const id = uid('p_');
        const blobKey = `photo_${id}`;
        await putPhoto(blobKey, file);
        const week = Math.max(1, currentWeek(get().settings.blockStart, date));
        set((state) => ({ photos: [...state.photos, { id, date, pose, week, blobKey }] }));
      },

      deletePhoto: async (id) => {
        const photo = get().photos.find((p) => p.id === id);
        if (photo) await removePhoto(photo.blobKey);
        set((state) => ({ photos: state.photos.filter((p) => p.id !== id) }));
      },

      logRecovery: (log) =>
        set((state) => ({
          recovery: [...state.recovery.filter((r) => r.date !== log.date), log].sort((a, b) =>
            a.date < b.date ? -1 : 1,
          ),
        })),

      dismiss: (key) =>
        set((state) => ({ dismissed: [...new Set([...state.dismissed, key])] })),

      importAll: (data) => {
        set((state) => ({
          settings: { ...state.settings, ...(data.settings ?? {}) },
          sessions: data.sessions ?? state.sessions,
          variantChoice: data.variantChoice ?? state.variantChoice,
          cardio: data.cardio ?? state.cardio,
          measurements: data.measurements ?? state.measurements,
          recovery: data.recovery ?? state.recovery,
          activeSessionId: null,
        }));
      },

      resetAll: () => set({ ...initialState, settings: defaultSettings(), hydrated: true }),
    }),
    {
      name: 'lift-state-v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        settings: state.settings,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        variantChoice: state.variantChoice,
        cardio: state.cardio,
        measurements: state.measurements,
        photos: state.photos,
        recovery: state.recovery,
        dismissed: state.dismissed,
      }),
      onRehydrateStorage: () => (state) => {
        // Fires whether or not stored state existed — either way we can render.
        state?.setHydrated(true);
      },
    },
  ),
);

// ── Derived helpers ─────────────────────────────────────────────────────────

export function bodyweightOn(state: AppState, date: string): number {
  const relevant = state.measurements
    .filter((m) => m.bodyweight && m.date <= date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return relevant[0]?.bodyweight ?? state.measurements.find((m) => m.bodyweight)?.bodyweight ?? 0;
}

export function restForExercise(settings: Settings, exerciseId: string, slotRest: number): number {
  const override = settings.restOverrides[exerciseId];
  if (override) return override;
  const compound = getExercise(exerciseId).kind === 'compound';
  const preference = compound ? settings.restCompound : settings.restIsolation;
  const reference = compound ? 150 : 90;
  // Slot prescriptions carry intent — a heavy squat rests longer than a row —
  // so scale them by how the athlete has tuned their default.
  return Math.round(slotRest * (preference / reference));
}
