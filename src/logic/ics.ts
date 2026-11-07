import { addDays, weekday } from './dates';

export type IcsDay = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';
const DAY_CODES: IcsDay[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  /** First date the event can happen (YYYY-MM-DD, Riyadh) */
  from: string;
  /** Last date (inclusive) */
  until: string;
  /** HH:MM Riyadh time */
  time: string;
  minutes: number;
  /** Weekly on these days; daily when omitted */
  days?: IcsDay[];
}

const STAMP = '20261107T000000Z';

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Folds lines longer than 75 characters (RFC 5545). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return parts.join('\r\n');
}

const compact = (d: string) => d.replace(/-/g, '');

/** First date on or after `from` that falls on one of `days`. */
export function firstOccurrence(from: string, days?: IcsDay[]): string {
  if (!days) return from;
  let d = from;
  for (let i = 0; i < 7; i++) {
    if (days.includes(DAY_CODES[weekday(d)])) return d;
    d = addDays(d, 1);
  }
  return from;
}

/** UNTIL in UTC for 23:59:59 Riyadh time (UTC+3) on the given date. */
function untilUtc(d: string): string {
  return `${compact(d)}T205959Z`;
}

export function buildIcs(calendarName: string, events: IcsEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hashan Fit//Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Riyadh',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Riyadh',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:+03',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
  for (const e of events) {
    const start = firstOccurrence(e.from, e.days);
    const rule = e.days
      ? `RRULE:FREQ=WEEKLY;BYDAY=${e.days.join(',')};UNTIL=${untilUtc(e.until)}`
      : `RRULE:FREQ=DAILY;UNTIL=${untilUtc(e.until)}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@hashan-fit`,
      `DTSTAMP:${STAMP}`,
      `DTSTART;TZID=Asia/Riyadh:${compact(start)}T${e.time.replace(':', '')}00`,
      `DURATION:PT${e.minutes}M`,
      rule,
      `SUMMARY:${escapeText(e.summary)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(e.summary)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
