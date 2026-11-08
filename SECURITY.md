# Sécurité

## Signaler une vulnérabilité

Merci de ne pas ouvrir d'issue publique. Utilise le **signalement privé de GitHub** (onglet *Security* → *Report a vulnerability*) ou écris à l'adresse affichée sur [mrgmf.github.io/#contact](https://mrgmf.github.io/#contact).

Indique la page concernée, les étapes pour reproduire et l'impact. Je réponds sous 7 jours.

## Ce qui protège le site

- **Site statique**, sans serveur, sans base de données, sans formulaire qui envoie des données.
- **Content-Security-Policy stricte** sur chaque page (balise `<meta>`, GitHub Pages ne permettant pas d'en-têtes) : `default-src 'none'`, scripts et styles uniquement depuis le site, aucun `unsafe-inline` ni `unsafe-eval`, le seul script inline autorisé par son empreinte SHA-256, `connect-src 'none'`, `base-uri 'none'`, `form-action 'none'`.
- **Aucune ressource externe** : polices, images et scripts sont auto-hébergés ; aucun traceur, aucune analyse d'audience.
- **Aucun `innerHTML` alimenté par l'utilisateur** : les textes dynamiques passent par `textContent`.
- **Démos 100 % locales** : données fictives générées dans le navigateur, rien n'est envoyé ni stocké à distance.
- **Chaîne d'intégration durcie** : actions GitHub épinglées par empreinte de commit, jeton en lecture seule, analyse CodeQL (requêtes *security-extended*), mises à jour Dependabot, vérification automatique de la CSP à chaque build (`scripts/check.mjs`).

---

*English: please report vulnerabilities privately through GitHub's "Report a vulnerability" or the email shown on the contact screen. The site is static, ships a strict CSP with no inline code allowed except one hashed boot script, loads no third-party resources and sends no data anywhere.*
