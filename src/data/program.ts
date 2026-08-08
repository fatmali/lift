import type { DayId, Phase, WorkoutDay } from '../types';

export const BLOCK_WEEKS = 12;

/**
 * The 12-week block. Exercise selection is deliberately stable across all
 * twelve weeks — the variable that moves is load and reps, not the menu.
 */
export const PROGRAM: WorkoutDay[] = [
  {
    id: 'lowerA',
    name: 'Lower A',
    focus: 'Glute + Quad',
    short: 'A',
    weekday: 2, // Tuesday
    slots: [
      {
        slotId: 'a1',
        variants: ['back-squat', 'hack-squat'],
        sets: 4,
        repMin: 6,
        repMax: 8,
        restSec: 180,
      },
      { slotId: 'a2', variants: ['hip-thrust'], sets: 4, repMin: 8, repMax: 10, restSec: 150 },
      {
        slotId: 'a3',
        variants: ['bulgarian-split-squat'],
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 120,
      },
      { slotId: 'a4', variants: ['leg-press'], sets: 3, repMin: 10, repMax: 12, restSec: 120 },
      { slotId: 'a5', variants: ['leg-extension'], sets: 2, repMin: 12, repMax: 15, restSec: 90 },
      { slotId: 'a6', variants: ['cable-abduction'], sets: 3, repMin: 15, repMax: 20, restSec: 75 },
      {
        slotId: 'a7',
        variants: ['hanging-knee-raise'],
        sets: 3,
        repMin: 10,
        repMax: 15,
        restSec: 75,
        section: 'Core',
      },
    ],
  },
  {
    id: 'upper',
    name: 'Upper',
    focus: 'Back + Shoulders + Arms',
    short: 'U',
    weekday: 4, // Thursday
    slots: [
      {
        slotId: 'u1',
        variants: ['lat-pulldown', 'assisted-pull-up'],
        sets: 4,
        repMin: 8,
        repMax: 10,
        restSec: 150,
        section: 'Back',
      },
      {
        slotId: 'u2',
        variants: ['seated-cable-row'],
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 120,
        section: 'Back',
      },
      {
        slotId: 'u3',
        variants: ['chest-supported-row'],
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 120,
        section: 'Back',
      },
      {
        slotId: 'u4',
        variants: ['db-shoulder-press'],
        sets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 150,
        section: 'Shoulders',
      },
      {
        slotId: 'u5',
        variants: ['cable-lateral-raise'],
        sets: 4,
        repMin: 12,
        repMax: 20,
        restSec: 75,
        section: 'Shoulders',
      },
      {
        slotId: 'u6',
        variants: ['rear-delt-fly'],
        sets: 3,
        repMin: 12,
        repMax: 20,
        restSec: 75,
        section: 'Shoulders',
      },
      {
        slotId: 'u7',
        variants: ['incline-db-curl'],
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSec: 90,
        section: 'Biceps',
      },
      {
        slotId: 'u8',
        variants: ['hammer-curl'],
        sets: 2,
        repMin: 10,
        repMax: 15,
        restSec: 75,
        section: 'Biceps',
      },
      {
        slotId: 'u9',
        variants: ['cable-tricep-pushdown'],
        sets: 3,
        repMin: 10,
        repMax: 15,
        restSec: 90,
        section: 'Triceps',
      },
      {
        slotId: 'u10',
        variants: ['overhead-cable-extension'],
        sets: 2,
        repMin: 10,
        repMax: 15,
        restSec: 75,
        section: 'Triceps',
      },
    ],
  },
  {
    id: 'lowerB',
    name: 'Lower B',
    focus: 'Glute + Hamstring',
    short: 'B',
    weekday: 6, // Saturday
    slots: [
      {
        slotId: 'b1',
        variants: ['romanian-deadlift'],
        sets: 4,
        repMin: 6,
        repMax: 10,
        restSec: 180,
      },
      { slotId: 'b2', variants: ['hip-thrust'], sets: 3, repMin: 8, repMax: 12, restSec: 150 },
      { slotId: 'b3', variants: ['walking-lunge'], sets: 3, repMin: 10, repMax: 10, restSec: 120 },
      {
        slotId: 'b4',
        variants: ['seated-leg-curl', 'lying-leg-curl'],
        sets: 3,
        repMin: 10,
        repMax: 15,
        restSec: 90,
      },
      { slotId: 'b5', variants: ['step-up'], sets: 3, repMin: 8, repMax: 10, restSec: 105 },
      { slotId: 'b6', variants: ['cable-kickback'], sets: 3, repMin: 12, repMax: 15, restSec: 75 },
      { slotId: 'b7', variants: ['calf-raise'], sets: 3, repMin: 12, repMax: 15, restSec: 75 },
      {
        slotId: 'b8',
        variants: ['cable-crunch'],
        sets: 3,
        repMin: 10,
        repMax: 15,
        restSec: 75,
        section: 'Core',
      },
    ],
  },
];

