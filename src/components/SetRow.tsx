import { useEffect, useState } from 'react';
import type { Rir, SetLog } from '../types';
import { Icon } from './Icon';
import { NumField } from './NumField';

const RIR_OPTIONS: { value: Rir; label: string }[] = [
  { value: 4, label: '4+' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
  { value: 0, label: '0' },
];

export function SetRow({
  index,
  set,
  ghostReps,
  onLog,
  onClear,
  onWeight,
  onRir,
  rirOpen,
  onToggleRir,
}: {
  index: number;
  set: SetLog;
  ghostReps: number | null;
  onLog: (weight: number, reps: number) => void;
  onClear: () => void;
  onWeight: (weight: number) => void;
  onRir: (rir: Rir) => void;
  rirOpen: boolean;
  onToggleRir: () => void;
}) {
  const done = set.reps > 0;
  const suggested = ghostReps ?? 0;
  const [reps, setReps] = useState(() => set.reps || suggested);
  const [touched, setTouched] = useState(false);

  // Keep the pending value aligned with the prescription when it changes.
  useEffect(() => {
    if (!done && !touched) setReps(suggested);
  }, [suggested, done, touched]);

  const bump = (delta: number) => {
    setTouched(true);
    setReps((r) => Math.max(0, r + delta));
  };

  return (
    <li>
      <div className={`setrow ${done ? 'setrow--done' : ''}`}>
        <span className="setrow__index num">{index + 1}</span>

        <NumField
          className="setrow__weight num"
          value={set.weight}
          ariaLabel={`Set ${index + 1} weight`}
          onChange={(w) => (done ? onLog(w, set.reps) : onWeight(w))}
        />

        {done ? (
          <button
            type="button"
            onClick={onToggleRir}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              paddingLeft: 4,
              textAlign: 'left',
            }}
          >
            <span className="num" style={{ fontSize: 17, fontWeight: 640 }}>
              {set.reps}
            </span>
            <span className="tiny dim">reps</span>
            <span className={`pill ${set.rir === 0 ? 'pill--warn' : ''}`}>
              {set.rir === null ? 'RIR ?' : `RIR ${set.rir === 4 ? '4+' : set.rir}`}
            </span>
          </button>
        ) : (
          <div className="stepper">
            <button type="button" onClick={() => bump(-1)} aria-label="One rep fewer">
              −
            </button>
            <NumField
              className={`stepper__value num ${touched ? '' : 'stepper__ghost'}`}
              value={reps}
              allowDecimal={false}
              ariaLabel={`Set ${index + 1} reps`}
              onChange={(r) => {
                setTouched(true);
                setReps(r);
              }}
            />
            <button type="button" onClick={() => bump(1)} aria-label="One rep more">
              +
            </button>
          </div>
        )}

        <button
          type="button"
          className={`checkbtn ${done ? 'checkbtn--done' : ''}`}
          aria-label={done ? `Undo set ${index + 1}` : `Complete set ${index + 1}`}
          aria-pressed={done}
          onClick={() => {
            if (done) {
              onClear();
              setTouched(false);
              return;
            }
            if (reps <= 0) return;
            onLog(set.weight, reps);
          }}
        >
          <Icon name="check" size={20} />
        </button>
      </div>

      {done && rirOpen ? (
        <div className="rir">
          <span className="rir__label">RIR</span>
          {RIR_OPTIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              className={`rir__opt ${o.value === 0 ? 'rir__opt--zero' : ''} ${
                set.rir === o.value ? 'rir__opt--on' : ''
              }`}
              onClick={() => onRir(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
