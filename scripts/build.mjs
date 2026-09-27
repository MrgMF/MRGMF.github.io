#!/usr/bin/env node
// Génère le site statique à la racine du dépôt (servi tel quel par GitHub Pages).
// Aucune dépendance : `node scripts/build.mjs` suffit.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import fr from '../src/content/fr.mjs';
import en from '../src/content/en.mjs';
import { renderPage, render404, SITE, ladderSteps } from '../src/templates/page.mjs';
import { faviconSVG, spriteSheet } from '../src/sprites.mjs';
import { renderDemo, demoURL } from '../src/templates/demo.mjs';
import accesConditionnel from '../src/demos/acces-conditionnel.mjs';
import nexthink from '../src/demos/nexthink.mjs';
import learnlink from '../src/demos/learnlink.mjs';
import tickets from '../src/demos/tickets.mjs';
import hotel from '../src/demos/hotel.mjs';
import projecttrone from '../src/demos/projecttrone.mjs';

const DEMOS = [accesConditionnel, nexthink, learnlink, tickets, hotel, projecttrone];
import { VAR_CLASSES } from '../src/pixel.mjs';

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
  const teams = new Set(c.teams.list.map((t) => t.id));
  for (const s of c.stages) {
    if (ids.has(s.id)) throw new Error(`[${c.lang}] mission en double : ${s.id}`);
    ids.add(s.id);
    for (const k of ['name', 'tile', 'kicker', 'tagline', 'intro']) {
      if (!s[k]) throw new Error(`[${c.lang}] ${s.id} : champ « ${k} » manquant`);
    }
    if (!s.hits.length) throw new Error(`[${c.lang}] ${s.id} : aucun coup`);
    // Une entreprise n'est jamais un adversaire : elle est l'équipe du joueur 1.
    if (!s.team && !s.crew) throw new Error(`[${c.lang}] ${s.id} : ni équipe ni formation (Solo…)`);
    for (const k of ['team', 'assist']) {
      if (s[k] && !teams.has(s[k])) throw new Error(`[${c.lang}] ${s.id} : ${k} inconnu (${s[k]})`);
    }
    for (const t of c.teams.list) {
      if (s.boss.name.includes(t.name) || s.tile.includes(t.name)) {
        throw new Error(`[${c.lang}] ${s.id} : « ${t.name} » ne doit pas apparaître comme adversaire`);
      }
    }
    for (const a of s.access) {
      if (!a.label || !a.href) throw new Error(`[${c.lang}] ${s.id} : accès incomplet`);
    }
  }
  const moves = [...c.moves.groups.flatMap((g) => g.moves), c.moves.super];
  const inputs = new Set();
  for (const m of moves) {
    if (!/^[1-9]+[PK]+$/.test(m.input)) throw new Error(`[${c.lang}] manipulation invalide : ${m.input}`);
    if (inputs.has(m.input)) throw new Error(`[${c.lang}] manipulation en double : ${m.input}`);
    inputs.add(m.input);
  }
  // Le parcours référence des missions ou des améliorations existantes (ladderSteps lève sinon).
  const steps = ladderSteps(c);
  const inLadder = new Set(steps.map((x) => x.id));
  for (const s of c.stages) if (!s.secret && !inLadder.has(s.id)) throw new Error(`[${c.lang}] mission absente du parcours : ${s.id}`);
  for (const u of c.upgrades) if (!inLadder.has(u.id)) throw new Error(`[${c.lang}] amélioration absente du parcours : ${u.id}`);
  // Les polices n'ont ni flèches ni infini : ces glyphes passent par des icônes SVG.
  const text = JSON.stringify(c);
  const missing = text.match(/[→←↗↓↑∞▶✓]/g);
  if (missing) throw new Error(`[${c.lang}] glyphes absents des polices : ${[...new Set(missing)].join(' ')}`);
}

function sameShape(a, b) {
  const ids = (c) => c.stages.map((s) => `${s.id}:${s.team || ''}:${s.assist || ''}`).join();
  const mv = (c) => [...c.moves.groups.flatMap((g) => g.moves), c.moves.super].map((m) => `${m.id}:${m.input}`).join();
  const ups = (c) => c.upgrades.map((u) => `${u.id}:${u.icon}`).join();
  if (ids(a) !== ids(b)) throw new Error('FR et EN n’ont pas les mêmes missions');
  if (mv(a) !== mv(b)) throw new Error('FR et EN n’ont pas la même move list');
  if (ups(a) !== ups(b)) throw new Error('FR et EN n’ont pas les mêmes améliorations');
  if (a.ladder.join() !== b.ladder.join()) throw new Error('FR et EN n’ont pas le même parcours');
  if (a.teams.list.map((t) => t.id).join() !== b.teams.list.map((t) => t.id).join()) throw new Error('FR et EN n’ont pas les mêmes équipes');
}

// Chaque couleur pilotée par variable CSS doit avoir sa classe dans site.css.
async function checkVarClasses() {
  spriteSheet();
  const css = await readFile(join(ROOT, 'assets/css/site.css'), 'utf8');
  for (const [cls, rule] of VAR_CLASSES) {
    if (!css.includes(`.${cls} {`)) throw new Error(`site.css : règle manquante « .${cls} { ${rule} } »`);
  }
}

console.log('Build MRGMF');
pages.forEach(check);
sameShape(fr, en);
await checkVarClasses();

for (const c of pages) {
  await write(join(c.dir, 'index.html'), renderPage(c, pages));
}

// Démos : une page par projet et par langue, liées depuis « Accéder au projet ».
for (const d of DEMOS) {
  if (!fr.stages.some((s) => s.id === d.stage)) throw new Error(`démo ${d.id} : mission inconnue ${d.stage}`);
  for (const c of pages) {
    if (!c.stages.find((s) => s.id === d.stage).access.some((a) => a.href === `demos/${d.id}/`)) {
      throw new Error(`[${c.lang}] la mission ${d.stage} ne pointe pas vers la démo ${d.id}`);
    }
    await write(join(c.dir, 'demos', d.id, 'index.html'), renderDemo(d, c.lang));
  }
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
${DEMOS.flatMap((d) =>
  pages.map(
    (c) => `  <url>
    <loc>${demoURL(d.id, c.lang)}</loc>
${pages.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${demoURL(d.id, a.lang)}"/>`).join('\n')}
  </url>`
  )
).join('\n')}
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