export const DAY_BY_ID: Record<DayId, WorkoutDay> = Object.fromEntries(
  PROGRAM.map((d) => [d.id, d]),
) as Record<DayId, WorkoutDay>;

export const DAY_BY_WEEKDAY: Record<number, WorkoutDay> = Object.fromEntries(
  PROGRAM.map((d) => [d.weekday, d]),
);

export const PHASES: Phase[] = [
  {
    name: 'Accumulation',
    weeks: [1, 2, 3, 4],
    rirLabel: 'RIR 2–3',
    intent: 'Groove the movements and build the base. Leave reps in the tank.',
  },
  {
    name: 'Intensification',
    weeks: [5, 6, 7, 8],
    rirLabel: 'RIR 1–2',
    intent: 'Same movements, heavier bars. This is where the numbers move.',
  },
  {
    name: 'Peak',
    weeks: [9, 10, 11],
    rirLabel: 'RIR 0–2',
    intent: 'Top of the block. Push the last set, keep technique intact.',
  },
  {
    name: 'Deload',
    weeks: [12],
    rirLabel: 'RIR 3–4',
    intent: 'Fewer sets, lighter load. You grow this week, not next block.',
    deload: true,
  },
];

export function phaseForWeek(week: number): Phase {
  return PHASES.find((p) => p.weeks.includes(week)) ?? PHASES[0];
}

/** Deload weeks trim volume rather than intensity. */
export function setsForWeek(baseSets: number, week: number): number {
  return phaseForWeek(week).deload ? Math.max(2, Math.round(baseSets * 0.6)) : baseSets;
}

/** Lifts surfaced in the Progress tab, in display order. */
export const TRACKED_LIFTS: string[] = [
  'back-squat',
  'hack-squat',
  'hip-thrust',
  'romanian-deadlift',
  'bulgarian-split-squat',
  'lat-pulldown',
  'seated-cable-row',
  'db-shoulder-press',
  'incline-db-curl',
  'cable-tricep-pushdown',
];

/** Copy for reminders — witty, short, never guilt-inducing. */
export const REMINDER_COPY: Record<string, { title: string; body: string }> = {
  'before-lowerA': { title: 'Lower A tomorrow 🍑', body: 'Glutes and quads. Sleep well.' },
  'before-upper': {
    title: 'Upper body tomorrow',
    body: 'Back, shoulders and arms. Bring the intent.',
  },
  'before-lowerB': {
    title: 'Lower B tomorrow',
    body: 'Hamstrings have entered the chat.',
  },
  'day-lowerA': { title: 'Lower A', body: 'Time to make the numbers move.' },
  'day-upper': { title: 'Upper day', body: 'Build the back, shoulders and arms.' },
  'day-lowerB': { title: 'Glute + hamstring day', body: "Let's work." },
};
