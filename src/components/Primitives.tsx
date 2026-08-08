import type { ReactNode } from 'react';
import { useEffect } from 'react';

export function Stat({
  value,
  unit,
  label,
  tone,
}: {
  value: ReactNode;
  unit?: string;
  label: string;
  tone?: 'done' | 'pr' | 'data';
}) {
  const color = tone ? `var(--${tone})` : undefined;
  return (
    <div className="stat">
      <div className="stat__value num" style={{ color }}>
        {value}
        {unit ? <span className="stat__unit">{unit}</span> : null}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      <p className="empty__body">{body}</p>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      className="switchrow"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ width: '100%', textAlign: 'left' }}
    >
      <span>
        <span style={{ fontSize: 15, fontWeight: 540 }}>{label}</span>
        {hint ? (
          <span className="tiny dim" style={{ display: 'block', marginTop: 2, lineHeight: 1.4 }}>
            {hint}
          </span>
        ) : null}
      </span>
      <span className={`switch ${checked ? 'switch--on' : ''}`} />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Notice({
  tone = 'default',
  icon,
  children,
}: {
  tone?: 'default' | 'data' | 'pr' | 'warn';
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`notice ${tone === 'default' ? '' : `notice--${tone}`}`}>
      {icon ? <span className="notice__icon">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section__head">
      <h2 className="section__title">{title}</h2>
      {action}
    </div>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(id);
  }, [message, onDone]);
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
