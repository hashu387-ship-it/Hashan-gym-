// Writes the two calendar files served from /public (spec B5).
import { writeFileSync } from 'node:fs';
import { buildIcs } from '../src/logic/ics';
import { ramadanEvents, workDayEvents } from '../src/plan/calendar';

writeFileSync('public/work-days.ics', buildIcs('Hashan Fit', workDayEvents()));
writeFileSync('public/ramadan.ics', buildIcs('Hashan Fit - Ramadan', ramadanEvents()));
console.log('calendar files written');
