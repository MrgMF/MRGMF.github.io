#!/usr/bin/env node
// Vérifications sans dépendance sur les pages générées :
// ancres internes, symboles SVG, fichiers référencés, identifiants uniques,
// métadonnées, et politique de sécurité (CSP) cohérente avec le contenu.

import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN = ['index.html', 'en/index.html'];
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

async function demoPages() {
  const out = [];
  for (const dir of ['demos', 'en/demos']) {
    const abs = join(ROOT, dir);
    if (!(await exists(abs))) continue;
    for (const d of await readdir(abs, { withFileTypes: true })) {
      if (d.isDirectory()) out.push(`${dir}/${d.name}/index.html`);
    }
  }
  return out;
}

const PAGES = [...MAIN, '404.html', ...(await demoPages())];

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
  // Références ARIA
  for (const [, attr, refs] of html.matchAll(/\s(aria-labelledby|aria-controls|aria-describedby)="([^"]+)"/g)) {
    for (const ref of refs.split(/\s+/)) if (!idSet.has(ref)) fail(page, `${attr} vise un id absent : ${ref}`);
  }

  // Fichiers locaux référencés (et ancres vers d'autres pages du site)
  for (const [, url, hash] of html.matchAll(/(?:href|src)="([^"#]*)(#[^"]*)?"/g)) {
    if (!url || /^(https?:|mailto:|data:)/.test(url)) continue;
    const base = url.startsWith('/') ? ROOT : join(ROOT, dirname(page));
    let file = normalize(join(base, url));
    if (url.endsWith('/')) file = join(file, 'index.html');
    if (!(await exists(file))) {
      fail(page, `fichier manquant : ${url}`);
      continue;
    }
    if (hash && hash.length > 1 && file.endsWith('.html')) {
      const target = await readFile(file, 'utf8');
      if (!target.includes(`id="${hash.slice(1)}"`)) fail(page, `ancre introuvable : ${url}${hash}`);
    }
  }

  // Métadonnées de base
  if (!/<html lang="(fr|en)"/.test(html)) fail(page, 'attribut lang manquant');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(page, '<title> manquant');
  if (page !== '404.html') {
    if (!/<meta name="description" content="[^"]{50,}"/.test(html)) fail(page, 'meta description trop courte');
    if (!/rel="canonical"/.test(html)) fail(page, 'lien canonique manquant');
    // Aucune donnée personnelle sensible ne doit fuiter dans le site
    if (/\b0[67](?:[ .-]?\d{2}){4}\b/.test(html)) fail(page, 'numéro de téléphone détecté');
  }
  if (MAIN.includes(page) && !html.includes('id="i18n"')) fail(page, 'textes JS (i18n) manquants');

  // CSP : présente, sans 'unsafe-inline', et chaque script inline est autorisé par son empreinte.
  const cspMatch = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html);
  if (!cspMatch) {
    fail(page, 'politique CSP absente');
  } else {
    const policy = cspMatch[1];
    if (policy.includes('unsafe-inline') || policy.includes('unsafe-eval')) fail(page, 'CSP trop permissive');
    if (html.indexOf('http-equiv="Content-Security-Policy"') > html.indexOf('<link')) fail(page, 'la CSP doit précéder les ressources');
    // Motif insensible à la casse, tolérant les espaces et attributs de fin de balise.
    for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi)) {
      if (/\bsrc\s*=/i.test(attrs) || /type\s*=\s*"application\/(ld\+)?json"/i.test(attrs)) continue;
      const hash = `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
      if (!policy.includes(hash)) fail(page, 'script inline non autorisé par la CSP');
    }
  }
  // Aucun style inline (bloqué par la CSP) ni gestionnaire d'événement inline.
  if (/\sstyle\s*=/i.test(html)) fail(page, 'attribut style= présent (bloqué par la CSP)');
  if (/<style\b/i.test(html)) fail(page, 'balise <style> présente (bloquée par la CSP)');
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(html)) fail(page, 'gestionnaire d’événement inline présent');
}

// Les modules JS importés existent
for (const entry of ['assets/js/main.js', ...(await readdir(join(ROOT, 'assets/js/demos'))).map((f) => `assets/js/demos/${f}`)]) {
  const src = await readFile(join(ROOT, entry), 'utf8');
  for (const [, mod] of src.matchAll(/from '\.\/([^']+)'/g)) {
    if (!(await exists(join(ROOT, dirname(entry), mod)))) fail(entry, `module manquant : ${mod}`);
  }
}

if (errors) {
  console.error(`\n${errors} problème(s) détecté(s).`);
  process.exit(1);
}
console.log(`Vérifications OK : ${PAGES.length} pages (ancres, fichiers, métadonnées, CSP).`);
