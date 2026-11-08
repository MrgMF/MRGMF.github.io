// ProjecTTrone Lite : exploration, ramassage par rayon, inventaire, porte
// du château et salle du trône. Tout est dessiné par code sur un canvas.
// Comme dans le projet Unity, les données d'objet (ItemData) sont séparées
// des objets posés dans le monde (Item).

import { $, $$, h, t, fill, reduced } from './common.js';

const TILE = 16;
const MAP = [
  '####################',
  '#..t....CCCCCC..t..#',
  '#.......CFFTFC.....#',
  '#..HH...CFFFFC..HH.#',
  '#..HH...CCGGCC..HH.#',
  '#.........::.......#',
  '#.t.::::::::::::.t.#',
  '#...:....w...:.....#',
  '#.HH:.........:.~~.#',
  '#.HH:..t..t...:.~~.#',
  '#...::::::::::::...#',
  '#..t.............t.#',
  '####################',
];
const W = MAP[0].length;
const H = MAP.length;
const SOLID = new Set(['#', 'C', 'G', 'H', '~', 't', 'w', 'T']);

// --- ItemData (données) et Item (instances du monde) ---------------------------------
const ITEM_DATA = {
  sword: { color: '#c9ccd9', accent: '#8a5a3c' },
  shield: { color: '#2f6bff', accent: '#ffd23f' },
  potion: { color: '#ff3d5a', accent: '#f5f2ea' },
  map: { color: '#f5e6c8', accent: '#c9ab78' },
  key: { color: '#ffd23f', accent: '#b8860b' },
};
const SPAWNS = [
  ['sword', 5, 11],
  ['shield', 17, 7],
  ['potion', 2, 5],
  ['map', 12, 9],
  ['key', 18, 11],
];

const canvas = $('[data-canvas]');
const ctx = canvas.getContext('2d');
const frame = $('[data-frame]');
const promptEl = $('[data-prompt]');
const statusEl = $('[data-status]');
const objectiveEl = $('[data-objective]');
const invEl = $('[data-inventory]');
const invPanel = $('[data-inventory-panel]');
const invCount = $('[data-inv-count]');
const detailEl = $('[data-item-detail]');
const touch = window.matchMedia('(pointer: coarse)').matches;

let S;
function reset() {
  S = {
    map: MAP.map((r) => r.split('')),
    player: { x: 10.5, y: 8.5, dir: 'u', step: 0 },
    items: SPAWNS.map(([id, x, y]) => ({ id, x: x + 0.5, y: y + 0.5 })),
    inventory: [],
    gateOpen: false,
    won: false,
    started: performance.now(),
    target: null,
  };
  renderInventory();
  renderObjective();
  say(t.start);
}

const say = (text) => (statusEl.textContent = text);
const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? '#' : S.map[Math.floor(y)][Math.floor(x)]);
const itemName = (id) => t.items[id][0];

// --- Déplacement et collisions (boîte de 0,6 case) ---------------------------------------
const held = { u: false, d: false, l: false, r: false };
const KEYS = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const HALF = 0.3;

function free(x, y) {
  for (const [dx, dy] of [[-HALF, -HALF], [HALF, -HALF], [-HALF, HALF], [HALF, HALF]]) {
    if (SOLID.has(tileAt(x + dx, y + dy))) return false;
  }
  return true;
}

function move(dt) {
  const p = S.player;
  let vx = (held.r ? 1 : 0) - (held.l ? 1 : 0);
  let vy = (held.d ? 1 : 0) - (held.u ? 1 : 0);
  if (!vx && !vy) return;
  if (vx && vy) {
    vx *= Math.SQRT1_2;
    vy *= Math.SQRT1_2;
  }
  p.dir = vy < 0 ? 'u' : vy > 0 ? 'd' : vx < 0 ? 'l' : 'r';
  if (Math.abs(vx) > Math.abs(vy)) p.dir = vx < 0 ? 'l' : 'r';
  const speed = 4.2;
  const nx = p.x + vx * speed * dt;
  const ny = p.y + vy * speed * dt;
  if (free(nx, p.y)) p.x = nx;
  if (free(p.x, ny)) p.y = ny;
  p.step += dt * 8;
}

