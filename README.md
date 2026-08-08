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

## Deploying

Pushing to the default branch builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`.

GitHub Pages serves project sites from `/<repo>/` rather than a domain root, so the workflow passes
the repository name through as `BASE_PATH` at build time. `vite.config.ts` defaults that to `/`, and
the manifest, service worker and notification icons all resolve their paths at runtime — so the same
source deploys unchanged to a domain root, a custom domain, or any static host.

```bash
BASE_PATH=/lift/ npm run build && BASE_PATH=/lift/ npm run preview   # reproduce the Pages build
```

## Design

**Direction: meet card.** The app is modelled on the artifact it replaces — a training ledger. The
materials of the subject set the palette: iron, chalk, and calibrated plates.

**Three colours.** Iron for ground and surfaces, chalk `#F2EEE6` for text, primary action *and*
completed sets, and one accent — plate red `#C4362C`, the colour of a 25 kg disc. The accent is
reserved **exclusively for progression**: ready-to-progress, personal records, load going up. It is
never spent on chrome, navigation or state. When red appears on a screen, it is always because the
numbers moved. Training days are told apart by their letter mark and their type, not by hue.

**One typeface, three widths.** Archivo, self-hosted as a single variable file carrying both weight
and width axes. Display runs wide and heavy (`wdth 116 / wght 700`) so loads read as stamped into
metal; body sits at normal width; utility labels run narrow in caps like the column headings on a
log sheet. The pairing is by width rather than by style, which is the training thesis in
typographic form — the same movement, loaded heavier. Numerals are tabular throughout, because
every screen in this app is a column of numbers that has to line up.

**The load line.** The signature element: a lift's block history set as a ledger rather than a
chart — the load stamped above a continuous rule, the reps and week beneath, and a red tick on the
weeks the bar got heavier. It appears once, at the top of the selected lift in Progress, so it
stays the thing the app is remembered by.

**The hero is the manifest.** Today opens on the loads you are actually walking into, pulled from
your last session, with an arrow against anything that topped its rep range — not on a greeting or
a headline number.

Everything else stays quiet: large touch targets, generous spacing, and no decoration that does not
carry information. The app has to be readable at arm's length, mid-set, under bad gym lighting.
