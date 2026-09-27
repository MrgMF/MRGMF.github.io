// Démo : ProjecTTrone Lite, les mécaniques du jeu 3D recréées en 2D.

function body(t, { esc, T, icon }) {
  return `  <div class="game-wrap">
    <div>
      <div class="screen-frame" data-frame tabindex="0" aria-describedby="pt-controls">
        <canvas class="game" width="320" height="208" data-canvas role="img" aria-label="${esc(T(t.canvasLabel))}"></canvas>
        <p class="prompt" data-prompt hidden></p>
      </div>
      <div class="pad" aria-label="${esc(T(t.padLabel))}" role="group">
        <button class="up" type="button" data-dir="u" aria-label="${esc(T(t.dirs.u))}">${icon('right')}</button>
        <button class="left" type="button" data-dir="l" aria-label="${esc(T(t.dirs.l))}">${icon('right')}</button>
        <button class="down" type="button" data-dir="d" aria-label="${esc(T(t.dirs.d))}">${icon('right')}</button>
        <button class="right" type="button" data-dir="r" aria-label="${esc(T(t.dirs.r))}">${icon('right')}</button>
      </div>
      <p class="touch-actions"><button class="btn" type="button" data-interact>${esc(T(t.interact))}</button> <button class="btn btn--ghost" type="button" data-inventory-toggle>${esc(T(t.inventoryBtn))}</button></p>
      <p class="status" data-status role="status" aria-live="polite"></p>
    </div>
    <aside class="grid">
      <section class="card" aria-labelledby="obj-h">
        <h2 id="obj-h">${esc(T(t.objectiveTitle))}</h2>
        <p class="objective" data-objective></p>
        <p class="actions"><button class="btn btn--small btn--ghost" type="button" data-restart>${esc(T(t.restart))}</button></p>
      </section>
      <section class="card" aria-labelledby="inv-h" data-inventory-panel>
        <h2 id="inv-h">${esc(T(t.inventoryTitle))} <span data-inv-count>0/5</span></h2>
        <ul class="inventory" data-inventory></ul>
        <p class="hint" data-item-detail>${esc(T(t.inventoryHint))}</p>
      </section>
      <section class="card" aria-labelledby="pt-controls-h">
        <h2 id="pt-controls-h">${esc(T(t.controlsTitle))}</h2>
        <ul id="pt-controls">
          ${t.controls.map((c) => `<li>${esc(T(c))}</li>`).join('\n          ')}
        </ul>
      </section>
    </aside>
  </div>`;
}

