# Redesign integration map

Groundwork for swapping Lift's visual system. This documents where every
design decision physically lives, so a new design system can be applied by
editing a known set of places rather than by reading 2,443 lines of CSS.

Nothing here prescribes a design. It describes the seams.

## Headline finding: the CSS is already tokenised

A redesign does **not** need a token-extraction refactor first. Across all
2,443 lines of `src/styles/app.css` there are only five hardcoded colour
values:

| Value | Meaning |
| --- | --- |
| `#fff` | one opaque white |
| `#08170f` | one dark green |
| `rgba(242, 238, 230, 0.22)` | chalk at 22% — an un-tokenised tint of `--text` |
| `rgba(0, 0, 0, 0.55)` | scrim |
| `rgba(0, 0, 0, 0.62)` | scrim |

Everything else routes through `src/styles/tokens.css`. That means **most of a
re-skin is a token-value swap**, and the work that remains is structural
(layout, component shape, new/removed elements) rather than a colour hunt.

The two scrims and the chalk tint are the only additions worth making to the
token file before a swap — otherwise they will silently keep the old palette's
black and cream.

## Where design lives

| Concern | File | Size |
| --- | --- | --- |
| Colour, type, radius, spacing, easing, shell metrics | `src/styles/tokens.css` | 81 lines |
| Reset, type roles (`.display` / `.caps` / `.num`), focus ring, reduced-motion | `src/styles/base.css` | 130 lines |
| Every component and screen style | `src/styles/app.css` | 2,443 lines |
| `@font-face` for Archivo | `src/styles/fonts.css` | 16 lines |
| Font binary | `public/fonts/archivo-latin.woff2` | preloaded in `index.html` |
| Theme colour, status bar, splash background | `index.html` | `#0b0b0c` in 3 places |
| PWA icons and theme | `public/manifest.webmanifest`, `public/favicon.svg`, `public/icon-{192,512}.png`, `public/apple-touch-icon.png` | |

`index.html` hardcodes `#0b0b0c` in `<meta name="theme-color">`, an inline
`html { background }`, and implicitly via `color-scheme: dark`. A palette
change must touch these or the browser chrome and first paint will flash the
old ground colour.

## Token contract

`tokens.css` is dark-only (`color-scheme: dark`) and organised as three
materials. Usage counts are `var()` references in `app.css`.

**Iron — ground and surfaces**

| Token | Value | Uses |
| --- | --- | --- |
| `--bg` | `#0b0b0c` | 7 |
| `--bg-soft` | `#0f1011` | 6 |
| `--surface` | `#131315` | 6 |
| `--surface-2` | `#191a1d` | 24 |
| `--surface-3` | `#212327` | 16 |
| `--line` | chalk @ 8% | 38 |
| `--line-strong` | chalk @ 16% | 16 |

**Chalk — text, primary action, completed work**

| Token | Value | Uses |
| --- | --- | --- |
| `--text` | `#f2eee6` | 17 |
| `--text-2` | `#98958e` | 20 |
| `--text-3` | `#67655f` | 38 |
| `--accent` / `--accent-ink` | `#f2eee6` / `#0b0b0c` | 9 / 5 |
| `--data` / `--data-soft` | `#d8d3c8` | 4 / 1 |
| `--done` / `--done-soft` | `#f2eee6` | 9 / 3 |

**Plate — the one accent**

| Token | Value | Uses |
| --- | --- | --- |
| `--pr` / `--pr-ink` / `--pr-soft` | `#c4362c` / `#ef7a6d` | 3 / 7 / 2 |
| `--warn` / `--warn-soft` | `#b8864a` | 7 / 3 |

The high-traffic tokens are `--line` and `--text-3` (38 each) and
`--surface-2` (24) — these three carry most of the app's visual character.

### The accent rule

`tokens.css` states it explicitly:

> The accent is the red of a 25 kg plate and it means exactly one thing:
> progression. Ready-to-progress, personal records, load going up. It is never
> used for chrome, state, or decoration — so when red appears on a screen, it
> is always because the athlete got stronger.

The primary action colour is therefore **chalk, not red** (`--accent` is
`#f2eee6`). Completed sets are chalked in, not coloured in — `app.css:1354`
comments "the accent is never spent on chrome."

**This is the highest-risk collision point in any redesign.** Most design
systems use their accent for primary buttons, active nav, focus, and selected
states. Adopting that convention here is not a neutral re-skin — it destroys a
deliberate semantic where red is earned. Worth an explicit decision rather than
an accident.

### Type

One family, three widths, driven by `font-stretch` on a variable font:

- `--w-display: 116%` — `.display`, weight 700, `-0.03em`. Loads read as
  stamped into metal.
- `--w-body: 100%` — body default.
- `--w-caps: 87%` — `.caps`, 10.5px, 600, `0.14em`, uppercase, `--text-3`.
  Column headings on a log sheet.

