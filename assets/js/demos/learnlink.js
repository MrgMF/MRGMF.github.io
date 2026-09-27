// LearnLink : double authentification TOTP (RFC 6238) et anti brute-force,
// recréés dans le navigateur avec Web Crypto. Aucun appel réseau.

import { $, h, t, fill, now } from './common.js';

const EMAIL = 'demo@learnlink.test';
const PASSWORD = 'Apprendre-2026';
const CAPTCHA_AT = 3;
const LOCK_AT = 10;
const ALERT_AT = 15;
const LOCK_SECONDS = 30; // 15 min en production
const STEP = 30; // secondes par code TOTP
const enc = new TextEncoder();

// --- Empreinte du mot de passe (PBKDF2) ----------------------------------------------
const salt = crypto.getRandomValues(new Uint8Array(16));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function pbkdf2(password) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256);
}

// Comparaison en temps constant : on ne s'arrête pas au premier octet différent.
function safeEqual(a, b) {
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const stored = pbkdf2(PASSWORD);
stored.then((bits) => ($('[data-hash]').textContent = `pbkdf2-sha256$100000$${hex(salt)}$${hex(bits)}`));

// --- TOTP (RFC 6238, HMAC-SHA-1, 6 chiffres, pas de 30 s) --------------------------------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

async function hotp(keyBytes, counter) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const off = mac[mac.length - 1] & 0x0f;
  const code = (((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3]) % 1_000_000;
  return String(code).padStart(6, '0');
}

const stepAt = (ms = Date.now()) => Math.floor(ms / 1000 / STEP);

let secret = null;
let backupCodes = [];
const usedBackup = new Set();
let lastStepUsed = -1;

async function verifyTotp(code) {
  const s = stepAt();
  for (const c of [s - 1, s, s + 1]) {
    if ((await hotp(secret, c)) === code) {
      if (c <= lastStepUsed) return 'replay';
      lastStepUsed = c;
      return 'ok';
    }
  }
  return 'bad';
}

// --- Journal SIEM ------------------------------------------------------------------------
const logEl = $('[data-log]');
function event(action, status, reason = '', metadata = {}) {
  const e = {
    timestamp: now(),
    action,
    status,
    ...(reason ? { reason } : {}),
    email: EMAIL,
    ip: '203.0.113.24',
    userAgent: 'LearnLink demo',
    metadata,
  };
  const line = h('span', { class: status === 'SUCCESS' ? 'ok' : status === 'ALERT' ? 'warn' : 'ko' }, `${JSON.stringify(e)}\n`);
  logEl.prepend(line);
  while (logEl.childNodes.length > 30) logEl.lastChild.remove();
}

// --- Activation de la MFA -------------------------------------------------------------------
const panel = $('[data-mfa-panel]');
const codeEl = $('[data-code]');
const ringEl = $('[data-ring]');
const remainingEl = $('[data-remaining]');
const totpField = $('[data-totp-field]');
let ticker = null;

async function tick() {
  if (!secret) return;
  const secs = STEP - (Math.floor(Date.now() / 1000) % STEP);
  const code = await hotp(secret, stepAt());
  codeEl.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
  remainingEl.textContent = fill(t.remaining, { s: secs });
  ringEl.style.setProperty('--p', (secs / STEP).toFixed(3));
}

$('[data-enable-mfa]').addEventListener('click', (e) => {
  secret = crypto.getRandomValues(new Uint8Array(20));
  const b32 = base32(secret);
  $('[data-secret]').textContent = b32.match(/.{1,4}/g).join(' ');
  $('[data-uri]').textContent = `otpauth://totp/LearnLink:${encodeURIComponent(EMAIL)}?secret=${b32}&issuer=LearnLink&digits=6&period=30`;
  backupCodes = Array.from({ length: 8 }, () => {
    const b = hex(crypto.getRandomValues(new Uint8Array(4)));
    return `${b.slice(0, 4)}-${b.slice(4)}`;
  });
  usedBackup.clear();
  renderBackup();
  panel.hidden = false;
  totpField.hidden = false;
  e.currentTarget.disabled = true;
  lastStepUsed = -1;
  event('MFA_ENABLED', 'SUCCESS', '', { method: 'TOTP' });
  setStatus(t.enabled, true);
  clearInterval(ticker);
  tick();
  ticker = setInterval(tick, 1000);
});

function renderBackup() {
  $('[data-backup]').replaceChildren(...backupCodes.map((c) => h('li', { class: usedBackup.has(c) ? 'is-used' : '' }, c)));
}

// --- Connexion et anti brute-force -------------------------------------------------------
const statusEl = $('[data-status]');
const countersEl = $('[data-counters]');
const captchaBox = $('[data-captcha]');
const captchaQ = $('[data-captcha-q]');
const captchaInput = $('#ll-captcha');
const session = $('[data-session]');
const form = $('[data-login]');
let failures = 0;
let lockedUntil = 0;
let captcha = null;

function setStatus(text, ok = false) {
  statusEl.className = `status ${ok ? 'status--ok' : 'status--ko'}`;
  statusEl.textContent = text;
}

function renderCounters() {
  countersEl.textContent = fill(t.counters, { n: failures });
  if (failures >= CAPTCHA_AT && !captcha) newCaptcha();
  captchaBox.hidden = failures < CAPTCHA_AT;
}

function newCaptcha() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  captcha = a + b;
  captchaQ.textContent = fill(t.captchaQ, { a, b });
  captchaInput.value = '';
}

