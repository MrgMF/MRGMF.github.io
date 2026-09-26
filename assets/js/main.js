// Borne d'arcade : routage entre écrans, sélection d'adversaire, écran VS,
// move list, fiche combattant, contact et réglages (son, mode lecture).

import * as input from './input.js';
import { sfx, setSound, isSoundOn, armOnGesture } from './audio.js';
import { initStages } from './stage.js';
import { root, i18n, store, isGame, reducedMotion, toast, announce, pulseClass, wait } from './util.js';

window.__arcadeReady = true;
if (window.__arcadeFallback) root.dataset.mode = 'reading';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const screens = new Map($$('.screen').map((el) => [el.id, el]));
const hudScreen = $('[data-hud-screen]');
const baseTitle = document.title;
const stages = initStages();
let current = null;

// --- Écrans -------------------------------------------------------------------
function labelFor(el) {
  if (!el) return '';
  if (el.dataset.screen === 'stage') return `${i18n.screens.stage} · ${$('.screen-heading', el)?.textContent || ''}`;
  return i18n.screens[el.id] || el.id;
}

function show(id) {
  const el = screens.get(id) || screens.get('title');
  if (current === el) return;
  if (current) {
    current.classList.remove('is-active');
    stages.get(current.id)?.leave();
    leaveHooks[current.dataset.screen]?.(current);
  }
  current = el;
  el.classList.add('is-active');
  el.scrollTop = 0;
  const label = labelFor(el);
  if (hudScreen) hudScreen.textContent = label;
  document.title = el.id === 'title' ? baseTitle : `${label} · MRGMF`;
  stages.get(el.id)?.enter();
  enterHooks[el.dataset.screen]?.(el);
  if (el.id !== 'select') $('.screen-heading', el)?.focus({ preventScroll: true });
  announce(`${i18n.announceScreen} : ${label}`);
}

function targetFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || id === 'main') return 'title';
  return screens.has(id) ? id : 'title';
}

let routing = false;
async function route() {
  if (!isGame() || routing) return;
  const id = targetFromHash();
  const el = screens.get(id);
  if (el?.dataset.screen === 'stage' && current && current !== el && !reducedMotion()) {
    routing = true;
    await playVS(el);
    routing = false;
  }
  show(targetFromHash());
}

function go(id) {
  if (location.hash === `#${id}`) show(id);
  else location.hash = id;
}

window.addEventListener('hashchange', route);

// --- Écran VS -------------------------------------------------------------------
const vs = $('[data-vs]');
const vsArt = $('[data-vs-art]');
const vsName = $('[data-vs-name]');
const vsRound = $('[data-vs-round]');
const bossStore = $('.boss-store');

function playVS(stageEl) {
  return new Promise((resolve) => {
    const art = bossStore?.querySelector(`[data-art="${stageEl.dataset.sprite}"]`);
    vsArt.innerHTML = art ? art.innerHTML : '';
    vsName.textContent = stageEl.dataset.boss;
    vsRound.textContent = '';
    vs.hidden = false;
    sfx.confirm();
    const timers = [
      setTimeout(() => (vsRound.textContent = i18n.fight.round), 800),
      setTimeout(() => {
        vsRound.textContent = i18n.fight.fight;
        sfx.start();
      }, 1350),
      setTimeout(finish, 1950),
    ];
    let off = null;
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      vs.hidden = true;
      vs.removeEventListener('click', finish);
      off?.();
      resolve();
    }
    vs.addEventListener('click', finish);
    setTimeout(() => {
      if (!finished) off = input.on('press', finish);
    }, 150);
  });
}

// --- Écran titre ------------------------------------------------------------------
$('[data-press-start]')?.addEventListener('click', () => sfx.start());

// --- Sélection -----------------------------------------------------------------
const select = screens.get('select');
const navItems = $$('.tile, .menu-btn', select).filter((el) => !el.closest('.reading-only'));
const p2 = {
  name: $('[data-p2-name]'),
  boss: $('[data-p2-boss]'),
  tagline: $('[data-p2-tagline]'),
  meta: $('[data-p2-meta]'),
  arts: $$('.p2-art', select),
};
let cursor = navItems.find((el) => el.classList.contains('tile'));

