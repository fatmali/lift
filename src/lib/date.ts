/** Local-date helpers. Everything is stored as "YYYY-MM-DD" in local time. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toISODate(new Date());
}

export function addDays(s: string, n: number): string {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Monday-based start of week. */
export function startOfWeek(s: string): string {
  const d = fromISODate(s);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** The next date falling on `weekday`; today counts if it already matches. */
export function nextWeekday(weekday: number, from: string = today()): string {
  const delta = (weekday - weekdayOf(from) + 7) % 7;
  return addDays(from, delta);
}

export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function weekdayOf(s: string): number {
  return fromISODate(s).getDay();
}

/** "Tue 12 Aug" */
export function formatDate(s: string): string {
  const d = fromISODate(s);
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "12 Aug" */
export function formatShort(s: string): string {
  const d = fromISODate(s);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "Today" / "Yesterday" / "Tue 12 Aug" */
export function formatRelativeDay(s: string): string {
  const diff = daysBetween(s, today());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  return formatDate(s);
}

export function minutesBetween(a: number, b: number): number {
  return Math.max(0, Math.round((b - a) / 60_000));
}

/** "HH:MM" -> minutes since midnight */
export function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${`${m}`.padStart(2, '0')} ${suffix}`;
}
