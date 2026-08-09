# Lift

A personal training companion built as an offline-first, mobile-first PWA.

Not a workout database. The whole app is one loop:

> Open it. See what you're doing today. Start. Move through it. Check things off. Done.

It answers two questions — **what am I training today?** and **what am I eating today?** — and
tries very hard not to ask anything else. Success is **consistency, getting stronger, and eating
enough protein**, never calories burned or scale weight.

---

## The week

| Day | Focus |
| --- | --- |
| Tuesday | **Glutes + Quads** |
| Thursday | **Shoulders + Back + Arms** |
| Saturday | **Glutes + Hamstrings** |

The muscle focus *is* the name — there is no "Lower A" to decode. That string is what Today shows
as its headline, and you can rename it.

**The plan is yours, not a constant.** In Plan, tap any workout to rename its focus, move it to
another day, switch it between functional and strength, change rounds and length, remove exercises
or add from the library. Add a workout and it takes the first free weekday; remove one and the day
becomes a rest day. Today follows whatever is scheduled for the day you are actually on — move
Tuesday's session to Friday and Tuesday becomes a genuine rest day, showing what's next and a way
into it.

## Functional is the default

A workout is a **circuit of rounds**, not a set-by-set logger:

```
ROUND 1 / 3
☐ Goblet Squat        12 reps · 12 kg
☐ Romanian Deadlift   12 reps · 20 kg
☐ Reverse Lunge       20 total · 10 kg
☐ Hip Thrust          12 reps · 40 kg
☐ Lateral Band Walk   20 total · Medium band
☐ Dead Bug            40 sec
```

Do the movement, tap the box. No entering reps the plan already specifies, no manually advancing
through sets. Tick the last one and the rest screen appears on its own with the clock already
running; skip it whenever you like. Three rounds and you're done.

Rep prescriptions follow the way the training actually goes: bilateral movements at ~12 reps,
unilateral at ~20 total (10 a side).

**Weight is secondary, and it remembers itself.** Tap an exercise name to open it full screen: a
big −/+ stepper at the equipment's own increment, the load carried over from last time, and one
short form cue. Band work steps through Light/Medium/Heavy instead of kilograms, because not
everything progresses in weight. Where there's a reason to nudge, it says so once and leaves the
choice alone.

**Timed work times itself.** Anything prescribed in seconds gets a built-in countdown — one Start
button, and it checks itself off when it hits zero. Nobody watches a clock.

Built for the gym floor: 52px checkboxes, 68px steppers, a 60px primary action, and the screen
stays awake for the whole session. You can use it holding a dumbbell, out of breath, looking at it
for two seconds.

## Strength mode, for the days that want it

Set a day to **strength** and it runs the app's full set-by-set logger instead — weight and reps
per set, RIR asked during the rest, records computed from the log. It is the same detailed system
described below, unchanged; functional days simply never see it.

**Double progression, asked as a choice rather than as arithmetic.** Hit the top of the prescribed
rep range on every set at the same load and you are ready to progress. Rather than handing over an
open-ended weight dial and a line of advice, the app offers two concrete options before the
exercise starts, each with its load, its rep target and the reason it exists:

> **Ready to progress** — 4 × 8 at 60 kg last time. Every set at the top of the range.
> **↑ 62.5 kg** · aim 6–8 · *Add load* — reps will drop at first; that is the point, they climb back.
> **60 kg** · aim 8+ · *Stay here* — repeat the weight and add reps instead.

Nothing is applied until you pick, so the app never quietly adds load on your behalf. The same
mechanism handles falling short of the range, and a first-ever session. If you report low energy in
the readiness check, the suggested option changes from the jump to holding, and says why.

Because the load is settled once per exercise, the logger only asks about reps — the thing that
actually varies set to set. Swipe the log zone for reps and load without reading the screen, the
system keyboard never opens, the rest clock is the size of the screen, and undo is always one tap
away.

## Fuel

Nutrition is part of the same system rather than a second app.

- **Fasting** — a 14:10 window by default, shown as a live clock on Today. It is *derived from the
  two times you set*, not tracked as a stopwatch, so it keeps running whether or not the app is
  open. End it by hand whenever you actually eat. The app makes no claims about what fasting does;
  it is a schedule, not a cure.
- **Protein** — a meter that fills from meals you tick off, against a daily target.
- **The week's meals** — three a day, marked training or rest depending on what your plan says for
  that weekday. Training days carry more carbohydrate; rest days somewhat less. Nothing is
  eliminated.
- **Recipes** — macros, prep and cook time, ingredients, method, and swaps that keep the numbers
  (chicken → tilapia / lean beef / tuna / eggs; rice → potatoes / sweet potato / ugali / wrap).
