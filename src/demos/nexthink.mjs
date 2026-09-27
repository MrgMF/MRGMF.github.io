// Démo : console DEX façon Nexthink, sur un parc entièrement fictif.

function body(t, { esc, T, icon }) {
  const kpi = (key, label) => `<div class="kpi"><dt>${esc(T(label))}</dt><dd data-kpi="${key}">…</dd></div>`;
  return `  <dl class="kpis" aria-label="${esc(T(t.kpisLabel))}">
    ${kpi('dex', t.kpis.dex)}
    ${kpi('devices', t.kpis.devices)}
    ${kpi('noncompliant', t.kpis.noncompliant)}
    ${kpi('alerts', t.kpis.alerts)}
  </dl>
  <div class="grid grid--side">
    <div class="grid">
      <section class="card" aria-labelledby="nql-h">
        <h2 id="nql-h">${esc(T(t.queryTitle))}</h2>
        <form class="query" data-query-form novalidate>
          <label class="sr-only" for="nql">${esc(T(t.queryLabel))}</label>
          <textarea id="nql" spellcheck="false" autocomplete="off" data-nql>devices | where disk_free_gb &lt; 10</textarea>
          <button class="btn" type="submit">${icon('play')} ${esc(T(t.run))}</button>
        </form>
        <p class="hint">${esc(T(t.queryHint))}</p>
        <div class="presets" role="group" aria-label="${esc(T(t.presetsLabel))}">
          ${t.presets.map(([q, l]) => `<button type="button" data-preset="${esc(q)}">${esc(T(l))}</button>`).join('\n          ')}
        </div>
        <p class="status" data-query-status role="status"></p>
      </section>
      <section class="card" aria-labelledby="alerts-h">
        <h2 id="alerts-h">${esc(T(t.alertsTitle))}</h2>
        <ul class="alerts" data-alerts></ul>
      </section>
    </div>
    <div class="grid">
      <section class="card" aria-labelledby="res-h">
        <h2 id="res-h">${esc(T(t.resultsTitle))}</h2>
        <div class="table-wrap results-table" tabindex="0" role="region" aria-label="${esc(T(t.tableLabel))}">
          <table>
            <thead><tr>${t.columns.map(([k, l, num]) => `<th scope="col"${num ? ' class="num"' : ''}>${esc(T(l))}</th>`).join('')}</tr></thead>
            <tbody data-rows></tbody>
          </table>
        </div>
        <div class="results-bar">
          <p class="hint" data-count></p>
          <div class="actions">
            <label class="sr-only" for="ra">${esc(T(t.remoteLabel))}</label>
            <select id="ra" data-remote>${t.remoteActions.map(([v, l]) => `<option value="${v}">${esc(T(l))}</option>`).join('')}</select>
            <button class="btn btn--small" type="button" data-run-remote>${esc(T(t.runRemote))}</button>
            <button class="btn btn--small btn--ghost" type="button" data-campaign>${esc(T(t.campaign))}</button>
          </div>
        </div>
      </section>
      <section class="card" aria-labelledby="log-h">
        <h2 id="log-h">${esc(T(t.logTitle))}</h2>
        <pre class="log" data-log tabindex="0" aria-live="polite"></pre>
      </section>
    </div>
  </div>`;
}

const presetsFr = [
  ['devices | where disk_free_gb < 10', 'Disque presque plein'],
  ['devices | where os_build != "24H2"', 'Windows pas à jour'],
  ['devices | where crashes_7d > 2 | sort crashes_7d desc', 'Plantages répétés'],
  ['devices | where encrypted == false', 'Postes non chiffrés'],
  ['devices | where compliant == false', 'Non conformes'],
  ['devices | sort dex_score asc | limit 10', '10 pires scores DEX'],
];
const presetsEn = [
  ['devices | where disk_free_gb < 10', 'Disk almost full'],
  ['devices | where os_build != "24H2"', 'Windows out of date'],
  ['devices | where crashes_7d > 2 | sort crashes_7d desc', 'Repeated crashes'],
  ['devices | where encrypted == false', 'Unencrypted devices'],
  ['devices | where compliant == false', 'Non-compliant'],
  ['devices | sort dex_score asc | limit 10', '10 worst DEX scores'],
];

