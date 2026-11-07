import { randomB64url, seal, sha256B64url, unseal, fromB64url } from './crypto.js';
import { clearCookie, cookie, json, page, parseCookies } from './http.js';

export interface Env {
  clientId: string;
  clientSecret: string;
  encKey: string;
  allowedEmail: string;
  appOrigin: string;
}

export type Fetch = typeof fetch;

export const HEALTH_SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
];
export const SCOPES = [...HEALTH_SCOPES, 'openid', 'email'];

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

const RT_COOKIE = 'hf_rt';
const RT_PATH = '/api';
const RT_MAX_AGE = 180 * 24 * 3600;
const OAUTH_COOKIE = 'hf_oauth';
const OAUTH_PATH = '/api/auth';
const OAUTH_MAX_AGE = 600;
const PAIR_TTL_MS = 15 * 60 * 1000;

interface OAuthState { state: string; verifier: string; exp: number }
interface RtCookie { kind: 'rt'; rt: string }
interface PairCode { kind: 'pair'; rt: string; exp: number }

/** Reads the five env vars. Returns null when any is missing or the key is too short. */
export function readEnv(raw: Record<string, string | undefined>): Env | null {
  const env = {
    clientId: raw.GOOGLE_CLIENT_ID ?? '',
    clientSecret: raw.GOOGLE_CLIENT_SECRET ?? '',
    encKey: raw.TOKEN_ENC_KEY ?? '',
    allowedEmail: (raw.ALLOWED_EMAIL ?? '').trim().toLowerCase(),
    appOrigin: (raw.APP_ORIGIN ?? '').trim().replace(/\/+$/, ''),
  };
  if (!env.clientId || !env.clientSecret || env.encKey.length < 32 || !env.allowedEmail || !env.appOrigin) return null;
  return env;
}

const redirectUri = (env: Env) => `${env.appOrigin}/api/auth/callback`;

function originOk(req: Request, env: Env): boolean {
  return req.headers.get('origin') === env.appOrigin;
}

const forbidden = () => json(403, { error: 'bad_origin' });

function form(body: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  };
}

function emailFromIdToken(idToken: unknown): { email: string; verified: boolean } | null {
  if (typeof idToken !== 'string') return null;
  const part = idToken.split('.')[1];
  if (!part) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(part))) as { email?: string; email_verified?: boolean | string };
    if (!payload.email) return null;
    return { email: payload.email.toLowerCase(), verified: payload.email_verified === true || payload.email_verified === 'true' };
  } catch {
    return null;
  }
}

