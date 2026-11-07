import { authStart, notConfigured, readEnv } from '../_lib/handlers.js';

export async function GET(): Promise<Response> {
  const env = readEnv(process.env);
  return env ? authStart(env) : notConfigured(true);
}
