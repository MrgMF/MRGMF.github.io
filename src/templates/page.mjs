// Gabarits HTML. Tout est rendu au build : la page fonctionne sans JavaScript
// (mode lecture) et le JS la transforme en borne d'arcade (mode jeu).

import { p1SVG, bossSVG, inputIcon, spriteSheet, standaloneBoss } from '../sprites.mjs';

export const SITE = 'https://mrgmf.github.io/';
const YEAR = 2026;

// --- Utilitaires ------------------------------------------------------------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Typographie française : espaces fines insécables avant ! ? ; : » et après «.
export function typo(lang, s = '') {
  if (lang !== 'fr') return String(s);
  return String(s)
    .replace(/'/g, '\u2019')
    .replace(/ ([!?;:»])/g, '\u202F$1')
    .replace(/« /g, '«\u202F');
}

const splitInput = (input) => {
  const m = input.match(/^([1-9]+)([PK]+)$/);
  if (!m) return { dirs: [], btns: [] };
  return { dirs: [...m[1]], btns: [...m[2]] };
};

function inputRow(input) {
  const { dirs, btns } = splitInput(input);
  const icons = dirs.map((d) => inputIcon(d)).join('');
  const buttons = btns.map((b) => inputIcon(b)).join('<span class="plus">+</span>');
  return `<span class="inputs" aria-hidden="true">${icons}<span class="plus">+</span>${buttons}</span><code class="notation">${esc(input)}</code>`;
}

// Icônes de trait : les polices n'ont pas de flèches, on dessine en SVG.
const ICONS = {
  left: '<path d="M15 5 8 12l7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  ext: '<path d="M7 17 17 7M9 7h8v8"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  sound: '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  book: '<path d="M3.5 5.5h6A2.5 2.5 0 0 1 12 8v11a2 2 0 0 0-2-2H3.5zM20.5 5.5h-6A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6.5z"/>',
  pad: '<path d="M7.5 7.5h9a4.5 4.5 0 0 1 4.5 4.5v1.5a3 3 0 0 1-5.3 1.9L14 13.5h-4l-1.7 1.9A3 3 0 0 1 3 13.5V12a4.5 4.5 0 0 1 4.5-4.5z"/><path d="M7.5 10.5v3M6 12h3"/>',
};
export const icon = (name) =>
  `<svg class="ico ico--${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// --- Fragments --------------------------------------------------------------
function head(c, base, { title, description, canonical, alternates, noindex = false }) {
  const og = `${SITE}assets/img/og-cover${c.lang === 'fr' ? '' : '-' + c.lang}.png`;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Fodié Marega',
    alternateName: 'MrgMF',
    url: SITE,
    jobTitle: 'End User Architect',
    sameAs: [c.contact.github, c.contact.linkedin],
    knowsAbout: [
      'Identity and Access Management',
      'Identity Governance and Administration',
      'IAM Architecture',
      'Zero Trust',
      'Microsoft Entra ID',
      'Conditional Access',
      'PowerShell',
      'Azure Automation',
      'Microsoft 365',
    ],
  };
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
${alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`).join('\n')}
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#07070f">
<meta name="author" content="Fodié Marega">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MRGMF">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${c.locale}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(c.meta.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${base}assets/img/apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preload" href="${base}assets/fonts/bungee-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}assets/fonts/chakra-petch-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/css/site.css">
<script>(function(d){d.classList.replace('no-js','js');try{if(localStorage.getItem('mrgmf.mode')!=='reading')d.dataset.mode='game';if(localStorage.getItem('mrgmf.unlocked')==='1')d.classList.add('is-unlocked');var c=localStorage.getItem('mrgmf.costume');if(c&&c!=='0')d.dataset.costume=c}catch(e){d.dataset.mode='game'}setTimeout(function(){if(!window.__arcadeReady){window.__arcadeFallback=1;d.dataset.mode='reading'}},4000)})(document.documentElement)</script>
<script type="application/ld+json">${JSON.stringify(person)}</script>
</head>`;
}

function hud(c, base) {
  const u = c.ui;
  const alt = c.alternate;
  const altHref = base + alt.dir;
  return `<header class="hud">
  <a class="hud-brand" href="#title"><span class="hud-p1" aria-hidden="true">P1</span> MRGMF</a>
  <p class="hud-screen game-only" data-hud-screen aria-hidden="true">${esc(u.screens.title)}</p>
  <nav class="hud-nav reading-only" aria-label="${esc(u.nav)}">
    <a href="#select">${esc(c.select.readingHeading)}</a>
    <a href="#moves">${esc(c.moves.heading)}</a>
    <a href="#profile">${esc(u.screens.profile)}</a>
    <a href="#contact">${esc(u.screens.contact)}</a>
  </nav>
  <div class="hud-actions">
    <button class="hud-btn game-only" type="button" data-sound aria-pressed="false">${icon('sound')}<span class="hud-label">${esc(u.sound)}</span> <b data-sound-state>${u.off}</b></button>
    <a class="hud-btn" href="${altHref}" hreflang="${alt.lang}" lang="${alt.lang}" title="${esc(alt.name)}" data-lang-switch>${alt.label}</a>
    <button class="hud-btn js-only" type="button" data-toggle-mode><span class="game-only">${icon('book')}<span class="hud-label">${esc(u.readingMode)}</span></span><span class="reading-only">${icon('pad')}<span class="hud-label">${esc(u.arcadeMode)}</span></span></button>
    <button class="hud-btn hud-btn--icon game-only" type="button" data-help aria-label="${esc(u.help)}" title="${esc(u.help)}">?</button>
  </div>
