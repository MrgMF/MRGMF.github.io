// Entrées façon jeu de combat.
// - Clavier : flèches ou WASD/ZQSD (touches physiques via e.code, donc AZERTY
//   et QWERTY fonctionnent pareil), J = poing (P), K = pied (K).
// - Manette : croix ou stick gauche, A/X = P, B/Y = K, Start, Select.
// - Buffer de directions en notation « numpad » (2 = bas, 6 = avant…) et
//   détection des manipulations (236P, 623K, 236236PK…).

import { isGame } from './util.js';

const listeners = new Map();
export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type).delete(fn);
}
function emit(type, detail) {
  listeners.get(type)?.forEach((fn) => fn(detail));
}

// --- Affichage des entrées (coin bas-gauche, comme le mode entraînement) ----
const ANGLE = { 6: 0, 3: 45, 2: 90, 1: 135, 4: 180, 7: 225, 8: 270, 9: 315 };
const displayEl = document.querySelector('[data-input-display]');
let lastRow = null;
let lastRowTime = 0;

const dirIcon = (n) =>
  `<svg class="in in--dir" viewBox="0 0 24 24"><use href="#in-dir"${ANGLE[n] ? ` transform="rotate(${ANGLE[n]} 12 12)"` : ''}/></svg>`;
const btnIcon = (b) => `<svg class="in in--btn in--${b.toLowerCase()}" viewBox="0 0 24 24"><use href="#in-${b}"/></svg>`;

function showInput(html, isButton) {
  if (!displayEl || !isGame()) return;
  const now = performance.now();
  if (isButton && lastRow && now - lastRowTime < 140) {
    lastRow.insertAdjacentHTML('beforeend', html);
    return;
  }
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = html;
  displayEl.append(row);
  while (displayEl.children.length > 10) displayEl.firstElementChild.remove();
  lastRow = row;
  lastRowTime = now;
}

// --- Directions ---------------------------------------------------------------
const KEY_DIR = {
  ArrowUp: 'u',
  KeyW: 'u',
  ArrowDown: 'd',
  KeyS: 'd',
  ArrowLeft: 'l',
  KeyA: 'l',
  ArrowRight: 'r',
  KeyD: 'r',
};
const held = {
  key: { u: false, d: false, l: false, r: false },
  pad: { u: false, d: false, l: false, r: false },
};
const buffer = [];
let lastNum = 5;

function numpad() {
  const h = (k) => held.key[k] || held.pad[k];
  let n = 5;
  if (h('r') && !h('l')) n += 1;
  if (h('l') && !h('r')) n -= 1;
  if (h('u') && !h('d')) n += 3;
  if (h('d') && !h('u')) n -= 3;
  return n;
}

function updateDir() {
  const n = numpad();
  if (n === lastNum) return;
  lastNum = n;
  buffer.push({ n, t: performance.now() });
  if (buffer.length > 40) buffer.shift();
  emit('dir', n);
  if (n !== 5) showInput(dirIcon(n), false);
}

// --- Manipulations ------------------------------------------------------------
let MOVES = [];
export function registerMoves(list) {
  MOVES = list
    .map(({ id, input }) => {
      const m = /^([1-9]+)([PK]+)$/.exec(input);
      return m ? { id, dirs: m[1], btns: m[2] } : null;
    })
    .filter(Boolean)
    // Les manipulations les plus longues d'abord (41236P avant 236P).
    .sort((a, b) => b.dirs.length - a.dirs.length || b.btns.length - a.btns.length);
}

const WINDOW = 950;
const DIAGONALS = new Set([1, 3, 7, 9]);
const collapse = (arr) => arr.filter((v, i) => i === 0 || v !== arr[i - 1]);

// Au clavier, les diagonales intermédiaires sont tolérées : 236 accepte 26.
function variants(dirs) {
  const pat = [...dirs].map(Number);
  const out = [pat];
  const lenient = pat.filter((d, i) => !(DIAGONALS.has(d) && i > 0 && i < pat.length - 1));
  if (lenient.length !== pat.length && lenient.length >= 2) out.push(lenient);
  return out;
}

// La séquence doit se terminer par le motif, avec au plus `maxSkips` parasites.
function tailMatch(seq, pat, maxSkips = 2) {
  let j = pat.length - 1;
  let skips = 0;
  for (let i = seq.length - 1; i >= 0 && j >= 0; i--) {
    if (seq[i] === pat[j]) j--;
    else if (++skips > maxSkips) return false;
  }
  return j < 0;
}

function motionDone(dirs, at) {
  const recent = collapse(buffer.filter((e) => at - e.t <= WINDOW).map((e) => e.n));
  if (/^(\d)\1$/.test(dirs)) {
    // Double tapotement (66, 22) : direction, neutre, direction.
    const d = Number(dirs[0]);
    return tailMatch(recent, [d, 5, d], 1);
  }
  const clean = collapse(recent.filter((n) => n !== 5));
  return variants(dirs).some((p) => tailMatch(clean, p));
}

function detect(btns, at) {
  for (const m of MOVES) if (m.btns === btns && motionDone(m.dirs, at)) return m.id;
  return null;
}

