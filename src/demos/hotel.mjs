// Démo : réservation d'hôtel, portage fidèle du modèle objet Java (Hotel.java).

function body(t, { esc, T }) {
  const opt = (arr) => arr.map(([v, l]) => `<option value="${v}">${esc(T(l))}</option>`).join('');
  return `  <div class="grid grid--side">
    <div class="grid">
      <section class="card" aria-labelledby="search-h">
        <h2 id="search-h">${esc(T(t.searchTitle))}</h2>
        <div class="grid grid--2">
          <div class="field"><label for="h-in">${esc(T(t.arrival))}</label><input id="h-in" type="date" data-in></div>
          <div class="field"><label for="h-out">${esc(T(t.departure))}</label><input id="h-out" type="date" data-out></div>
          <div class="field"><label for="h-guests">${esc(T(t.guests))}</label><select id="h-guests" data-guests>${opt([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']])}</select></div>
          <div class="field"><label for="h-type">${esc(T(t.type))}</label><select id="h-type" data-type>${opt(t.types)}</select></div>
        </div>
        <div class="field"><label for="h-budget">${esc(T(t.budget))} <output data-budget-out for="h-budget"></output></label><input id="h-budget" type="range" min="50" max="200" step="10" value="200" data-budget></div>
        <p class="status" data-nights role="status"></p>
      </section>
      <section class="card" aria-labelledby="rooms-h">
        <h2 id="rooms-h">${esc(T(t.roomsTitle))}</h2>
        <ul class="rooms" data-rooms></ul>
      </section>
    </div>
    <div class="grid">
      <section class="card" aria-labelledby="book-h">
        <h2 id="book-h">${esc(T(t.bookingTitle))}</h2>
        <p data-selected class="hint">${esc(T(t.noRoom))}</p>
        <form data-book novalidate>
          <div class="field"><label for="h-name">${esc(T(t.client))}</label><input id="h-name" type="text" autocomplete="off" value="Jean DUPONT"></div>
          <div class="field"><label for="h-mail">${esc(T(t.email))}</label><input id="h-mail" type="email" autocomplete="off" value="jean@test.com"></div>
          <fieldset class="field">
            <legend class="label">${esc(T(t.services))}</legend>
            <div data-services></div>
          </fieldset>
          <table class="invoice"><caption class="sr-only">${esc(T(t.invoice))}</caption><tbody data-invoice></tbody><tfoot><tr><td>${esc(T(t.total))}</td><td class="num" data-total>–</td></tr></tfoot></table>
          <p class="actions"><button class="btn" type="submit" data-confirm disabled>${esc(T(t.confirm))}</button></p>
          <p class="status" data-book-status role="status"></p>
        </form>
      </section>
      <section class="card" aria-labelledby="list-h">
        <h2 id="list-h">${esc(T(t.bookingsTitle))}</h2>
        <ul class="bookings" data-bookings><li class="hint">${esc(T(t.noBooking))}</li></ul>
      </section>
      <section class="card" aria-labelledby="model-h">
        <h2 id="model-h">${esc(T(t.modelTitle))}</h2>
        <p class="hint">${esc(T(t.modelText))}</p>
        <div class="uml" aria-label="${esc(T(t.umlLabel))}">
          <div class="uml-box uml-root"><b>«abstract» Chambre</b>numero · prixParNuit · capacite<br>+ getType() : String<br>+ calculerPrix(nbNuits) : double</div>
          <div class="uml-box"><b>ChambreSimple</b>prixParNuit = 50 · capacite = 1</div>
          <div class="uml-box"><b>ChambreDouble</b>prixParNuit = 80 · capacite = 2<br>litsJumeaux : boolean</div>
          <div class="uml-box"><b>Suite</b>prixParNuit = 150 · capacite = 4<br>jacuzzi (+30) · balcon (+20)</div>
        </div>
        <pre class="code"><code>// Suite.java : la Suite surcharge le calcul (polymorphisme)
@Override
public double calculerPrix(int nbNuits) {
    double prixTotalNuit = this.prixParNuit;
    if (jacuzzi) prixTotalNuit += 30; // Supplément Jacuzzi
    if (balcon)  prixTotalNuit += 20; // Supplément Balcon
    return prixTotalNuit * nbNuits;
}</code></pre>
      </section>
    </div>
  </div>`;
}

