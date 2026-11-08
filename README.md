# MRGMF · Zero Trust Fighter

Le portfolio jouable de **Fodié Marega**, End User Architect spécialisé **IAM : gouvernance et architecture des identités**.

**En ligne : [mrgmf.github.io](https://mrgmf.github.io/)** · [English version](https://mrgmf.github.io/en/)

Le site est une borne d'arcade façon jeu de combat. Chaque mission oppose le joueur 1 à un **problème** (un accès trop permissif, un poste qui dérive, une file de tickets…), chaque compétence est une manipulation (236P, 623K…) qu'on peut exécuter au clavier ou à la manette, chaque diplôme est une amélioration. Les entreprises ne sont jamais des adversaires : ce sont les **équipes** du joueur 1, et Nexthink un **allié** appelé en renfort.

Pour lire sans jouer, le **mode lecture** affiche tout le contenu sur une page classique et accessible, sans animation. C'est aussi ce qu'on voit sans JavaScript.

![Aperçu](assets/img/og-cover.png)

## Ce qu'il y a dedans

| Écran | Contenu |
| --- | --- |
| Écran titre | Press start, pixel art, fond synthwave |
| Missions | Une grille 3 × 3 : le joueur 1 et son équipe à gauche, le problème à affronter à droite, un tirage aléatoire et une mission secrète |
| Combats | Un écran par mission, en onglets (Brief · Points forts · Résultat), avec un accès direct à la démo du projet |
| Progression | Le parcours en mode arcade : missions et améliorations (diplômes, certifications) mêlées, niveaux, équipes et alliés |
| Compétences | La move list, avec détection réelle des manipulations |
| Profil, contact | Fiche combattant avec costumes, challenger en approche |

Les missions : End User Architect et Expérience numérique (équipe Louis Vuitton, assist Nexthink), LearnLink, Support IT du N1 au N3 (équipe Bain & Company), Hotel.java, ProjecTTrone, ce portfolio, et des archives à débloquer.

## Les démos

Chaque projet a sa démo jouable, en français et en anglais, 100 % dans le navigateur et avec des données fictives :

| Démo | Ce qu'elle montre |
| --- | --- |
| [Simulateur d'accès conditionnel](https://mrgmf.github.io/demos/acces-conditionnel/) | Évaluation de stratégies façon Microsoft Entra ID : MFA, lieux, appareils conformes, risque, mode rapport seul, déploiement par anneaux, journal de connexion |
| [Console DEX](https://mrgmf.github.io/demos/nexthink/) | Requêtes NQL simplifiées (analyseur maison, sans `eval`), alertes, Remote Actions, campagne et score DEX |
| [Connexion LearnLink](https://mrgmf.github.io/demos/learnlink/) | TOTP conforme à la RFC 6238 (Web Crypto), codes de secours, anti-rejeu, CAPTCHA adaptatif, verrouillage, journal SIEM en JSON |
| [Ticket Rush](https://mrgmf.github.io/demos/tickets/) | Mini-jeu de support : résoudre ou escalader au bon niveau avant le SLA, du N1 au N3 |
| [Réserver une chambre](https://mrgmf.github.io/demos/hotel/) | Le modèle objet Java de Hotel.java porté en JavaScript : classe abstraite, polymorphisme des prix, services, anti-overbooking |
| [ProjecTTrone Lite](https://mrgmf.github.io/demos/projecttrone/) | Exploration 2D, ramassage par rayon (« Appuie sur E »), inventaire séparé des données d'objet, salle du trône |

## Sécurité

- **CSP stricte** sur chaque page : `default-src 'none'`, rien d'inline (le seul script de démarrage est autorisé par son empreinte SHA-256), aucune requête réseau, aucun tiers. Les couleurs dynamiques des sprites passent par des classes CSS, pas par des attributs `style`.
- **Aucune donnée envoyée** : pas de formulaire distant, pas de traceur, polices et images auto-hébergées.
- **CI durcie** : actions épinglées par empreinte de commit, jeton en lecture seule, **CodeQL** (*security-extended*), **Dependabot**, et `scripts/check.mjs` qui refuse une page sans CSP, avec du style inline ou un script non autorisé.

Voir [SECURITY.md](SECURITY.md) pour signaler une vulnérabilité.

## Choix techniques

- **Zéro framework, zéro dépendance à l'exécution** : HTML, CSS et JavaScript natifs (modules ES).
- **Site statique généré** par `scripts/build.mjs` (Node, sans dépendance) à partir de `src/`. Les pages générées sont versionnées et servies telles quelles par GitHub Pages.
- **Pixel art dessiné par code** (`src/pixel.mjs`, `src/sprites.mjs`) : des formes, un contour automatique, puis une planche de symboles SVG. Chaque sprite n'est écrit qu'une fois par page.
- **Deux modes pour un même contenu** : `data-mode="game"` (un écran à la fois, barre d'onglets en bas sur mobile) et `data-mode="reading"` (page classique, rendu par défaut sans JS).
- **Accessibilité** : navigation complète au clavier (onglets au motif WAI-ARIA), annonces pour lecteur d'écran, `prefers-reduced-motion` respecté, contrastes AA vérifiés avec axe-core sur tous les écrans et toutes les démos.
- **Bilingue FR / EN**, avec `hreflang`, une image de partage par langue, un sitemap et des données structurées `Person`.
- **Polices auto-hébergées** sous licence OFL : Bungee, Chakra Petch et Tiny5.

## Modifier le contenu

Tout le texte est dans `src/content/fr.mjs` et `src/content/en.mjs` (même structure), les démos dans `src/demos/`. Le build refuse de générer le site si les deux langues divergent (missions, move list, améliorations, parcours, équipes), si une entreprise apparaît comme adversaire, ou si un texte utilise un glyphe absent des polices.

```bash
npm run build   # régénère index.html, en/, demos/, 404.html, sitemap…
npm run check   # build + vérifications (ancres, fichiers, métadonnées, CSP)
npm run dev     # build + serveur local sur http://localhost:4173
```

Pour ajouter un projet : une entrée dans `stages` (dans les deux langues) avec son équipe (`team`) ou sa formation (`crew`), un boss dans `src/sprites.mjs`, sa place dans `ladder`, puis `npm run build`. Pour ajouter un diplôme ou une certification : une entrée dans `upgrades` et dans `ladder`.

Les images PNG (aperçu social et icônes) se régénèrent avec `node scripts/render-images.mjs` (demande Playwright : `npm i -D playwright`).

## Structure

```
src/
  content/fr.mjs, en.mjs   tout le texte du site
  demos/*.mjs              texte et gabarit de chaque démo
  templates/page.mjs       gabarits HTML et CSP
  templates/demo.mjs       gabarit commun des démos
  pixel.mjs, sprites.mjs   moteur de pixel art, sprites, alliés, améliorations
scripts/
  build.mjs                génération du site
  check.mjs                vérifications (liens, métadonnées, CSP)
  serve.mjs                serveur local
  render-images.mjs        images PNG (optionnel)
assets/
  css/site.css, demo.css   styles
  js/                      main (écrans), input (clavier, manette), stage (combats),
                           tabs, progress (niveaux), audio, util
  js/demos/                une démo par fichier + outils communs
  fonts/, img/
index.html, en/, demos/, 404.html   pages générées (ne pas modifier à la main)
```

## Licence

Code sous licence MIT. Les textes, le pixel art et l'identité visuelle « MRGMF » sont © Fodié Marega. Les polices sont sous licence SIL OFL 1.1 (fichiers dans `assets/fonts/`). Les noms d'entreprises et de produits cités appartiennent à leurs propriétaires ; les démos sont indépendantes et n'utilisent aucune donnée réelle.

---

*English: a playable, arcade-style portfolio focused on identity governance and architecture (IAM). Missions pit player 1 against problems, companies are his teams, degrees are upgrades, and every project has a playable demo. No framework, no runtime dependency, strict CSP, readable without JavaScript. Edit `src/content/*.mjs`, then run `npm run build`.*
