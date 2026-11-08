// Démo : double authentification et anti brute-force de LearnLink.

const EMAIL = 'demo@learnlink.test';
const PASSWORD = 'Apprendre-2026';

function body(t, { esc, T }) {
  return `  <div class="grid grid--2">
    <div class="grid">
      <section class="card" aria-labelledby="acc-h">
        <h2 id="acc-h">${esc(T(t.accountTitle))}</h2>
        <p>${esc(T(t.accountText))}</p>
        <dl class="creds">
          <div><dt>${esc(T(t.emailLabel))}</dt><dd><code>${EMAIL}</code></dd></div>
          <div><dt>${esc(T(t.passwordLabel))}</dt><dd><code>${PASSWORD}</code></dd></div>
        </dl>
        <p class="hint">${esc(T(t.hashText))}</p>
        <code class="secret" data-hash>…</code>
      </section>
      <section class="card" aria-labelledby="mfa-h">
        <h2 id="mfa-h">${esc(T(t.mfaTitle))}</h2>
        <p>${esc(T(t.mfaText))}</p>
        <p class="actions"><button class="btn" type="button" data-enable-mfa>${esc(T(t.enable))}</button></p>
        <div data-mfa-panel hidden>
          <p class="hint">${esc(T(t.secretLabel))}</p>
          <code class="secret" data-secret></code>
          <p class="hint">${esc(T(t.uriLabel))}</p>
          <code class="secret" data-uri></code>
          <h3>${esc(T(t.authTitle))}</h3>
          <div class="authenticator" aria-live="off">
            <span class="auth-ring" data-ring aria-hidden="true"></span>
            <div>
              <div class="auth-code" data-code>––– –––</div>
              <div class="auth-meta" data-remaining></div>
            </div>
          </div>
          <h3>${esc(T(t.backupTitle))}</h3>
          <p class="hint">${esc(T(t.backupText))}</p>
          <ul class="backup" data-backup></ul>
        </div>
      </section>
    </div>
    <div class="grid">
      <section class="card" aria-labelledby="login-h">
        <h2 id="login-h">${esc(T(t.loginTitle))}</h2>
        <form data-login novalidate>
          <div class="field"><label for="ll-email">${esc(T(t.emailLabel))}</label><input id="ll-email" type="email" autocomplete="off" value="${EMAIL}"></div>
          <div class="field"><label for="ll-pass">${esc(T(t.passwordLabel))}</label><input id="ll-pass" type="password" autocomplete="off"></div>
          <div class="field captcha" data-captcha hidden><label for="ll-captcha" data-captcha-q></label><input id="ll-captcha" type="text" inputmode="numeric" autocomplete="off"></div>
          <div class="field" data-totp-field hidden><label for="ll-totp">${esc(T(t.totpLabel))}</label><input id="ll-totp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="9"></div>
          <p class="actions"><button class="btn" type="submit" data-submit>${esc(T(t.signIn))}</button> <button class="btn btn--ghost" type="button" data-bruteforce>${esc(T(t.bruteforce))}</button></p>
        </form>
        <p class="status" data-status role="status"></p>
        <p class="meter-line" data-counters></p>
        <div data-session hidden>
          <p><strong data-welcome></strong></p>
          <p class="actions"><button class="btn btn--ghost" type="button" data-logout>${esc(T(t.logout))}</button></p>
        </div>
      </section>
      <section class="card" aria-labelledby="siem-h">
        <h2 id="siem-h">${esc(T(t.siemTitle))}</h2>
        <p class="hint">${esc(T(t.siemText))}</p>
        <pre class="log" data-log tabindex="0"></pre>
        <p class="actions"><button class="btn btn--small btn--ghost" type="button" data-reset>${esc(T(t.reset))}</button></p>
      </section>
    </div>
  </div>`;
}