</header>`;
}

function titleScreen(c, T) {
  const t = c.title;
  return `<section id="title" class="screen screen--title" data-screen="title" aria-labelledby="title-h">
  <div class="title-bg" aria-hidden="true"><div class="title-sky"></div><div class="title-floor"></div></div>
  <div class="title-inner">
    <h1 id="title-h" class="logo screen-heading" tabindex="-1"><span class="logo-main">${esc(t.logo)}</span><span class="logo-sub">${esc(t.subtitle)}</span><span class="sr-only"> · Fodié Marega</span></h1>
    <p class="title-role">${esc(T(t.role))}</p>
    <p class="title-tagline">${esc(T(t.tagline))}</p>
    <div class="title-hero p1-costume" aria-hidden="true">${p1SVG({ cls: 'breathe' })}</div>
    <p class="title-blurb">${esc(T(t.blurb))}</p>
    <a class="press-start game-only" href="#select" data-press-start><span>${esc(t.start)}</span><small>${esc(T(t.startHint))}</small></a>
    <p class="title-foot game-only" aria-hidden="true"><span class="title-copy">© ${YEAR} Fodié Marega</span><span class="blink-slow">${esc(t.credit)}</span></p>
    <button class="linklike game-only" type="button" data-toggle-mode>${esc(T(t.reading))}</button>
  </div>