// --- Boutons : P et K pressés ensemble (< 70 ms) = « PK » -------------------
const BOTH_WINDOW = 70;
let pending = null;

function fireStrike(btns, at) {
  let move = detect(btns, at);
  if (!move && btns === 'PK') move = detect('P', at) || detect('K', at);
  if (move) buffer.length = 0;
  emit('strike', { btns, move });
}

function pressButton(btn) {
  const now = performance.now();
  showInput(btnIcon(btn), true);
  emit('press', btn);
  if (pending && pending.btn !== btn && now - pending.t <= BOTH_WINDOW) {
    clearTimeout(pending.timer);
    const at = pending.t;
    pending = null;
    fireStrike('PK', at);
    return;
  }
  if (pending) {
    clearTimeout(pending.timer);
    fireStrike(pending.btn, pending.t);
  }
  pending = {
    btn,
    t: now,
    timer: setTimeout(() => {
      const p = pending;
      pending = null;
      if (p) fireStrike(p.btn, p.t);
    }, BOTH_WINDOW),
  };
}

// --- Konami : ↑ ↑ ↓ ↓ ← → ← → B A ------------------------------------------
const KONAMI = ['u', 'u', 'd', 'd', 'l', 'r', 'l', 'r', 'b', 'a'];
let konamiPos = 0;
function konamiStep(token) {
  if (token === KONAMI[konamiPos]) {
    konamiPos++;
    if (konamiPos === KONAMI.length) {
      konamiPos = 0;
      emit('konami');
    }
  } else {
    konamiPos = token === KONAMI[0] ? 1 : 0;
  }
}

// --- Clavier ----------------------------------------------------------------
const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const interactive = (el) => el && el.closest('a[href], button, summary, [role="button"]');
const dialogOpen = () => !!document.querySelector('dialog[open]');

window.addEventListener('keydown', (e) => {
  if (!isGame() || e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || dialogOpen()) return;
  const letter = e.key.length === 1 ? e.key.toLowerCase() : '';
  const dir = KEY_DIR[e.code];

  if (!e.repeat) {
    if (letter === 'a' || letter === 'b') konamiStep(letter);
    else if (dir && e.code.startsWith('Arrow')) konamiStep(dir);
  }

  if (dir) {
    e.preventDefault();
    emit('nav', { dir, repeat: e.repeat, source: 'key' });
    if (!held.key[dir]) {
      held.key[dir] = true;
      updateDir();
    }
    return;
  }
  if (e.repeat) return;

  if (e.code === 'KeyJ') pressButton('P');
  else if (e.code === 'KeyK') pressButton('K');
  else if (e.key === 'Enter' && !interactive(e.target)) {
    e.preventDefault();
    emit('press', 'START');
  } else if (e.key === 'Escape') emit('press', 'BACK');
  else if (letter === 'm') emit('press', 'SOUND');
  else if (e.key === '?') emit('press', 'HELP');
});

window.addEventListener('keyup', (e) => {
  const dir = KEY_DIR[e.code];
  if (dir && held.key[dir]) {
    held.key[dir] = false;
    updateDir();
  }
});

window.addEventListener('blur', () => {
  Object.keys(held.key).forEach((k) => (held.key[k] = false));
  updateDir();
});

// --- Manette (Gamepad API) --------------------------------------------------
let polling = false;
const prevButtons = {};
const PAD_BUTTONS = { 0: 'P', 2: 'P', 1: 'K', 3: 'K', 8: 'BACK', 9: 'START' };

function pollPads() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  if (!pads.length) {
    polling = false;
    return;
  }
  const gp = pads[0];
  const ax = gp.axes[0] || 0;
  const ay = gp.axes[1] || 0;
  const pressed = (i) => Boolean(gp.buttons[i] && gp.buttons[i].pressed);
  const now = {
    u: pressed(12) || ay < -0.55,
    d: pressed(13) || ay > 0.55,
    l: pressed(14) || ax < -0.55,
    r: pressed(15) || ax > 0.55,
  };
  let changed = false;
  for (const k of ['u', 'd', 'l', 'r']) {
    if (now[k] === held.pad[k]) continue;
    held.pad[k] = now[k];
    changed = true;
    if (now[k] && isGame()) {
      emit('nav', { dir: k, repeat: false, source: 'pad' });
      konamiStep(k);
    }
  }
  if (changed) updateDir();

  for (const [i, name] of Object.entries(PAD_BUTTONS)) {
    const p = pressed(Number(i));
    if (p && !prevButtons[i] && isGame() && !dialogOpen()) {
      if (i === '0') konamiStep('a');
      if (i === '1') konamiStep('b');
      if (name === 'P' || name === 'K') {
        pressButton(name);
        emit('pad', name);
      } else emit('press', name);
    }
    prevButtons[i] = p;
  }
  requestAnimationFrame(pollPads);
}

window.addEventListener('gamepadconnected', () => {
  emit('padconnected');
  if (!polling) {
    polling = true;
    requestAnimationFrame(pollPads);
  }
});

// Déclenche une manipulation « à la main » (démo tactile de la move list).
export function simulate(moveId) {
  emit('strike', { btns: '', move: moveId, simulated: true });
}