const unlocked = () => root.classList.contains('is-unlocked');

function preview(tile) {
  if (!tile.classList.contains('tile')) return;
  const locked = tile.hasAttribute('data-secret') && !unlocked();
  const d = locked
    ? { name: i18n.select.locked.name, boss: '?', tagline: i18n.select.locked.tagline, sprite: 'mystery', meta: '[]' }
    : tile.dataset;
  p2.name.textContent = d.name;
  p2.boss.textContent = d.boss;
  p2.tagline.textContent = d.tagline;
  let meta = [];
  try {
    meta = JSON.parse(d.meta || '[]');
  } catch {
    meta = [];
  }
  p2.meta.replaceChildren(
    ...meta.map((m) => {
      const li = document.createElement('li');
      li.textContent = m;
      return li;
    })
  );
  p2.arts.forEach((a) => (a.hidden = a.dataset.art !== d.sprite));
}

function setCursor(el, { sound = false, focus = true } = {}) {
  if (!el) return;
  navItems.forEach((i) => i.classList.toggle('is-focused', i === el));
  cursor = el;
  preview(el);
  if (focus && document.activeElement !== el) el.focus({ preventScroll: false });
  if (sound) sfx.move();
}

navItems.forEach((el) => {
  el.addEventListener('focus', () => setCursor(el, { focus: false }));
  el.addEventListener('mouseenter', () => isGame() && setCursor(el, { focus: false }));
});