</section>`;
}

function tile(c, s, T) {
  const art = s.secret
    ? `<span class="tile-art tile-art--locked">${bossSVG('mystery')}</span><span class="tile-art tile-art--open">${bossSVG(s.boss.sprite)}</span>`
    : `<span class="tile-art">${bossSVG(s.boss.sprite)}</span>`;
  const name = s.secret
    ? `<span class="tile-name"><span class="secret-locked">${esc(c.select.locked.name)}</span><span class="secret-open">${esc(s.tile)}</span></span>`
    : `<span class="tile-name">${esc(s.tile)}</span>`;
  const data = {
    stage: s.id,
    name: s.name,
    tagline: T(s.tagline),
    boss: s.boss.name,
    sprite: s.boss.sprite,
    meta: JSON.stringify(s.meta),
  };
  const attrs = Object.entries(data)
    .map(([k, v]) => `data-${k}="${esc(v)}"`)
    .join(' ');
  return `<li><a class="tile${s.secret ? ' tile--secret' : ''}" href="#vs-${s.id}" ${attrs}${s.secret ? ' data-secret' : ''}>
      ${art}${name}
      <span class="tile-desc reading-only">${esc(T(s.tagline))}</span>
    </a></li>`;
}

function selectScreen(c, T) {
  const s = c.select;
  const first = c.stages[0];
  const tiles = c.stages.map((st) => tile(c, st, T)).join('\n');
  const random = `<li class="game-only"><a class="tile tile--random" href="#select" data-random data-name="${esc(s.random.name)}" data-tagline="${esc(T(s.random.tagline))}" data-sprite="mystery" data-boss="?" data-meta="[]"><span class="tile-art">${bossSVG('mystery')}</span><span class="tile-name">${esc(s.random.name)}</span></a></li>`;
  const sprites = [...new Set(c.stages.map((st) => st.boss.sprite)), 'mystery']
    .map((id) => `<div class="p2-art" data-art="${id}"${id === first.boss.sprite ? '' : ' hidden'}>${bossSVG(id)}</div>`)
    .join('');
  const menu = s.menu
    .map(
      (m) =>
        `<a class="menu-btn" href="#${m.id}" data-menu="${m.id}"><span>${esc(m.label)}</span><small>${esc(T(m.hint))}</small></a>`
    )
    .join('');
  return `<section id="select" class="screen screen--select" data-screen="select" aria-labelledby="select-h">
  <h2 id="select-h" class="screen-heading" tabindex="-1"><span class="game-only">${esc(s.heading)}</span><span class="reading-only">${esc(s.readingHeading)}</span></h2>
  <p class="lede reading-only">${esc(T(s.readingIntro))}</p>
  <div class="select-layout">
    <aside class="side side--p1 game-only" aria-hidden="true">
      <p class="side-tag">${esc(s.p1)}</p>
      <div class="side-art p1-costume">${p1SVG({ cls: 'breathe' })}</div>
      <p class="side-name">MRGMF</p>
      <p class="side-sub">Fodié Marega</p>
      <p class="side-role">${esc(T(c.title.role))}</p>
    </aside>
    <div class="roster-wrap">
      <ul class="roster" role="list">
