export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name: string, value: string, opts: { path: string; maxAge: number }): string {
  return `${name}=${encodeURIComponent(value)}; Path=${opts.path}; Max-Age=${opts.maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCookie(name: string, path: string): string {
  return cookie(name, '', { path, maxAge: 0 });
}

export function json(status: number, body: unknown, setCookies: string[] = []): Response {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  for (const c of setCookies) headers.append('Set-Cookie', c);
  return new Response(JSON.stringify(body), { status, headers });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** A small standalone page for the sign-in flow (shown outside the app). */
export function page(status: number, title: string, paragraphs: string[], opts: { setCookies?: string[]; appUrl?: string; pairCode?: string } = {}): Response {
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  for (const c of opts.setCookies ?? []) headers.append('Set-Cookie', c);
  const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const pair = opts.pairCode
    ? `<h2>Opened in Safari instead of the app?</h2>
<p>Copy this pairing code, open Hashan Fit from your home screen, then go to Plan, Settings, Fitbit, Paste pairing code. It works for 15 minutes.</p>
<textarea id="code" readonly rows="4">${escapeHtml(opts.pairCode)}</textarea>
<button id="copy" type="button">Copy pairing code</button>
<script>document.getElementById('copy').onclick=function(){var t=document.getElementById('code');t.select();navigator.clipboard&&navigator.clipboard.writeText(t.value);this.textContent='Copied';};</script>`
    : '';
  const back = opts.appUrl ? `<p><a class="btn" href="${escapeHtml(opts.appUrl)}">Back to Hashan Fit</a></p>` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>:root{color-scheme:light dark;--bg:#f6f7f9;--fg:#15181d;--card:#fff;--accent:#0f7b5f}
@media (prefers-color-scheme:dark){:root{--bg:#0f1214;--fg:#e8ecef;--card:#1a1f23;--accent:#3ccf9f}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,sans-serif}
main{max-width:520px;margin:0 auto;background:var(--card);border-radius:16px;padding:20px}
h1{font-size:22px;margin:0 0 12px}h2{font-size:17px;margin:20px 0 8px}
textarea{width:100%;box-sizing:border-box;font:13px ui-monospace,monospace;padding:8px;border-radius:8px}
button,.btn{display:inline-block;margin-top:8px;padding:12px 16px;border-radius:10px;border:0;background:var(--accent);color:#fff;font-weight:600;text-decoration:none;font-size:16px}</style>
</head><body><main><h1>${escapeHtml(title)}</h1>${body}${back}${pair}</main></body></html>`;
  return new Response(html, { status, headers });
}
