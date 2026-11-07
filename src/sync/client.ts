import { addDays, todayRiyadh } from '../logic/dates';
import type { BandDay } from '../db/queries';
import {
  civilRange,
  mapCalories,
  mapRestingHr,
  mapSleep,
  mapSteps,
  type ListResponse,
  type RestingHrPoint,
  type RollupResponse,
  type SleepPoint,
} from './map';

const API = 'https://health.googleapis.com/v4/users/me/dataTypes';

export type SyncErrorKind = 'not_connected' | 'reconnect' | 'not_configured' | 'not_linked' | 'missing_scope' | 'network' | 'google';

export class SyncError extends Error {
  constructor(public kind: SyncErrorKind, message: string) {
    super(message);
  }
}

export const SYNC_MESSAGES: Record<SyncErrorKind, string> = {
  not_connected: 'Fitbit is not connected.',
  reconnect: 'Fitbit connection expired. Tap Reconnect.',
  not_configured: 'Fitbit sync is not set up yet. Follow the Google Health setup guide.',
  not_linked: 'Open the Google Health app on your iPhone and finish its setup, then sync again.',
  missing_scope: 'Some permissions were not given. Reconnect and tick every box.',
  network: 'No connection. The app will try again later.',
  google: 'Google Health had a problem. Try again in a few minutes.',
};

export interface SyncDeps {
  fetchFn?: typeof fetch;
  now?: Date;
}

let cached: { token: string; until: number } | null = null;
let inflight: Promise<string> | null = null;

export function clearTokenCache(): void {
  cached = null;
  inflight = null;
}

/** One token request at a time; parallel callers share it. */
function accessToken(fetchFn: typeof fetch, now: number): Promise<string> {
  if (cached && cached.until > now) return Promise.resolve(cached.token);
  if (!inflight) {
    const p = requestToken(fetchFn, now);
    inflight = p;
    p.then(() => undefined, () => undefined).finally(() => {
      if (inflight === p) inflight = null;
    });
  }
  return inflight;
}

async function requestToken(fetchFn: typeof fetch, now: number): Promise<string> {
  let res: Response;
  try {
    res = await fetchFn('/api/token', { method: 'POST', credentials: 'same-origin' });
  } catch {
    throw new SyncError('network', SYNC_MESSAGES.network);
  }
  // 404 happens on local previews that have no /api functions
  if (res.status === 503 || res.status === 404) throw new SyncError('not_configured', SYNC_MESSAGES.not_configured);
  if (res.status === 401) {
    const body = (await res.json().catch(() => ({}))) as { reconnect?: boolean };
    throw body.reconnect ? new SyncError('reconnect', SYNC_MESSAGES.reconnect) : new SyncError('not_connected', SYNC_MESSAGES.not_connected);
  }
  if (!res.ok) throw new SyncError('google', SYNC_MESSAGES.google);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, until: now + (body.expires_in - 60) * 1000 };
  return body.access_token;
}

async function googleError(res: Response): Promise<SyncError> {
  const body = (await res.json().catch(() => ({}))) as { error?: { details?: { reason?: string }[] } };
  const reasons = (body.error?.details ?? []).map((d) => d.reason);
  if (reasons.includes('ACCOUNT_NOT_LINKED')) return new SyncError('not_linked', SYNC_MESSAGES.not_linked);
  if (reasons.includes('MISSING_OAUTH_SCOPE')) return new SyncError('missing_scope', SYNC_MESSAGES.missing_scope);
  return new SyncError('google', SYNC_MESSAGES.google);
}

/** Calls the Google Health API, refreshing the access token once on 401. */
async function call<T>(fetchFn: typeof fetch, now: number, url: string, init: RequestInit = {}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const tokenValue = await accessToken(fetchFn, now);
    let res: Response;
    try {
      res = await fetchFn(url, {
        ...init,
        headers: { Authorization: `Bearer ${tokenValue}`, Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
      });
    } catch {
      throw new SyncError('network', SYNC_MESSAGES.network);
    }
    if (res.status === 401 && attempt === 0) {
      clearTokenCache();
      continue;
    }
    if (!res.ok) throw await googleError(res);
    return (await res.json()) as T;
  }
  throw new SyncError('reconnect', SYNC_MESSAGES.reconnect);
}

