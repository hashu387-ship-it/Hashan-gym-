import { disconnect, notConfigured, readEnv } from './_lib/handlers.js';

export async function POST(request: Request): Promise<Response> {
  const env = readEnv(process.env);
  return env ? disconnect(request, env, fetch) : notConfigured(false);
}
