// Outils communs aux démos : textes traduits, création d'éléments, formats.
// Aucune donnée ne quitte le navigateur : pas de fetch, pas de stockage distant.

export const root = document.documentElement;
export const lang = root.lang === 'en' ? 'en' : 'fr';
export const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
export const t = JSON.parse(document.getElementById('demo-i18n')?.textContent || '{}');

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// h('p', { class: 'x', 'aria-live': 'polite' }, 'texte', autreNoeud)
// Le texte passe toujours par des nœuds texte : jamais d'innerHTML.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const fmt = (n, opts) => new Intl.NumberFormat(locale, opts).format(n);
export const money = (n) => fmt(n, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });

// « Bonjour {name} » + { name: 'Ada' }
export const fill = (s = '', vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Générateur pseudo-aléatoire reproductible (données fictives stables).
export function seeded(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Heure locale lisible pour les journaux.
export const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

// Bouton « segmenté » (aria-pressed) : renvoie la valeur choisie via onChange.
export function segmented(container, onChange) {
  container.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-value]');
    if (!b || !container.contains(b)) return;
    container.querySelectorAll('button[data-value]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onChange(b.dataset.value);
  });
}

// La démo tourne : on retire l'avertissement « JavaScript requis ».
document.querySelector('[data-nojs]')?.remove();
