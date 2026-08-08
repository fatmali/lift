export function uid(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}

/** Trims trailing zeros: 52.5 -> "52.5", 50 -> "50". */
export function num(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals;
  return `${rounded}`;
}

export function volume(n: number): string {
  if (n >= 100_000) return `${Math.round(n / 1000)}k`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

export function duration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${`${m}`.padStart(2, '0')}m`;
  return `${m}:${`${s}`.padStart(2, '0')}`;
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${`${s % 60}`.padStart(2, '0')}`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