export default {
  id: 'nexthink',
  stage: 'nexthink',
  body,
  fr: {
    title: 'Console DEX',
    kicker: 'Démo · Expérience numérique · données fictives',
    description:
      'Mini-console DEX façon Nexthink sur un parc fictif : requêtes NQL simplifiées, alertes, Remote Actions, campagne et score d’expérience numérique.',
    intro:
      'Une mini-console inspirée de Nexthink : interroge un parc fictif avec des requêtes NQL simplifiées, repère les postes qui dérivent, corrige-les à distance et regarde le score DEX remonter.',
    note: 'Parc, postes et scores entièrement fictifs, générés dans ton navigateur. Démo indépendante, non affiliée à Nexthink.',
    kpisLabel: 'Indicateurs du parc',
    kpis: { dex: 'Score DEX moyen', devices: 'Postes', noncompliant: 'Non conformes', alerts: 'Alertes actives' },
    queryTitle: 'Requête NQL',
    queryLabel: 'Requête',
    run: 'Exécuter',
    queryHint:
      'Syntaxe : devices | where champ opérateur valeur [and …] | sort champ asc|desc | limit n. Champs : name, os_build, disk_free_gb, crashes_7d, encrypted, compliant, dex_score.',
    presetsLabel: 'Requêtes prêtes',
    presets: presetsFr,
    alertsTitle: 'Alertes',
    resultsTitle: 'Résultats',
    tableLabel: 'Tableau des postes (défilable)',
    columns: [
      ['name', 'Poste'],
      ['os_build', 'Windows'],
      ['disk_free_gb', 'Disque libre', true],
      ['crashes_7d', 'Plantages 7 j', true],
      ['encrypted', 'Chiffré'],
      ['dex_score', 'Score DEX', true],
    ],
    remoteLabel: 'Remote Action',
    remoteActions: [
      ['cleanup', 'Remote Action : nettoyer le disque'],
      ['update', 'Remote Action : mettre à jour Windows'],
      ['repair', 'Remote Action : réparer l’application'],
      ['encrypt', 'Remote Action : activer le chiffrement'],
    ],
    runRemote: 'Lancer',
    campaign: 'Campagne',
    logTitle: 'Journal',
    js: {
      yes: 'oui',
      no: 'non',
      gb: '{n} Go',
      count: '{n} poste(s) correspondent à la requête.',
      none: 'Aucun poste ne correspond : le parc est propre sur ce critère.',
      ran: 'Requête exécutée : {n} résultat(s) en {ms} ms.',
      errors: {
        start: 'Une requête commence par « devices ».',
        stage: 'Étape inconnue : « {x} ». Utilise where, sort ou limit.',
        field: 'Champ inconnu : « {x} ».',
        op: 'Opérateur inconnu : « {x} ». Utilise ==, !=, <, <=, > ou >=.',
        value: 'Valeur invalide : « {x} ».',
        cond: 'Condition incomplète : champ opérateur valeur.',
        limit: 'La limite doit être un nombre entier positif.',
      },
      remoteNames: {
        cleanup: 'Nettoyer le disque',
        update: 'Mettre à jour Windows',
        repair: 'Réparer l’application',
        encrypt: 'Activer le chiffrement',
      },
      remoteEmpty: 'Aucun poste dans les résultats : lance d’abord une requête.',
      remoteStart: 'Remote Action « {name} » envoyée à {n} poste(s)…',
      remoteDone: 'Remote Action « {name} » : {ok} succès, {skip} déjà conformes.',
      campaignStart: 'Campagne envoyée à {n} utilisateur(s) concerné(s)…',
      campaignDone: 'Campagne : {r} réponse(s) sur {n}, satisfaction moyenne {s}/5.',
      alerts: {
        disk: '{n} poste(s) avec moins de 10 Go libres',
        os: '{n} poste(s) sans la dernière version de Windows',
        crash: '{n} poste(s) avec des plantages répétés',
        encrypt: '{n} poste(s) non chiffré(s)',
        clear: 'Aucune alerte : tout est sous contrôle.',
      },
      investigate: 'Investiguer',
    },
  },
  en: {
    title: 'DEX console',
    kicker: 'Demo · Digital experience · fictitious data',
    description:
      'A Nexthink-style DEX mini-console on a fictitious fleet: simplified NQL queries, alerts, Remote Actions, campaign and digital experience score.',
    intro:
      'A mini-console inspired by Nexthink: query a fictitious fleet with simplified NQL, spot the devices that drift, fix them remotely and watch the DEX score climb back.',
    note: 'Fleet, devices and scores are entirely fictitious, generated in your browser. Independent demo, not affiliated with Nexthink.',
    kpisLabel: 'Fleet indicators',
    kpis: { dex: 'Average DEX score', devices: 'Devices', noncompliant: 'Non-compliant', alerts: 'Active alerts' },
    queryTitle: 'NQL query',
    queryLabel: 'Query',
    run: 'Run',
    queryHint:
      'Syntax: devices | where field operator value [and …] | sort field asc|desc | limit n. Fields: name, os_build, disk_free_gb, crashes_7d, encrypted, compliant, dex_score.',
    presetsLabel: 'Ready-made queries',
    presets: presetsEn,
    alertsTitle: 'Alerts',
    resultsTitle: 'Results',
    tableLabel: 'Device table (scrollable)',
    columns: [
      ['name', 'Device'],
      ['os_build', 'Windows'],
      ['disk_free_gb', 'Free disk', true],
      ['crashes_7d', 'Crashes 7d', true],
      ['encrypted', 'Encrypted'],
      ['dex_score', 'DEX score', true],
    ],
    remoteLabel: 'Remote Action',
    remoteActions: [
      ['cleanup', 'Remote Action: clean up the disk'],
      ['update', 'Remote Action: update Windows'],
      ['repair', 'Remote Action: repair the app'],
      ['encrypt', 'Remote Action: turn on encryption'],
    ],
    runRemote: 'Run',
    campaign: 'Campaign',
    logTitle: 'Log',
    js: {
      yes: 'yes',
      no: 'no',
      gb: '{n} GB',
      count: '{n} device(s) match the query.',
      none: 'No device matches: the fleet is clean on this criterion.',
      ran: 'Query run: {n} result(s) in {ms} ms.',
      errors: {
        start: 'A query starts with “devices”.',
        stage: 'Unknown step: “{x}”. Use where, sort or limit.',
        field: 'Unknown field: “{x}”.',
        op: 'Unknown operator: “{x}”. Use ==, !=, <, <=, > or >=.',
        value: 'Invalid value: “{x}”.',
        cond: 'Incomplete condition: field operator value.',
        limit: 'The limit must be a positive whole number.',
      },
      remoteNames: {
        cleanup: 'Clean up the disk',
        update: 'Update Windows',
        repair: 'Repair the app',
        encrypt: 'Turn on encryption',
      },
      remoteEmpty: 'No device in the results: run a query first.',
      remoteStart: 'Remote Action “{name}” sent to {n} device(s)…',
      remoteDone: 'Remote Action “{name}”: {ok} succeeded, {skip} already compliant.',
      campaignStart: 'Campaign sent to {n} affected user(s)…',
      campaignDone: 'Campaign: {r} answer(s) out of {n}, average satisfaction {s}/5.',
      alerts: {
        disk: '{n} device(s) with less than 10 GB free',
        os: '{n} device(s) without the latest Windows version',
        crash: '{n} device(s) with repeated crashes',
        encrypt: '{n} unencrypted device(s)',
        clear: 'No alert: everything is under control.',
      },
      investigate: 'Investigate',
    },
  },
};