// --- Rayon (raycast) : ce que le joueur vise, jusqu'à 1,4 case devant lui -------------------
function raycast() {
  const p = S.player;
  const [dx, dy] = DIRS[p.dir];
  for (let d = 0; d <= 1.4; d += 0.1) {
    const x = p.x + dx * d;
    const y = p.y + dy * d;
    const item = S.items.find((it) => Math.abs(it.x - x) < 0.5 && Math.abs(it.y - y) < 0.5);
    if (item) return { kind: 'item', item };
    const tile = tileAt(x, y);
    if (tile === 'G') return { kind: 'gate' };
    if (tile === 'T') return { kind: 'throne' };
    if (SOLID.has(tile)) return null;
  }
  // Tolérance : un objet tout proche compte même s'il n'est pas pile en face.
  const near = S.items.find((it) => Math.hypot(it.x - p.x, it.y - p.y) < 0.9);
  return near ? { kind: 'item', item: near } : null;
}

function updatePrompt() {
  const target = S.won ? null : raycast();
  S.target = target;
  let text = '';
  if (target?.kind === 'item') text = fill(touch ? t.pickTouch : t.pick, { item: itemName(target.item.id) });
  else if (target?.kind === 'gate') text = t.gatePrompt;
  else if (target?.kind === 'throne') text = t.thronePrompt;
  promptEl.hidden = !text;
  if (text && promptEl.textContent !== text) promptEl.textContent = text;
}

function interact() {
  const target = S.target;
  if (!target || S.won) return;
  if (target.kind === 'item') {
    S.items = S.items.filter((it) => it !== target.item);
    S.inventory.push(target.item.id);
    say(fill(t.picked, { item: itemName(target.item.id) }));
    renderInventory();
    renderObjective();
  } else if (target.kind === 'gate') {
    if (!S.inventory.includes('key')) {
      say(t.gateLocked);
      return;
    }
    S.map[4][10] = 'F';
    S.map[4][11] = 'F';
    S.gateOpen = true;
    say(t.gateOpen);
    renderObjective();
  } else if (target.kind === 'throne') {
    S.won = true;
    const s = Math.round((performance.now() - S.started) / 1000);
    say(fill(t.victory, { n: S.inventory.length, s }));
    renderObjective();
  }
  updatePrompt();
}

// --- Inventaire (HTML, accessible) -----------------------------------------------------------
function icon(id, size = 32) {
  const c = h('canvas', { width: 16, height: 16, 'aria-hidden': 'true' });
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;
  drawItem(c.getContext('2d'), id, 0, 0);
  return c;
}

function renderInventory() {
  const slots = Array.from({ length: 6 }, (_, i) => S.inventory[i]);
  invEl.replaceChildren(
    ...slots.map((id) =>
      id
        ? h(
            'li',
            {},
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn--ghost btn--small',
                onclick: () => (detailEl.textContent = `${itemName(id)} : ${t.items[id][1]}`),
              },
              icon(id),
              itemName(id)
            )
          )
        : h('li', { class: 'is-empty' }, t.empty)
    )
  );
  invCount.textContent = `${S.inventory.length}/5`;
}

function renderObjective() {
  const o = t.objectives;
  objectiveEl.textContent = S.won ? o.done : S.gateOpen ? o.throne : S.inventory.includes('key') ? o.gate : o.key;
}

function toggleInventory() {
  invPanel.hidden = !invPanel.hidden;
  say(invPanel.hidden ? t.inventoryHidden : t.inventoryShown);
}

