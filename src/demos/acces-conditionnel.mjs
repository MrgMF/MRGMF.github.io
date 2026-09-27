// Démo : simulateur d'accès conditionnel (mission End User Architect).

const POLICIES = ['CA001', 'CA002', 'CA003', 'CA004', 'CA005', 'CA006'];
// État et anneau de déploiement par défaut : CA005 est en pilote (rapport seul,
// anneau 0), CA006 en cours de déploiement (anneau 1).
const DEFAULTS = {
  CA001: ['on', '2'],
  CA002: ['on', '2'],
  CA003: ['on', '2'],
  CA004: ['on', '2'],
  CA005: ['report', '0'],
  CA006: ['on', '1'],
};

function body(t, { esc, T }) {
  const field = (id, f, value) => `<div class="field">
        <label for="ca-${id}">${esc(T(f.label))}</label>
        <select id="ca-${id}" data-ctx="${id}">${f.options
          .map(([v, l]) => `<option value="${v}"${v === value ? ' selected' : ''}>${esc(T(l))}</option>`)
          .join('')}</select>
      </div>`;
  const seg = (name, label, options, value) => `<div class="seg" role="group" aria-label="${esc(T(label))}" data-seg="${name}">${options
    .map(([v, l]) => `<button type="button" data-value="${v}" aria-pressed="${v === value}">${esc(T(l))}</button>`)
    .join('')}</div>`;
  const policies = t.policies
    .map((p) => {
      const [state, ring] = DEFAULTS[p.id];
      return `<li class="policy" data-policy="${p.id}">
          <div class="policy-head"><h3 class="policy-name"><code>${p.id}</code> ${esc(T(p.name))}</h3></div>
          <p class="policy-desc">${esc(T(p.desc))}</p>
          <div class="policy-ctrl">
            ${seg('state', `${p.id} · ${t.stateLabel}`, t.stateOptions, state)}
            <span>${esc(T(t.ringLabel))}</span>
            ${seg('ring', `${p.id} · ${t.ringLabel}`, [['0', '0'], ['1', '1'], ['2', '2']], ring)}
          </div>
        </li>`;
    })
    .join('\n        ');
  return `  <div class="grid grid--side">
    <div class="grid">
      <section class="card" aria-labelledby="ctx-h">
        <h2 id="ctx-h">${esc(T(t.ctxTitle))}</h2>
        ${field('user', t.fields.user, 'guest')}
        ${field('ring', t.fields.ring, '2')}
        ${field('app', t.fields.app, 'teams')}
        ${field('device', t.fields.device, 'unmanaged')}
        ${field('location', t.fields.location, 'internet')}
        ${field('risk', t.fields.risk, 'low')}
      </section>
      <section class="card" aria-labelledby="dec-h">
        <h2 id="dec-h">${esc(T(t.decisionTitle))}</h2>
        <div class="verdict" data-verdict aria-live="polite"><span class="verdict-label">${esc(T(t.accessLabel))}</span><span class="verdict-value" data-verdict-value></span><span class="hint" data-verdict-why></span></div>
        <p class="actions"><button class="btn" type="button" data-signin>${esc(T(t.signIn))}</button> <button class="btn btn--ghost" type="button" data-mfa hidden>${esc(T(t.mfa))}</button></p>
        <h3>${esc(T(t.traceTitle))}</h3>
        <ol class="trace" data-trace></ol>
      </section>
    </div>
    <div class="grid">
      <section class="card" aria-labelledby="pol-h">
        <h2 id="pol-h">${esc(T(t.policiesTitle))}</h2>
        <p class="hint">${esc(T(t.policiesHint))}</p>
        <ul class="policies">
        ${policies}
        </ul>
      </section>
      <section class="card" aria-labelledby="log-h">
        <h2 id="log-h">${esc(T(t.logTitle))}</h2>
        <p class="hint">${esc(T(t.logHint))}</p>
        <pre class="log" data-log tabindex="0">${esc(T(t.logEmpty))}</pre>
      </section>
    </div>
  </div>`;
}