`.num` applies `tabular-nums` so figures don't jitter as they change.

A design system supplying a non-variable font, or one without a width axis,
cannot express this three-role system as written — `base.css` would need the
roles remapped to weight/size instead of width.

### Scale

Radii `--r-sm|md|lg|xl|full` = 8/12/18/24/999px.
Spacing `--sp-1..8` = 4/8/12/16/20/24/32/44px (note the jump: 24 → 32 → 44).
Shadows `--shadow-1..3`. Easing `--ease`, `--ease-out`.
Shell: `--app-w: 540px`, `--tabbar-h: 58px`.

## Layout and responsive

Mobile-first. Five media queries, at three breakpoints:

| Line | Breakpoint | What changes |
| --- | --- | --- |
| `app.css:1702` | `min-width: 760px` | side rail replaces the tab bar |
| `app.css:1967` | `min-width: 760px` | rail carries block position; hides duplicate |
| `app.css:1859` | `min-width: 900px` | training mode gains a named exercise rail |
| `app.css:2303` | `min-width: 900px` | load-decision layout |
| `app.css:1820` | `min-width: 1080px` | two content columns |

`App.tsx:97` renders **both** navigations unconditionally — `.sidenav` and
`.tabbar` — and CSS shows whichever suits the width. A redesign that changes
navigation must handle both, or delete one and its JSX.

## Screen and component inventory

Four tabs (`App.tsx:19`): Today, Progress, Body, Plan. Two full-screen modes
that bypass the shell entirely — `SessionView` (training) and `Completion` —
plus a `splash` while the store hydrates.

| Screen | Lines |
| --- | --- |
| `screens/Plan.tsx` | 533 |
| `screens/Today.tsx` | 507 |
| `screens/Body.tsx` | 501 |
| `screens/Progress.tsx` | 392 |
| `screens/Completion.tsx` | 203 |
| `screens/SessionView.tsx` | 189 |

Sixteen components. The largest and most design-dense:

| Component | Lines | Notes |
| --- | --- | --- |
| `ExerciseBlock.tsx` | 338 | |
| `LogZone.tsx` | 272 | the commit target — "a zone, not a button" |
| `LineChart.tsx` | 175 | hand-rolled SVG; no chart library |
| `Primitives.tsx` | 132 | includes `Toast` |
| `Numpad.tsx` | 96 | |
| `Icon.tsx` | 89 | inline SVG sprite, size-prop driven |
| `LoadChoice.tsx` | 65 | |
| `RestBar.tsx` | 62 | |

`LineChart` and `Icon` are drawn in code, not assets — restyling them means
editing TSX, not CSS.

### CSS class families

`app.css` uses flat BEM-ish families, largest first: `zone` (17 selectors),
`restbar` (10), `choiceopt` (10), `manifest` (8), `loadrec` (8), `chart` (7),
`btn` (7), `weightctl` (5), `setchip` (5), `session` (5), `rir` (5), `pill`
(5), `numpad` (5), `notice` (5), `exnav` (5).

No CSS modules, no framework, no scoping — class names are global. Renaming a
family means a coordinated TSX + CSS change.

### "Gym mode" — the load-bearing interaction

`app.css:1973` onward is a distinct subsystem, and the part of the app most
tied to its physical context:

> The bottom of the training screen is one control that never moves.

It comprises set chips, the zone, 64px weight/reps dials either side of a
large readout, the commit zone, the resting state, the numpad, and the load
decision. Roughly 470 lines. This is the app's core loop and the place where a
generic design system is most likely to produce something worse — the sizing
is driven by using a phone with chalked hands mid-set, not by a spacing scale.

## Constraints a new design system must respect

- **Dark-only.** `color-scheme: dark` is declared and there is no light
  palette anywhere. A light or dual-mode kit needs new work, not a swap.
- **Touch targets.** Dials are 64px by intent (`app.css:2099`).
- **Reduced motion** is honoured globally (`base.css:122`); new animation must
  stay inside that guard.
- **Focus ring** is `2px solid var(--data)` with 2px offset (`base.css:66`).
- **No text selection / tap highlight** — deliberate (`base.css:24`).
- **Scrollbars hidden** (`base.css:117`).
- **Tabular numerals** on all figures.
- **iOS PWA**: `viewport-fit=cover`, `black-translucent` status bar, so safe-area
  insets matter for anything pinned to an edge.

## Suggested order of work, once the design lands

1. Add the three un-tokenised values (two scrims, chalk tint) to `tokens.css`.
2. Swap token values; leave names alone. Re-check the whole app — this alone
   will reveal most of the delta.
3. Resolve the accent-semantics question above before touching components.
4. Reconcile type: does the new family have a width axis? If not, remap the
   three roles in `base.css`.
5. Update `index.html` (×3), the manifest, and the icons.
6. Only then take on structural component changes, gym mode last — it is the
   highest-risk and benefits from the rest being settled.