// --- Dessin ---------------------------------------------------------------------------------
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function drawTile(tile, x, y) {
  const px = x * TILE;
  const py = y * TILE;
  const r = hash(x, y);
  const fill = (c, a, b, w, hh) => {
    ctx.fillStyle = c;
    ctx.fillRect(px + a, py + b, w, hh);
  };
  const grass = () => {
    fill('#2f7d3a', 0, 0, 16, 16);
    fill('#3a9146', (r % 11) + 1, (r % 7) + 2, 2, 1);
    fill('#256b30', ((r >> 3) % 12) + 1, ((r >> 5) % 11) + 3, 2, 1);
  };
  switch (tile) {
    case '.':
      grass();
      break;
    case ':':
      fill('#b8a07a', 0, 0, 16, 16);
      fill('#9c865f', (r % 10) + 1, (r % 5) + 2, 4, 1);
      fill('#9c865f', ((r >> 4) % 9) + 2, ((r >> 2) % 6) + 9, 3, 1);
      break;
    case '#':
      fill('#4a4a5e', 0, 0, 16, 16);
      fill('#5d5d76', 1, 1, 6, 6);
      fill('#5d5d76', 9, 9, 6, 6);
      break;
    case 'C':
      fill('#8a8aa6', 0, 0, 16, 16);
      fill('#6b6b87', 0, 7, 16, 1);
      fill('#6b6b87', 7, 0, 1, 7);
      fill('#6b6b87', 3, 8, 1, 8);
      fill('#6b6b87', 11, 8, 1, 8);
      break;
    case 'F':
      fill('#3b2a4a', 0, 0, 16, 16);
      fill('#8f1f33', 4, 0, 8, 16);
      break;
    case 'T':
      fill('#3b2a4a', 0, 0, 16, 16);
      fill('#8f1f33', 4, 8, 8, 8);
      fill('#ffd23f', 3, 1, 10, 12);
      fill('#c9171f', 5, 4, 6, 7);
      fill('#ffd23f', 2, 11, 12, 3);
      break;
    case 'G':
      fill('#8a5a3c', 0, 0, 16, 16);
      fill('#5b3824', 0, 4, 16, 2);
      fill('#5b3824', 0, 11, 16, 2);
      fill('#2c2c4d', 7, 0, 2, 16);
      break;
    case 'H': {
      const roof = tileAt(x, y - 1) !== 'H';
      if (roof) {
        fill('#b33a3a', 0, 0, 16, 16);
        fill('#8a2a2a', 0, 12, 16, 4);
        fill('#cf5555', 0, 2, 16, 1);
      } else {
        fill('#d9c29a', 0, 0, 16, 16);
        fill('#8a5a3c', 5, 7, 6, 9);
        fill('#3f7fbf', 1, 4, 3, 3);
        fill('#3f7fbf', 12, 4, 3, 3);
      }
      break;
    }
    case '~':
      fill('#2b6cb0', 0, 0, 16, 16);
      fill('#5a9be0', (r % 8) + 2, (r % 5) + 3, 5, 1);
      fill('#5a9be0', ((r >> 3) % 7) + 3, ((r >> 2) % 5) + 10, 4, 1);
      break;
    case 't':
      grass();
      fill('#6b4423', 7, 10, 3, 6);
      fill('#1f5a2a', 2, 1, 12, 10);
      fill('#2c7a3a', 4, 2, 6, 4);
      break;
    case 'w':
      grass();
      fill('#8a8aa6', 2, 3, 12, 11);
      fill('#2b6cb0', 5, 6, 6, 5);
      fill('#6b4423', 1, 1, 14, 2);
      break;
    default:
      grass();
  }
}

function drawItem(c, id, x, y) {
  const d = ITEM_DATA[id];
  const f = (col, a, b, w, hh) => {
    c.fillStyle = col;
    c.fillRect(x + a, y + b, w, hh);
  };
  f('rgba(0,0,0,0.35)', 3, 13, 10, 2);
  switch (id) {
    case 'sword':
      f(d.color, 7, 1, 2, 9);
      f('#ffffff', 7, 1, 1, 8);
      f(d.accent, 4, 10, 8, 2);
      f(d.accent, 7, 12, 2, 2);
      break;
    case 'shield':
      f(d.color, 3, 2, 10, 8);
      f(d.color, 5, 10, 6, 2);
      f(d.color, 7, 12, 2, 1);
      f(d.accent, 7, 3, 2, 8);
      f(d.accent, 4, 5, 8, 2);
      break;
    case 'potion':
      f('#c9ccd9', 7, 1, 2, 3);
      f(d.color, 4, 5, 8, 7);
      f(d.color, 6, 4, 4, 1);
      f(d.accent, 5, 6, 2, 2);
      break;
    case 'map':
      f(d.color, 3, 3, 10, 9);
      f(d.accent, 3, 3, 1, 9);
      f(d.accent, 12, 3, 1, 9);
      f('#c9171f', 8, 6, 2, 2);
      f('#6b6b87', 5, 9, 5, 1);
      break;
    case 'key':
      f(d.color, 3, 4, 5, 5);
      f('#2c2c4d', 5, 6, 1, 1);
      f(d.color, 8, 6, 6, 2);
      f(d.color, 11, 8, 1, 2);
      f(d.color, 13, 8, 1, 2);
      break;
  }
}

