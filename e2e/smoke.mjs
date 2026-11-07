// Phone-size smoke test against `vite preview` (run `npm run build` first).
// Uses the pre-installed Playwright: confirm breakfast, add food, open a how-to demo,
// log a set, record a weigh-in, export a backup.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const shots = process.env.SHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const fail = (msg) => { console.error(`FAIL: ${msg}`); server.kill(); process.exit(1); };

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  fail('preview server did not start');
}

await waitForServer();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('/api/') && !m.text().includes('404') && errors.push(m.text()));

const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });

try {
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'Today' }).waitFor();

  // Breakfast in one tap
  await page.getByRole('button', { name: /Add usual breakfast/ }).click();
  await page.getByText('2-egg omelette').waitFor();

  // Add tandoori chicken to lunch
  await page.getByRole('button', { name: '+ Add food' }).nth(1).click();
  await page.getByRole('searchbox', { name: 'Search food' }).fill('tandoori');
  await page.getByRole('button', { name: 'Add Tandoori chicken' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  const kcal = await page.getByRole('progressbar', { name: 'Calories' }).getAttribute('aria-valuenow');
  if (kcal !== '950') fail(`expected 950 kcal after breakfast + tandoori, got ${kcal}`);
  await page.getByRole('button', { name: '+250 ml' }).click();
  await shot('today');

  // Workout: pick Upper A, open how-to demo, log a set
  await page.getByRole('button', { name: 'Workout' }).click();
  await page.getByLabel('Session').selectOption('upperA');
  await page.getByRole('heading', { name: 'Upper A' }).waitFor();
  await page.getByRole('button', { name: 'How to' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Barbell bench press' });
  await dialog.waitFor();
  await dialog.getByText('How to do it').waitFor();
  const loaded = await dialog.locator('.demo img').first().evaluate((img) => img.complete && img.naturalWidth > 0);
  if (!loaded) fail('demo image did not load');
  // the demo loops: the end frame should become the visible one within ~1.2 s
  await page.waitForFunction(() => document.querySelectorAll('.demo img')[1]?.style.opacity === '1', null, { timeout: 3000 })
    .catch(() => fail('demo did not move to the end frame'));
  await page.waitForTimeout(500);
  await shot('howto');
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.getByLabel('Barbell bench press set 1 kg').fill('40');
  await page.getByRole('button', { name: 'Set 1 done' }).first().click();
  await page.getByRole('timer').waitFor();
  if ((await page.getByRole('button', { name: 'Set 1 done' }).first().getAttribute('aria-pressed')) !== 'true') fail('set not ticked');
  await shot('workout');

  // Progress: add a weigh-in
  await page.getByRole('button', { name: 'Progress' }).click();
  await page.getByRole('button', { name: '+ Weigh-in' }).click();
  await page.getByLabel('Weight', { exact: true }).fill('95.4');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('95.4 kg', { exact: true }).waitFor();
  await shot('progress');

  // Plan: backup export downloads a file
  await page.getByRole('button', { name: 'Plan' }).click();
  await page.getByRole('heading', { name: 'Plan', exact: true }).waitFor();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save backup' }).click()]);
  if (!download.suggestedFilename().startsWith('hashan-fit-backup-')) fail('backup file name');
  await shot('plan');

  // Calendar file is served
  const ics = await (await fetch(`${BASE}/work-days.ics`)).text();
  if (!ics.startsWith('BEGIN:VCALENDAR')) fail('calendar file not served');

  // Data survives a reload
  await page.reload();
  await page.getByText('2-egg omelette').waitFor();

  if (errors.length) fail(`page errors:\n${errors.join('\n')}`);
  console.log('smoke test passed');
} catch (e) {
  await shot('failure');
  fail(e.stack ?? String(e));
} finally {
  await browser.close();
  server.kill();
}
