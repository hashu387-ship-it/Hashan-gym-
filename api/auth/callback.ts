import { authCallback, notConfigured, readEnv } from '../_lib/handlers.js';

export async function GET(request: Request): Promise<Response> {
  const env = readEnv(process.env);
  return env ? authCallback(request, env, fetch) : notConfigured(true);
}
