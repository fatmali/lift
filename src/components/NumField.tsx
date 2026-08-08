import { useEffect, useRef, useState } from 'react';

/**
 * Numeric input that tolerates half-typed values ("", "5.") without fighting
 * the keyboard — important when the gym floor is the input device.
 */
export function NumField({
  value,
  onChange,
  className,
  ariaLabel,
  selectOnFocus = true,
  allowDecimal = true,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  ariaLabel: string;
  selectOnFocus?: boolean;
  allowDecimal?: boolean;
}) {
  const [raw, setRaw] = useState(() => (value ? `${value}` : ''));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(value ? `${value}` : '');
  }, [value]);

  return (
    <input
      className={className}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      aria-label={ariaLabel}
      value={raw}
      placeholder="0"
      onFocus={(e) => {
        focused.current = true;
        if (selectOnFocus) e.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setRaw(value ? `${value}` : '');
      }}
      onChange={(e) => {
        const next = e.target.value.replace(',', '.');
        if (next !== '' && !/^\d*\.?\d*$/.test(next)) return;
        setRaw(next);
        const parsed = Number.parseFloat(next);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
