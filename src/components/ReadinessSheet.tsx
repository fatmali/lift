import { useState } from 'react';
import { readinessAdvice } from '../domain/readiness';
import type { Level, Readiness } from '../types';
import { Sheet } from './Sheet';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function ReadinessSheet({
  open,
  onSkip,
  onSubmit,
}: {
  open: boolean;
  onSkip: () => void;
  onSubmit: (r: Readiness) => void;
}) {
  const [energy, setEnergy] = useState<Level>('medium');
  const [soreness, setSoreness] = useState<Level>('low');
  const [sleep, setSleep] = useState<number | null>(null);

  const advice = readinessAdvice({ energy, soreness });

  return (
    <Sheet open={open} onClose={onSkip} title="How are you turning up?">
      <div className="stack" style={{ gap: 20 }}>
        <Row label="Energy" value={energy} onChange={setEnergy} />
        <Row label="Soreness" value={soreness} onChange={setSoreness} />

        <div className="field">
          <span className="field__label">Sleep last night (optional)</span>
          <div className="chiprow">
            {[5, 6, 7, 8, 9].map((h) => (
              <button
                key={h}
                type="button"
                className={`chip ${sleep === h ? 'chip--on' : ''}`}
                onClick={() => setSleep(sleep === h ? null : h)}
              >
                {h === 5 ? '≤5h' : h === 9 ? '9h+' : `${h}h`}
              </button>
            ))}
          </div>
        </div>

        <div className={`notice ${advice.tone === 'default' ? '' : `notice--${advice.tone}`}`}>
          {advice.text}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn--ghost" onClick={onSkip} style={{ flex: 1 }}>
            Skip
          </button>
          <button
            type="button"
            className="btn btn--primary"
            style={{ flex: 2 }}
            onClick={() => onSubmit({ energy, soreness, sleepHours: sleep ?? undefined })}
          >
            Start workout
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Level;
  onChange: (v: Level) => void;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            className={`btn btn--ghost ${value === l.value ? 'btn--primary' : ''}`}
            style={{ height: 48 }}
            onClick={() => onChange(l.value)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