function fail(reason, message) {
  failures += 1;
  const meta = { failedAttempts: failures };
  if (failures >= LOCK_AT && failures % LOCK_AT === 0) {
    lockedUntil = Date.now() + LOCK_SECONDS * 1000;
    event('ACCOUNT_LOCKED', 'FAILURE', 'TOO_MANY_ATTEMPTS', { ...meta, lockSeconds: LOCK_SECONDS });
  } else event('LOGIN', 'FAILURE', reason, meta);
  if (failures === ALERT_AT) {
    event('SECURITY_ALERT', 'ALERT', 'BRUTE_FORCE_SUSPECTED', meta);
    message = `${message} ${t.alert}`;
  }
  if (failures >= CAPTCHA_AT) newCaptcha();
  setStatus(message);
  renderCounters();
}

async function attempt({ email, password, totp, captchaAnswer }) {
  if (Date.now() < lockedUntil) {
    const s = Math.ceil((lockedUntil - Date.now()) / 1000);
    event('LOGIN', 'FAILURE', 'ACCOUNT_LOCKED', { failedAttempts: failures });
    setStatus(fill(t.errors.locked, { s }));
    return false;
  }
  if (failures >= CAPTCHA_AT) {
    if (!captchaAnswer) {
      fail('CAPTCHA_REQUIRED', t.errors.captchaRequired);
      return false;
    }
    if (Number(captchaAnswer) !== captcha) {
      fail('CAPTCHA_FAILED', t.errors.captchaFailed);
      return false;
    }
  }
  const ok = email.trim().toLowerCase() === EMAIL && safeEqual(await pbkdf2(password), await stored);
  if (!ok) {
    fail(email.trim().toLowerCase() === EMAIL ? 'BAD_PASSWORD' : 'USER_NOT_FOUND', t.errors.credentials);
    return false;
  }
  if (secret) {
    const code = totp.replace(/\s+/g, '');
    if (!code) {
      event('MFA_CHALLENGE', 'PENDING', 'TOTP_REQUIRED');
      setStatus(t.errors.totpRequired);
      return false;
    }
    if (/^[0-9a-f]{4}-[0-9a-f]{4}$/i.test(code) && backupCodes.includes(code.toLowerCase())) {
      if (usedBackup.has(code.toLowerCase())) {
        fail('BACKUP_CODE_REUSED', t.errors.totpBad);
        return false;
      }
      usedBackup.add(code.toLowerCase());
      renderBackup();
      event('BACKUP_CODE_USED', 'SUCCESS', '', { remaining: backupCodes.length - usedBackup.size });
      setStatus(t.backupUsed, true);
    } else {
      const res = /^\d{6}$/.test(code) ? await verifyTotp(code) : 'bad';
      if (res !== 'ok') {
        fail(res === 'replay' ? 'TOTP_REPLAY' : 'BAD_TOTP', res === 'replay' ? t.errors.totpReplay : t.errors.totpBad);
        return false;
      }
    }
  }
  failures = 0;
  captcha = null;
  renderCounters();
  event('LOGIN', 'SUCCESS', '', { mfa: secret ? 'TOTP' : 'NONE' });
  setStatus(t.ok, true);
  session.hidden = false;
  $('[data-welcome]').textContent = fill(t.welcome, { email: EMAIL });
  return true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await attempt({
    email: $('#ll-email').value,
    password: $('#ll-pass').value,
    totp: $('#ll-totp').value,
    captchaAnswer: captchaInput.value,
  });
  $('#ll-totp').value = '';
});

// Attaque simulée : cinq mots de passe courants, l'un après l'autre.
const WORDLIST = ['123456', 'password', 'azerty', 'learnlink', 'Apprendre2026', 'motdepasse', 'qwerty123', 'soleil'];
$('[data-bruteforce]').addEventListener('click', async () => {
  let n = 0;
  for (let i = 0; i < 5; i++) {
    n++;
    const ok = await attempt({ email: EMAIL, password: WORDLIST[(failures + i) % WORDLIST.length], totp: '', captchaAnswer: '' });
    if (ok || Date.now() < lockedUntil) break;
  }
  setStatus(`${statusEl.textContent} ${fill(t.attack, { n })}`);
});

$('[data-logout]').addEventListener('click', () => {
  session.hidden = true;
  event('LOGOUT', 'SUCCESS');
  setStatus(t.loggedOut, true);
});

$('[data-reset]').addEventListener('click', () => {
  failures = 0;
  lockedUntil = 0;
  captcha = null;
  logEl.textContent = '';
  session.hidden = true;
  setStatus('');
  statusEl.className = 'status';
  renderCounters();
});

renderCounters();
