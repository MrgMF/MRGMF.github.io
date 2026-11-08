// Sprites du portfolio, dessinés au pixel près (formes + contour automatique).
// P1 = MRGMF, un opérateur à capuche et visière, badge d'accès autour du cou.
// Les boss sont les « problèmes » affrontés dans chaque projet.

import { grid, rect, ellipse, poly, line, outline, tint, put, paths, svgGroup, resolveVars } from './pixel.mjs';

// Couleurs de la capuche pilotées par CSS (costumes alternatifs).
const HOOD = {
  h: 'var(--c-main,#2f6bff)',
  H: 'var(--c-shade,#1b3fa8)',
  l: 'var(--c-light,#7fb0ff)',
};

// Tête : grosse capuche arrondie, ouverture du visage vers la droite,
// visage masqué et visière lumineuse.
function drawHead(g, oy, finish = true) {
  ellipse(g, 12, 7.2 + oy, 7.6, 6.8, 'h');
  tint(g, 'h', 'H', (x, y) => x <= 6 && y >= 4 + oy && y <= 14 + oy);
  ellipse(g, 12.5, 3 + oy, 3.6, 1.8, 'l');
  tint(g, 'l', 'h', (x) => x < 11);
  ellipse(g, 16.2, 8.4 + oy, 3.9, 3.6, 'f');
  rect(g, 13, 7 + oy, 7, 2, 'v');
  put(g, 18, 7 + oy, 'w');
  put(g, 19, 7 + oy, 'w');
  return finish ? outline(g, 'k') : g;
}

export const P1_PALETTE = {
  ...HOOD,
  k: '#0b0b16',
  f: '#161627',
  v: 'var(--c-visor,#3ff0ff)',
  w: '#e6fdff',
  g: '#f4f4f8',
  G: '#b8b8cc',
  y: '#ffd23f',
  c: '#ffffff',
  s: 'var(--c-main,#2f6bff)',
  p: '#434370',
  P: '#2c2c4d',
  b: '#15151f',
  B: '#565684',
  r: '#ff3d5a',
};

// --- P1 -------------------------------------------------------------------
const W = 30;
const H = 32;

function p1Frame({ bob = 0, punch = 0, headOnly = false } = {}) {
  const g = grid(W, H);
  const oy = bob; // respiration : le haut du corps descend d'1 px

  if (headOnly) return drawHead(g, oy);

  // Jambes (statiques) : garde large, jambe avant fléchie.
  line(g, 10, 22, 6, 27.5, 'p', 3.4);
  line(g, 14.5, 22, 17.5, 25, 'p', 3.4);
  line(g, 17.5, 25, 18.5, 27.5, 'p', 3.4);
  tint(g, 'p', 'P', (x, y) => y >= 23 && x <= 8);
  rect(g, 3, 28, 6, 2, 'b');
  rect(g, 16, 28, 6, 2, 'b');
  rect(g, 4, 28, 2, 1, 'B');
  rect(g, 17, 28, 2, 1, 'B');

  // Torse (sweat à capuche)
  poly(g, [[6.5, 13 + oy], [17.5, 13 + oy], [16.5, 22 + oy], [7.5, 22 + oy]], 'h');
  tint(g, 'h', 'H', (x, y) => x <= 8 && y >= 13 + oy);
  rect(g, 8, 21 + oy, 8, 1, 'P'); // ceinture

  // Cordon et badge d'accès (clin d'œil IAM)
  line(g, 9, 13 + oy, 11, 17 + oy, 'y');
  line(g, 15, 13 + oy, 13, 17 + oy, 'y');
  rect(g, 10, 17 + oy, 5, 3, 'c');
  rect(g, 10, 18 + oy, 5, 1, 's');

  // Bras arrière : garde haute, coude replié
  line(g, 8, 15 + oy, 13, 14 + oy, 'H', 3);
  // Bras avant : garde ou direct
  line(g, 16, 15 + oy, 19 + punch, 14 + oy, 'h', 3);

  drawHead(g, oy, false);

  // Gants, dessinés en dernier pour passer devant
  ellipse(g, 14.5, 13.5 + oy, 2, 1.9, 'g');
  put(g, 13, 14 + oy, 'G');
  ellipse(g, 21 + punch, 14 + oy, 2.3, 2.1, 'g');
  put(g, 19 + punch, 14 + oy, 'G');
  put(g, 19 + punch, 15 + oy, 'G');

  return outline(g, 'k');
}

