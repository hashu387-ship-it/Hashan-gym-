import { addDays } from '../logic/dates';
import type { IcsEvent } from '../logic/ics';
import { DEFAULT_SETTINGS } from './defaults';

const s = DEFAULT_SETTINGS;
const W1 = s.startDate; // Sun 8 Nov 2026
const W2 = addDays(W1, 7);
const W3 = addDays(W1, 14);
const END = addDays(W1, 90); // Sat 6 Feb 2027

/** Daily schedule events with week-1 and week-2 sleep ramp (spec A4, B5). */
function ramp(uid: string, summary: string, times: [string, string, string], minutes: number, description?: string): IcsEvent[] {
  return [
    { uid: `${uid}-w1`, summary, description, from: W1, until: addDays(W2, -1), time: times[0], minutes },
    { uid: `${uid}-w2`, summary, description, from: W2, until: addDays(W3, -1), time: times[1], minutes },
    { uid: `${uid}-w3`, summary, description, from: W3, until: END, time: times[2], minutes },
  ];
}

export function workDayEvents(): IcsEvent[] {
  return [
    ...ramp('wake', 'Wake up', ['06:30', '06:15', '06:00'], 15, 'Glass of water and daylight.'),
    { uid: 'breakfast', summary: 'Breakfast', description: '2 chapatis, omelette, beef curry, tea without sugar.', from: W1, until: END, time: '07:50', minutes: 30 },
    { uid: 'lipo', summary: 'Lipo 6 - 1 capsule', description: 'Between meals. Never after 10 AM. No tea or coffee after 12.', from: W1, until: s.lipoEndDate, time: '09:00', minutes: 5 },
    { uid: 'lunch', summary: 'Lunch + 10 min walk', description: 'Protein first: tikka, tandoori or grilled fish, dal, salad, 1 chapati.', from: W1, until: END, time: '13:00', minutes: 30 },
    { uid: 'snack', summary: 'Snack', description: 'Greek yogurt or a whey shake, plus 1 fruit.', from: W1, until: END, time: '16:30', minutes: 15 },
    { uid: 'gym', summary: 'Gym - Body Masters', description: 'Open Hashan Fit for today\'s session and weights. Friday is rest.', from: W1, until: END, time: '19:00', minutes: 75, days: ['SU', 'MO', 'TU', 'WE', 'TH', 'SA'] },
    ...ramp('wind-down', 'Screens away', ['22:45', '22:15', '22:00'], 15, 'Wind down for sleep.'),
    ...ramp('sleep', 'Sleep', ['23:15', '22:45', '22:30'], 15),
    { uid: 'weigh-in', summary: 'Weigh-in', description: 'After the toilet, before food or water. Log it in Hashan Fit.', from: W1, until: END, time: '08:00', minutes: 10, days: ['FR'] },
  ];
}

export function ramadanEvents(): IcsEvent[] {
  const from = s.ramadanStart;
  const until = s.ramadanEnd;
  return [
    { uid: 'r-suhoor', summary: 'Suhoor', description: '3-egg omelette, 2 chapatis, laban, 750 ml water. Finish before Fajr.', from, until, time: '04:15', minutes: 30 },
    { uid: 'r-iftar', summary: 'Iftar', description: 'Dates, water, lentil soup. Maghrib moves from 17:44 to 18:00 - check your prayer app.', from, until, time: '17:45', minutes: 30 },
    { uid: 'r-gym', summary: 'Gym after taraweeh', description: 'Ramadan session, about 45 minutes.', from, until, time: '21:45', minutes: 45, days: ['SU', 'MO', 'TU', 'WE'] },
    { uid: 'r-sleep', summary: 'Sleep', description: 'Plus a 1.5-2 hour nap after Fajr or after work.', from, until, time: '23:30', minutes: 15 },
  ];
}
