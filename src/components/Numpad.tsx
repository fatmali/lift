import { useEffect, useState } from 'react';
import { num } from '../lib/format';
import { tick } from '../lib/notify';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

/**
 * An in-app keypad, because the system keyboard is the worst control in a
 * gym: small keys, half the screen lost to it, and it fights chalky fingers.
 * These keys are roughly four times the area and never move.
 */
export function Numpad({
  open,
  value,
  unit,
  step,
  onClose,
  onCommit,
}: {
  open: boolean;
  value: number;
  unit: string;
  step: number;
  onClose: () => void;
  onCommit: (n: number) => void;
}) {
  const [raw, setRaw] = useState('');

  useEffect(() => {
    if (open) setRaw(value ? `${value}` : '');
  }, [open, value]);

  const parsed = Number.parseFloat(raw);
  const current = Number.isFinite(parsed) ? parsed : 0;

  const press = (k: string) => {
    tick();
    setRaw((r) => {
      if (k === 'del') return r.slice(0, -1);
      if (k === '.' && r.includes('.')) return r;
      if (r.length > 6) return r;
      return r + k;
    });
  };

  const nudge = (delta: number) => {
    tick();
    setRaw(`${Math.max(0, Math.round((current + delta) * 100) / 100)}`);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Working weight">
      <div className="numpad__display num display">
        {raw === '' ? '0' : raw}
        <span className="numpad__unit">{unit}</span>
      </div>

      <div className="numpad__quick">
        {[-step * 2, -step, step, step * 2].map((d) => (
          <button key={d} type="button" className="chip" onClick={() => nudge(d)}>
            {d > 0 ? '+' : '−'}
            {num(Math.abs(d))}
          </button>
        ))}
      </div>

      <div className="numpad">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className="numpad__key"
            onClick={() => press(k)}
            aria-label={k === 'del' ? 'Delete' : k}
          >
            {k === 'del' ? <Icon name="back" size={20} /> : k}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        style={{ marginTop: 14, height: 58 }}
        onClick={() => {
          onCommit(current);
          onClose();
        }}
      >
        Set weight
      </button>
    </Sheet>
  );
}
