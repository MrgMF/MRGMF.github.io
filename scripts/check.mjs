#!/usr/bin/env node
// Vérifications sans dépendance sur les pages générées :
// ancres internes, symboles SVG, fichiers référencés, identifiants uniques, métadonnées.

import { readFile, access } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'en/index.html', '404.html'];
let errors = 0;

const fail = (page, msg) => {
  errors++;
  console.error(`  ✗ ${page} : ${msg}`);
};

const exists = async (file) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

for (const page of PAGES) {
  const html = await readFile(join(ROOT, page), 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const idSet = new Set(ids);

  // Identifiants uniques
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(page, `identifiants en double : ${[...new Set(dupes)].join(', ')}`);

  // Ancres internes (#...) et références de symboles (<use href="#...">)
  for (const [, ref] of html.matchAll(/href="#([^"]*)"/g)) {
    if (ref && !idSet.has(ref)) fail(page, `ancre introuvable : #${ref}`);
  }

  // Fichiers locaux référencés
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    const base = url.startsWith('/') ? ROOT : join(ROOT, dirname(page));
    let file = normalize(join(base, url));
    if (url.endsWith('/')) file = join(file, 'index.html');
    if (!(await exists(file))) fail(page, `fichier manquant : ${url}`);
  }

  // Métadonnées de base
  if (!/<html lang="(fr|en)"/.test(html)) fail(page, 'attribut lang manquant');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(page, '<title> manquant');
  if (page !== '404.html') {
    if (!/<meta name="description" content="[^"]{50,}"/.test(html)) fail(page, 'meta description trop courte');
    if (!/rel="canonical"/.test(html)) fail(page, 'lien canonique manquant');
    if (!html.includes('id="i18n"')) fail(page, 'textes JS (i18n) manquants');
    // Aucune donnée personnelle sensible ne doit fuiter dans le site
    if (/\b0[67](?:[ .-]?\d{2}){4}\b/.test(html)) fail(page, 'numéro de téléphone détecté');
  }
}

// Les fichiers CSS/JS référencés par les modules existent
const main = await readFile(join(ROOT, 'assets/js/main.js'), 'utf8');
for (const [, mod] of main.matchAll(/from '\.\/([^']+)'/g)) {
  if (!(await exists(join(ROOT, 'assets/js', mod)))) fail('assets/js/main.js', `module manquant : ${mod}`);
}

if (errors) {
  console.error(`\n${errors} problème(s) détecté(s).`);
  process.exit(1);
}
console.log('Vérifications OK : ancres, symboles, fichiers, métadonnées.');