export default {
  id: 'learnlink',
  stage: 'learnlink',
  body,
  fr: {
    title: 'Connexion sécurisée LearnLink',
    kicker: 'Démo · LearnLink · MFA et anti brute-force',
    description:
      'Démo interactive des mécanismes de sécurité de LearnLink : double authentification TOTP (RFC 6238), codes de secours, CAPTCHA adaptatif, verrouillage et journal SIEM.',
    intro:
      'Les mécanismes de sécurité de LearnLink, recréés dans le navigateur : active la double authentification (TOTP, RFC 6238), connecte-toi, puis essaie de forcer le mot de passe pour voir le CAPTCHA, le verrouillage et le journal de sécurité réagir.',
    note: 'Compte de démonstration fictif. Le secret TOTP est généré localement et disparaît quand tu fermes la page.',
    accountTitle: '1. Compte de démo',
    accountText: 'Un compte étudiant fictif, pour jouer le rôle de l’attaquant comme de l’utilisateur.',
    emailLabel: 'Adresse e-mail',
    passwordLabel: 'Mot de passe',
    hashText:
      'Le mot de passe n’est jamais stocké en clair. LearnLink utilise bcrypt (12 tours) côté serveur ; ici, le navigateur applique PBKDF2 (Web Crypto, 100 000 itérations) pour la même idée. Empreinte stockée :',
    mfaTitle: '2. Double authentification',
    mfaText: 'Un second facteur par application (Google Authenticator, Authy…) : même avec le mot de passe, l’attaquant reste dehors.',
    enable: 'Activer la MFA',
    secretLabel: 'Clé secrète (à saisir dans une application d’authentification) :',
    uriLabel: 'URI otpauth (normalement affichée en QR code) :',
    authTitle: 'Authentificateur simulé',
    backupTitle: 'Codes de secours',
    backupText: 'À usage unique, si le téléphone est perdu.',
    loginTitle: '3. Connexion',
    totpLabel: 'Code à 6 chiffres (ou code de secours)',
    signIn: 'Se connecter',
    bruteforce: 'Simuler une attaque (5 essais)',
    logout: 'Se déconnecter',
    siemTitle: 'Journal de sécurité (SIEM)',
    siemText: 'Chaque événement d’authentification, en JSON normalisé : prêt pour Prometheus, Grafana ou un SIEM.',
    reset: 'Réinitialiser la démo',
    js: {
      enabled: 'MFA activée. Le code change toutes les 30 secondes.',
      remaining: 'Expire dans {s} s',
      counters: 'Échecs consécutifs : {n} · CAPTCHA dès 3 · verrouillage à 10 · alerte à 15',
      captchaQ: 'Vérification : combien font {a} + {b} ?',
      ok: 'Connexion réussie.',
      welcome: 'Connecté : {email} · rôle Étudiant',
      loggedOut: 'Déconnecté.',
      errors: {
        credentials: 'Identifiants incorrects.',
        captchaRequired: 'Trop d’échecs : réponds d’abord à la vérification.',
        captchaFailed: 'Vérification incorrecte.',
        totpRequired: 'Saisis le code de ton application d’authentification.',
        totpBad: 'Code invalide ou expiré.',
        totpReplay: 'Ce code a déjà servi : attends le suivant.',
        locked: 'Compte verrouillé pendant {s} s (15 min en production).',
      },
      attack: 'Attaque par force brute simulée : {n} mots de passe essayés.',
      alert: 'Alerte de sécurité : 15 échecs sur ce compte. L’équipe sécurité est prévenue.',
      backupUsed: 'Code de secours utilisé : il ne fonctionnera plus.',
    },
  },
  en: {
    title: 'LearnLink secure sign-in',
    kicker: 'Demo · LearnLink · MFA and anti brute-force',
    description:
      'Interactive demo of LearnLink’s security mechanisms: TOTP two-factor authentication (RFC 6238), backup codes, adaptive CAPTCHA, lockout and SIEM log.',
    intro:
      'LearnLink’s security mechanisms, rebuilt in the browser: turn on two-factor authentication (TOTP, RFC 6238), sign in, then try to brute-force the password and watch the CAPTCHA, the lockout and the security log react.',
    note: 'Fictitious demo account. The TOTP secret is generated locally and disappears when you close the page.',
    accountTitle: '1. Demo account',
    accountText: 'A fictitious student account, so you can play both the attacker and the user.',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    hashText:
      'The password is never stored in plain text. LearnLink uses bcrypt (12 rounds) server-side; here the browser applies PBKDF2 (Web Crypto, 100,000 iterations) for the same idea. Stored hash:',
    mfaTitle: '2. Two-factor authentication',
    mfaText: 'An app-based second factor (Google Authenticator, Authy…): even with the password, the attacker stays out.',
    enable: 'Turn on MFA',
    secretLabel: 'Secret key (to type into an authenticator app):',
    uriLabel: 'otpauth URI (normally shown as a QR code):',
    authTitle: 'Simulated authenticator',
    backupTitle: 'Backup codes',
    backupText: 'Single use, in case the phone gets lost.',
    loginTitle: '3. Sign in',
    totpLabel: '6-digit code (or a backup code)',
    signIn: 'Sign in',
    bruteforce: 'Simulate an attack (5 tries)',
    logout: 'Sign out',
    siemTitle: 'Security log (SIEM)',
    siemText: 'Every authentication event as normalised JSON: ready for Prometheus, Grafana or a SIEM.',
    reset: 'Reset the demo',
    js: {
      enabled: 'MFA on. The code changes every 30 seconds.',
      remaining: 'Expires in {s}s',
      counters: 'Consecutive failures: {n} · CAPTCHA from 3 · lockout at 10 · alert at 15',
      captchaQ: 'Check: what is {a} + {b}?',
      ok: 'Signed in.',
      welcome: 'Signed in: {email} · Student role',
      loggedOut: 'Signed out.',
      errors: {
        credentials: 'Wrong credentials.',
        captchaRequired: 'Too many failures: answer the check first.',
        captchaFailed: 'Wrong answer to the check.',
        totpRequired: 'Enter the code from your authenticator app.',
        totpBad: 'Invalid or expired code.',
        totpReplay: 'This code was already used: wait for the next one.',
        locked: 'Account locked for {s}s (15 min in production).',
      },
      attack: 'Simulated brute-force attack: {n} passwords tried.',
      alert: 'Security alert: 15 failures on this account. The security team is notified.',
      backupUsed: 'Backup code used: it will not work again.',
    },
  },
};

export { EMAIL, PASSWORD };
