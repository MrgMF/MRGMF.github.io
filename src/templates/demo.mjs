// Gabarit commun des démos (une page par projet et par langue).
// Même politique de sécurité que le site : aucun script ni style inline,
// aucune ressource externe, aucune requête réseau (connect-src 'none').

import { SITE, csp, esc, typo, icon } from './page.mjs';

export function demoURL(id, lang) {
  return `${SITE}${lang === 'en' ? 'en/' : ''}demos/${id}/`;
}

export function renderDemo(demo, lang) {
  const t = demo[lang];
  const T = (s) => typo(lang, s);
  const base = lang === 'en' ? '../../../' : '../../';
  const other = lang === 'en' ? 'fr' : 'en';
  const otherHref = lang === 'en' ? `../../../demos/${demo.id}/` : `../../en/demos/${demo.id}/`;
  const ui = UI[lang];
  const helpers = { T, esc, icon };
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp()}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t.title)} · ${esc(ui.demo)} · MRGMF</title>
<meta name="description" content="${esc(T(t.description))}">
<link rel="canonical" href="${demoURL(demo.id, lang)}">
<link rel="alternate" hreflang="fr" href="${demoURL(demo.id, 'fr')}">
<link rel="alternate" hreflang="en" href="${demoURL(demo.id, 'en')}">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#07070f">
<meta name="author" content="Fodié Marega">
<link rel="icon" href="${base}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${base}assets/fonts/chakra-petch-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/css/demo.css">
</head>
<body class="demo-page demo-page--${demo.id}">
<a class="skip-link" href="#main">${esc(ui.skip)}</a>
<header class="demo-bar">
  <a class="demo-back" href="../../#vs-${demo.stage}">${icon('left')} ${esc(ui.back)}</a>
  <p class="demo-brand"><span class="demo-p1" aria-hidden="true">P1</span> MRGMF · ${esc(ui.demo)}</p>
  <a class="demo-lang" href="${otherHref}" hreflang="${other}" lang="${other}">${other.toUpperCase()}</a>
</header>
<main class="demo" id="main" tabindex="-1">
  <header class="demo-head">
    <p class="demo-kicker">${esc(T(t.kicker))}</p>
    <h1>${esc(T(t.title))}</h1>
    <p class="demo-intro">${esc(T(t.intro))}</p>
    <p class="demo-note">${icon('shield')} ${esc(T(t.note))}</p>
  </header>
  <p class="demo-nojs" data-nojs>${esc(T(ui.nojs))}</p>
${demo.body(t, helpers)}
</main>
<footer class="demo-foot">
  <p>© 2026 Fodié Marega · <a href="../../#vs-${demo.stage}">${esc(ui.back)}</a> · <a href="https://github.com/MrgMF/MRGMF.github.io/tree/main/assets/js/demos" rel="noopener">${esc(ui.source)}</a></p>
</footer>
<script type="application/json" id="demo-i18n">${JSON.stringify(deepTypo(lang, t.js || {})).replace(/</g, '\\u003c')}</script>
<script type="module" src="${base}assets/js/demos/${demo.id}.js"></script>
</body>
</html>
`;
}

// Typographie française appliquée aussi aux textes utilisés par le script.
function deepTypo(lang, v) {
  if (typeof v === 'string') return typo(lang, v);
  if (Array.isArray(v)) return v.map((x) => deepTypo(lang, x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepTypo(lang, x)]));
  return v;
}

const UI = {
  fr: {
    skip: 'Aller au contenu',
    back: 'Retour au portfolio',
    demo: 'Démo',
    source: 'Code de la démo',
    nojs: 'Cette démo a besoin de JavaScript pour fonctionner. Le reste du portfolio reste lisible sans.',
  },
  en: {
    skip: 'Skip to content',
    back: 'Back to the portfolio',
    demo: 'Demo',
    source: 'Demo source code',
    nojs: 'This demo needs JavaScript to run. The rest of the portfolio stays readable without it.',
  },
};