// Navigation spatiale : on cherche l'élément le plus proche dans la direction.
function neighbour(from, dir) {
  const r0 = from.getBoundingClientRect();
  const c0 = { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2 };
  const dx = dir === 'r' ? 1 : dir === 'l' ? -1 : 0;
  const dy = dir === 'd' ? 1 : dir === 'u' ? -1 : 0;
  let best = null;
  let bestScore = Infinity;
  for (const el of navItems) {
    if (el === from || !el.offsetParent) continue;
    const r = el.getBoundingClientRect();
    const vx = r.left + r.width / 2 - c0.x;
    const vy = r.top + r.height / 2 - c0.y;
    const along = dx ? vx * dx : vy * dy;
    if (along <= 4) continue;
    const across = dx ? Math.abs(vy) : Math.abs(vx);
    const score = along + across * 2.4;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

async function randomPick(tile) {
  const pool = navItems.filter(
    (el) => el.classList.contains('tile') && el.dataset.stage && (!el.hasAttribute('data-secret') || unlocked())
  );
  const choice = pool[Math.floor(Math.random() * pool.length)];
  if (!reducedMotion()) {
    for (let i = 0; i < 10; i++) {
      setCursor(pool[i % pool.length], { sound: true, focus: false });
      await wait(55 + i * 12);
    }
  }
  setCursor(choice, { focus: false });
  pulseClass(choice, 'is-picked');
  tile.blur();
  go(`vs-${choice.dataset.stage}`);
}

select.addEventListener('click', (e) => {
  if (!isGame()) return;
  const tile = e.target.closest('.tile');
  if (!tile) return;
  if (tile.hasAttribute('data-random')) {
    e.preventDefault();
    sfx.confirm();
    randomPick(tile);
    return;
  }
  if (tile.hasAttribute('data-secret') && !unlocked()) {
    e.preventDefault();
    pulseClass(tile, 'is-denied', 400);
    sfx.deny();
    toast(i18n.select.lockedToast, 'info');
    return;
  }
  pulseClass(tile, 'is-picked');
});

const enterHooks = {
  select() {
    setCursor(cursor, { focus: true });
  },
  contact: startContinue,
};
const leaveHooks = {
  contact: stopContinue,
};

// --- Commandes globales (clavier / manette) ------------------------------------
input.on('nav', ({ dir }) => {
  if (!isGame() || !current || $('dialog[open]')) return;
  if (current.id === 'select') {
    const from = navItems.includes(document.activeElement) ? document.activeElement : cursor;
    const next = neighbour(from, dir);
    if (next) setCursor(next, { sound: true });
  }
});

function confirm() {
  const el = document.activeElement;
  if (el && el !== document.body && el.matches('a[href], button')) el.click();
}

function back() {
  if (!current) return;
  if (current.id === 'title') return;
  sfx.back();
  go(current.id === 'select' ? 'title' : 'select');
}

input.on('press', (btn) => {
  if (!isGame() || !current || routing) return;
  if (btn === 'SOUND') return toggleSound();
  if (btn === 'HELP') return openHelp();
  if (btn === 'BACK') return back();
  if (current.id === 'title' && (btn === 'START' || btn === 'P')) {
    sfx.start();
    return go('select');
  }
  if (current.id === 'select' && btn === 'START') return confirm();
});

// Bouton A de la manette = valider, B = retour (hors combat et move list).
input.on('pad', (btn) => {
  if (!isGame() || !current || routing) return;
  const fighting = current.dataset.screen === 'stage' || current.id === 'moves';
  if (btn === 'P' && !fighting && current.id !== 'title' && current.id !== 'select') confirm();
  if (btn === 'K' && !fighting) back();
});

// Clavier J = valider sur la sélection.
input.on('press', (btn) => {
  if (isGame() && current?.id === 'select' && btn === 'P' && !routing) confirm();
});

input.on('padconnected', () => isGame() && toast(i18n.padConnected, 'info'));

// Coups (J/K, éventuellement précédés d'une manipulation)
input.on('strike', ({ move }) => {
  if (!isGame() || !current) return;
  const stage = stages.get(current.id);
  const name = move ? i18n.moveNames[move] : '';
  if (stage) {
    stage.strike({ move, moveName: name });
    if (move) landMove(move, { toast: false });
    return;
  }
  if (move) landMove(move, { toast: true });
});

// --- Move list -------------------------------------------------------------------
const moveEls = $$('.move[data-move]');
input.registerMoves(moveEls.map((el) => ({ id: el.dataset.move, input: el.dataset.input })));
const found = new Set((store.get('moves', '') || '').split(',').filter((id) => moveEls.some((m) => m.dataset.move === id)));
const foundEl = $('[data-moves-found]');

function renderFound() {
  moveEls.forEach((el) => el.classList.toggle('is-found', found.has(el.dataset.move)));
  if (foundEl) foundEl.textContent = String(found.size);
}
renderFound();

function landMove(id, { toast: showToast = true } = {}) {
  const el = moveEls.find((m) => m.dataset.move === id);
  const isSuper = el?.classList.contains('move--super');
  if (showToast) toast(`${i18n.moveNames[id]}${i18n.bang}`, isSuper ? 'gold' : '');
  if (current?.id === 'moves' || !stages.get(current?.id)) {
    if (isSuper) sfx.super();
    else sfx.special();
  }
  if (el) pulseClass(el, 'is-flash', 800);
  if (!found.has(id)) {
    found.add(id);
    store.set('moves', [...found].join(','));
    renderFound();
    if (found.size === moveEls.length) {
      toast(i18n.moves.allFound, 'gold');
      unlock();
    }
  }
}

// Démo : on allume les icônes de la manipulation une à une.
moveEls.forEach((el) => {
  el.querySelector('[data-demo]')?.addEventListener('click', async () => {
    const icons = [...el.querySelectorAll('.inputs .in')];
    if (!reducedMotion()) {
      for (const ic of icons) {
        ic.classList.add('is-lit');
        sfx.move();
        await wait(110);
        ic.classList.remove('is-lit');
      }
    }
    landMove(el.dataset.move);
  });
});

// --- Adversaire secret -------------------------------------------------------------
function unlock() {
  if (unlocked()) return;
  root.classList.add('is-unlocked');
  store.set('unlocked', '1');
  sfx.coin();
  setTimeout(() => toast(i18n.select.unlockedToast, 'gold'), 300);
  if (cursor) preview(cursor);
}

input.on('konami', () => {
  if (!isGame()) return;
  toast(i18n.konami, 'gold');
  unlock();
});

// --- Fiche combattant : costumes ----------------------------------------------------
const swatches = $$('[data-costume]');
function applyCostume(i) {
  const n = Number(i) || 0;
  if (n) root.dataset.costume = String(n);
  else delete root.dataset.costume;
  swatches.forEach((s) => s.setAttribute('aria-pressed', String(Number(s.dataset.costume) === n)));
}
applyCostume(store.get('costume', 0));
swatches.forEach((s) =>
  s.addEventListener('click', () => {
    applyCostume(s.dataset.costume);
    store.set('costume', s.dataset.costume);
    sfx.confirm();
  })
);

// --- Contact ------------------------------------------------------------------------
$$('[data-u][data-d]').forEach((el) => {
  const addr = `${el.dataset.u}@${el.dataset.d}`;
  if (el.matches('[data-mail]')) el.textContent = addr;
  if (el.tagName === 'A') el.href = `mailto:${addr}`;
});

$('[data-copy]')?.addEventListener('click', async (e) => {
  const el = e.currentTarget;
  const addr = `${el.dataset.u}@${el.dataset.d}`;
  try {
    await navigator.clipboard.writeText(addr);
    toast(i18n.contact.copied, 'info');
    sfx.coin();
  } catch {
    toast(i18n.contact.copyFail, 'info');
  }
});

let continueTimer = null;
function startContinue(el) {
  const b = $('[data-continue]', el);
  const over = $('[data-game-over]', el);
  if (!b) return;
  let n = 9;
  b.textContent = '9';
  if (over) over.hidden = true;
  stopContinue();
  if (reducedMotion()) return;
  continueTimer = setInterval(() => {
    n -= 1;
    b.textContent = String(n);
    if (n <= 0) {
      stopContinue();
      if (over) over.hidden = false;
    }
  }, 1000);
}
function stopContinue() {
  clearInterval(continueTimer);
  continueTimer = null;
}

// --- Réglages : son, mode, aide, langue --------------------------------------------
const soundBtn = $('[data-sound]');
const soundState = $('[data-sound-state]');
function renderSound() {
  soundBtn?.setAttribute('aria-pressed', String(isSoundOn()));
  if (soundState) soundState.textContent = isSoundOn() ? i18n.on : i18n.off;
}
function toggleSound() {
  setSound(!isSoundOn());
  store.set('sound', isSoundOn() ? 'on' : 'off');
  renderSound();
  toast(isSoundOn() ? i18n.toastSoundOn : i18n.toastSoundOff, 'info');
  sfx.coin();
}
if (store.get('sound') === 'on') {
  setSound(true);
  armOnGesture();
}
renderSound();
soundBtn?.addEventListener('click', toggleSound);

function setMode(mode) {
  root.dataset.mode = mode;
  store.set('mode', mode);
  if (mode === 'game') {
    current = null;
    route();
    toast(i18n.toastArcade, 'info');
  } else {
    const id = current?.id;
    current?.classList.remove('is-active');
    stages.get(id)?.leave();
    stopContinue();
    current = null;
    document.title = baseTitle;
    const target = id && id !== 'title' ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView();
      $('.screen-heading', target)?.focus({ preventScroll: true });
    } else window.scrollTo(0, 0);
    toast(i18n.toastReading, 'info');
  }
}
$$('[data-toggle-mode]').forEach((b) =>
  b.addEventListener('click', () => setMode(isGame() ? 'reading' : 'game'))
);

const helpDialog = $('[data-help-dialog]');
function openHelp() {
  if (helpDialog && !helpDialog.open) helpDialog.showModal();
}
$('[data-help]')?.addEventListener('click', openHelp);

// On garde l'écran courant en changeant de langue.
$('[data-lang-switch]')?.addEventListener('click', (e) => {
  const a = e.currentTarget;
  if (location.hash) a.href = a.getAttribute('href').split('#')[0] + location.hash;
});

// Lien d'évitement en mode jeu : il vise l'écran courant.
$('.skip-link')?.addEventListener('click', (e) => {
  if (!isGame() || !current) return;
  e.preventDefault();
  $('.screen-heading', current)?.focus();
});

// --- Démarrage --------------------------------------------------------------------
if (isGame()) route();
