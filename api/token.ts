import { notConfigured, readEnv, token } from './_lib/handlers.js';

export async function POST(request: Request): Promise<Response> {
  const env = readEnv(process.env);
  return env ? token(request, env, fetch) : notConfigured(false);
}