function drawPlayer(time) {
  const p = S.player;
  const x = Math.round(p.x * TILE - 8);
  const bob = held.u || held.d || held.l || held.r ? Math.round(Math.sin(p.step) * 1) : 0;
  const y = Math.round(p.y * TILE - 10) + bob;
  const f = (col, a, b, w, hh) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + a, y + b, w, hh);
  };
  f('rgba(0,0,0,0.35)', 3, 15, 10, 2);
  f('#2c2c4d', 4, 12, 3, 4);
  f('#2c2c4d', 9, 12, 3, 4);
  f('#2f6bff', 3, 6, 10, 7);
  f('#ffd23f', 3, 9, 10, 1);
  f('#b8b8cc', 4, 0, 8, 7);
  f('#161627', 5, 3, 6, 2);
  // Visière orientée vers la direction du regard
  const eye = { u: null, d: [6, 3], l: [5, 3], r: [9, 3] }[p.dir];
  if (eye) f('#3ff0ff', eye[0], eye[1], 2, 1);
  if (p.dir === 'u') f('#8d8db5', 5, 3, 6, 2);
  // Épée tenue si ramassée
  if (S.inventory.includes('sword')) f('#e6e6f8', p.dir === 'l' ? 0 : 14, 5, 2, 7);
  if (S.inventory.includes('shield')) f('#2f6bff', p.dir === 'l' ? 12 : 0, 7, 3, 5);
  void time;
}

function draw(time) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawTile(S.map[y][x], x, y);
  for (const it of S.items) {
    const bob = reduced() ? 0 : Math.round(Math.sin(time / 300 + it.x) * 1);
    drawItem(ctx, it.id, Math.round(it.x * TILE - 8), Math.round(it.y * TILE - 8) + bob);
  }
  // Rayon de détection (visible, comme un gizmo de debug Unity)
  if (S.target?.kind === 'item') {
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(S.target.item.x * TILE - 8) + 0.5, Math.round(S.target.item.y * TILE - 8) + 0.5, 15, 15);
  }
  drawPlayer(time);
  if (S.won) {
    ctx.fillStyle = 'rgba(7, 7, 15, 0.55)';
    ctx.fillRect(0, 0, W * TILE, H * TILE);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '16px Tiny5, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t.victoryTitle, (W * TILE) / 2, (H * TILE) / 2);
  }
}

// --- Boucle ----------------------------------------------------------------------------------
let last = performance.now();
function loop(time) {
  const dt = Math.min(0.05, (time - last) / 1000);
  last = time;
  if (!S.won) move(dt);
  updatePrompt();
  draw(time);
  requestAnimationFrame(loop);
}

// --- Entrées ---------------------------------------------------------------------------------
const playing = () => {
  const a = document.activeElement;
  return !a || a === document.body || a === frame || frame.contains(a);
};

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const dir = KEYS[e.code];
  if (dir && playing()) {
    e.preventDefault();
    held[dir] = true;
    return;
  }
  if (!playing() || e.repeat) return;
  if (e.code === 'KeyE') interact();
  else if (e.code === 'KeyI') toggleInventory();
});
window.addEventListener('keyup', (e) => {
  const dir = KEYS[e.code];
  if (dir) held[dir] = false;
});
window.addEventListener('blur', () => Object.keys(held).forEach((k) => (held[k] = false)));
frame.addEventListener('pointerdown', () => frame.focus());

$$('[data-dir]').forEach((b) => {
  const d = b.dataset.dir;
  const on = (e) => {
    e.preventDefault();
    held[d] = true;
  };
  const off = () => (held[d] = false);
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off);
  b.addEventListener('pointercancel', off);
});
$('[data-interact]').addEventListener('click', interact);
$('[data-inventory-toggle]').addEventListener('click', toggleInventory);
$('[data-restart]').addEventListener('click', () => {
  reset();
  frame.focus();
});

reset();
requestAnimationFrame(loop);
