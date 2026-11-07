import { beforeEach, describe, expect, it, vi } from 'vitest';
import { civilRange, mapCalories, mapRestingHr, mapSleep, mapSteps } from './map';
import { clearTokenCache, fetchBandDays, SyncError } from './client';

// Shapes recorded from the Google Health API v4 reference (developers.google.com/health).
const stepsFixture = {
  rollupDataPoints: [
    { civilStartTime: { date: { year: 2026, month: 11, day: 6 }, time: {} }, civilEndTime: { date: { year: 2026, month: 11, day: 7 }, time: {} }, steps: { countSum: '3822' } },
    { civilStartTime: { date: { year: 2026, month: 11, day: 5 }, time: {} }, civilEndTime: { date: { year: 2026, month: 11, day: 6 }, time: {} } },
  ],
};
const caloriesFixture = {
  rollupDataPoints: [{ civilStartTime: { date: { year: 2026, month: 11, day: 6 }, time: {} }, totalCalories: { kcalSum: 2187.4 } }],
};
const rhrFixture = {
  dataPoints: [{ dailyRestingHeartRate: { date: { year: 2026, month: 11, day: 6 }, beatsPerMinute: '58', dailyRestingHeartRateMetadata: { calculationMethod: 'WITH_SLEEP' } } }],
  nextPageToken: '',
};
const sleepFixture = {
  dataPoints: [
    { sleep: { interval: { startTime: '2026-11-05T20:10:00Z', endTime: '2026-11-06T03:20:00Z' }, summary: { minutesAsleep: '398' }, metadata: { mainSleep: true } } },
    { sleep: { interval: { startTime: '2026-11-06T11:00:00Z', endTime: '2026-11-06T11:40:00Z' }, summary: { minutesAsleep: '40' }, metadata: { nap: true } } },
    { sleep: { interval: { startTime: '2026-11-06T20:00:00Z', endTime: '2026-11-07T03:00:00Z' }, summary: { minutesAsleep: '380' }, metadata: { main: true } } },
  ],
  nextPageToken: '',
};

describe('mapping', () => {
  it('builds a closed-open civil range with no leading zeros', () => {
    expect(civilRange('2026-11-01', '2026-11-08')).toEqual({
      start: { date: { year: 2026, month: 11, day: 1 }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } },
      end: { date: { year: 2026, month: 11, day: 8 }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } },
    });
  });
  it('maps steps and skips unworn days', () => {
    expect(mapSteps(stepsFixture)).toEqual({ '2026-11-06': 3822 });
  });
  it('maps calories and resting heart rate', () => {
    expect(mapCalories(caloriesFixture)).toEqual({ '2026-11-06': 2187 });
    expect(mapRestingHr(rhrFixture)).toEqual({ '2026-11-06': 58 });
  });
  it('picks the main sleep per wake-up date and ignores naps', () => {
    expect(mapSleep(sleepFixture)).toEqual({
      '2026-11-06': { minutes: 398, start: '2026-11-05T20:10:00Z', end: '2026-11-06T03:20:00Z' },
      '2026-11-07': { minutes: 380, start: '2026-11-06T20:00:00Z', end: '2026-11-07T03:00:00Z' },
    });
  });
});

function jsonRes(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('fetchBandDays', () => {
  beforeEach(() => clearTokenCache());
  const now = new Date('2026-11-07T08:00:00Z');

  it('combines all four data types by date', async () => {
    const calls: string[] = [];
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url === '/api/token') return jsonRes(200, { access_token: 'AT', expires_in: 3599 });
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer AT');
      if (url.includes('/steps/')) return jsonRes(200, stepsFixture);
      if (url.includes('/total-calories/')) return jsonRes(200, caloriesFixture);
      if (url.includes('daily-resting-heart-rate')) return jsonRes(200, rhrFixture);
      if (url.includes('/sleep/')) return jsonRes(200, sleepFixture);
      throw new Error(url);
    });
    const out = await fetchBandDays(14, { fetchFn: fetchFn as unknown as typeof fetch, now });
    expect(out['2026-11-06']).toEqual({ steps: 3822, kcalBurned: 2187, restingHr: 58, sleep: { minutes: 398, start: '2026-11-05T20:10:00Z', end: '2026-11-06T03:20:00Z' } });
    expect(out['2026-11-07'].sleep?.minutes).toBe(380);
    expect(calls.filter((c) => c.includes('/api/token'))).toHaveLength(1);
    const sleepCall = calls.find((c) => c.includes('/sleep/'))!;
    expect(decodeURIComponent(sleepCall.replace(/\+/g, ' '))).toContain('sleep.interval.civil_end_time >= "2026-10-25" AND sleep.interval.civil_end_time < "2026-11-08"');
    expect(calls.find((c) => c.includes('/steps/'))).toContain('POST https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp');
  });

  it('reports not connected, reconnect, not configured and not linked', async () => {
    const run = (tokenRes: Response, apiRes?: Response) =>
      fetchBandDays(14, {
        now,
        fetchFn: (async (url: string) => (url === '/api/token' ? tokenRes.clone() : apiRes!.clone())) as unknown as typeof fetch,
      }).catch((e: SyncError) => e.kind);
    expect(await run(jsonRes(401, { connected: false, reconnect: false }))).toBe('not_connected');
    clearTokenCache();
    expect(await run(jsonRes(401, { connected: false, reconnect: true }))).toBe('reconnect');
    clearTokenCache();
    expect(await run(jsonRes(503, { error: 'not_configured' }))).toBe('not_configured');
    clearTokenCache();
    expect(await run(jsonRes(200, { access_token: 'AT', expires_in: 3599 }),
      jsonRes(400, { error: { code: 400, status: 'FAILED_PRECONDITION', details: [{ reason: 'ACCOUNT_NOT_LINKED' }] } }))).toBe('not_linked');
  });

  it('refreshes the access token once when Google returns 401', async () => {
    let tokens = 0;
    let firstApi = true;
    const fetchFn = vi.fn(async (url: string) => {
      if (url === '/api/token') return jsonRes(200, { access_token: `AT${++tokens}`, expires_in: 3599 });
      if (firstApi) { firstApi = false; return jsonRes(401, { error: { code: 401 } }); }
      if (url.includes('/steps/')) return jsonRes(200, stepsFixture);
      if (url.includes('/total-calories/')) return jsonRes(200, caloriesFixture);
      if (url.includes('daily-resting-heart-rate')) return jsonRes(200, rhrFixture);
      return jsonRes(200, sleepFixture);
    });
    const out = await fetchBandDays(14, { fetchFn: fetchFn as unknown as typeof fetch, now });
    expect(out['2026-11-06'].steps).toBe(3822);
    expect(tokens).toBe(2);
  });
});
