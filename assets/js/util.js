// Petits utilitaires partagés : stockage tolérant, textes traduits, effets.

export const root = document.documentElement;

export const i18n = JSON.parse(document.getElementById('i18n')?.textContent || '{}');

export const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(`mrgmf.${key}`);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`mrgmf.${key}`, String(value));
    } catch {
      /* navigation privée, stockage bloqué : tant pis, rien d'essentiel */
    }
  },
};

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => motionQuery.matches;

export const isGame = () => root.dataset.mode === 'game';

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Relance une animation CSS portée par une classe.
export function pulseClass(el, cls, ms = 0) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  if (ms) setTimeout(() => el.classList.remove(cls), ms);
}

// --- Annonces lecteur d'écran + toasts visuels ----------------------------
const announcer = document.querySelector('[data-announcer]');
export function announce(text) {
  if (!announcer) return;
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = text;
  }, 60);
}

const toasts = document.querySelector('[data-toasts]');
export function toast(text, variant = '') {
  if (!toasts) return;
  const el = document.createElement('p');
  el.className = `toast${variant ? ` toast--${variant}` : ''}`;
  el.textContent = text;
  toasts.append(el);
  while (toasts.children.length > 3) toasts.firstElementChild.remove();
  setTimeout(() => el.remove(), 2100);
  announce(text);
}

// Grande bannière centrale (FIGHT!, K.O., PERFECT). Résout à la fin.
const bannerEl = document.querySelector('[data-banner]');
export function banner(text, gold = false) {
  return new Promise((resolve) => {
    if (!bannerEl || reducedMotion()) {
      resolve();
      return;
    }
    bannerEl.textContent = text;
    bannerEl.classList.toggle('banner--gold', gold);
    pulseClass(bannerEl, 'is-on');
    setTimeout(() => {
      bannerEl.classList.remove('is-on');
      resolve();
    }, 1000);
  });
}

// Étincelle d'impact positionnée dans un calque.
export function spark(layer, x, y, big = false) {
  if (!layer || reducedMotion()) return;
  const s = document.createElement('span');
  s.className = `spark${big ? ' spark--super' : ''}`;
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  layer.append(s);
  setTimeout(() => s.remove(), 400);
}
