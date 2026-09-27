// Mini moteur de pixel art : on peint des formes simples dans une grille,
// on ajoute un contour automatique, puis on exporte en SVG net (crispEdges).
// Utilisé uniquement au build : le site final ne contient que du SVG inline.

export function grid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill('.'));
}

export function clone(g) {
  return g.map((row) => row.slice());
}

export function put(g, x, y, c) {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
}

export function rect(g, x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(g, i, j, c);
}

export function ellipse(g, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(g, x, y, c);
    }
  }
}

// Remplissage de polygone (scanline), points en coordonnées pixel.
export function poly(g, pts, c) {
  const ys = pts.map((p) => p[1]);
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  for (let y = minY; y <= maxY; y++) {
    const cy = y + 0.5;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= cy && y2 > cy) || (y2 <= cy && y1 > cy)) {
        xs.push(x1 + ((cy - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) put(g, x, y, c);
    }
  }
}

// Trait épais entre deux points.
export function line(g, x0, y0, x1, y1, c, thick = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (thick <= 1) put(g, Math.round(x), Math.round(y), c);
    else ellipse(g, x + 0.5, y + 0.5, thick / 2, thick / 2, c);
  }
}

// Contour : tout pixel vide touchant (4-voisinage) un pixel plein devient c.
export function outline(g, c = 'k', diagonal = false) {
  const out = clone(g);
  const h = g.length;
  const w = g[0].length;
  const full = (x, y) => y >= 0 && y < h && x >= 0 && x < w && g[y][x] !== '.' && g[y][x] !== c;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      let n = full(x - 1, y) || full(x + 1, y) || full(x, y - 1) || full(x, y + 1);
      if (diagonal) n = n || full(x - 1, y - 1) || full(x + 1, y - 1) || full(x - 1, y + 1) || full(x + 1, y + 1);
      if (n) out[y][x] = c;
    }
  }
  return out;
}

// Ombrage simple : remplace `from` par `to` quand le prédicat (x, y) est vrai.
export function tint(g, from, to, pred) {
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[0].length; x++) if (g[y][x] === from && pred(x, y)) g[y][x] = to;
  }
}

export function fromRows(rows) {
  return rows.map((r) => r.split(''));
}

export function toRows(g) {
  return g.map((r) => r.join(''));
}

// Décale une grille (utile pour les frames d'animation).
export function shift(g, dx, dy) {
  const h = g.length;
  const w = g[0].length;
  const out = grid(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(out, x + dx, y + dy, g[y][x]);
  return out;
}

export function flipX(g) {
  return g.map((r) => r.slice().reverse());
}

// Export SVG : un <path> par couleur, chaque ligne de pixels identiques
// devient un petit rectangle « M x y h n v1 h-n z ». Très compact.
export function paths(g, palette) {
  const byColor = new Map();
  for (let y = 0; y < g.length; y++) {
    const row = g[y];
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.' || !(c in palette)) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      const d = `M${x} ${y}h${run}v1h-${run}z`;
      byColor.set(c, (byColor.get(c) || '') + d);
      x += run;
    }
  }
  let out = '';
  for (const [c, d] of byColor) {
    const color = palette[c];
    // Couleurs pilotées par variables CSS (costumes) : une classe définie dans
    // site.css plutôt qu'un attribut style=, pour garder une CSP stricte
    // (style-src 'self', sans 'unsafe-inline').
    const paint = color.startsWith('var(') ? `class="${varClass(color)}"` : `fill="${color}"`;
    out += `<path ${paint} d="${d}"/>`;
  }
  return out;
}

// var(--c-main,#2f6bff) -> « vc-c-main » (règle correspondante dans site.css).
export const VAR_CLASSES = new Map();
export function varClass(color) {
  const m = /^var\(--([a-z0-9-]+),\s*(#[0-9a-f]{3,8})\)$/i.exec(color);
  if (!m) throw new Error(`Couleur variable invalide : ${color}`);
  const cls = `vc-${m[1]}`;
  VAR_CLASSES.set(cls, `fill:var(--${m[1]},${m[2]})`);
  return cls;
}

export function svgGroup(g, palette, attrs = '') {
  return `<g${attrs ? ' ' + attrs : ''}>${paths(g, palette)}</g>`;
}

export function resolveVars(palette) {
  return Object.fromEntries(
    Object.entries(palette).map(([k, v]) => [k, v.replace(/^var\([^,]+,\s*([^)]+)\)$/, '$1')])
  );
}
