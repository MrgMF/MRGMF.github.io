// Ticket Rush : résoudre ou escalader au bon niveau avant la fin du SLA.
// On commence au N1 ; le score débloque le N2 (60 pts) puis le N3 (180 pts).

import { $, h, t, fill, reduced } from './common.js';

const ROUND = 90; // secondes
const MAX_QUEUE = 8;
const SLA = { 1: 22, 2: 30, 3: 40 }; // secondes
const POINTS = { 1: 10, 2: 20, 3: 30 };
const LEVELS = [
  [3, 180],
  [2, 60],
  [1, 0],
];

const queueEl = $('[data-queue]');
const statusEl = $('[data-status]');
const startBtn = $('[data-start]');
const overEl = $('[data-over]');
const ui = {
  level: $('[data-level]'),
  score: $('[data-score]'),
  time: $('[data-time]'),
  resolved: $('[data-resolved]'),
  hydra: $('[data-hydra]'),
  queue: $('[data-queue-count]'),
};

let state = null;
let loop = null;

const say = (text) => (statusEl.textContent = text);
const levelFor = (score) => LEVELS.find(([, min]) => score >= min)[0];

function newState() {
  return { running: true, score: 0, level: 1, time: ROUND, resolved: 0, escalated: 0, late: 0, tickets: [], nextSpawn: 0, id: 0, elapsed: 0 };
}

function pickTicket() {
  // Mélange : 50 % N1, 30 % N2, 20 % N3.
  const r = Math.random();
  const lvl = r < 0.5 ? 1 : r < 0.8 ? 2 : 3;
  const pool = t.tickets.filter(([l]) => l === lvl);
  const [level, title, cat] = pool[Math.floor(Math.random() * pool.length)];
  return { level, title, cat };
}

function spawn(ticket = pickTicket()) {
  const id = ++state.id;
  const tk = { ...ticket, id, sla: SLA[ticket.level], left: SLA[ticket.level] };
  state.tickets.push(tk);
  const card = h(
    'li',
    { class: 'ticket', 'data-id': id, tabindex: '-1' },
    h('div', { class: 'ticket-top' }, h('span', {}, `#${String(1000 + id)}`), h('span', {}, fill(t.levelTag, { l: tk.level }))),
    h('h3', {}, tk.title),
    h('p', {}, tk.cat),
    h('div', { class: 'sla', 'aria-hidden': 'true' }, h('i')),
    h(
      'p',
      { class: 'actions' },
      h('button', { class: 'btn', type: 'button', 'data-act': 'resolve' }, t.resolve),
      h('button', { class: 'btn btn--ghost', type: 'button', 'data-act': 'escalate' }, t.escalate)
    )
  );
  tk.el = card;
  queueEl.append(card);
  render();
  if (state.tickets.length >= MAX_QUEUE) end('hydra');
}

function removeTicket(tk) {
  state.tickets = state.tickets.filter((x) => x !== tk);
  tk.el.classList.add('is-done');
  const el = tk.el;
  setTimeout(() => el.remove(), reduced() ? 0 : 350);
}

function addScore(p) {
  state.score = Math.max(0, state.score + p);
  const lvl = levelFor(state.score);
  if (lvl > state.level) {
    state.level = lvl;
    say(fill(t.msgs.levelUp, { l: lvl }));
  }
}

function act(tk, action) {
  if (!state?.running || !state.tickets.includes(tk)) return;
  const inScope = tk.level <= state.level;
  if (action === 'resolve') {
    if (inScope) {
      const p = POINTS[tk.level];
      state.resolved++;
      removeTicket(tk);
      say(fill(t.msgs.resolved, { l: state.level, p }));
      addScore(p);
    } else {
      addScore(-10);
      say(t.msgs.outOfScope);
      spawn();
    }
  } else if (inScope) {
    removeTicket(tk);
    addScore(-5);
    say(fill(t.msgs.useless, { p: -5 }));
  } else {
    state.escalated++;
    removeTicket(tk);
    say(fill(t.msgs.escalated, { p: 5 }));
    addScore(5);
  }
  render();
}

function render() {
  if (!state) return;
  ui.level.textContent = fill(t.levelTag, { l: state.level });
  ui.score.textContent = state.score;
  ui.time.textContent = Math.ceil(state.time);
  ui.resolved.textContent = state.resolved;
  ui.queue.textContent = `${state.tickets.length}/${MAX_QUEUE}`;
  ui.hydra.style.setProperty('--v', (state.tickets.length / MAX_QUEUE).toFixed(3));
  for (const tk of state.tickets) {
    const bar = tk.el.querySelector('.sla');
    bar.firstChild.style.setProperty('--v', Math.max(0, tk.left / tk.sla).toFixed(3));
    bar.classList.toggle('is-late', tk.left < tk.sla * 0.3);
  }
}

function step(dt) {
  state.time -= dt;
  state.elapsed += dt;
  state.nextSpawn -= dt;
  if (state.nextSpawn <= 0) {
    spawn();
    // Le rythme s'accélère au fil du service : de 4,5 s à 2,2 s entre deux tickets.
    state.nextSpawn = Math.max(2.2, 4.5 - state.elapsed / 30);
  }
  for (const tk of [...state.tickets]) {
    tk.left -= dt;
    if (tk.left <= 0) {
      state.late++;
      removeTicket(tk);
      addScore(-10);
      say(t.msgs.late);
      spawn({ level: tk.level, title: fill(t.followUp, { title: tk.title.replace(/^[^:]+:\s*/, '') }), cat: tk.cat });
      if (!state.running) return;
    }
  }
  if (state.time <= 0) end('time');
  render();
}

function start() {
  queueEl.replaceChildren();
  overEl.hidden = true;
  state = newState();
  say(t.msgs.start);
  render();
  startBtn.disabled = true;
  let last = performance.now();
  clearInterval(loop);
  loop = setInterval(() => {
    const nowT = performance.now();
    const dt = Math.min(0.5, (nowT - last) / 1000);
    last = nowT;
    if (state.running) step(dt);
  }, 200);
}

function end(reason) {
  if (!state.running) return;
  state.running = false;
  clearInterval(loop);
  const vars = { resolved: state.resolved, escalated: state.escalated, late: state.late, level: state.level, score: state.score };
  $('[data-summary]').textContent = fill(reason === 'hydra' ? t.overHydra : t.overTime, vars);
  overEl.hidden = false;
  startBtn.disabled = false;
  startBtn.textContent = startBtn.dataset.replay || startBtn.textContent;
  queueEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
  render();
}

queueEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = Number(btn.closest('[data-id]').dataset.id);
  const tk = state?.tickets.find((x) => x.id === id);
  if (tk) act(tk, btn.dataset.act);
});

document.addEventListener('keydown', (e) => {
  if (!state?.running || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const oldest = state.tickets[0];
  if (!oldest) return;
  const k = e.key.toLowerCase();
  if (k === 'r') act(oldest, 'resolve');
  else if (k === 'e') act(oldest, 'escalate');
});

// Pause automatique quand l'onglet est caché.
document.addEventListener('visibilitychange', () => {
  if (!state?.running) return;
  if (document.hidden) clearInterval(loop);
  else {
    let last = performance.now();
    clearInterval(loop);
    loop = setInterval(() => {
      const nowT = performance.now();
      const dt = Math.min(0.5, (nowT - last) / 1000);
      last = nowT;
      if (state.running) step(dt);
    }, 200);
  }
});

startBtn.dataset.replay = t.replay || '';
startBtn.addEventListener('click', start);
