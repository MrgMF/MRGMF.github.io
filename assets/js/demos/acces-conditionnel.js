// Simulateur d'accès conditionnel : même logique d'évaluation que Microsoft
// Entra ID, à petite échelle. Un blocage l'emporte toujours ; les contrôles
// d'octroi (MFA, appareil conforme) doivent tous être satisfaits ; une
// stratégie en rapport seul est évaluée et journalisée, jamais appliquée.

import { $, $$, h, t, fill, now, segmented } from './common.js';

const POLICIES = [
  { id: 'CA001', applies: (c) => c.user === 'guest', ctl: { mfa: true } },
  { id: 'CA002', applies: (c) => c.user === 'admin', ctl: { mfa: true } },
  { id: 'CA003', applies: (c) => c.app === 'admin', ctl: { mfa: true, device: true } },
  { id: 'CA004', applies: (c) => c.location === 'blocked', ctl: { block: true } },
  { id: 'CA005', applies: (c) => c.user === 'member' && c.app === 'exchange', ctl: { device: true } },
  { id: 'CA006', applies: (c) => c.risk !== 'low', ctl: { mfa: true } },
];

const verdictBox = $('[data-verdict]');
const verdictValue = $('[data-verdict-value]');
const verdictWhy = $('[data-verdict-why]');
const trace = $('[data-trace]');
const mfaBtn = $('[data-mfa]');
const logEl = $('[data-log]');
const log = [];
let mfaDone = false;

function context() {
  const c = {};
  $$('[data-ctx]').forEach((el) => (c[el.dataset.ctx] = el.value));
  c.ring = Number(c.ring);
  c.mfaDone = mfaDone;
  return c;
}

function policyState(id) {
  const li = $(`[data-policy="${id}"]`);
  const pick = (name) => $(`[data-seg="${name}"] [aria-pressed="true"]`, li)?.dataset.value;
  return { state: pick('state') || 'on', ring: Number(pick('ring') ?? 2) };
}

function evaluate(ctx) {
  const rows = [];
  let block = false;
  let needDevice = false;
  let needMfa = false;
  let mfaUsed = false;
  for (const p of POLICIES) {
    const st = policyState(p.id);
    if (st.state === 'off') {
      rows.push({ p, kind: 'off', result: 'notEnabled' });
      continue;
    }
    if (ctx.ring > st.ring) {
      rows.push({ p, kind: 'ring', ring: st.ring, result: 'notApplied' });
      continue;
    }
    if (!p.applies(ctx)) {
      rows.push({ p, kind: 'skip', result: st.state === 'report' ? 'reportOnlyNotApplied' : 'notApplied' });
      continue;
    }
    const unmet = [];
    if (p.ctl.block) unmet.push('block');
    if (p.ctl.device && ctx.device !== 'compliant') unmet.push('device');
    if (p.ctl.mfa && !ctx.mfaDone) unmet.push('mfa');
    const met = Object.keys(p.ctl).filter((k) => k !== 'block' && !unmet.includes(k));
    if (st.state === 'report') {
      rows.push({ p, kind: 'report', unmet, result: unmet.length ? 'reportOnlyFailure' : 'reportOnlySuccess' });
      continue;
    }
    const kind = unmet.includes('block') ? 'block' : unmet.includes('device') ? 'device' : unmet.includes('mfa') ? 'mfa' : 'ok';
    rows.push({ p, kind, unmet, met, result: unmet.length ? 'failure' : 'success' });
    if (kind === 'block') block = true;
    if (unmet.includes('device')) needDevice = true;
    if (unmet.includes('mfa')) needMfa = true;
    if (p.ctl.mfa && ctx.mfaDone) mfaUsed = true;
  }
  const verdict = block ? 'block' : needDevice ? 'blockDevice' : needMfa ? 'mfa' : mfaUsed ? 'grantMfa' : 'grant';
  return { verdict, rows };
}

const BADGE = { off: 'muted', ring: 'muted', skip: 'muted', report: 'info', block: 'block', device: 'block', mfa: 'warn', ok: 'ok' };
const J = t;
const needs = (list) => list.map((k) => J.needs[k]).join(' + ');

function why(row, ctx) {
  switch (row.kind) {
    case 'off':
      return J.offWhy;
    case 'ring':
      return fill(J.ringWhy, { ring: row.ring, user: ctx.ring });
    case 'skip':
      return J.skip[row.p.id];
    case 'report':
      return row.unmet.length ? fill(J.reportWould, { what: needs(row.unmet) }) : J.reportPass;
    case 'ok':
      return fill(J.okWhy, { what: needs(row.met) });
    case 'block':
      return J.blockWhy;
    default:
      return fill(J.enforcedWhy, { what: needs(row.unmet) });
  }
}

function render() {
  const ctx = context();
  const { verdict, rows } = evaluate(ctx);
  verdictBox.className = `verdict verdict--${verdict.startsWith('grant') ? 'grant' : verdict === 'mfa' ? 'mfa' : 'block'}`;
  verdictValue.textContent = J.verdicts[verdict];
  verdictWhy.textContent = J.why[verdict];
  mfaBtn.hidden = verdict !== 'mfa';
  const policyName = (id) => $(`[data-policy="${id}"] .policy-name`)?.textContent || id;
  trace.replaceChildren(
    ...rows.map((row) =>
      h(
        'li',
        {},
        h('span', { class: `badge badge--${BADGE[row.kind]}` }, J.kinds[row.kind]),
        h('span', {}, h('strong', {}, policyName(row.p.id)), h('span', { class: 'why' }, why(row, ctx)))
      )
    )
  );
  return { ctx, verdict, rows };
}

function signIn() {
  const { ctx, verdict, rows } = render();
  const entry = {
    createdDateTime: now(),
    userType: ctx.user,
    rolloutRing: ctx.ring,
    appDisplayName: J.apps[ctx.app],
    location: ctx.location,
    deviceDetail: { isCompliant: ctx.device === 'compliant' },
    riskLevelDuringSignIn: ctx.risk,
    status: verdict.startsWith('grant') ? 'success' : verdict === 'mfa' ? 'interrupted' : 'failure',
    conditionalAccessStatus: rows.some((r) => r.result === 'failure')
      ? 'failure'
      : rows.some((r) => r.result === 'success')
        ? 'success'
        : 'notApplied',
    appliedConditionalAccessPolicies: rows.map((r) => ({ id: r.p.id, result: r.result })),
  };
  log.unshift(entry);
  log.length = Math.min(log.length, 6);
  logEl.textContent = log.map((e) => JSON.stringify(e, null, 2)).join('\n\n');
  logEl.scrollTop = 0;
}

// Tout changement de contexte annule une MFA déjà faite (nouvelle connexion).
$$('[data-ctx]').forEach((el) =>
  el.addEventListener('change', () => {
    mfaDone = false;
    render();
  })
);
$$('[data-seg]').forEach((seg) => segmented(seg, render));
$('[data-signin]').addEventListener('click', signIn);
mfaBtn.addEventListener('click', () => {
  mfaDone = true;
  const { verdict } = render();
  verdictWhy.textContent = `${J.mfaDone} ${J.why[verdict]}`;
  signIn();
});

render();