- **Shopping list** — grouped the way a shop is walked, with quantities, checkable as you go.

The meals are high protein, high fibre, practical and Kenyan-friendly.

## Progress tells a story

Not fourteen charts. One page that says what actually happened:

- **Strength** — the loads that moved, first logged weight → most recent. Only appears once an
  exercise has been trained twice; one session is a data point, not a trend.
- **Consistency** — sessions kept over the trailing four weeks.
- **Muscle focus** — completed exercise-rounds per muscle group, so you can see what's carrying the
  block and what's thin.
- **Body** — weight, waist and hips as trends across your readings rather than daily numbers, plus
  private progress photos.

Until there is enough history to say something true, it says so plainly instead of inventing a
number.

Load history is **snapshotted onto each session when you finish it**, so editing your plan or your
working weights later cannot retroactively rewrite what a past workout was.

## Navigation

Three destinations, not four.

- **Today** — the training card, the fasting clock, the day's fuel, one progress insight.
- **Progress** — the story above, with Body inside it.
- **Plan** — your week and its editor, the exercise library, strength sessions, meal plan, shopping
  list, fasting window.

Body has no tab of its own and nutrition has no tab of its own; both live where you already are.

## Layout

One codebase, two shapes. Below 760px it is a phone app: bottom tab bar, single column, bottom
sheets. Above that the tab bar becomes a persistent side rail and sheets become centred dialogs.
Body additionally splits into two columns at 1080px.

Verified with no horizontal overflow from 320px to 1600px.

## Data

Everything is local. There is no backend and no network request.

- Circuit plan, sessions, working loads, logged meals, shopping basket and fasting window →
  **IndexedDB** (`lift-circuit-v1`) via `zustand/persist`.
- Strength sessions, sets, reps, RIR, measurements, recovery and preferences → **IndexedDB**
  (`lift-state-v1`), same mechanism.
- Progress photos → a **separate IndexedDB store** as blobs. Never uploaded, never analysed.
- Rest timer → `localStorage`, stored as an end timestamp so it survives a locked screen or reload.

The two stores are kept separate on purpose: a round you tick off and a set you log are different
shapes, and forcing one schema to carry both would bend the strength side out of shape for no
benefit.

Set logs carry a `source` field (`manual` | `import`) so a future Apple Watch / HealthKit import can
write sets without a schema migration. Manual logging only, by design.

## Architecture

```
src/
  data/        circuit exercises + plan, strength program, exercise library, meal plan & recipes
  domain/      pure logic: circuit progress, nutrition & fasting, progression, PRs, scheduling
  store/       two zustand stores, IndexedDB persistence, rest timer
  components/  reusable UI (set row, exercise block, charts, sheets)
  screens/     Today, CircuitSession, CircuitCompletion, Progress, Plan, PlanEditor,
               Meals, Recipe, Shopping, Library, Fasting, StrengthSessions, SessionView, Body
  styles/      design tokens, base, components
  check.ts     domain checks (npm run check) — covers the strength domain
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

```bash
npm run deploy
```

Builds locally and force-pushes the result to the `gh-pages` branch, which Pages serves directly.
That branch holds build output only — it is not part of the source history and is replaced wholesale
on every deploy.

GitHub Pages serves project sites from `/<repo>/` rather than a domain root, so the build passes the
repository name through as `BASE_PATH`. `vite.config.ts` defaults that to `/`, and the manifest,
service worker and notification icons all resolve their paths at runtime — so the same source
deploys unchanged to a domain root, a custom domain, or any static host.

```bash
BASE_PATH=/lift/ npm run build && BASE_PATH=/lift/ npm run preview   # reproduce the Pages build
```

## Design

**Nocturne.** A quiet, compact dark interface: a near-neutral blue-grey ground (`#161826`), warm
off-white text (`#E9E9ED`), soft 8px radii, and a single accent — a blurple `#9184D9` — carried as a
line and a glow rather than a flood. Primary actions are outlined, never filled. Contrast comes from
the tonal ramps rather than from saturation.

**The accent means something.** It marks progression and completion — a load going up, a box
ticked, a round done, a fast complete. It is not spent on decoration.

**Inter, self-hosted**, at medium weight. Hierarchy is size and space rather than heavier type:
headings sit at 560 and are never bolded past it. Numerals are tabular throughout, because every
screen in this app is a column of numbers that has to line up.

**Editorial, not chrome.** Flush-left headings, generous spacing, hairline rules instead of boxes.
Today opens on a 40px muscle-focus headline and a list you can read in seconds — not on a greeting,
a dashboard, or a wall of cards. Almost nothing is a card; most things are just a line of type with
room around it.

The app has to be readable at arm's length, mid-set, under bad gym lighting.
