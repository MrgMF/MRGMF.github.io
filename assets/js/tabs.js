// Onglets d'un combat (Brief · Points forts · Résultat).
// Actifs en mode jeu seulement : en mode lecture, les panneaux s'affichent
// tous, les uns sous les autres, avec leurs titres.

export function createTabs(scope) {
  const list = scope.querySelector('[role="tablist"]');
  if (!list) return null;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const headings = panels.map((p) => p.getAttribute('aria-labelledby'));
  let index = 0;
  let enabled = false;

  function render() {
    tabs.forEach((t, i) => {
      const on = i === index;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, i) => {
      if (enabled) {
        p.setAttribute('role', 'tabpanel');
        p.setAttribute('aria-labelledby', tabs[i].id);
        p.tabIndex = 0;
        p.hidden = i !== index;
      } else {
        p.removeAttribute('role');
        p.setAttribute('aria-labelledby', headings[i]);
        p.removeAttribute('tabindex');
        p.hidden = false;
      }
    });
  }

  function select(which, { focus = false } = {}) {
    const i = typeof which === 'number' ? which : tabs.findIndex((t) => t.dataset.tab === which);
    if (i < 0) return;
    index = i;
    render();
    if (focus) tabs[i].focus();
  }

  list.addEventListener('click', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (t) select(tabs.indexOf(t));
  });

  // Flèches, Début, Fin (motif WAI-ARIA). On arrête la propagation pour que
  // ces flèches ne comptent pas comme des directions de manipulation.
  list.addEventListener('keydown', (e) => {
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    const k = moves[e.key];
    if (k === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    const n = tabs.length;
    const i = k === 'first' ? 0 : k === 'last' ? n - 1 : (index + k + n) % n;
    select(i, { focus: true });
  });

  return {
    select,
    setEnabled(on) {
      enabled = on;
      render();
    },
    get current() {
      return tabs[index].dataset.tab;
    },
  };
}
