#!/usr/bin/env node
// Génère les images PNG (aperçu réseaux sociaux + icônes) à partir des sprites.
// Optionnel : à relancer seulement si le visuel change.
// Prérequis : `npm i -D playwright` (Chromium). Usage : node scripts/render-images.mjs

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { standaloneP1, standaloneBoss, faviconSVG } from '../src/sprites.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/img');
// La page est rendue via setContent (origine about:blank) : on intègre donc
// la feuille de style et les polices directement, en data URI.
let css = await readFile(join(ROOT, 'assets/css/site.css'), 'utf8');
for (const m of css.matchAll(/url\('\.\.\/fonts\/([^']+)'\)/g)) {
  const font = await readFile(join(ROOT, 'assets/fonts', m[1]));
  css = css.replace(m[0], `url('data:font/woff2;base64,${font.toString('base64')}')`);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright est requis : npm i -D playwright');
  process.exit(1);
}

const COVER_TEXT = {
  fr: { who: 'Fodié Marega · End User Architect', what: 'IAM · Gouvernance &amp; architecture des identités' },
  en: { who: 'Fodié Marega · End User Architect', what: 'IAM · Identity governance &amp; architecture' },
};
const cover = (lang) => `<!doctype html><html data-mode="game"><head><meta charset="utf-8">
<style>${css}</style>
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #07070f; }
  .card { position: relative; width: 1200px; height: 630px; overflow: hidden; isolation: isolate; }
  .card .title-bg { position: absolute; inset: 0; }
  .card .title-floor { animation: none; }
  .wrap { position: absolute; inset: 0; display: grid; grid-template-columns: 300px 1fr 300px; align-items: center; padding: 0 40px; }
  .col { display: grid; place-items: center; }
  .p1 svg { width: 240px; filter: drop-shadow(0 10px 0 rgba(0,0,0,.4)); }
  .boss svg { width: 200px; filter: drop-shadow(0 0 22px rgba(255,61,90,.5)); }
  .mid { text-align: center; display: grid; gap: 18px; justify-items: center; }
  .logo-main { font-size: 150px; }
  .logo-sub { font-size: 30px; }
  .who { font: 600 28px 'Chakra Petch', sans-serif; color: #fff; margin: 6px 0 0; text-shadow: 2px 2px 0 #0b0b16; }
  .what { font: 500 22px 'Chakra Petch', sans-serif; color: #ffd23f; margin: 0; text-shadow: 2px 2px 0 #0b0b16; }
  .vs { position: absolute; right: 250px; top: 80px; font: 64px 'Bungee', sans-serif; color: #ffd23f; text-shadow: 0 5px 0 #0b0b16; }
</style></head><body>
<div class="card">
  <div class="title-bg"><div class="title-sky"></div><div class="title-floor"></div></div>
  <div class="wrap">
    <div class="col p1">${standaloneP1('punch')}</div>
    <div class="mid">
      <div class="logo"><span class="logo-main">MRGMF</span><span class="logo-sub">Zero Trust Fighter</span></div>
      <p class="who">${COVER_TEXT[lang].who}</p>
      <p class="what">${COVER_TEXT[lang].what}</p>
    </div>
    <div class="col boss">${standaloneBoss('ghost')}</div>
  </div>
</div></body></html>`;

const iconPage = (size, radius) => `<!doctype html><html><head><style>
  html, body { margin: 0; width: ${size}px; height: ${size}px; background: transparent; }
  svg { width: ${size}px; height: ${size}px; display: block; image-rendering: pixelated; }
</style></head><body>${radius ? faviconSVG() : faviconSVG().replace('rx="4"', 'rx="0"')}</body></html>`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [lang, file] of [
  ['fr', 'og-cover.png'],
  ['en', 'og-cover-en.png'],
]) {
  await page.setContent(cover(lang), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await writeFile(join(OUT, file), await page.screenshot({ type: 'png' }));
  console.log(`  ✓ assets/img/${file}`);
}

for (const [name, size, radius] of [
  ['favicon-32.png', 32, true],
  ['apple-touch-icon.png', 180, false],
  ['icon-192.png', 192, true],
  ['icon-512.png', 512, true],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(iconPage(size, radius));
  await writeFile(join(OUT, name), await page.screenshot({ type: 'png', omitBackground: true }));
  console.log(`  ✓ assets/img/${name}`);
}
await browser.close();
