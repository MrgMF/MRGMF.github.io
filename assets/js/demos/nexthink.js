// Console DEX façon Nexthink, sur un parc fictif généré localement.
// - Un sous-ensemble de NQL analysé à la main (pas d'eval) :
//   devices | where champ op valeur [and …] | sort champ asc|desc | limit n
// - Des Remote Actions qui corrigent les postes, une campagne simulée,
//   des alertes et un score DEX recalculés à chaque changement.

import { $, $$, h, t, fill, fmt, seeded, wait, reduced } from './common.js';

// --- Parc fictif (reproductible) --------------------------------------------------
const rand = seeded(2026);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const SITES = ['PAR', 'LYO', 'NCE', 'LDN', 'MIL'];
const LATEST = '24H2';

const fleet = Array.from({ length: 64 }, (_, i) => {
  const r = rand();
  return {
    name: `LT-${pick(SITES)}-${String(i + 1).padStart(3, '0')}`,
    os_build: r < 0.7 ? LATEST : r < 0.92 ? '23H2' : '22H2',
    disk_free_gb: rand() < 0.16 ? Math.round(2 + rand() * 7) : Math.round(18 + rand() * 180),
    crashes_7d: rand() < 0.18 ? Math.round(3 + rand() * 6) : Math.round(rand() * 2),
    encrypted: rand() > 0.1,
  };
});

function refresh(d) {
  d.compliant = d.os_build === LATEST && d.encrypted && d.disk_free_gb >= 10;
  let s = 100;
  if (d.disk_free_gb < 10) s -= 25;
  s -= Math.min(40, d.crashes_7d * 8);
  if (d.os_build !== LATEST) s -= 15;
  if (!d.encrypted) s -= 10;
  d.dex_score = Math.max(0, s);
  return d;
}
fleet.forEach(refresh);

// --- Mini-analyseur NQL ----------------------------------------------------------
const FIELDS = {
  name: 'string',
  os_build: 'string',
  disk_free_gb: 'number',
  crashes_7d: 'number',
  encrypted: 'bool',
  compliant: 'bool',
  dex_score: 'number',
};
const OPS = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
};
const E = t.errors;

class QueryError extends Error {}
const fail = (key, x = '') => {
  throw new QueryError(fill(E[key], { x }));
};

function parseValue(raw, type) {
  const v = raw.trim();
  if (type === 'number') {
    if (!/^-?\d+(\.\d+)?$/.test(v)) fail('value', v);
    return Number(v);
  }
  if (type === 'bool') {
    if (v !== 'true' && v !== 'false') fail('value', v);
    return v === 'true';
  }
  const m = /^"([^"]*)"$/.exec(v) || /^'([^']*)'$/.exec(v);
  if (!m) fail('value', v);
  return m[1];
}

