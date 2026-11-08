// Démo : Ticket Rush, le support IT de N1 à N3 en mini-jeu.

function body(t, { esc, T }) {
  return `  <section class="rush" aria-labelledby="rush-h">
    <h2 id="rush-h" class="sr-only">${esc(T(t.gameTitle))}</h2>
    <div class="rush-hud">
      <span class="level-badge" data-level>N1</span>
      <dl>
        <div><dt>${esc(T(t.hud.score))}</dt><dd data-score>0</dd></div>
        <div><dt>${esc(T(t.hud.time))}</dt><dd data-time>90</dd></div>
        <div><dt>${esc(T(t.hud.resolved))}</dt><dd data-resolved>0</dd></div>
      </dl>
      <p class="hydra-meter"><span>${esc(T(t.hud.queue))}</span><span class="meter" aria-hidden="true"><i data-hydra></i></span><span data-queue-count>0/8</span></p>
    </div>
    <p class="actions"><button class="btn" type="button" data-start>${esc(T(t.start))}</button></p>
    <p class="status" data-status role="status" aria-live="polite">${esc(T(t.ready))}</p>
    <ol class="queue" data-queue aria-label="${esc(T(t.queueLabel))}"></ol>
    <div class="card rush-over" data-over hidden>
      <h2>${esc(T(t.overTitle))}</h2>
      <p data-summary></p>
    </div>
  </section>
  <div class="grid grid--2">
    <section class="card" aria-labelledby="rules-h">
      <h2 id="rules-h">${esc(T(t.rulesTitle))}</h2>
      <ul>
        ${t.rules.map((r) => `<li>${esc(T(r))}</li>`).join('\n        ')}
      </ul>
      <p class="hint">${esc(T(t.keys))}</p>
    </section>
    <section class="card" aria-labelledby="levels-h">
      <h2 id="levels-h">${esc(T(t.levelsTitle))}</h2>
      <ul>
        ${t.levels.map((r) => `<li>${esc(T(r))}</li>`).join('\n        ')}
      </ul>
    </section>
  </div>`;
}