const P1_FRAMES = [
  ['p1-a', 'idle-a', () => p1Frame()],
  ['p1-b', 'idle-b', () => p1Frame({ bob: 1 })],
  ['p1-p', 'punch', () => p1Frame({ punch: 5 })],
];

// Référence au sprite P1 (les frames sont définies une seule fois dans la
// planche de symboles, voir spriteSheet()).
export function p1SVG({ cls = '', label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  const uses = P1_FRAMES.map(([id, name]) => `<use href="#${id}" class="f ${name}"/>`).join('');
  return `<svg class="px p1 ${cls}" viewBox="0 0 ${W} ${H}" ${a11y}>${uses}</svg>`;
}

// Icône autonome (favicon) : la tête du P1 sur fond sombre, couleurs résolues.
export function faviconSVG() {
  // Tête seule (lignes 0 à 15, colonnes 3 à 22), centrée.
  const g = p1Frame({ headOnly: true })
    .slice(0, 16)
    .map((row) => row.slice(3, 23));
  const head = svgGroup(g, resolveVars(P1_PALETTE));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges"><rect width="24" height="24" rx="4" fill="#07070f"/><g transform="translate(1.5 4)">${head}</g></svg>`;
}

// SVG autonome (images générées : aperçu social, icônes).
export function standaloneP1(frame = 'idle-a') {
  const g = frame === 'punch' ? p1Frame({ punch: 5 }) : p1Frame();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${svgGroup(g, resolveVars(P1_PALETTE))}</svg>`;
}

// --- Boss -----------------------------------------------------------------
const BOSS_W = 26;
const BOSS_H = 26;

const BASE = { k: '#0b0b16', w: '#ffffff', e: '#0b0b16', r: '#ff3d5a' };

// BRUTE FORCE : un bélier (la bête… et l'engin de siège).
function ram() {
  const g = grid(BOSS_W, BOSS_H);
  // Cornes enroulées
  ellipse(g, 6, 9, 5, 5, 'h');
  ellipse(g, 20, 9, 5, 5, 'h');
  ellipse(g, 6, 9, 2.4, 2.4, 'H');
  ellipse(g, 20, 9, 2.4, 2.4, 'H');
  // Tête
  poly(g, [[8, 5], [18, 5], [19, 15], [16, 23], [10, 23], [7, 15]], 'a');
  tint(g, 'a', 'A', (x, y) => y >= 18 || x <= 9);
  // Toupet de laine
  ellipse(g, 13, 5, 5, 2.6, 'W');
  ellipse(g, 10, 6, 2, 1.6, 'W');
  ellipse(g, 16, 6, 2, 1.6, 'W');
  // Yeux furieux
  rect(g, 9, 11, 3, 2, 'w');
  rect(g, 15, 11, 3, 2, 'w');
  put(g, 11, 12, 'e');
  put(g, 15, 12, 'e');
  line(g, 8, 10, 12, 11, 'k');
  line(g, 14, 11, 18, 10, 'k');
  // Museau + naseaux fumants
  rect(g, 10, 18, 7, 3, 'n');
  put(g, 11, 19, 'k');
  put(g, 15, 19, 'k');
  return outline(g, 'k');
}

// CONFIANCE IMPLICITE : un fantôme avec un faux badge « ? ».
function ghost() {
  const g = grid(BOSS_W, BOSS_H);
  ellipse(g, 13, 10, 9, 8.5, 'a');
  rect(g, 4, 10, 18, 11, 'a');
  // Bas ondulé
  for (let i = 0; i < 6; i++) {
    const x = 4 + i * 3;
    rect(g, x, 21, 2, i % 2 ? 1 : 2, 'a');
  }
  tint(g, 'a', 'A', (x, y) => x <= 6 || y >= 18);
  // Yeux vides
  rect(g, 8, 8, 3, 4, 'e');
  rect(g, 15, 8, 3, 4, 'e');
  put(g, 9, 9, 'w');
  put(g, 16, 9, 'w');
  // Sourire trop confiant
  line(g, 9, 14, 17, 14, 'e');
  put(g, 8, 13, 'e');
  put(g, 18, 13, 'e');
  // Faux badge
  rect(g, 11, 16, 5, 5, 'y');
  rect(g, 12, 17, 3, 3, 'w');
  put(g, 13, 17, 'k');
  put(g, 14, 18, 'k');
  put(g, 13, 19, 'k');
  line(g, 13, 13, 13, 16, 'y');
  return outline(g, 'k');
}

// OVERBOOKING : la sonnette de réception, furieuse.
function bell() {
  const g = grid(BOSS_W, BOSS_H);
  rect(g, 12, 3, 2, 2, 'A'); // bouton
  rect(g, 11, 5, 4, 1, 'a');
  ellipse(g, 13, 14, 9, 8.5, 'a');
  rect(g, 3, 14, 20, 5, 'a');
  tint(g, 'a', 'l', (x, y) => x >= 15 && x <= 18 && y >= 8 && y <= 12);
  tint(g, 'a', 'A', (x, y) => x <= 6);
  rect(g, 1, 19, 24, 3, 'H'); // socle
  rect(g, 1, 19, 24, 1, 'h');
  // Yeux
  rect(g, 8, 12, 3, 3, 'w');
  rect(g, 15, 12, 3, 3, 'w');
  put(g, 10, 13, 'e');
  put(g, 15, 13, 'e');
  line(g, 7, 11, 11, 12, 'k');
  line(g, 15, 12, 19, 11, 'k');
  // Bouche « DING »
  rect(g, 11, 16, 5, 2, 'e');
  put(g, 12, 16, 'w');
  put(g, 14, 16, 'w');
  return outline(g, 'k');
}

// LE MOTEUR 3D : un cube en fil de fer qui ne veut pas s'afficher.
function cube() {
  const g = grid(BOSS_W, BOSS_H);
  // Faces pleines (perspective iso)
  poly(g, [[13, 2], [23, 7], [13, 12], [3, 7]], 'l'); // dessus
  poly(g, [[3, 7], [13, 12], [13, 24], [3, 19]], 'A'); // gauche
  poly(g, [[13, 12], [23, 7], [23, 19], [13, 24]], 'a'); // droite
  // Arêtes néon
  line(g, 13, 2, 23, 7, 'v');
  line(g, 13, 2, 3, 7, 'v');
  line(g, 13, 12, 13, 24, 'v');
  line(g, 3, 7, 13, 12, 'v');
  line(g, 23, 7, 13, 12, 'v');
  // Yeux sur la face droite
  rect(g, 15, 13, 2, 3, 'w');
  rect(g, 19, 11, 2, 3, 'w');
  put(g, 16, 14, 'e');
  put(g, 20, 12, 'e');
  line(g, 15, 18, 20, 16, 'e');
  return outline(g, 'k');
}

// LE CV ENNUYEUX : une feuille A4 qui bâille.
function paper() {
  const g = grid(BOSS_W, BOSS_H);
  poly(g, [[5, 1], [17, 1], [22, 6], [22, 25], [5, 25]], 'a');
  poly(g, [[17, 1], [22, 6], [17, 6]], 'A'); // coin corné
  // Puces et lignes de texte
  for (let i = 0; i < 4; i++) {
    put(g, 8, 17 + i * 2, 'e');
    rect(g, 10, 17 + i * 2, 9 - (i % 2) * 3, 1, 'A');
  }
  rect(g, 8, 4, 7, 1, 'A');
  // Yeux mi-clos
  rect(g, 8, 9, 3, 1, 'e');
  rect(g, 15, 9, 3, 1, 'e');
  // Bâillement
  ellipse(g, 13, 13, 2.2, 2.4, 'e');
  put(g, 13, 14, 'r');
  return outline(g, 'k');
}

// ARCHIVES (boss secret) : une disquette.
function floppy() {
  const g = grid(BOSS_W, BOSS_H);
  rect(g, 3, 2, 20, 22, 'a');
  tint(g, 'a', 'A', (x) => x <= 4);
  rect(g, 7, 2, 12, 7, 'l'); // volet métal
  rect(g, 14, 3, 3, 5, 'A');
  rect(g, 6, 13, 14, 11, 'w'); // étiquette
  rect(g, 8, 15, 10, 1, 'A');
  rect(g, 8, 17, 8, 1, 'A');
  rect(g, 8, 19, 10, 1, 'A');
  // Visage malicieux sur l'étiquette
  put(g, 9, 21, 'e');
  put(g, 16, 21, 'e');
  line(g, 10, 22, 15, 22, 'e');
  return outline(g, 'k');
}

// L'HYDRE À TICKETS (le support IT) : on ferme un ticket, deux repoussent.
function hydra() {
  const g = grid(BOSS_W, BOSS_H);
  // Corps
  ellipse(g, 13, 21, 10, 5, 'a');
  tint(g, 'a', 'A', (x, y) => y >= 23 || x <= 5);
  // Cous
  line(g, 7, 19, 5, 11, 'a', 2.6);
  line(g, 13, 18, 13, 8, 'a', 2.6);
  line(g, 19, 19, 21, 11, 'a', 2.6);
  // Têtes = tickets (feuille blanche + bandeau rouge « # »)
  const head = (x, y) => {
    rect(g, x, y, 7, 6, 'w');
    rect(g, x, y, 7, 2, 'r');
    put(g, x + 1, y + 3, 'e');
    put(g, x + 5, y + 3, 'e');
    rect(g, x + 2, y + 5, 3, 1, 'e');
  };
  head(1, 5);
  head(10, 2);
  head(18, 5);
  // Griffes
  rect(g, 5, 25, 2, 1, 'k');
  rect(g, 19, 25, 2, 1, 'k');
  return outline(g, 'k');
}

// LA DÉRIVE : un portable qui sort de la conformité en silence.
function laptop() {
  const g = grid(BOSS_W, BOSS_H);
  // Écran
  rect(g, 4, 3, 18, 13, 'a');
  rect(g, 6, 5, 14, 9, 'S');
  // Visage glitché
  rect(g, 8, 7, 3, 2, 'r');
  rect(g, 15, 7, 3, 2, 'r');
  rect(g, 9, 11, 8, 1, 'r');
  rect(g, 12, 6, 2, 1, 'l');
  rect(g, 17, 10, 3, 1, 'l');
  rect(g, 6, 12, 4, 1, 'l');
  // Charnière + clavier en perspective
  rect(g, 3, 16, 20, 1, 'A');
  poly(g, [[3, 17], [23, 17], [25, 22], [1, 22]], 'a');
  for (let i = 0; i < 4; i++) rect(g, 5 + i * 4, 18, 3, 1, 'A');
  rect(g, 9, 20, 8, 1, 'A');
  // Panneau d'alerte
  poly(g, [[21, 0], [25, 7], [17, 7]], 'y');
  rect(g, 21, 2, 1, 3, 'e');
  put(g, 21, 6, 'e');
  return outline(g, 'k');
}

// Tuile verrouillée : un « ? » massif.
const QMARK = [
  '..XXXXXX..',
  '.XXXXXXXX.',
  'XXX....XXX',
  'XXX....XXX',
  '.......XXX',
  '......XXX.',
  '....XXXX..',
  '....XXX...',
  '....XXX...',
  '..........',
  '....XXX...',
  '....XXX...',
];

function stamp(g, pattern, x0, y0, c, scale = 1) {
  pattern.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch !== '.') rect(g, x0 + i * scale, y0 + j * scale, scale, scale, c);
    })
  );
}

function mystery() {
  const g = grid(BOSS_W, BOSS_H);
  stamp(g, QMARK, 3, 1, 'a', 2);
  return outline(g, 'k');
}

const BOSS_DEFS = {
  ram: { draw: ram, pal: { a: '#e9e2d0', A: '#b8ad94', h: '#8a5a3c', H: '#5b3824', W: '#fffaf0', n: '#f2a3b3' } },
  ghost: { draw: ghost, pal: { a: '#cfd6ff', A: '#98a3e0', y: '#ffd23f' } },
  bell: { draw: bell, pal: { a: '#ffcf4a', A: '#d19a1a', l: '#fff1b8', h: '#7a4d2b', H: '#4f301a' } },
  cube: { draw: cube, pal: { a: '#3b2a7a', A: '#23174d', l: '#5b46b3', v: '#3ff0ff' } },
  paper: { draw: paper, pal: { a: '#f5f2ea', A: '#b9b3a4' } },
  floppy: { draw: floppy, pal: { a: '#ff4fd8', A: '#b62c98', l: '#c9ccd9' } },
  hydra: { draw: hydra, pal: { a: '#3ddc84', A: '#1f9a5a', w: '#f5f2ea' } },
  laptop: { draw: laptop, pal: { a: '#c9ccd9', A: '#8a8fa6', S: '#1b2a4a', l: '#3ff0ff', y: '#ffd23f' } },
  mystery: { draw: mystery, pal: { a: 'var(--c-mystery,#5d5d80)' } },
};

export function standaloneBoss(id) {
  const def = BOSS_DEFS[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOSS_W} ${BOSS_H}" shape-rendering="crispEdges">${svgGroup(def.draw(), resolveVars({ ...BASE, ...def.pal }))}</svg>`;
}

export function bossSVG(id, { cls = '', label = '' } = {}) {
  if (!BOSS_DEFS[id]) throw new Error(`Boss inconnu : ${id}`);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="px boss boss--${id} ${cls}" viewBox="0 0 ${BOSS_W} ${BOSS_H}" ${a11y}><use href="#b-${id}"/></svg>`;
}

export const BOSS_IDS = Object.keys(BOSS_DEFS);

// --- Alliés (assists) : ils combattent AVEC le joueur 1 -------------------
const ALLY_W = 20;
const ALLY_H = 20;

// NEXTHINK : un drone d'observation qui scanne le parc et corrige à distance.
function drone() {
  const g = grid(ALLY_W, ALLY_H);
  // Rotors et bras
  rect(g, 1, 4, 6, 1, 'A');
  rect(g, 13, 4, 6, 1, 'A');
  line(g, 4, 5, 6, 7, 'A');
  line(g, 15, 5, 13, 7, 'A');
  // Antenne
  line(g, 10, 2, 10, 5, 'A');
  put(g, 10, 1, 'l');
  // Corps
  ellipse(g, 10, 10.5, 6.2, 5.2, 'a');
  tint(g, 'a', 'A', (x, y) => y >= 13 || x <= 5);
  // Visière et œil qui scanne
  rect(g, 6, 8, 8, 3, 'S');
  rect(g, 10, 8, 2, 2, 'l');
  put(g, 11, 8, 'w');
  rect(g, 7, 10, 2, 1, 'L');
  // Propulseur
  rect(g, 9, 16, 2, 1, 'l');
  return outline(g, 'k');
}

const ALLY_DEFS = {
  drone: { draw: drone, pal: { a: '#eaf2ff', A: '#a9b8d6', S: '#13233d', l: '#36e0a0', L: '#1f8a63', w: '#ffffff' } },
};

export function allySVG(id, { cls = '' } = {}) {
  if (!ALLY_DEFS[id]) throw new Error(`Allié inconnu : ${id}`);
  return `<svg class="px ally ally--${id} ${cls}" viewBox="0 0 ${ALLY_W} ${ALLY_H}" aria-hidden="true" focusable="false"><use href="#a-${id}"/></svg>`;
}

// --- Améliorations : diplômes et certifications ----------------------------
const UP = 16;

// Diplôme : un parchemin roulé, scellé.
function scroll() {
  const g = grid(UP, UP);
  rect(g, 3, 3, 10, 9, 'p');
  rect(g, 1, 2, 3, 11, 'P');
  rect(g, 12, 2, 3, 11, 'P');
  rect(g, 2, 2, 1, 11, 'q');
  rect(g, 13, 2, 1, 11, 'q');
  rect(g, 5, 5, 6, 1, 'P');
  rect(g, 5, 7, 4, 1, 'P');
  rect(g, 8, 12, 1, 3, 'r');
  rect(g, 11, 12, 1, 3, 'r');
  ellipse(g, 9.5, 10.5, 2.1, 2.1, 'r');
  put(g, 9, 10, 'R');
  return outline(g, 'k');
}

// Formation supérieure : la toque.
function cap() {
  const g = grid(UP, UP);
  rect(g, 4, 8, 8, 4, 'A');
  poly(g, [[0.5, 6.5], [8, 2.5], [15.5, 6.5], [8, 10.5]], 'a');
  tint(g, 'a', 'l', (x, y) => y <= 4);
  line(g, 8, 6, 13, 8, 'y');
  rect(g, 13, 8, 1, 4, 'y');
  rect(g, 12, 12, 3, 2, 'y');
  put(g, 8, 6, 'y');
  return outline(g, 'k');
}

// Certification : la médaille.
function medal() {
  const g = grid(UP, UP);
  poly(g, [[3, 0], [7, 0], [9, 7], [5, 7]], 'r');
  poly(g, [[9, 0], [13, 0], [11, 7], [7, 7]], 'b');
  ellipse(g, 8, 11, 4.6, 4.6, 'y');
  ellipse(g, 8, 11, 2.8, 2.8, 'Y');
  put(g, 7, 9, 'w');
  put(g, 6, 10, 'w');
  return outline(g, 'k');
}

// À débloquer : le cadenas.
function lock() {
  const g = grid(UP, UP);
  rect(g, 5, 1, 6, 2, 'A');
  rect(g, 4, 2, 2, 5, 'A');
  rect(g, 10, 2, 2, 5, 'A');
  rect(g, 3, 7, 10, 8, 'a');
  tint(g, 'a', 'l', (x, y) => y === 7);
  rect(g, 6, 9, 4, 2, 'k');
  rect(g, 7, 11, 2, 2, 'k');
  return outline(g, 'k');
}

const UPGRADE_DEFS = {
  scroll: { draw: scroll, pal: { p: '#f5e6c8', P: '#c9ab78', q: '#fff6de', r: '#ff3d5a', R: '#ffb3bf' } },
  cap: { draw: cap, pal: { a: '#5a5ae0', A: '#2e2e86', l: '#8d8dff', y: '#ffd23f' } },
  medal: { draw: medal, pal: { r: '#ff3d5a', b: '#3aa0ff', y: '#ffd23f', Y: '#e8a800', w: '#fff6c8' } },
  lock: { draw: lock, pal: { a: '#6b6b92', A: '#b8b8cc', l: '#8d8db5' } },
};

export function upgradeSVG(id, { cls = '' } = {}) {
  if (!UPGRADE_DEFS[id]) throw new Error(`Amélioration inconnue : ${id}`);
  return `<svg class="px up up--${id} ${cls}" viewBox="0 0 ${UP} ${UP}" aria-hidden="true" focusable="false"><use href="#u-${id}"/></svg>`;
}

export function standaloneUpgrade(id) {
  const def = UPGRADE_DEFS[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${UP} ${UP}" shape-rendering="crispEdges">${svgGroup(def.draw(), resolveVars({ ...BASE, ...def.pal }))}</svg>`;
}

export function standaloneAlly(id) {
  const def = ALLY_DEFS[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ALLY_W} ${ALLY_H}" shape-rendering="crispEdges">${svgGroup(def.draw(), resolveVars({ ...BASE, ...def.pal }))}</svg>`;
}

// --- Icônes de manipulation (notation « numpad » des jeux de combat) ------
// 1 ↙ 2 ↓ 3 ↘ / 4 ← 5 · 6 → / 7 ↖ 8 ↑ 9 ↗
const ARROW_ANGLE = { 6: 0, 3: 45, 2: 90, 1: 135, 4: 180, 7: 225, 8: 270, 9: 315 };

export function inputIcon(token) {
  if (ARROW_ANGLE[token] !== undefined) {
    const a = ARROW_ANGLE[token];
    return `<svg class="in in--dir" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#in-dir"${a ? ` transform="rotate(${a} 12 12)"` : ''}/></svg>`;
  }
  return `<svg class="in in--btn in--${token.toLowerCase()}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#in-${token}"/></svg>`;
}

// Planche de symboles : chaque sprite n'est écrit qu'une fois par page.
export function spriteSheet() {
  const p1 = P1_FRAMES.map(
    ([id, , draw]) => `<symbol id="${id}" viewBox="0 0 ${W} ${H}">${paths(draw(), P1_PALETTE)}</symbol>`
  ).join('');
  const bosses = Object.entries(BOSS_DEFS)
    .map(([id, def]) => `<symbol id="b-${id}" viewBox="0 0 ${BOSS_W} ${BOSS_H}">${paths(def.draw(), { ...BASE, ...def.pal })}</symbol>`)
    .join('');
  const allies = Object.entries(ALLY_DEFS)
    .map(([id, def]) => `<symbol id="a-${id}" viewBox="0 0 ${ALLY_W} ${ALLY_H}">${paths(def.draw(), { ...BASE, ...def.pal })}</symbol>`)
    .join('');
  const upgrades = Object.entries(UPGRADE_DEFS)
    .map(([id, def]) => `<symbol id="u-${id}" viewBox="0 0 ${UP} ${UP}">${paths(def.draw(), { ...BASE, ...def.pal })}</symbol>`)
    .join('');
  // Les styles passent par des classes (site.css) et des variables CSS : les
  // variables traversent la frontière du <use>, ce qui permet de colorer
  // chaque instance (touches allumées, costumes).
  const inputs =
    `<symbol id="in-dir" viewBox="0 0 24 24"><circle class="in-bg" cx="12" cy="12" r="10.5"/><path class="in-arrow" d="M6 12h10m-4-4 4 4-4 4"/></symbol>` +
    ['P', 'K']
      .map(
        (b) =>
          `<symbol id="in-${b}" viewBox="0 0 24 24"><circle class="in-bg" cx="12" cy="12" r="10.5"/><text class="in-txt" x="12" y="16.6" text-anchor="middle">${b}</text></symbol>`
      )
      .join('');
  return `<svg class="sprite-sheet" width="0" height="0" aria-hidden="true" focusable="false"><defs>${p1}${bosses}${allies}${upgrades}${inputs}</defs></svg>`;
}