${tiles}
${random}
      </ul>
      <nav class="select-menu" aria-label="${esc(c.select.menuLabel)}">${menu}</nav>
    </div>
    <aside class="side side--p2 game-only" aria-hidden="true">
      <p class="side-tag">${esc(s.p2)}</p>
      <div class="side-art">${sprites}</div>
      <p class="side-name" data-p2-name>${esc(first.name)}</p>
      <p class="side-boss"><span>${esc(s.boss)}</span> <strong data-p2-boss>${esc(first.boss.name)}</strong></p>
      <p class="side-sub" data-p2-tagline>${esc(T(first.tagline))}</p>
      <ul class="side-meta" data-p2-meta>${first.meta.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
    </aside>
  </div>
  <p class="hints game-only" aria-hidden="true">${esc(T(s.hints))}</p>
</section>`;
}

function stageScreen(c, s, i, T) {
  const f = c.fight;
  const total = s.hits.length + 1;
  const visible = c.stages.filter((x) => !x.secret);
  const idx = visible.findIndex((x) => x.id === s.id);
  const next = s.secret ? visible[0] : visible[(idx + 1) % visible.length];
  const hits = s.hits
    .map(
      (h, n) => `<li class="hit" data-hit="${n + 1}"><span class="hit-n" aria-hidden="true">${String(n + 1).padStart(2, '0')}</span><div><h4>${esc(T(h.name))}</h4><p>${esc(T(h.desc))}</p></div></li>`
    )
    .join('\n');
  const superHit = `<li class="hit hit--super" data-hit="${total}"><span class="hit-n" aria-hidden="true">SP</span><div><h4>${esc(T(s.super.name))}</h4><p>${esc(T(s.super.desc))}</p></div></li>`;
  const stats = s.results
    .map((r) => `<div class="stat"><dt>${esc(T(r.label))}</dt><dd>${esc(r.value)}</dd></div>`)
    .join('');
  const chips = s.stack.map((x) => `<li>${esc(x)}</li>`).join('');
  const links = s.links.map((l) => `<a class="btn btn--small" href="${esc(l.href)}" rel="noopener">${esc(l.label)} ${icon('ext')}</a>`).join(' ');
  return `<article id="vs-${s.id}" class="screen screen--stage stage stage--${s.id}${s.secret ? ' stage--secret' : ''}" data-screen="stage" data-stage="${s.id}" data-total="${total}" data-boss="${esc(s.boss.name)}" data-sprite="${s.boss.sprite}" aria-labelledby="vs-${s.id}-h">
  <div class="fight-hud game-only" aria-hidden="true">
    <div class="bar bar--p1"><span class="bar-name">MRGMF</span><span class="hp"><i></i></span></div>
    <div class="timer" data-timer>99</div>
    <div class="bar bar--p2"><span class="hp"><i data-boss-hp></i></span><span class="bar-name">${esc(s.boss.name)}</span></div>
  </div>
  <header class="stage-head">
    <p class="kicker">${esc(T(s.kicker))}</p>
    <h2 id="vs-${s.id}-h" class="screen-heading" tabindex="-1">${esc(s.name)}</h2>
    <p class="tagline">${esc(T(s.tagline))}</p>
  </header>
  <div class="stage-grid">
    <div class="arena game-only" aria-hidden="true">
      <div class="arena-floor"></div>
      <div class="fighter fighter--p1 p1-costume">${p1SVG({ cls: 'breathe' })}</div>
      <div class="fighter fighter--boss">${bossSVG(s.boss.sprite)}</div>
      <p class="combo-count" data-combo></p>
      <div class="arena-fx" data-fx></div>
    </div>
    <div class="stage-brief">
      <p class="boss-card"><span class="boss-label">${esc(f.opponent)}</span> <strong>${esc(s.boss.name)}</strong> <span class="boss-desc">${esc(T(s.boss.desc))}</span></p>
      <p class="stage-intro">${esc(T(s.intro))}</p>
      <div class="commentary game-only" data-commentary aria-live="polite"><p class="commentary-idle">${esc(T(f.commentaryIdle))}</p></div>
      <div class="controls game-only">
        <button class="btn btn--attack" type="button" data-attack>${esc(f.attack)} <kbd>J</kbd></button>
        <button class="btn btn--ghost" type="button" data-skip>${esc(f.skip)}</button>
      </div>
      <p class="controls-hint game-only">${esc(T(f.controlsHint))}</p>
    </div>
  </div>
  <h3 class="log-title">${esc(f.combo)}</h3>
  <ol class="hits" role="list">
${hits}
${superHit}
  </ol>
  <section class="results" aria-labelledby="vs-${s.id}-res vs-${s.id}-h">
    <h3 id="vs-${s.id}-res" class="results-title"><span class="game-only ko-stamp" aria-hidden="true">${esc(f.ko)}</span> ${esc(f.results)}</h3>
    <dl class="stats">${stats}</dl>
    <h4 class="stack-title">${esc(f.stack)}</h4>
    <ul class="chips" role="list">${chips}</ul>
    ${s.note ? `<p class="note">${esc(T(s.note))}</p>` : ''}
    ${links ? `<p class="links">${links}</p>` : ''}
  </section>
  <nav class="stage-nav" aria-label="${esc(s.name)}">
    <a class="btn btn--ghost" href="#select">${icon('left')} ${esc(f.toSelect)}</a>
    <button class="btn btn--ghost game-only" type="button" data-replay>${esc(f.replay)}</button>
    <a class="btn" href="#vs-${next.id}">${esc(f.next)} ${icon('right')}</a>
  </nav>
</article>`;
}

function moveItem(m, T, demoLabel, isSuper = false) {
  return `<li class="move${isSuper ? ' move--super' : ''}" data-move="${m.id}" data-input="${m.input}">
      <div class="move-main">
        <h4 class="move-name">${esc(T(m.name))}</h4>
        <p class="move-input">${inputRow(m.input)}</p>
      </div>
      <p class="move-desc">${esc(T(m.desc))}</p>
      <button class="move-demo game-only" type="button" data-demo aria-label="${esc(demoLabel)} · ${esc(T(m.name))}">${icon('play')}</button>
      <span class="move-check game-only" aria-hidden="true">${icon('check')}</span>
    </li>`;
}

function movesScreen(c, T) {
  const m = c.moves;
  const count = m.groups.reduce((n, g) => n + g.moves.length, 0) + 1;
  const groups = m.groups
    .map(
      (g) => `<section class="move-group">
      <h3>${esc(T(g.title))}</h3>
      <ul class="move-list" role="list">${g.moves.map((mv) => moveItem(mv, T, m.demo)).join('')}</ul>
    </section>`
    )
    .join('\n');
  const legend = m.legend
    .map(([k, v]) => `<li>${inputIcon(k)}<span>${esc(T(v))}</span></li>`)
    .join('');
  return `<section id="moves" class="screen screen--moves" data-screen="moves" aria-labelledby="moves-h">
  <header class="screen-head">
    <h2 id="moves-h" class="screen-heading" tabindex="-1">${esc(m.heading)}</h2>
    <p class="lede">${esc(T(m.intro))}</p>
    <div class="moves-meta">
      <ul class="legend" role="list">${legend}</ul>
      <p class="moves-progress game-only"><strong data-moves-found>0</strong>/<span data-moves-total>${count}</span> ${esc(T(m.progress))}</p>
    </div>
    <p class="touch-hint game-only">${esc(T(m.tapHint))}</p>
  </header>
  <div class="moves-grid">
${groups}
    <section class="move-group move-group--super">
      <h3>${esc(T(m.superTitle))}</h3>
      <ul class="move-list" role="list">${moveItem(m.super, T, m.demo, true)}</ul>
    </section>
    <section class="move-group move-group--normals">
      <h3>${esc(T(m.normalsTitle))}</h3>
      <ul class="chips" role="list">${m.normals.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </section>
  </div>
</section>`;
}

function profileScreen(c, T) {
  const p = c.profile;
  const swatches = p.costumes
    .map(
      (name, i) =>
        `<button class="swatch swatch--${i}" type="button" data-costume="${i}" aria-pressed="${i === 0}" title="${esc(name)}"><span class="sr-only">${esc(name)}</span></button>`
    )
    .join('');
  return `<section id="profile" class="screen screen--profile" data-screen="profile" aria-labelledby="profile-h">
  <div class="profile-layout">
    <div class="profile-art">
      <div class="profile-sprite p1-costume" aria-hidden="true">${p1SVG({ cls: 'breathe' })}</div>
      <div class="costumes js-only" role="group" aria-label="${esc(p.costume)}"><span class="costumes-label" aria-hidden="true">${esc(p.costume)}</span>${swatches}</div>
    </div>
    <div class="profile-card">
      <p class="kicker">${esc(T(p.heading))}</p>
      <h2 id="profile-h" class="screen-heading" tabindex="-1">${esc(p.name)} <span class="tag">${esc(p.tag)}</span></h2>
      <dl class="profile-rows">${p.rows.map(([k, v]) => `<div><dt>${esc(T(k))}</dt><dd>${esc(T(v))}</dd></div>`).join('')}</dl>
      <p class="profile-bio">${esc(T(p.bio))}</p>
      <figure class="win-quote"><figcaption>${esc(T(p.quoteLabel))}</figcaption><blockquote>${esc(T(p.quote))}</blockquote></figure>
    </div>
  </div>
</section>`;
}

function contactScreen(c, T) {
  const k = c.contact;
  const shown = `${k.email.user} [@] ${k.email.domain}`;
  return `<section id="contact" class="screen screen--contact" data-screen="contact" aria-labelledby="contact-h">
  <p class="challenger game-only" aria-hidden="true"><span>${esc(T(k.banner))}</span></p>
  <div class="contact-layout">
    <div class="contact-card">
      <h2 id="contact-h" class="screen-heading" tabindex="-1">${esc(k.heading)}</h2>
      <p class="lede">${esc(T(k.text))}</p>
      <p class="contact-mail"><a class="mail" href="#contact" data-mail data-u="${esc(k.email.user)}" data-d="${esc(k.email.domain)}">${esc(shown)}</a></p>
      <div class="contact-actions">
        <a class="btn" href="#contact" data-mail-btn data-u="${esc(k.email.user)}" data-d="${esc(k.email.domain)}">${esc(k.emailLabel)}</a>
        <button class="btn btn--ghost js-only" type="button" data-copy data-u="${esc(k.email.user)}" data-d="${esc(k.email.domain)}">${esc(T(k.copy))}</button>
        <a class="btn btn--ghost" href="${esc(k.linkedin)}" rel="noopener me">LinkedIn ${icon('ext')}</a>
        <a class="btn btn--ghost" href="${esc(k.github)}" rel="noopener me">GitHub ${icon('ext')}</a>
      </div>
    </div>
    <div class="contact-p2 game-only" aria-hidden="true">
      <div class="p2-slot">${bossSVG('mystery')}</div>
      <p class="continue"><span>${esc(T(k.continue))}</span> <b data-continue>9</b></p>
      <p class="game-over" data-game-over hidden>${esc(T(k.gameOver))}</p>
    </div>
  </div>
</section>`;
}

function overlays(c, T) {
  const u = c.ui;
  const f = c.fight;
  const help = u.helpItems.map(([k, v]) => `<div><dt><kbd>${esc(k)}</kbd></dt><dd>${esc(T(v))}</dd></div>`).join('');
  const bossStore = [...new Set(c.stages.map((s) => s.boss.sprite))]
    .map((id) => `<div data-art="${id}">${bossSVG(id)}</div>`)
    .join('');
  const i18n = {
    screens: u.screens,
    on: u.on,
    off: u.off,
    toastSoundOn: u.toastSoundOn,
    toastSoundOff: u.toastSoundOff,
    toastReading: u.toastReading,
    toastArcade: u.toastArcade,
    announceScreen: u.announceScreen,
    fight: {
      round: f.round,
      fight: T(f.fight),
      ko: f.ko,
      perfect: f.perfect,
      hits: f.hits,
      hit: f.hit,
      special: T(f.special),
      super: T(f.super),
      commentaryIdle: T(f.commentaryIdle),
    },
    select: {
      lockedToast: T(c.select.lockedToast),
      unlockedToast: T(c.select.unlockedToast),
      locked: c.select.locked,
    },
    moves: { allFound: T(c.moves.allFound) },
    contact: { copied: T(c.contact.copied), copyFail: T(c.contact.copyFail) },
    konami: T(c.konami),
    bang: c.lang === 'fr' ? '\u202F!' : '!',
    padConnected: c.ui.padConnected,
    moveNames: Object.fromEntries(
      [...c.moves.groups.flatMap((g) => g.moves), c.moves.super].map((m) => [m.id, T(m.name)])
    ),
  };
  return `<div class="vs" data-vs hidden aria-hidden="true">
  <div class="vs-side vs-side--p1"><div class="vs-art p1-costume">${p1SVG()}</div><p class="vs-name">MRGMF</p></div>
  <div class="vs-side vs-side--p2"><div class="vs-art" data-vs-art></div><p class="vs-name" data-vs-name></p></div>
  <p class="vs-mark">${esc(f.vs)}</p>
  <p class="vs-round" data-vs-round></p>
</div>
<p class="banner" data-banner aria-hidden="true"></p>
<div class="toasts" data-toasts aria-hidden="true"></div>
<p class="sr-only" data-announcer role="status" aria-live="polite"></p>
<div class="input-display game-only" data-input-display aria-hidden="true"></div>
<dialog class="help-dialog" data-help-dialog aria-labelledby="help-h">
  <h2 id="help-h">${esc(u.help)}</h2>
  <dl class="help-list">${help}</dl>
  <p class="help-note">${esc(T(u.helpNote))}</p>
  <form method="dialog"><button class="btn" type="submit">${esc(u.close)}</button></form>
</dialog>
<div class="crt game-only" aria-hidden="true"></div>
<div class="boss-store" hidden aria-hidden="true">${bossStore}</div>
<script type="application/json" id="i18n">${JSON.stringify(i18n).replace(/</g, '\\u003c')}</script>`;
}

// --- Pages -------------------------------------------------------------------
export function renderPage(c, all) {
  const base = c.dir ? '../' : '';
  const T = (s) => typo(c.lang, s);
  const canonical = SITE + c.dir;
  const alternates = [
    ...all.map((x) => ({ lang: x.lang, href: SITE + x.dir })),
    { lang: 'x-default', href: SITE },
  ];
  const stages = c.stages.map((s, i) => stageScreen(c, s, i, T)).join('\n');
  return `<!doctype html>
<html lang="${c.lang}" class="no-js" data-mode="reading">
${head(c, base, { title: c.meta.title, description: T(c.meta.description), canonical, alternates })}
<body>
${spriteSheet()}
<a class="skip-link" href="#main">${esc(c.ui.skip)}</a>
${hud(c, base)}
<main id="main" tabindex="-1">
${titleScreen(c, T)}
${selectScreen(c, T)}
<div class="stages" id="stages">
${stages}
</div>
${movesScreen(c, T)}
${profileScreen(c, T)}
${contactScreen(c, T)}
</main>
<footer class="site-footer">
  <p>© ${YEAR} Fodié Marega · ${esc(T(c.ui.footer))} · <a href="https://github.com/MrgMF/MRGMF.github.io" rel="noopener">${esc(c.ui.source)}</a></p>
</footer>
${overlays(c, T)}
<script type="module" src="${base}assets/js/main.js"></script>
</body>
</html>
`;
}

export function render404(fr, en) {
  const T = (s) => typo('fr', s);
  return `<!doctype html>
<html lang="fr" class="no-js" data-mode="reading">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fr.meta.notFoundTitle)}</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#07070f">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body class="page-404">
<main class="gameover">
  <div class="gameover-art" aria-hidden="true">${standaloneBoss('paper').replace('<svg ', '<svg class="px" aria-hidden="true" focusable="false" ')}</div>
  <h1>${esc(fr.notFound.heading)}</h1>
  <p>${esc(T(fr.notFound.text))}</p>
  <p lang="en" class="gameover-en">${esc(en.notFound.text)}</p>
  <p class="continue" aria-hidden="true"><span>${esc(T(fr.notFound.continue))}</span> <b data-count>9</b></p>
  <p class="gameover-actions"><a class="btn" href="/">${esc(T(fr.notFound.cta))}</a> <a class="btn btn--ghost" href="/en/" lang="en">${esc(en.notFound.cta)}</a></p>
</main>
<script>
(function(){var b=document.querySelector('[data-count]');var n=9;if(matchMedia('(prefers-reduced-motion: reduce)').matches){b.textContent='0';return}var t=setInterval(function(){n--;b.textContent=n;if(n<=0)clearInterval(t)},1000)})();
</script>
</body>
</html>
`;
}
