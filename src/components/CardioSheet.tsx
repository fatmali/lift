import { useState } from 'react';
import { today as todayISO } from '../lib/date';
import { useStore } from '../store/useStore';
import type { CardioType, Level } from '../types';
import { Sheet } from './Sheet';

const TYPES: { value: CardioType; label: string }[] = [
  { value: 'easy', label: 'Easy cardio' },
  { value: 'run', label: '5K / Run' },
  { value: 'padel', label: 'Padel' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'other', label: 'Other' },
];

const EFFORTS: { value: Level; label: string }[] = [
  { value: 'low', label: 'Easy' },
  { value: 'medium', label: 'Moderate' },
  { value: 'high', label: 'Hard' },
];

export function CardioSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCardio = useStore((s) => s.addCardio);
  const [type, setType] = useState<CardioType>('easy');
  const [minutes, setMinutes] = useState(25);
  const [effort, setEffort] = useState<Level>('low');

  return (
    <Sheet open={open} onClose={onClose} title="Log cardio">
      <div className="stack" style={{ gap: 20 }}>
        <div className="field">
          <span className="field__label">Type</span>
          <div className="chiprow" style={{ flexWrap: 'wrap' }}>
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`chip ${type === t.value ? 'chip--on' : ''}`}
                onClick={() => setType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Minutes</span>
          <div className="chiprow">
            {[15, 20, 25, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${minutes === m ? 'chip--on' : ''}`}
                onClick={() => setMinutes(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Effort</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {EFFORTS.map((e) => (
              <button
                key={e.value}
                type="button"
                className={`btn btn--ghost ${effort === e.value ? 'btn--primary' : ''}`}
                style={{ height: 46 }}
                onClick={() => setEffort(e.value)}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <p className="tiny dim" style={{ lineHeight: 1.5 }}>
          Cardio supports the training — it does not replace it. One to two easy sessions a week is
          the target; hard conditioning close to leg days will cost you reps.
        </p>

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            addCardio({ date: todayISO(), type, minutes, effort });
            onClose();
          }}
        >
          Save session
        </button>
      </div>
    </Sheet>
  );
}