export default {
  id: 'acces-conditionnel',
  stage: 'lv',
  body,
  fr: {
    title: 'Simulateur d’accès conditionnel',
    kicker: 'Démo · End User Architect · Microsoft Entra ID',
    description:
      'Simulateur interactif de stratégies d’accès conditionnel : MFA, lieux, appareils conformes, risque de connexion, mode rapport seul et déploiement par anneaux.',
    intro:
      'Choisis un contexte de connexion, active ou passe en rapport seul des stratégies génériques, et regarde comment l’accès se décide : accordé, MFA exigée ou bloqué. Le même raisonnement que dans Microsoft Entra ID, à petite échelle.',
    note: 'Stratégies génériques, sans lien avec un vrai tenant : rien ne quitte ton navigateur.',
    ctxTitle: 'Contexte de connexion',
    fields: {
      user: { label: 'Utilisateur', options: [['member', 'Collaborateur (membre)'], ['guest', 'Invité externe (B2B)'], ['admin', 'Administrateur']] },
      ring: { label: 'Anneau de l’utilisateur', options: [['0', 'Anneau 0 · équipe IT'], ['1', 'Anneau 1 · pilotes'], ['2', 'Anneau 2 · tout le monde']] },
      app: { label: 'Application', options: [['teams', 'Microsoft Teams'], ['sharepoint', 'SharePoint Online'], ['exchange', 'Exchange Online'], ['admin', 'Portail d’administration']] },
      device: { label: 'Appareil', options: [['compliant', 'Conforme (géré par Intune)'], ['unmanaged', 'Personnel, non géré']] },
      location: { label: 'Lieu', options: [['trusted', 'Réseau de l’entreprise'], ['internet', 'Internet'], ['blocked', 'Pays hors périmètre']] },
      risk: { label: 'Risque de connexion', options: [['low', 'Faible'], ['medium', 'Moyen'], ['high', 'Élevé']] },
    },
    policiesTitle: 'Stratégies',
    policiesHint:
      'Mode rapport seul : la stratégie est évaluée et journalisée sans rien bloquer. Anneau : jusqu’où la stratégie est déployée (0 = équipe IT, 2 = tout le monde).',
    stateLabel: 'État',
    stateOptions: [['on', 'Activée'], ['report', 'Rapport seul'], ['off', 'Désactivée']],
    ringLabel: 'Anneau',
    policies: [
      { id: 'CA001', name: 'MFA pour les invités', desc: 'Invités externes · toutes les applications : exiger la MFA.' },
      { id: 'CA002', name: 'MFA pour les administrateurs', desc: 'Rôles d’administration · toutes les applications : exiger la MFA.' },
      { id: 'CA003', name: 'Portails d’administration', desc: 'Tous les utilisateurs · portails d’administration : MFA et appareil conforme.' },
      { id: 'CA004', name: 'Pays hors périmètre', desc: 'Tous les utilisateurs · lieux hors périmètre : bloquer.' },
      { id: 'CA005', name: 'Messagerie sur appareil conforme', desc: 'Membres · Exchange Online : appareil conforme exigé. En pilote.' },
      { id: 'CA006', name: 'Connexion à risque', desc: 'Tous les utilisateurs · risque moyen ou élevé : exiger la MFA. En cours de déploiement.' },
    ],
    decisionTitle: 'Décision',
    accessLabel: 'Accès',
    signIn: 'Tenter la connexion',
    mfa: 'Répondre à la MFA',
    traceTitle: 'Évaluation des stratégies',
    logTitle: 'Journal des connexions',
    logHint: 'Format simplifié, inspiré des journaux de connexion Microsoft Entra.',
    logEmpty: 'Aucune connexion pour l’instant : clique sur « Tenter la connexion ».',
    js: {
      verdicts: {
        grant: 'Accordé',
        grantMfa: 'Accordé après MFA',
        mfa: 'MFA exigée',
        block: 'Bloqué',
        blockDevice: 'Bloqué',
      },
      why: {
        grant: 'Aucune stratégie active n’exige de contrôle supplémentaire.',
        grantMfa: 'La MFA a été satisfaite, toutes les conditions sont remplies.',
        mfa: 'Une stratégie active exige un second facteur.',
        block: 'Une stratégie active bloque cette connexion.',
        blockDevice: 'Une stratégie active exige un appareil conforme.',
      },
      kinds: {
        off: 'Désactivée',
        ring: 'Hors anneau',
        skip: 'Non concernée',
        report: 'Rapport seul',
        block: 'Bloque',
        device: 'Appareil non conforme',
        mfa: 'MFA exigée',
        ok: 'Satisfaite',
      },
      ringWhy: 'Déployée jusqu’à l’anneau {ring}, l’utilisateur est dans l’anneau {user}.',
      offWhy: 'La stratégie n’est pas évaluée.',
      okWhy: 'Conditions remplies : {what}.',
      blockWhy: 'La stratégie bloque l’accès depuis ce contexte.',
      enforcedWhy: 'Stratégie appliquée, contrôle manquant : {what}.',
      needs: { mfa: 'MFA', device: 'appareil conforme', block: 'blocage' },
      reportWould: 'Aurait exigé : {what}. Rien n’est bloqué en rapport seul.',
      reportPass: 'Aurait laissé passer. Rien n’est appliqué en rapport seul.',
      skip: {
        CA001: 'L’utilisateur n’est pas un invité.',
        CA002: 'L’utilisateur n’a pas de rôle d’administration.',
        CA003: 'L’application n’est pas un portail d’administration.',
        CA004: 'Le lieu est dans le périmètre autorisé.',
        CA005: 'Ne vise que les membres sur Exchange Online.',
        CA006: 'Le risque de connexion est faible.',
      },
      mfaDone: 'MFA validée : la décision est réévaluée.',
      logged: 'Connexion ajoutée au journal.',
      apps: { teams: 'Microsoft Teams', sharepoint: 'SharePoint Online', exchange: 'Exchange Online', admin: 'Admin portal' },
    },
  },
  en: {
    title: 'Conditional Access simulator',
    kicker: 'Demo · End User Architect · Microsoft Entra ID',
    description:
      'Interactive Conditional Access policy simulator: MFA, locations, compliant devices, sign-in risk, report-only mode and ring deployment.',
    intro:
      'Pick a sign-in context, switch generic policies on or to report-only, and watch how access gets decided: granted, MFA required or blocked. The same reasoning as Microsoft Entra ID, on a small scale.',
    note: 'Generic policies, not connected to any real tenant: nothing leaves your browser.',
    ctxTitle: 'Sign-in context',
    fields: {
      user: { label: 'User', options: [['member', 'Employee (member)'], ['guest', 'External guest (B2B)'], ['admin', 'Administrator']] },
      ring: { label: 'User’s ring', options: [['0', 'Ring 0 · IT team'], ['1', 'Ring 1 · pilots'], ['2', 'Ring 2 · everyone']] },
      app: { label: 'Application', options: [['teams', 'Microsoft Teams'], ['sharepoint', 'SharePoint Online'], ['exchange', 'Exchange Online'], ['admin', 'Admin portal']] },
      device: { label: 'Device', options: [['compliant', 'Compliant (Intune managed)'], ['unmanaged', 'Personal, unmanaged']] },
      location: { label: 'Location', options: [['trusted', 'Corporate network'], ['internet', 'Internet'], ['blocked', 'Out-of-scope country']] },
      risk: { label: 'Sign-in risk', options: [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']] },
    },
    policiesTitle: 'Policies',
    policiesHint:
      'Report-only: the policy is evaluated and logged without blocking anything. Ring: how far the policy is rolled out (0 = IT team, 2 = everyone).',
    stateLabel: 'State',
    stateOptions: [['on', 'On'], ['report', 'Report-only'], ['off', 'Off']],
    ringLabel: 'Ring',
    policies: [
      { id: 'CA001', name: 'MFA for guests', desc: 'External guests · all apps: require MFA.' },
      { id: 'CA002', name: 'MFA for administrators', desc: 'Admin roles · all apps: require MFA.' },
      { id: 'CA003', name: 'Admin portals', desc: 'All users · admin portals: MFA and compliant device.' },
      { id: 'CA004', name: 'Out-of-scope countries', desc: 'All users · out-of-scope locations: block.' },
      { id: 'CA005', name: 'Mail on compliant devices', desc: 'Members · Exchange Online: compliant device required. Piloting.' },
      { id: 'CA006', name: 'Risky sign-ins', desc: 'All users · medium or high risk: require MFA. Rolling out.' },
    ],
    decisionTitle: 'Decision',
    accessLabel: 'Access',
    signIn: 'Try to sign in',
    mfa: 'Answer the MFA prompt',
    traceTitle: 'Policy evaluation',
    logTitle: 'Sign-in log',
    logHint: 'Simplified format, inspired by Microsoft Entra sign-in logs.',
    logEmpty: 'No sign-in yet: click “Try to sign in”.',
    js: {
      verdicts: {
        grant: 'Granted',
        grantMfa: 'Granted after MFA',
        mfa: 'MFA required',
        block: 'Blocked',
        blockDevice: 'Blocked',
      },
      why: {
        grant: 'No active policy requires an extra control.',
        grantMfa: 'MFA was satisfied, every condition is met.',
        mfa: 'An active policy requires a second factor.',
        block: 'An active policy blocks this sign-in.',
        blockDevice: 'An active policy requires a compliant device.',
      },
      kinds: {
        off: 'Off',
        ring: 'Out of ring',
        skip: 'Not applied',
        report: 'Report-only',
        block: 'Blocks',
        device: 'Device not compliant',
        mfa: 'MFA required',
        ok: 'Satisfied',
      },
      ringWhy: 'Rolled out up to ring {ring}, the user is in ring {user}.',
      offWhy: 'The policy is not evaluated.',
      okWhy: 'Conditions met: {what}.',
      blockWhy: 'The policy blocks access from this context.',
      enforcedWhy: 'Policy enforced, missing control: {what}.',
      needs: { mfa: 'MFA', device: 'compliant device', block: 'block' },
      reportWould: 'Would have required: {what}. Nothing is blocked in report-only.',
      reportPass: 'Would have let it through. Nothing is enforced in report-only.',
      skip: {
        CA001: 'The user is not a guest.',
        CA002: 'The user has no admin role.',
        CA003: 'The app is not an admin portal.',
        CA004: 'The location is in scope.',
        CA005: 'Only targets members on Exchange Online.',
        CA006: 'Sign-in risk is low.',
      },
      mfaDone: 'MFA approved: the decision is re-evaluated.',
      logged: 'Sign-in added to the log.',
      apps: { teams: 'Microsoft Teams', sharepoint: 'SharePoint Online', exchange: 'Exchange Online', admin: 'Admin portal' },
    },
  },
};

export { POLICIES };
