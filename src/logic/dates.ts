/** Date helpers. Every date is a YYYY-MM-DD string in Riyadh time (UTC+3, no daylight saving). */

const TZ = 'Asia/Riyadh';

export function todayRiyadh(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function riyadhHour(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(now));
}

function toUtc(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  return fromUtc(toUtc(d) + n * 86_400_000);
}

/** Whole days from b to a (a - b). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
}

/** 0 = Sunday ... 6 = Saturday */
export function weekday(d: string): number {
  return new Date(toUtc(d)).getUTCDay();
}

export function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && fromUtc(toUtc(d)) === d;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function dayName(d: string): string {
  return DAYS[weekday(d)];
}

/** "Sun 8 Nov" */
export function shortDate(d: string): string {
  const [, m, day] = d.split('-').map(Number);
  return `${DAYS[weekday(d)].slice(0, 3)} ${day} ${MONTHS[m - 1]}`;
}

/** "8 Nov" */
export function dayMonth(d: string): string {
  const [, m, day] = d.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]}`;
}

/** Converts a Date to "HH:MM" in Riyadh time. */
export function riyadhTime(iso: string | Date): string {
  const dt = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(dt);
}

/** Riyadh calendar date of an instant. */
export function riyadhDateOf(iso: string | Date): string {
  return todayRiyadh(typeof iso === 'string' ? new Date(iso) : iso);
}
