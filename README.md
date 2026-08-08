# Lift

A personal strength training system built as an offline-first, mobile-first PWA.

Not a generic fitness tracker: it runs one specific 12-week hypertrophy block, three days a week,
and measures success by **consistency, progressive overload and recovery** — never by calories
burned or scale weight.

---

## The block

| Day | Session | Focus |
| --- | --- | --- |
| Tuesday | **Lower A** | Glute + Quad |
| Thursday | **Upper** | Back + Shoulders + Arms |
| Saturday | **Lower B** | Glute + Hamstring |

The exercise selection is **fixed for all twelve weeks**. Stable movements are the only way to know
whether you actually got stronger. What moves is load and reps.

Periodisation is built in:

| Weeks | Phase | Effort |
| --- | --- | --- |
| 1–4 | Accumulation | RIR 2–3 |
| 5–8 | Intensification | RIR 1–2 |
| 9–11 | Peak | RIR 0–2 |
| 12 | Deload | RIR 3–4, sets cut ~40% |

Priorities are reflected in the set allocation: glutes lead, hamstrings and back are built
deliberately, arms sit at 5–8 direct weekly sets each — proportional, not maximal.

## How it works

**Double progression.** Hit the top of the prescribed rep range on *every* set at the *same* load,
and the exercise is flagged as ready to progress, on the dashboard and in the logger, with a
suggested next jump. The app never changes a weight on its own — you decide.

**Fast logging.** Weight is pre-filled from your last session; reps default to what you did last
time at that set number. One tap on the ✓ saves the set, starts the rest timer and moves on. RIR is
a five-chip row that appears after the set — optional, never blocking.

**Last time, always visible.** Every exercise shows `55 kg · 10 / 10 / 9 / 8` from your previous
session, inline, before you lift anything.

**Records, computed not stored.** Heaviest load, rep PR at a given weight, session volume and
estimated 1RM are all derived from the raw set log, so history stays the single source of truth.
Multiple records on one lift in one session are grouped into one achievement.

**Recovery is part of the program.** A two-tap energy/soreness check before a session suggests a
load adjustment when you are beaten up — a suggestion, never a diagnosis. Repeatedly taking
compound work to RIR 0 gets a gentle note, not a gold star.

**Missed sessions are handled, not punished.** A missed day offers "train it today" or "move on",
and a session shifted to another day of the same week still counts toward that week.

## Screens

- **Today** — today's session, next session, week 2/3, week streak, ready-to-progress queue,
  recent PRs, 12-week block indicator, conditioning.
- **Session** — full-screen training mode: readiness check, one exercise at a time, set rows,
  rest timer, completion summary.
- **Progress** — per-lift charts (top weight / est. 1RM / volume / reps), weekly summaries,
  weekly sets by muscle group, 12-week consistency grid, PR log.
- **Body** — measurements, private progress photos (front/side/back with comparison), recovery
  check-ins, conditioning log.
- **Plan** — the full program, rest defaults, reminders, unit, export/import/reset.

## Data

Everything is local. There is no backend and no network request.

- App state (sessions, sets, reps, weights, RIR, measurements, recovery, preferences) →
  **IndexedDB** via `zustand/persist`.
- Progress photos → a **separate IndexedDB store** as blobs. They are never uploaded and never
  analysed.
- Rest timer → `localStorage`, stored as an end timestamp so it survives a locked screen or reload.

Export produces a JSON backup of everything except photos.

Set logs carry a `source` field (`manual` | `import`) so a future Apple Watch / HealthKit import can
write sets without a schema migration. V1 is manual logging only, by design.

## Architecture

```
src/
  data/        exercise library + the 12-week program (the only seeded content)
  domain/      pure logic: progression, PRs, scheduling, statistics
  store/       zustand store, IndexedDB persistence, rest timer
  components/  reusable UI (set row, exercise block, charts, sheets)
  screens/     Today, Session, Completion, Progress, Body, Plan
  styles/      design tokens, base, components
  check.ts     domain checks (npm run check)
```

`domain/` is free of React and of storage concerns, which is what makes it directly testable.

## Running it

```bash
npm install
npm run dev      # development
npm run check    # domain checks
npm run build    # typecheck + production build
npm run preview  # serve the build
```

Install it to your home screen for standalone display, offline use and notifications. On iOS,
notifications require the app to be added to the Home Screen first.

## Design

Dark, near-black ground; one warm off-white for primary action; one indigo for data; gold reserved
for records. Large touch targets, tabular numerals, and no decoration that does not carry
information — the app has to be readable at arm's length, mid-set, under bad gym lighting.
