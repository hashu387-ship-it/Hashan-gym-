import { describe, expect, it, vi } from 'vitest';
import { seal, toB64url, unseal } from './crypto.js';
import { authCallback, authStart, disconnect, pair, readEnv, token, type Env } from './handlers.js';

const env: Env = {
  clientId: 'cid.apps.googleusercontent.com',
  clientSecret: 'secret',
  encKey: 'k'.repeat(40),
  allowedEmail: 'hashan@example.com',
  appOrigin: 'https://hashan-fit.vercel.app',
};
const NOW = 1_800_000_000_000;

function idToken(email: string, verified = true): string {
  const part = (o: object) => toB64url(new TextEncoder().encode(JSON.stringify(o)));
  return `${part({ alg: 'RS256' })}.${part({ email, email_verified: verified })}.sig`;
}

function jsonRes(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function cookiesOf(res: Response): string[] {
  return res.headers.getSetCookie();
}

function cookieValue(res: Response, name: string): string {
  const c = cookiesOf(res).find((x) => x.startsWith(`${name}=`))!;
  return decodeURIComponent(c.split(';')[0].slice(name.length + 1));
}

const post = (path: string, opts: { origin?: string; cookie?: string; body?: unknown } = {}) =>
  new Request(`${env.appOrigin}${path}`, {
    method: 'POST',
    headers: {
      ...(opts.origin !== undefined ? { origin: opts.origin } : { origin: env.appOrigin }),
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
      'Content-Type': 'application/json',
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

describe('crypto', () => {
  it('round-trips and rejects tampering or a different key', async () => {
    const t = await seal({ rt: 'abc' }, env.encKey);
    expect(await unseal(t, env.encKey)).toEqual({ rt: 'abc' });
    const flipped = t.slice(0, -2) + (t.at(-2) === 'A' ? 'B' : 'A') + t.at(-1);
    expect(await unseal(flipped, env.encKey)).toBeNull();
    expect(await unseal(t, 'x'.repeat(40))).toBeNull();
    expect(await unseal('garbage!!', env.encKey)).toBeNull();
    expect(await unseal(undefined, env.encKey)).toBeNull();
  });
});

describe('readEnv', () => {
  it('requires all five values and a 32+ character key', () => {
    const raw = { GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b', TOKEN_ENC_KEY: 'k'.repeat(32), ALLOWED_EMAIL: ' Hashan@Example.com ', APP_ORIGIN: 'https://x.vercel.app/' };
    expect(readEnv(raw)).toMatchObject({ allowedEmail: 'hashan@example.com', appOrigin: 'https://x.vercel.app' });
    expect(readEnv({ ...raw, TOKEN_ENC_KEY: 'short' })).toBeNull();
    expect(readEnv({ ...raw, GOOGLE_CLIENT_SECRET: undefined })).toBeNull();
  });
});

async function startedFlow() {
  const res = await authStart(env, NOW);
  const loc = new URL(res.headers.get('location')!);
  return { res, loc, state: loc.searchParams.get('state')!, oauthCookie: cookieValue(res, 'hf_oauth') };
}

function callbackReq(state: string, oauthCookie: string, code = 'the-code') {
  return new Request(`${env.appOrigin}/api/auth/callback?code=${code}&state=${state}`, {
    headers: { cookie: `hf_oauth=${encodeURIComponent(oauthCookie)}` },
  });
}

describe('auth flow', () => {
  it('redirects to Google with offline access, PKCE and all scopes', async () => {
    const { res, loc } = await startedFlow();
    expect(res.status).toBe(302);
    expect(loc.origin + loc.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(loc.searchParams.get('access_type')).toBe('offline');
    expect(loc.searchParams.get('code_challenge_method')).toBe('S256');
    expect(loc.searchParams.get('redirect_uri')).toBe('https://hashan-fit.vercel.app/api/auth/callback');
    expect(loc.searchParams.get('scope')).toContain('googlehealth.sleep.readonly');
    expect(cookiesOf(res)[0]).toContain('HttpOnly');
  });

  it('stores the refresh token in an encrypted cookie and shows a pairing code', async () => {
    const { state, oauthCookie } = await startedFlow();
    const fetchFn = vi.fn(async () => jsonRes(200, { refresh_token: 'RT1', id_token: idToken('Hashan@example.com'), scope: 'openid' }));
    const res = await authCallback(callbackReq(state, oauthCookie), env, fetchFn as typeof fetch, NOW);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Fitbit connected');
    expect(body).toContain('Some permissions were not ticked');
    expect(await unseal(cookieValue(res, 'hf_rt'), env.encKey)).toEqual({ kind: 'rt', rt: 'RT1' });
    expect(cookiesOf(res).find((c) => c.startsWith('hf_rt='))).toContain('Path=/api');
    const sent = new URLSearchParams((fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.get('code_verifier')).toBeTruthy();
    expect(sent.get('grant_type')).toBe('authorization_code');
  });

  it('rejects a state mismatch', async () => {
    const { oauthCookie } = await startedFlow();
    const fetchFn = vi.fn();
    const res = await authCallback(callbackReq('wrong', oauthCookie), env, fetchFn as unknown as typeof fetch, NOW);
    expect(res.status).toBe(400);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('rejects an expired sign-in', async () => {
    const { state, oauthCookie } = await startedFlow();
    const res = await authCallback(callbackReq(state, oauthCookie), env, vi.fn() as unknown as typeof fetch, NOW + 11 * 60 * 1000);
    expect(res.status).toBe(400);
  });

  it('rejects the wrong Google account and revokes its token', async () => {
    const { state, oauthCookie } = await startedFlow();
    const fetchFn = vi.fn(async (url: string) =>
      url.includes('revoke') ? jsonRes(200, {}) : jsonRes(200, { refresh_token: 'RT2', id_token: idToken('someone@else.com') }));
    const res = await authCallback(callbackReq(state, oauthCookie), env, fetchFn as unknown as typeof fetch, NOW);
    expect(res.status).toBe(403);
    expect(cookiesOf(res).some((c) => c.startsWith('hf_rt=') && !c.includes('Max-Age=0'))).toBe(false);
    expect(fetchFn.mock.calls.some((c) => String(c[0]).includes('revoke'))).toBe(true);
  });

  it('rejects an unverified email and a missing refresh token', async () => {
    let { state, oauthCookie } = await startedFlow();
    let res = await authCallback(callbackReq(state, oauthCookie), env,
      (async () => jsonRes(200, { refresh_token: 'RT', id_token: idToken('hashan@example.com', false) })) as unknown as typeof fetch, NOW);
    expect(res.status).toBe(403);
    ({ state, oauthCookie } = await startedFlow());
    res = await authCallback(callbackReq(state, oauthCookie), env,
      (async () => jsonRes(200, { id_token: idToken('hashan@example.com') })) as unknown as typeof fetch, NOW);
    expect(res.status).toBe(400);
  });
});

describe('token, pair and disconnect', () => {
  const rtCookie = async () => `hf_rt=${encodeURIComponent(await seal({ kind: 'rt', rt: 'RT1' }, env.encKey))}`;

  it('rejects requests from another origin', async () => {
    for (const fn of [token, disconnect] as const) {
      expect((await fn(post('/api/token', { origin: 'https://evil.example' }), env, vi.fn() as unknown as typeof fetch)).status).toBe(403);
    }
    expect((await pair(post('/api/pair', { origin: '' }), env)).status).toBe(403);
  });

  it('returns 401 without a cookie or with a tampered cookie', async () => {
    expect((await token(post('/api/token'), env, vi.fn() as unknown as typeof fetch)).status).toBe(401);
    const res = await token(post('/api/token', { cookie: 'hf_rt=bad' }), env, vi.fn() as unknown as typeof fetch);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ connected: false, reconnect: false });
  });

  it('returns an access token', async () => {
    const fetchFn = vi.fn(async () => jsonRes(200, { access_token: 'AT', expires_in: 3599, scope: 's' }));
    const res = await token(post('/api/token', { cookie: await rtCookie() }), env, fetchFn as unknown as typeof fetch);
    expect(await res.json()).toEqual({ access_token: 'AT', expires_in: 3599, scope: 's' });
  });

  it('asks to reconnect when Google says invalid_grant', async () => {
    const fetchFn = vi.fn(async () => jsonRes(400, { error: 'invalid_grant' }));
    const res = await token(post('/api/token', { cookie: await rtCookie() }), env, fetchFn as unknown as typeof fetch);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ connected: false, reconnect: true });
    expect(cookiesOf(res)[0]).toContain('Max-Age=0');
  });

  it('pairs with a fresh code and rejects expired or wrong codes', async () => {
    const code = await seal({ kind: 'pair', rt: 'RT9', exp: NOW + 1000 }, env.encKey);
    const ok = await pair(post('/api/pair', { body: { code } }), env, NOW);
    expect(ok.status).toBe(200);
    expect(await unseal(cookieValue(ok, 'hf_rt'), env.encKey)).toEqual({ kind: 'rt', rt: 'RT9' });
    expect((await pair(post('/api/pair', { body: { code } }), env, NOW + 2000)).status).toBe(400);
    const rtAsCode = await seal({ kind: 'rt', rt: 'RT9' }, env.encKey);
    expect((await pair(post('/api/pair', { body: { code: rtAsCode } }), env, NOW)).status).toBe(400);
    expect((await pair(post('/api/pair', { body: {} }), env, NOW)).status).toBe(400);
  });

  it('disconnect revokes and clears the cookie', async () => {
    const fetchFn = vi.fn(async () => jsonRes(200, {}));
    const res = await disconnect(post('/api/disconnect', { cookie: await rtCookie() }), env, fetchFn as unknown as typeof fetch);
    expect(res.status).toBe(200);
    expect(String((fetchFn.mock.calls[0] as unknown[])[0])).toContain('revoke');
    expect(cookiesOf(res)[0]).toContain('Max-Age=0');
  });
});
