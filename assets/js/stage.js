// Combat d'un stage : chaque coup révèle un point fort du projet,
// le dernier est le « super ». Barre de vie, combo, K.O., résultats.

import { sfx } from './audio.js';
import { i18n, store, reducedMotion, pulseClass, banner, spark, announce } from './util.js';

const F = i18n.fight || {};
const cleared = new Set((store.get('cleared', '') || '').split(',').filter(Boolean));

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
  const layer = el.querySelector('[data-fx]');
  const timerEl = el.querySelector('[data-timer]');
  const attackBtn = el.querySelector('[data-attack]');
  const results = el.querySelector('.results');
  const idleHTML = commentary ? commentary.innerHTML : '';

  let n = 0;
  let done = false;
  let finishing = false;
  let time = 99;
  let timer = null;

  function setHP() {
    const ratio = Math.max(0, 1 - n / total);
    hp?.style.setProperty('--hp', ratio.toFixed(3));
    if (hp) hp.toggleAttribute('data-low', ratio <= 0.3);
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
    commentary.innerHTML = '';
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
    commentary.append(p);
  }

  function impact(big) {
    if (!arena || !boss) return;
    const a = arena.getBoundingClientRect();
    const b = boss.getBoundingClientRect();
    const x = b.left - a.left + b.width * 0.35 + (Math.random() * 20 - 10);
    const y = b.top - a.top + b.height * 0.45 + (Math.random() * 30 - 15);
    spark(layer, x, y, big);
    pulseClass(p1, 'is-punching', 220);
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
      combo.innerHTML = `${n} ${n > 1 ? F.hits : F.hit}${move ? `<small>${F.special} ${moveName}</small>` : ''}`;
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
    done = true;
    finishing = false;
    clear(true);
  }

  function clear(scroll) {
    done = true;
    reveal(total);
    n = total;
    setHP();
    el.classList.add('is-ko', 'is-cleared');
    markCleared(id);
    announce(`${F.ko} ${F.perfect}`);
    if (scroll && results) {
      results.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function skip() {
    if (done) return;
    stopTimer();
    clear(true);
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
  }

  function tick() {
    time = Math.max(0, time - 1);
    if (timerEl) timerEl.textContent = time ? String(time).padStart(2, '0') : '∞';
    if (!time) stopTimer();
  }

  function startTimer() {
    stopTimer();
    if (done || reducedMotion()) return;
    timer = setInterval(tick, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  // Un projet déjà battu (visite précédente) s'affiche directement vaincu.
  if (cleared.has(id)) {
    reveal(total);
    n = total;
    done = true;
    setHP();
    el.classList.add('is-ko', 'is-cleared');
  }

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
    strike,
    enter: startTimer,
    leave: stopTimer,
    get done() {
      return done;
    },
  };
}

export function initStages() {
  const map = new Map();
  document.querySelectorAll('.stage').forEach((el) => map.set(el.id, createStage(el)));
  cleared.forEach((id) => document.querySelectorAll(`.tile[data-stage="${id}"]`).forEach((t) => t.classList.add('is-cleared')));
  return map;
}