function parse(query) {
  const parts = query
    .trim()
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts[0] !== 'devices') fail('start');
  const plan = { where: [], sort: null, limit: null };
  for (const part of parts.slice(1)) {
    const [kw, ...rest] = part.split(/\s+/);
    const tail = part.slice(kw.length).trim();
    if (kw === 'where') {
      for (const cond of tail.split(/\s+and\s+/i)) {
        const m = /^([a-z_0-9]+)\s*(==|!=|<=|>=|<|>)\s*(.+)$/i.exec(cond.trim());
        if (!m) {
          const op = /^([a-z_0-9]+)\s*([^\s\w"']+)/i.exec(cond.trim());
          if (op && !OPS[op[2]]) fail('op', op[2]);
          fail('cond');
        }
        const [, field, op, value] = m;
        if (!FIELDS[field]) fail('field', field);
        plan.where.push({ field, op, value: parseValue(value, FIELDS[field]) });
      }
    } else if (kw === 'sort') {
      const [field, dir = 'asc'] = rest;
      if (!FIELDS[field]) fail('field', field || '');
      if (dir !== 'asc' && dir !== 'desc') fail('value', dir);
      plan.sort = { field, dir };
    } else if (kw === 'limit') {
      const n = Number(rest[0]);
      if (!Number.isInteger(n) || n <= 0) fail('limit');
      plan.limit = n;
    } else fail('stage', kw);
  }
  return plan;
}

function run(plan) {
  let rows = fleet.filter((d) => plan.where.every((c) => OPS[c.op](d[c.field], c.value)));
  if (plan.sort) {
    const { field, dir } = plan.sort;
    const k = dir === 'desc' ? -1 : 1;
    rows = [...rows].sort((a, b) => (a[field] > b[field] ? k : a[field] < b[field] ? -k : 0));
  }
  if (plan.limit) rows = rows.slice(0, plan.limit);
  return rows;
}

// --- Affichage ----------------------------------------------------------------------
const nql = $('[data-nql]');
const status = $('[data-query-status]');
const tbody = $('[data-rows]');
const countEl = $('[data-count]');
const logEl = $('[data-log]');
const alertsEl = $('[data-alerts]');
let current = [];
let lastQuery = nql.value;

function logLine(text, cls = '') {
  const line = h('span', { class: cls }, `[${new Date().toLocaleTimeString()}] ${text}\n`);
  logEl.prepend(line);
  while (logEl.childNodes.length > 40) logEl.lastChild.remove();
}

function scoreBar(v) {
  const bar = h('span', { class: `bar-score${v < 50 ? ' is-low' : v < 75 ? ' is-mid' : ''}`, 'aria-hidden': 'true' }, h('i'));
  bar.firstChild.style.setProperty('--v', (v / 100).toFixed(2));
  return bar;
}

function renderRows(rows, fixed = new Set()) {
  tbody.replaceChildren(
    ...rows.map((d) =>
      h(
        'tr',
        { class: fixed.has(d.name) ? 'is-fixed' : '' },
        h('td', {}, d.name),
        h('td', {}, d.os_build),
        h('td', { class: 'num' }, fill(t.gb, { n: d.disk_free_gb })),
        h('td', { class: 'num' }, d.crashes_7d),
        h('td', {}, d.encrypted ? t.yes : t.no),
        h('td', { class: 'num' }, scoreBar(d.dex_score), d.dex_score)
      )
    )
  );
  countEl.textContent = rows.length ? fill(t.count, { n: rows.length }) : t.none;
}

const ALERTS = [
  ['disk', (d) => d.disk_free_gb < 10, 'devices | where disk_free_gb < 10'],
  ['os', (d) => d.os_build !== LATEST, `devices | where os_build != "${LATEST}"`],
  ['crash', (d) => d.crashes_7d > 2, 'devices | where crashes_7d > 2 | sort crashes_7d desc'],
  ['encrypt', (d) => !d.encrypted, 'devices | where encrypted == false'],
];

function renderKpis() {
  const avg = fleet.reduce((s, d) => s + d.dex_score, 0) / fleet.length;
  const active = ALERTS.map(([key, test, q]) => ({ key, q, n: fleet.filter(test).length })).filter((a) => a.n);
  const set = (k, v) => ($(`[data-kpi="${k}"]`).textContent = v);
  set('dex', fmt(avg, { maximumFractionDigits: 1 }));
  set('devices', fleet.length);
  set('noncompliant', fleet.filter((d) => !d.compliant).length);
  set('alerts', active.length);
  alertsEl.replaceChildren(
    ...(active.length
      ? active.map((a) =>
          h(
            'li',
            {},
            h('strong', {}, fill(t.alerts[a.key], { n: a.n })),
            ' ',
            h('button', { class: 'btn btn--small btn--ghost', type: 'button', onclick: () => query(a.q) }, t.investigate)
          )
        )
      : [h('li', { class: 'is-clear' }, t.alerts.clear)])
  );
}

function query(text, { silent = false, fixed } = {}) {
  if (text !== undefined) nql.value = text;
  const started = performance.now();
  try {
    const plan = parse(nql.value);
    current = run(plan);
    lastQuery = nql.value;
    renderRows(current, fixed);
    status.className = 'status status--ok';
    status.textContent = fill(t.ran, { n: current.length, ms: Math.max(1, Math.round(performance.now() - started)) });
    if (!silent) logLine(`NQL › ${nql.value.replace(/\s+/g, ' ')}`);
  } catch (err) {
    if (!(err instanceof QueryError)) throw err;
    status.className = 'status status--ko';
    status.textContent = err.message;
  }
}

// --- Remote Actions et campagne -------------------------------------------------------
const FIX = {
  cleanup: (d) => (d.disk_free_gb < 10 ? ((d.disk_free_gb += 20 + Math.round(Math.random() * 25)), true) : false),
  update: (d) => (d.os_build !== LATEST ? ((d.os_build = LATEST), true) : false),
  repair: (d) => (d.crashes_7d > 0 ? ((d.crashes_7d = 0), true) : false),
  encrypt: (d) => (!d.encrypted ? ((d.encrypted = true), true) : false),
};

const runBtn = $('[data-run-remote]');
const campaignBtn = $('[data-campaign]');

runBtn.addEventListener('click', async () => {
  const action = $('[data-remote]').value;
  const name = t.remoteNames[action];
  if (!current.length) {
    logLine(t.remoteEmpty, 'warn');
    return;
  }
  runBtn.disabled = true;
  logLine(fill(t.remoteStart, { name, n: current.length }));
  if (!reduced()) await wait(700);
  const fixed = new Set();
  let skip = 0;
  current.forEach((d) => {
    if (FIX[action](d)) fixed.add(d.name);
    else skip++;
    refresh(d);
  });
  logLine(fill(t.remoteDone, { name, ok: fixed.size, skip }), 'ok');
  renderKpis();
  query(lastQuery, { silent: true, fixed });
  runBtn.disabled = false;
});

campaignBtn.addEventListener('click', async () => {
  if (!current.length) {
    logLine(t.remoteEmpty, 'warn');
    return;
  }
  const n = current.length;
  campaignBtn.disabled = true;
  logLine(fill(t.campaignStart, { n }));
  if (!reduced()) await wait(1200);
  const r = Math.max(1, Math.round(n * (0.55 + Math.random() * 0.3)));
  const s = fmt(3.4 + Math.random() * 1.2, { maximumFractionDigits: 1 });
  logLine(fill(t.campaignDone, { r, n, s }), 'ok');
  campaignBtn.disabled = false;
});

// --- Commandes -------------------------------------------------------------------------
$('[data-query-form]').addEventListener('submit', (e) => {
  e.preventDefault();
  query();
});
nql.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    query();
  }
});
$$('[data-preset]').forEach((b) => b.addEventListener('click', () => query(b.dataset.preset)));

renderKpis();
query(undefined, { silent: true });
