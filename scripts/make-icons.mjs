// One-off: renders the app icon SVG to PNG sizes with the pre-installed Playwright.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#0e7c5f"/>
  <g transform="translate(256 236) scale(${pad ? 0.78 : 1}) translate(-256 -236)" fill="#ffffff">
    <rect x="96" y="176" width="44" height="120" rx="14"/>
    <rect x="372" y="176" width="44" height="120" rx="14"/>
    <rect x="148" y="146" width="44" height="180" rx="14"/>
    <rect x="320" y="146" width="44" height="180" rx="14"/>
    <rect x="186" y="220" width="140" height="32" rx="10"/>
    <text x="256" y="420" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="76" letter-spacing="2">FIT</text>
  </g>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, maskable] of [['icon-512.png', 512, false], ['icon-192.png', 192, false], ['apple-touch-icon.png', 180, true], ['icon-maskable-512.png', 512, true]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(maskable).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  writeFileSync(`public/icons/${name}`, await page.screenshot({ omitBackground: !maskable, clip: { x: 0, y: 0, width: size, height: size } }));
}
await browser.close();
console.log('icons done');