/** GET /api/auth/start - sends the user to Google sign-in. */
export async function authStart(env: Env, now = Date.now()): Promise<Response> {
  const state = randomB64url(16);
  const verifier = randomB64url(32);
  const sealed = await seal({ state, verifier, exp: now + OAUTH_MAX_AGE * 1000 } satisfies OAuthState, env.encKey);
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: redirectUri(env),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    login_hint: env.allowedEmail,
    state,
    code_challenge: await sha256B64url(verifier),
    code_challenge_method: 'S256',
  }).toString();
  const headers = new Headers({ Location: url.toString(), 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', cookie(OAUTH_COOKIE, sealed, { path: OAUTH_PATH, maxAge: OAUTH_MAX_AGE }));
  return new Response(null, { status: 302, headers });
}

/** GET /api/auth/callback - Google sends the user back here. */
export async function authCallback(req: Request, env: Env, fetchFn: Fetch, now = Date.now()): Promise<Response> {
  const url = new URL(req.url);
  const appUrl = `${env.appOrigin}/`;
  const clearOAuth = clearCookie(OAUTH_COOKIE, OAUTH_PATH);
  if (url.searchParams.get('error')) {
    return page(400, 'Sign-in cancelled', ['Google sign-in was cancelled. You can try again from the app.'], { appUrl, setCookies: [clearOAuth] });
  }
  const code = url.searchParams.get('code');
  const saved = await unseal<OAuthState>(parseCookies(req.headers.get('cookie'))[OAUTH_COOKIE], env.encKey);
  if (!code || !saved || saved.state !== url.searchParams.get('state') || saved.exp < now) {
    return page(400, 'Sign-in expired', ['This sign-in link is old or was opened in a different browser. Go back to the app and tap Connect Fitbit again.'], { appUrl, setCookies: [clearOAuth] });
  }

  const res = await fetchFn(TOKEN_URL, form({
    code,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    redirect_uri: redirectUri(env),
    grant_type: 'authorization_code',
    code_verifier: saved.verifier,
  }));
  if (!res.ok) {
    return page(502, 'Google did not accept the sign-in', ['Check that the Client ID, Client secret and redirect URI in your setup match, then try again.'], { appUrl, setCookies: [clearOAuth] });
  }
  const tok = (await res.json()) as { refresh_token?: string; id_token?: string; scope?: string };
  const who = emailFromIdToken(tok.id_token);
  if (!who || !who.verified || who.email !== env.allowedEmail) {
    if (tok.refresh_token) await fetchFn(REVOKE_URL, form({ token: tok.refresh_token })).catch(() => undefined);
    return page(403, 'Wrong Google account', [`Please sign in with ${env.allowedEmail}. This app only works for that account.`], { appUrl, setCookies: [clearOAuth] });
  }
  if (!tok.refresh_token) {
    return page(400, 'Google did not give lasting access', ['Open your Google account, go to Security, Third-party connections, remove Hashan Fit, then connect again.'], { appUrl, setCookies: [clearOAuth] });
  }

  const granted = (tok.scope ?? '').split(' ');
  const missing = HEALTH_SCOPES.filter((s) => !granted.includes(s));
  const rtCookie = await seal({ kind: 'rt', rt: tok.refresh_token } satisfies RtCookie, env.encKey);
  const pairCode = await seal({ kind: 'pair', rt: tok.refresh_token, exp: now + PAIR_TTL_MS } satisfies PairCode, env.encKey);
  const notes = ['Your Fitbit Air data will now sync into Hashan Fit.'];
  if (missing.length) notes.push('Some permissions were not ticked, so some data (steps, heart rate or sleep) will be missing. Connect again and tick every box to fix it.');
  return page(200, 'Fitbit connected', notes, {
    appUrl: `${appUrl}?connected=1`,
    pairCode,
    setCookies: [clearOAuth, cookie(RT_COOKIE, rtCookie, { path: RT_PATH, maxAge: RT_MAX_AGE })],
  });
}

/** POST /api/token - returns a fresh Google access token for the browser. */
export async function token(req: Request, env: Env, fetchFn: Fetch): Promise<Response> {
  if (!originOk(req, env)) return forbidden();
  const saved = await unseal<RtCookie>(parseCookies(req.headers.get('cookie'))[RT_COOKIE], env.encKey);
  if (!saved || saved.kind !== 'rt') return json(401, { connected: false, reconnect: false });
  const res = await fetchFn(TOKEN_URL, form({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    refresh_token: saved.rt,
    grant_type: 'refresh_token',
  }));
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (body.error === 'invalid_grant') {
      return json(401, { connected: false, reconnect: true }, [clearCookie(RT_COOKIE, RT_PATH)]);
    }
    return json(502, { error: 'google_error' });
  }
  const tok = (await res.json()) as { access_token: string; expires_in: number; scope?: string };
  return json(200, { access_token: tok.access_token, expires_in: tok.expires_in, scope: tok.scope ?? '' });
}

/** POST /api/pair - turns a pairing code (shown in Safari) into the cookie inside the home-screen app. */
export async function pair(req: Request, env: Env, now = Date.now()): Promise<Response> {
  if (!originOk(req, env)) return forbidden();
  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const p = await unseal<PairCode>(code, env.encKey);
  if (!p || p.kind !== 'pair') return json(400, { error: 'invalid_code' });
  if (p.exp < now) return json(400, { error: 'expired_code' });
  const rtCookie = await seal({ kind: 'rt', rt: p.rt } satisfies RtCookie, env.encKey);
  return json(200, { ok: true }, [cookie(RT_COOKIE, rtCookie, { path: RT_PATH, maxAge: RT_MAX_AGE })]);
}

/** POST /api/disconnect - revokes Google access and removes the cookie. */
export async function disconnect(req: Request, env: Env, fetchFn: Fetch): Promise<Response> {
  if (!originOk(req, env)) return forbidden();
  const saved = await unseal<RtCookie>(parseCookies(req.headers.get('cookie'))[RT_COOKIE], env.encKey);
  if (saved?.rt) await fetchFn(REVOKE_URL, form({ token: saved.rt })).catch(() => undefined);
  return json(200, { ok: true }, [clearCookie(RT_COOKIE, RT_PATH)]);
}

export function notConfigured(asPage: boolean): Response {
  if (asPage) {
    return page(503, 'Fitbit sync is not set up yet', ['Follow the Google Health setup guide and add the five settings in Vercel, then redeploy.']);
  }
  return json(503, { error: 'not_configured' });
}