export default {
  id: 'tickets',
  stage: 'bain',
  body,
  fr: {
    title: 'Ticket Rush',
    kicker: 'Démo · Support IT de N1 à N3 · mini-jeu',
    description:
      'Mini-jeu de support IT : résous ou escalade les tickets au bon niveau avant la fin du SLA, et monte du niveau 1 au niveau 3.',
    intro:
      'Le support IT en accéléré : des tickets tombent, à toi de les résoudre ou de les escalader au bon niveau avant la fin du délai (SLA). Tu commences au niveau 1 ; chaque bonne décision te fait monter vers le N3.',
    note: 'Tickets entièrement fictifs, sans aucune donnée d’entreprise.',
    gameTitle: 'Partie en cours',
    hud: { score: 'Score', time: 'Temps', resolved: 'Résolus', queue: 'L’Hydre' },
    start: 'Prendre le service',
    replay: 'Rejouer',
    ready: 'Prêt ? 90 secondes de service, 8 tickets en attente maximum.',
    queueLabel: 'File de tickets',
    overTitle: 'Fin du service',
    rulesTitle: 'Règles',
    rules: [
      'Un ticket de ton niveau ou en dessous : résous-le.',
      'Un ticket au-dessus de ton niveau : escalade-le, c’est le bon réflexe.',
      'Un ticket qui dépasse son SLA génère une relance.',
      'Huit tickets en attente et l’Hydre l’emporte.',
    ],
    keys: 'Clavier : R résout le plus ancien ticket, E l’escalade.',
    levelsTitle: 'Progression',
    levels: [
      'N1 : poste de travail, périphériques, comptes.',
      'N2 : Active Directory, Microsoft 365, applications. Débloqué à 60 points.',
      'N3 : serveurs et automatisation. Débloqué à 180 points.',
    ],
    js: {
      replay: 'Rejouer',
      resolve: 'Résoudre',
      escalate: 'Escalader',
      levelTag: 'N{l}',
      sla: 'SLA',
      msgs: {
        resolved: 'Résolu au N{l} : +{p}.',
        escalated: 'Bon réflexe : escaladé au niveau supérieur, +{p}.',
        useless: 'Escalade inutile : tu pouvais le résoudre. {p}.',
        outOfScope: 'Hors de ton périmètre : le ticket est rouvert et l’Hydre grandit.',
        late: 'SLA dépassé : une relance arrive.',
        levelUp: 'Niveau N{l} débloqué !',
        start: 'Service commencé. Bon courage !',
      },
      followUp: 'Relance : {title}',
      overTime: 'Temps écoulé. {resolved} ticket(s) résolu(s), {escalated} bonne(s) escalade(s), {late} en retard. Niveau atteint : N{level}. Score : {score}.',
      overHydra: 'L’Hydre a gagné : trop de tickets en attente. {resolved} ticket(s) résolu(s), niveau atteint : N{level}. Score : {score}.',
      tickets: [
        [1, 'Écran noir au démarrage', 'Poste · matériel'],
        [1, 'Mot de passe expiré', 'Compte'],
        [1, 'Casque Teams sans son', 'Périphérique'],
        [1, 'Préparer le poste d’un nouvel arrivant', 'Parc'],
        [1, 'Souris sans fil qui ne répond plus', 'Périphérique'],
        [1, 'Compte verrouillé après les congés', 'Compte'],
        [2, 'Accès au dossier partagé du projet', 'Active Directory'],
        [2, 'Boîte partagée absente d’Outlook', 'Microsoft 365'],
        [2, 'Licence Microsoft 365 manquante', 'Microsoft 365'],
        [2, 'Application métier qui plante au lancement', 'Application'],
        [2, 'Ajout à un groupe de sécurité', 'Active Directory'],
        [3, 'Serveur de fichiers presque plein', 'Serveur'],
        [3, 'Script de déploiement en échec sur 40 postes', 'Automatisation'],
        [3, 'Certificat expiré sur un serveur interne', 'Serveur'],
        [3, 'Tâche planifiée PowerShell en erreur', 'Automatisation'],
        [3, 'Réplication Active Directory en retard', 'Serveur'],
      ],
    },
  },
  en: {
    title: 'Ticket Rush',
    kicker: 'Demo · IT support from L1 to L3 · mini-game',
    description:
      'An IT support mini-game: solve or escalate tickets at the right level before their SLA runs out, and climb from level 1 to level 3.',
    intro:
      'IT support on fast-forward: tickets keep coming, and you solve them or escalate them to the right level before their deadline (SLA). You start at level 1; every good call takes you up towards L3.',
    note: 'Entirely fictitious tickets, with no company data.',
    gameTitle: 'Game in progress',
    hud: { score: 'Score', time: 'Time', resolved: 'Solved', queue: 'The Hydra' },
    start: 'Start the shift',
    replay: 'Play again',
    ready: 'Ready? A 90-second shift, 8 waiting tickets at most.',
    queueLabel: 'Ticket queue',
    overTitle: 'End of shift',
    rulesTitle: 'Rules',
    rules: [
      'A ticket at or below your level: solve it.',
      'A ticket above your level: escalate it, that is the right call.',
      'A ticket that misses its SLA brings a follow-up.',
      'Eight waiting tickets and the Hydra wins.',
    ],
    keys: 'Keyboard: R solves the oldest ticket, E escalates it.',
    levelsTitle: 'Progression',
    levels: [
      'L1: workstations, peripherals, accounts.',
      'L2: Active Directory, Microsoft 365, applications. Unlocked at 60 points.',
      'L3: servers and automation. Unlocked at 180 points.',
    ],
    js: {
      replay: 'Play again',
      resolve: 'Solve',
      escalate: 'Escalate',
      levelTag: 'L{l}',
      sla: 'SLA',
      msgs: {
        resolved: 'Solved at L{l}: +{p}.',
        escalated: 'Good call: escalated to the next level, +{p}.',
        useless: 'Needless escalation: you could have solved it. {p}.',
        outOfScope: 'Out of your scope: the ticket is reopened and the Hydra grows.',
        late: 'SLA missed: a follow-up is coming.',
        levelUp: 'Level L{l} unlocked!',
        start: 'Shift started. Good luck!',
      },
      followUp: 'Follow-up: {title}',
      overTime: 'Time is up. {resolved} ticket(s) solved, {escalated} good escalation(s), {late} late. Level reached: L{level}. Score: {score}.',
      overHydra: 'The Hydra wins: too many waiting tickets. {resolved} ticket(s) solved, level reached: L{level}. Score: {score}.',
      tickets: [
        [1, 'Black screen at start-up', 'Workstation · hardware'],
        [1, 'Password expired', 'Account'],
        [1, 'Teams headset has no sound', 'Peripheral'],
        [1, 'Set up a new starter’s laptop', 'Fleet'],
        [1, 'Wireless mouse not responding', 'Peripheral'],
        [1, 'Account locked after the holidays', 'Account'],
        [2, 'Access to the project shared folder', 'Active Directory'],
        [2, 'Shared mailbox missing in Outlook', 'Microsoft 365'],
        [2, 'Missing Microsoft 365 licence', 'Microsoft 365'],
        [2, 'Business app crashes on launch', 'Application'],
        [2, 'Add to a security group', 'Active Directory'],
        [3, 'File server almost full', 'Server'],
        [3, 'Deployment script failing on 40 laptops', 'Automation'],
        [3, 'Expired certificate on an internal server', 'Server'],
        [3, 'PowerShell scheduled task failing', 'Automation'],
        [3, 'Active Directory replication lagging', 'Server'],
      ],
    },
  },
};