export default {
  id: 'hotel',
  stage: 'hotel',
  body,
  fr: {
    title: 'Réserver une chambre',
    kicker: 'Démo · Hotel.java · programmation orientée objet',
    description:
      'Démo de réservation d’hôtel qui reprend le modèle objet Java du projet : classe abstraite Chambre, polymorphisme des prix, services et facture.',
    intro:
      'Le modèle objet du projet Hotel.java, porté en JavaScript : cherche une chambre, ajoute des services et regarde la facture se calculer toute seule. Mêmes classes, mêmes prix, même règle contre l’overbooking.',
    note: 'Hôtel, clients et réservations fictifs : tout reste dans ton navigateur.',
    searchTitle: 'Recherche',
    arrival: 'Arrivée',
    departure: 'Départ',
    guests: 'Voyageurs',
    type: 'Type de chambre',
    types: [['all', 'Tous les types'], ['simple', 'Chambre simple'], ['double', 'Chambre double'], ['suite', 'Suite']],
    budget: 'Budget maximum par nuit :',
    roomsTitle: 'Chambres',
    bookingTitle: 'Réservation',
    noRoom: 'Choisis une chambre dans la liste.',
    client: 'Client',
    email: 'E-mail',
    services: 'Services',
    invoice: 'Facture',
    total: 'Total',
    confirm: 'Confirmer la réservation',
    bookingsTitle: 'Réservations',
    noBooking: 'Aucune réservation pour l’instant.',
    modelTitle: 'Le modèle Java',
    modelText: 'Chambre fixe le contrat, chaque type le précise. La démo appelle exactement la même méthode, calculerPrix(nbNuits).',
    umlLabel: 'Diagramme de classes simplifié',
    js: {
      nights: '{n} nuit(s), du {from} au {to}.',
      badDates: 'La date de départ doit suivre la date d’arrivée.',
      perNight: '{p} / nuit',
      stay: '{p} pour {n} nuit(s)',
      capacity: '{n} pers. max',
      busy: 'Déjà réservée à ces dates',
      choose: 'Choisir',
      chosen: 'Choisie',
      none: 'Aucune chambre ne correspond : élargis le budget ou change de type.',
      selected: 'Chambre {num} · {type} · {n} nuit(s)',
      roomLine: 'Chambre {num} : {n} nuit(s) × {p}',
      serviceLine: '{name} ({desc})',
      types: { simple: 'Chambre simple', double: 'Chambre double', suite: 'Suite' },
      opts: { twin: 'Lits jumeaux', king: 'Grand lit', jacuzzi: 'Jacuzzi', balcony: 'Balcon' },
      servicesList: [
        ['Petit-déjeuner', 15, 'Buffet à volonté'],
        ['Spa', 50, 'Accès 1 h'],
      ],
      badEmail: 'Adresse e-mail invalide (même règle que Client.validerEmail()).',
      booked: 'Réservation n°{id} enregistrée : {total}.',
      overbooking: 'Refusé : la chambre {num} est déjà réservée sur ces dates.',
      status: { active: 'En cours', cancelled: 'Annulée' },
      cancel: 'Annuler',
      bookingLine: 'n°{id} · {client} · chambre {num} · {from} – {to} · {total}',
    },
  },
  en: {
    title: 'Book a room',
    kicker: 'Demo · Hotel.java · object-oriented programming',
    description:
      'Hotel booking demo reusing the project’s Java object model: abstract Room class, polymorphic pricing, services and invoice.',
    intro:
      'The object model of the Hotel.java project, ported to JavaScript: search for a room, add services and watch the bill compute itself. Same classes, same prices, same rule against overbooking.',
    note: 'Fictitious hotel, guests and bookings: everything stays in your browser.',
    searchTitle: 'Search',
    arrival: 'Check-in',
    departure: 'Check-out',
    guests: 'Guests',
    type: 'Room type',
    types: [['all', 'All types'], ['simple', 'Single room'], ['double', 'Double room'], ['suite', 'Suite']],
    budget: 'Maximum budget per night:',
    roomsTitle: 'Rooms',
    bookingTitle: 'Booking',
    noRoom: 'Pick a room from the list.',
    client: 'Guest',
    email: 'Email',
    services: 'Services',
    invoice: 'Invoice',
    total: 'Total',
    confirm: 'Confirm the booking',
    bookingsTitle: 'Bookings',
    noBooking: 'No booking yet.',
    modelTitle: 'The Java model',
    modelText: 'Room sets the contract, each type refines it. The demo calls the very same method, calculerPrix(nbNuits).',
    umlLabel: 'Simplified class diagram',
    js: {
      nights: '{n} night(s), from {from} to {to}.',
      badDates: 'Check-out must come after check-in.',
      perNight: '{p} / night',
      stay: '{p} for {n} night(s)',
      capacity: 'up to {n} guest(s)',
      busy: 'Already booked on these dates',
      choose: 'Choose',
      chosen: 'Chosen',
      none: 'No room matches: raise the budget or change the type.',
      selected: 'Room {num} · {type} · {n} night(s)',
      roomLine: 'Room {num}: {n} night(s) × {p}',
      serviceLine: '{name} ({desc})',
      types: { simple: 'Single room', double: 'Double room', suite: 'Suite' },
      opts: { twin: 'Twin beds', king: 'King bed', jacuzzi: 'Jacuzzi', balcony: 'Balcony' },
      servicesList: [
        ['Breakfast', 15, 'All-you-can-eat buffet'],
        ['Spa', 50, '1-hour access'],
      ],
      badEmail: 'Invalid email address (same rule as Client.validerEmail()).',
      booked: 'Booking #{id} saved: {total}.',
      overbooking: 'Refused: room {num} is already booked on these dates.',
      status: { active: 'Active', cancelled: 'Cancelled' },
      cancel: 'Cancel',
      bookingLine: '#{id} · {client} · room {num} · {from} – {to} · {total}',
    },
  },
};
