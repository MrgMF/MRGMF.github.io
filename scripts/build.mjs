#!/usr/bin/env node
// Génère le site statique à la racine du dépôt (servi tel quel par GitHub Pages).
// Aucune dépendance : `node scripts/build.mjs` suffit.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import fr from '../src/content/fr.mjs';
import en from '../src/content/en.mjs';
import { renderPage, render404, SITE } from '../src/templates/page.mjs';
import { faviconSVG } from '../src/sprites.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = [fr, en];

async function write(rel, content) {
  const file = join(ROOT, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
  console.log(`  ✓ ${rel} (${(Buffer.byteLength(content) / 1024).toFixed(1)} ko)`);
}

// Garde-fous : le build échoue si le contenu est incohérent.
function check(c) {
  const ids = new Set();
  for (const s of c.stages) {
    if (ids.has(s.id)) throw new Error(`[${c.lang}] stage en double : ${s.id}`);
    ids.add(s.id);
    for (const k of ['name', 'tile', 'kicker', 'tagline', 'intro']) {
      if (!s[k]) throw new Error(`[${c.lang}] ${s.id} : champ « ${k} » manquant`);
    }
    if (!s.hits.length) throw new Error(`[${c.lang}] ${s.id} : aucun coup`);
  }
  const moves = [...c.moves.groups.flatMap((g) => g.moves), c.moves.super];
  const inputs = new Set();
  for (const m of moves) {
    if (!/^[1-9]+[PK]+$/.test(m.input)) throw new Error(`[${c.lang}] manipulation invalide : ${m.input}`);
    if (inputs.has(m.input)) throw new Error(`[${c.lang}] manipulation en double : ${m.input}`);
    inputs.add(m.input);
  }
}

function sameShape(a, b) {
  const ids = (c) => c.stages.map((s) => s.id).join();
  const mv = (c) => [...c.moves.groups.flatMap((g) => g.moves), c.moves.super].map((m) => `${m.id}:${m.input}`).join();
  if (ids(a) !== ids(b)) throw new Error('FR et EN n’ont pas les mêmes stages');
  if (mv(a) !== mv(b)) throw new Error('FR et EN n’ont pas la même move list');
}

console.log('Build MRGMF');
pages.forEach(check);
sameShape(fr, en);

for (const c of pages) {
  await write(join(c.dir, 'index.html'), renderPage(c, pages));
}
await write('404.html', render404(fr, en));

await write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages
  .map(
    (c) => `  <url>
    <loc>${SITE}${c.dir}</loc>
${pages.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.dir}"/>`).join('\n')}
  </url>`
  )
  .join('\n')}
</urlset>
`
);

await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

await write(
  'site.webmanifest',
  JSON.stringify(
    {
      id: '/',
      name: 'MRGMF · Zero Trust Fighter',
      short_name: 'MRGMF',
      description: fr.meta.description,
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#07070f',
      theme_color: '#07070f',
      icons: [
        { src: '/assets/img/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
        { src: '/assets/img/icon-192.png', type: 'image/png', sizes: '192x192' },
        { src: '/assets/img/icon-512.png', type: 'image/png', sizes: '512x512' },
      ],
    },
    null,
    2
  ) + '\n'
);

await write('assets/img/favicon.svg', faviconSVG() + '\n');
await write('.nojekyll', '');
console.log('Terminé.');