async function dailyRollUp(fetchFn: typeof fetch, now: number, type: string, start: string, endExclusive: string): Promise<RollupResponse> {
  const points: NonNullable<RollupResponse['rollupDataPoints']> = [];
  let pageToken: string | undefined;
  do {
    const r = await call<RollupResponse>(fetchFn, now, `${API}/${type}/dataPoints:dailyRollUp`, {
      method: 'POST',
      body: JSON.stringify({ range: civilRange(start, endExclusive), windowSizeDays: 1, ...(pageToken ? { pageToken } : {}) }),
    });
    points.push(...(r.rollupDataPoints ?? []));
    pageToken = r.nextPageToken || undefined;
  } while (pageToken);
  return { rollupDataPoints: points };
}

async function listAll<T>(fetchFn: typeof fetch, now: number, path: string, filter: string, pageSize: number): Promise<ListResponse<T>> {
  const points: T[] = [];
  let pageToken: string | undefined;
  do {
    const q = new URLSearchParams({ filter, pageSize: String(pageSize) });
    if (pageToken) q.set('pageToken', pageToken);
    const r = await call<ListResponse<T>>(fetchFn, now, `${API}/${path}?${q.toString()}`);
    points.push(...(r.dataPoints ?? []));
    pageToken = r.nextPageToken || undefined;
  } while (pageToken);
  return { dataPoints: points };
}

/** Reads the last `days` days (including today) from the band, keyed by Riyadh date. */
export async function fetchBandDays(days = 14, deps: SyncDeps = {}): Promise<Record<string, BandDay>> {
  const fetchFn = deps.fetchFn ?? fetch.bind(globalThis);
  const nowDate = deps.now ?? new Date();
  const now = nowDate.getTime();
  const today = todayRiyadh(nowDate);
  const start = addDays(today, -(days - 1));
  const endExclusive = addDays(today, 1);

  const [steps, calories, rhr, sleep] = await Promise.all([
    dailyRollUp(fetchFn, now, 'steps', start, endExclusive).then(mapSteps),
    dailyRollUp(fetchFn, now, 'total-calories', start, endExclusive).then(mapCalories),
    listAll<RestingHrPoint>(fetchFn, now, 'daily-resting-heart-rate/dataPoints',
      `daily_resting_heart_rate.date >= "${start}" AND daily_resting_heart_rate.date < "${endExclusive}"`, 100).then(mapRestingHr),
    listAll<SleepPoint>(fetchFn, now, 'sleep/dataPoints:reconcile',
      `sleep.interval.civil_end_time >= "${start}" AND sleep.interval.civil_end_time < "${endExclusive}"`, 25).then(mapSleep),
  ]);

  const out: Record<string, BandDay> = {};
  const put = (d: string, patch: BandDay) => {
    if (d < start || d > today) return;
    out[d] = { ...out[d], ...patch };
  };
  for (const [d, v] of Object.entries(steps)) put(d, { steps: v });
  for (const [d, v] of Object.entries(calories)) put(d, { kcalBurned: v });
  for (const [d, v] of Object.entries(rhr)) put(d, { restingHr: v });
  for (const [d, v] of Object.entries(sleep)) put(d, { sleep: v });
  return out;
}

export function connectFitbit(): void {
  window.location.href = '/api/auth/start';
}

export async function pairWithCode(code: string, fetchFn: typeof fetch = fetch): Promise<void> {
  const res = await fetchFn('/api/pair', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (res.status === 503) throw new SyncError('not_configured', SYNC_MESSAGES.not_configured);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error === 'expired_code' ? 'That pairing code has expired. Connect again to get a new one.' : 'That pairing code is not valid.');
  }
  clearTokenCache();
}

export async function disconnectFitbit(fetchFn: typeof fetch = fetch): Promise<void> {
  await fetchFn('/api/disconnect', { method: 'POST', credentials: 'same-origin' });
  clearTokenCache();
}
