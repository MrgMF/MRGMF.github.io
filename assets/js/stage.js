// Combat d'une mission : chaque coup révèle un point fort du projet,
// le dernier est le « super ». Barre de vie, combo, K.O., résultats.
// Le contenu est découpé en onglets (Brief · Points forts · Résultat).

import { sfx } from './audio.js';
import { createTabs } from './tabs.js';
import { i18n, store, reducedMotion, pulseClass, banner, spark, announce, isGame } from './util.js';

const F = i18n.fight || {};
const cleared = new Set((store.get('cleared', '') || '').split(',').filter(Boolean));

// Le chrono descend d'une unité toutes les 3 secondes : ~5 minutes pour
// lire tranquillement avant la fin du temps réglementaire.
const TICK_MS = 3000;

function markCleared(id) {
  cleared.add(id);
  store.set('cleared', [...cleared].join(','));
  document.querySelectorAll(`.tile[data-stage="${id}"]`).forEach((t) => t.classList.add('is-cleared'));
}

export function wasCleared(id) {
  return cleared.has(id);
}

function createStage(el) {
  const id = el.dataset.stage;
  const total = Number(el.dataset.total);
  const hits = [...el.querySelectorAll('.hit')];
  const hp = el.querySelector('[data-boss-hp]');
  const combo = el.querySelector('[data-combo]');
  const commentary = el.querySelector('[data-commentary]');
  const arena = el.querySelector('.arena');
  const p1 = el.querySelector('.fighter--p1');
  const boss = el.querySelector('.fighter--boss');
  const assist = el.querySelector('.fighter--assist');
  const layer = el.querySelector('[data-fx]');
  const timerEl = el.querySelector('[data-timer]');
  const attackBtn = el.querySelector('[data-attack]');
  const countEl = el.querySelector('[data-hit-count]');
  const tabs = createTabs(el);
  const idleHTML = commentary ? commentary.innerHTML : '';

  let n = 0;
  let done = false;
  let finishing = false;
  let time = 99;
  let timer = null;
  let visited = false;

  function setHP() {
    const ratio = Math.max(0, 1 - n / total);
    hp?.style.setProperty('--hp', ratio.toFixed(3));
    if (hp) hp.toggleAttribute('data-low', ratio <= 0.3);
    if (countEl) countEl.textContent = `${Math.min(n, total)}/${total}`;
  }

  function reveal(upTo) {
    hits.forEach((h, i) => h.classList.toggle('is-revealed', i < upTo));
  }

  function say(hitIndex, tag, isSuper = false) {
    const h = hits[hitIndex];
    if (!h || !commentary) return;
    const name = h.querySelector('h4')?.textContent || '';
    const desc = h.querySelector('p')?.textContent || '';
    commentary.classList.toggle('is-super', isSuper);
    const p = document.createElement('p');
    const t = document.createElement('span');
    t.className = 'commentary-tag';
    t.textContent = tag;
    const nm = document.createElement('span');
    nm.className = 'commentary-name';
    nm.textContent = name;
    const d = document.createElement('span');
    d.className = 'commentary-desc';
    d.textContent = desc;
    p.append(t, nm, d);
    commentary.replaceChildren(p);
  }

  function impact(big) {
    if (!arena || !boss) return;
    const a = arena.getBoundingClientRect();
    const b = boss.getBoundingClientRect();
    const x = b.left - a.left + b.width * 0.35 + (Math.random() * 20 - 10);
    const y = b.top - a.top + b.height * 0.45 + (Math.random() * 30 - 15);
    spark(layer, x, y, big);
    pulseClass(p1, 'is-punching', 220);
    if (assist && (big || n % 3 === 0)) pulseClass(assist, 'is-helping', 500);
    pulseClass(boss, 'is-hit', 300);
    if (!reducedMotion()) pulseClass(arena, big ? 'is-super' : 'is-shaking', big ? 700 : 260);
  }

  function strike({ move = null, moveName = '' } = {}) {
    if (done || finishing) return;
    const before = n;
    n = Math.min(total, n + (move ? 2 : 1));
    const isSuper = n >= total;
    reveal(n);
    setHP();
    impact(isSuper);
    if (combo) {
      combo.textContent = `${n} ${n > 1 ? F.hits : F.hit}`;
      if (move) {
        const small = document.createElement('small');
        small.textContent = `${F.special} ${moveName}`;
        combo.append(small);
      }
      pulseClass(combo, 'is-bump', 220);
    }
    const tag = isSuper ? F.super : move ? `${F.special} ${moveName}` : `Combo ${n}`;
    say(n - 1, tag, isSuper);
    if (isSuper) sfx.super();
    else if (move) sfx.special();
    else sfx.hit();
    if (n > before && isSuper) finish();
  }

  async function finish() {
    finishing = true;
    stopTimer();
    el.classList.add('is-ko');
    sfx.ko();
    await banner(F.ko);
    await banner(F.perfect, true);
    finishing = false;
    clear();
  }

  // Combat terminé (K.O. ou passé) : tout est révélé, on montre le résultat.
  function clear() {
    done = true;
    stopTimer();
    reveal(total);
    n = total;
    setHP();
    el.classList.add('is-ko', 'is-cleared');
    markCleared(id);
    tabs?.select('results');
    announce(`${F.ko} ${F.perfect}`);
    el.dispatchEvent(new CustomEvent('stage:cleared', { bubbles: true, detail: { id } }));
  }

  function skip() {
    if (done) return;
    clear();
  }

  function reset() {
    n = 0;
    done = false;
    finishing = false;
    el.classList.remove('is-ko', 'is-cleared');
    reveal(0);
    setHP();
    if (combo) combo.textContent = '';
    if (commentary) {
      commentary.classList.remove('is-super');
      commentary.innerHTML = idleHTML;
    }
    time = 99;
    if (timerEl) timerEl.textContent = '99';
    tabs?.select('brief');
  }

  function tick() {
    time = Math.max(0, time - 1);
    if (timerEl) timerEl.textContent = String(time).padStart(2, '0');
    if (!time) stopTimer();
  }

  function startTimer() {
    stopTimer();
    if (done || reducedMotion()) return;
    timer = setInterval(tick, TICK_MS);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  // Une mission déjà réussie (visite précédente) s'affiche directement vaincue.
  if (cleared.has(id)) {
    reveal(total);
    n = total;
    done = true;
    el.classList.add('is-ko', 'is-cleared');
  }
  setHP();

  attackBtn?.addEventListener('click', () => strike());
  el.querySelector('[data-skip]')?.addEventListener('click', skip);
  el.querySelector('[data-replay]')?.addEventListener('click', () => {
    reset();
    startTimer();
    el.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    attackBtn?.focus({ preventScroll: true });
  });

  return {
    el,
    id,
    tabs,
    strike,
    enter() {
      // Première visite : le brief ; mission déjà réussie : le résultat.
      if (!visited) tabs?.select(done ? 'results' : 'brief');
      visited = true;
      startTimer();
    },
    leave: stopTimer,
    get done() {
      return done;
    },
  };
}

let all = new Map();

export function initStages() {
  all = new Map();
  document.querySelectorAll('.stage').forEach((el) => all.set(el.id, createStage(el)));
  cleared.forEach((id) => document.querySelectorAll(`.tile[data-stage="${id}"]`).forEach((t) => t.classList.add('is-cleared')));
  setTabsEnabled(isGame());
  return all;
}

export function setTabsEnabled(on) {
  all.forEach((s) => s.tabs?.setEnabled(on));
}
