import { useRef } from 'react';
import { clock, num } from '../lib/format';
import { tick } from '../lib/notify';
import type { Rir } from '../types';
import { Icon } from './Icon';

/**
 * The single primary control of a workout.
 *
 * It occupies the bottom of the screen and never moves — it only changes what
 * it says. Whatever you should do next is always in the same place and always
 * the biggest thing on screen: log the set, wait out the rest, or move on.
 *
 * The commit target is a zone rather than a button, so hitting it needs no
 * aim. Adjusting the numbers is a swipe rather than a tap on a small stepper,
 * because a coarse drag survives chalk, sweat and shaking hands — and each
 * increment is confirmed by a haptic tick, so the screen need not be read at
 * all. The ± buttons remain for anyone who would rather tap, and for
 * assistive technology.
 */

const REP_PX = 30;
const WEIGHT_PX = 46;
const TAP_SLOP = 12;

const RIR_OPTIONS: { value: Rir; label: string }[] = [
  { value: 4, label: '4+' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
  { value: 0, label: '0' },
];

export type ZoneState = 'log' | 'rest' | 'done';

export function LogZone({
  state,
  setNumber,
  totalSets,
  weight,
  reps,
  unit,
  unitSuffix,
  restRemaining,
  restDuration,
  restDone,
  lastRir,
  progressionText,
  isLastExercise,
  onLog,
  onAdjustReps,
  onAdjustWeight,
  onEditWeight,
  onSkipRest,
  onExtendRest,
  onUndo,
  onRir,
  onNext,
}: {
  state: ZoneState;
  setNumber: number;
  totalSets: number;
  weight: number;
  reps: number;
  unit: string;
  unitSuffix: string;
  restRemaining: number;
  restDuration: number;
  restDone: boolean;
  lastRir: Rir;
  progressionText: string | null;
  isLastExercise: boolean;
  onLog: () => void;
  onAdjustReps: (delta: number) => void;
  onAdjustWeight: (steps: number) => void;
  onEditWeight: () => void;
  onSkipRest: () => void;
  onExtendRest: (seconds: number) => void;
  onUndo: () => void;
  onRir: (rir: Rir) => void;
  onNext: () => void;
}) {
  const drag = useRef<{
    x: number;
    y: number;
    reps: number;
    weight: number;
    axis: null | 'x' | 'y';
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, reps: 0, weight: 0, axis: null };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;

    if (!d.axis) {
      if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return;
      d.axis = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x';
    }

    if (d.axis === 'y') {
      const steps = Math.round(-dy / REP_PX); // up adds reps
      if (steps !== d.reps) {
        onAdjustReps(steps - d.reps);
        d.reps = steps;
        tick();
      }
    } else {
      const steps = Math.round(dx / WEIGHT_PX); // right adds load
      if (steps !== d.weight) {
        onAdjustWeight(steps - d.weight);
        d.weight = steps;
        tick();
      }
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    // No axis was ever committed, so the finger never really moved: it is a tap.
    if (d && d.axis === null) onLog();
  };

  // ── Resting ─────────────────────────────────────────────────────────────
  if (state === 'rest') {
    const progress = restDuration > 0 ? Math.min(1, 1 - restRemaining / restDuration) : 1;
    return (
      <div className={`zone zone--rest ${restDone ? 'zone--rest-done' : ''}`}>
        <div className="zone__fill" style={{ width: `${progress * 100}%` }} />
        <div className="zone__body">
          <div className="zone__label caps">{restDone ? 'Rest complete' : 'Resting'}</div>
          <div className="zone__clock num display" aria-live="polite">
            {restDone ? 'GO' : clock(restRemaining)}
          </div>

          <div className="zone__next num">
            Next · set {setNumber} of {totalSets} · {num(weight)} {unit} × {reps}
          </div>

          <div className="zone__rir">
            <span className="caps">Last set RIR</span>
            <div className="zone__rirrow">
              {RIR_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  className={`rir__opt ${o.value === 0 ? 'rir__opt--zero' : ''} ${
                    lastRir === o.value ? 'rir__opt--on' : ''
                  }`}
                  onClick={() => onRir(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="zone__actions">
            <button type="button" className="btn btn--ghost" onClick={() => onExtendRest(30)}>
              +30s
            </button>
            {/* Nothing lights up until the rest is actually done — the bright
                button should reward waiting, not invite cutting it short. */}
            <button
              type="button"
              className={`btn ${restDone ? 'btn--primary' : 'btn--ghost'} zone__cta`}
              onClick={onSkipRest}
            >
              {restDone ? 'Next set' : 'Skip rest'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onUndo}>
              Undo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exercise finished ───────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <div className="zone zone--done">
        <div className="zone__body">
          <div className="zone__label caps">Exercise complete</div>
          {progressionText ? <div className="zone__msg">{progressionText}</div> : null}
          <div className="zone__actions">
            <button type="button" className="btn btn--ghost" onClick={onUndo}>
              Undo last set
            </button>
            <button type="button" className="btn btn--primary zone__cta" onClick={onNext}>
              {isLastExercise ? 'Finish workout' : 'Next exercise'}
              <Icon name="chevron" size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready to log ────────────────────────────────────────────────────────
  return (
    <div className="zone">
      <div className="zone__body">
        {/* The load was settled before the exercise began, so it is stated
            rather than asked again — only the reps change set to set. */}
        <div className="zone__setline">
          <span className="caps">
            Set {setNumber} of {totalSets}
          </span>
          <button
            type="button"
            className="zone__load"
            onClick={onEditWeight}
            aria-label={`Load ${weight} ${unit}. Tap to change.`}
          >
            <span className="num display">{num(weight)}</span>
            <span className="dial__unit">{unitSuffix}</span>
            <Icon name="chevronDown" size={13} className="zone__loadedit" />
          </button>
        </div>

        <div className="dialrow">
          <button
            type="button"
            className="dial__btn"
            aria-label="One rep fewer"
            onClick={() => onAdjustReps(-1)}
          >
            <Icon name="minus" size={20} />
          </button>
          <div className="dial__value dial__value--static">
            <span className="num display">{reps}</span>
            <span className="dial__unit">reps</span>
          </div>
          <button
            type="button"
            className="dial__btn"
            aria-label="One rep more"
            onClick={() => onAdjustReps(1)}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>

        <button
          type="button"
          className="zone__commit"
          aria-label={`Log set ${setNumber}: ${weight} ${unit} for ${reps} reps`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <Icon name="check" size={26} />
          Log set
        </button>

        <div className="zone__hint caps">Tap to log · drag up/down reps · left/right load</div>
      </div>
    </div>
  );
}
