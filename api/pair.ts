import { notConfigured, pair, readEnv } from './_lib/handlers.js';

export async function POST(request: Request): Promise<Response> {
  const env = readEnv(process.env);
  return env ? pair(request, env) : notConfigured(false);
}
