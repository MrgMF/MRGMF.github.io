// Progression du mode arcade : chaque mission vaincue et chaque amélioration
// obtenue (diplôme, certification) fait monter le joueur 1 d'un niveau.

import { i18n, store } from './util.js';

const LADDER = i18n.ladder || [];
const P = i18n.progress || {};

const read = (key) => new Set((store.get(key, '') || '').split(',').filter(Boolean));

export function doneSet() {
  const cleared = read('cleared');
  const obtained = read('upgrades');
  return new Set(LADDER.filter((s) => (s.kind === 'stage' ? cleared : obtained).has(s.id)).map((s) => s.id));
}

export const level = () => 1 + doneSet().size;

// Marque une amélioration comme obtenue. Renvoie true si c'est nouveau.
export function obtain(id) {
  if (!LADDER.some((s) => s.kind === 'upgrade' && s.id === id)) return false;
  const set = read('upgrades');
  if (set.has(id)) return false;
  set.add(id);
  store.set('upgrades', [...set].join(','));
  return true;
}

// Prochaine étape non franchie (ou la première si tout est fait).
export function nextHref() {
  const done = doneSet();
  const step = LADDER.find((s) => !done.has(s.id));
  return (step || LADDER[0])?.href || '#select';
}

export function render() {
  const done = doneSet();
  const lvl = 1 + done.size;
  document.querySelectorAll('[data-level]').forEach((el) => (el.textContent = String(lvl)));
  document.querySelectorAll('[data-level-count]').forEach((el) => (el.textContent = String(done.size)));
  document
    .querySelectorAll('[data-level-bar]')
    .forEach((el) => el.style.setProperty('--fill', LADDER.length ? (done.size / LADDER.length).toFixed(3) : '0'));
  document.querySelectorAll('.step[data-step]').forEach((el) => {
    const on = done.has(el.dataset.step);
    el.classList.toggle('is-done', on);
    const status = el.querySelector('[data-status]');
    if (status) status.textContent = on ? (el.dataset.kind === 'stage' ? P.cleared : P.obtained) : '';
  });
  const btn = document.querySelector('[data-arcade]');
  if (btn && btn.firstChild) {
    const all = LADDER.length > 0 && done.size >= LADDER.length;
    btn.href = all ? LADDER[0].href : nextHref();
    btn.firstChild.textContent = `${all ? P.restart : done.size ? P.resume : P.start} `;
  }
}