export default {
  id: 'projecttrone',
  stage: 'trone',
  body,
  fr: {
    title: 'ProjecTTrone Lite',
    kicker: 'Démo · ProjecTTrone · mini-jeu 2D',
    description:
      'Mini-jeu 2D qui recrée les mécaniques de ProjecTTrone : exploration d’une ville médiévale, ramassage par détection de rayon, inventaire et salle du trône.',
    intro:
      'Les mécaniques que j’avais codées dans le jeu 3D, recréées en 2D pour le navigateur : explorer la ville médiévale, ramasser les objets repérés par un rayon (« Appuie sur E »), gérer l’inventaire (touche I) et ouvrir la salle du trône.',
    note: 'Graphismes dessinés par code pour la démo : les assets sous licence du projet d’origine ne sont pas publiés.',
    canvasLabel: 'Ville médiévale vue de dessus : le chevalier du joueur, des maisons, un puits, un étang et le château au nord.',
    padLabel: 'Croix directionnelle',
    dirs: { u: 'Haut', l: 'Gauche', d: 'Bas', r: 'Droite' },
    interact: 'Ramasser · E',
    inventoryBtn: 'Inventaire · I',
    objectiveTitle: 'Objectif',
    restart: 'Recommencer',
    inventoryTitle: 'Inventaire',
    inventoryHint: 'Les objets ramassés apparaissent ici. Données (ItemData) et objets du monde (Item) sont séparés, comme dans le projet Unity.',
    controlsTitle: 'Commandes',
    controls: [
      'Flèches ou ZQSD : se déplacer.',
      'E : ramasser l’objet visé, ouvrir la porte, s’asseoir sur le trône.',
      'I : afficher ou masquer l’inventaire.',
      'Sur mobile : la croix et les boutons sous le jeu.',
    ],
    js: {
      items: {
        sword: ['Épée', 'Lame d’entraînement, parfaite pour le bac à sable.'],
        shield: ['Bouclier', 'Aux couleurs du joueur 1.'],
        potion: ['Potion', 'Rend des points de vie. Ou de moral.'],
        map: ['Carte', 'Le plan de la ville, avec le château au nord.'],
        key: ['Clé du château', 'Ouvre la grande porte de la salle du trône.'],
      },
      empty: 'Vide',
      pick: 'E : ramasser {item}',
      pickTouch: 'Ramasser {item}',
      picked: '{item} ramassé(e) !',
      gatePrompt: 'E : ouvrir la porte',
      gateLocked: 'La porte est verrouillée : il faut la clé du château.',
      gateOpen: 'La porte du château s’ouvre !',
      thronePrompt: 'E : s’asseoir sur le trône',
      victory: 'Victoire ! Trône conquis avec {n}/5 objets en {s} s.',
      victoryTitle: 'VICTOIRE !',
      objectives: {
        key: 'Explore la ville et trouve la clé du château.',
        gate: 'Tu as la clé : ouvre la porte du château, au nord.',
        throne: 'La porte est ouverte : rejoins le trône.',
        done: 'Trône conquis ! Recommence pour battre ton temps.',
      },
      inventoryShown: 'Inventaire affiché.',
      inventoryHidden: 'Inventaire masqué.',
      start: 'Clique sur le jeu (ou touche-le) puis explore la ville.',
    },
  },
  en: {
    title: 'ProjecTTrone Lite',
    kicker: 'Demo · ProjecTTrone · 2D mini-game',
    description:
      'A 2D mini-game recreating ProjecTTrone’s mechanics: exploring a medieval town, raycast item pickup, inventory and the throne room.',
    intro:
      'The mechanics I coded in the 3D game, rebuilt in 2D for the browser: explore the medieval town, pick up items spotted by a ray (“Press E”), manage the inventory (I key) and open the throne room.',
    note: 'Graphics drawn in code for the demo: the original project’s licensed assets are not published.',
    canvasLabel: 'Top-down medieval town: the player’s knight, houses, a well, a pond and the castle to the north.',
    padLabel: 'Directional pad',
    dirs: { u: 'Up', l: 'Left', d: 'Down', r: 'Right' },
    interact: 'Pick up · E',
    inventoryBtn: 'Inventory · I',
    objectiveTitle: 'Objective',
    restart: 'Start over',
    inventoryTitle: 'Inventory',
    inventoryHint: 'Picked-up items show here. Data (ItemData) and world items (Item) are kept apart, as in the Unity project.',
    controlsTitle: 'Controls',
    controls: [
      'Arrows or WASD: move.',
      'E: pick up the targeted item, open the gate, sit on the throne.',
      'I: show or hide the inventory.',
      'On mobile: the pad and buttons under the game.',
    ],
    js: {
      items: {
        sword: ['Sword', 'A training blade, perfect for the sandbox.'],
        shield: ['Shield', 'In player 1’s colours.'],
        potion: ['Potion', 'Restores health. Or morale.'],
        map: ['Map', 'The town plan, with the castle to the north.'],
        key: ['Castle key', 'Opens the great gate of the throne room.'],
      },
      empty: 'Empty',
      pick: 'E: pick up {item}',
      pickTouch: 'Pick up {item}',
      picked: '{item} picked up!',
      gatePrompt: 'E: open the gate',
      gateLocked: 'The gate is locked: you need the castle key.',
      gateOpen: 'The castle gate opens!',
      thronePrompt: 'E: sit on the throne',
      victory: 'Victory! Throne taken with {n}/5 items in {s}s.',
      victoryTitle: 'VICTORY!',
      objectives: {
        key: 'Explore the town and find the castle key.',
        gate: 'You have the key: open the castle gate, to the north.',
        throne: 'The gate is open: reach the throne.',
        done: 'Throne taken! Start over to beat your time.',
      },
      inventoryShown: 'Inventory shown.',
      inventoryHidden: 'Inventory hidden.',
      start: 'Click (or tap) the game, then explore the town.',
    },
  },
};
