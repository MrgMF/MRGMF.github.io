// Hotel.java, porté en JavaScript : mêmes classes, mêmes prix, même logique.
// Chambre est abstraite ; ChambreSimple, ChambreDouble et Suite la précisent,
// et la Suite surcharge calculerPrix() (suppléments jacuzzi et balcon).

import { $, h, t, fill, money, locale } from './common.js';

// --- Modèle (hotel.model) ------------------------------------------------------------
class Chambre {
  constructor(numero, prixParNuit, capacite) {
    if (new.target === Chambre) throw new TypeError('Chambre est abstraite');
    this.numero = numero;
    this.prixParNuit = prixParNuit;
    this.capacite = capacite;
  }
  getType() {
    throw new Error('à implémenter');
  }
  options() {
    return [];
  }
  calculerPrix(nbNuits) {
    return this.prixParNuit * nbNuits;
  }
}

class ChambreSimple extends Chambre {
  constructor(numero) {
    super(numero, 50.0, 1);
  }
  getType() {
    return 'simple';
  }
}

class ChambreDouble extends Chambre {
  constructor(numero, litsJumeaux) {
    super(numero, 80.0, 2);
    this.litsJumeaux = litsJumeaux;
  }
  getType() {
    return 'double';
  }
  options() {
    return [this.litsJumeaux ? 'twin' : 'king'];
  }
}

class Suite extends Chambre {
  constructor(numero, jacuzzi, balcon) {
    super(numero, 150.0, 4);
    this.jacuzzi = jacuzzi;
    this.balcon = balcon;
  }
  getType() {
    return 'suite';
  }
  options() {
    return [this.jacuzzi && 'jacuzzi', this.balcon && 'balcony'].filter(Boolean);
  }
  // Surcharge : les suppléments s'ajoutent au prix de chaque nuit.
  calculerPrix(nbNuits) {
    let prixTotalNuit = this.prixParNuit;
    if (this.jacuzzi) prixTotalNuit += 30;
    if (this.balcon) prixTotalNuit += 20;
    return prixTotalNuit * nbNuits;
  }
}

class Service {
  constructor(nom, prix, description) {
    this.nom = nom;
    this.prix = prix;
    this.description = description;
  }
}

class Reservation {
  static compteur = 0;
  constructor(client, chambre, dateDebut, dateFin) {
    this.numeroReservation = ++Reservation.compteur;
    this.client = client;
    this.chambre = chambre;
    this.dateDebut = dateDebut;
    this.dateFin = dateFin;
    this.services = [];
    this.statut = 'active';
  }
  // ChronoUnit.DAYS.between(debut, fin), en UTC pour ignorer les heures d'été.
  calculerNombreNuits() {
    return nightsBetween(this.dateDebut, this.dateFin);
  }
  calculerPrixChambre() {
    return this.chambre.calculerPrix(this.calculerNombreNuits());
  }
  calculerPrixServices() {
    return this.services.reduce((s, x) => s + x.prix, 0);
  }
  calculerPrixTotal() {
    return this.calculerPrixChambre() + this.calculerPrixServices();
  }
  ajouterService(s) {
    this.services.push(s);
  }
  annuler() {
    this.statut = 'cancelled';
  }
}

// Même expression régulière que Client.validerEmail().
const validerEmail = (email) => /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email || '');

// --- Données de l'hôtel (fictives) -----------------------------------------------------
const chambres = [
  new ChambreSimple(101),
  new ChambreSimple(102),
  new ChambreDouble(103, true),
  new ChambreDouble(104, false),
  new Suite(201, true, true),
  new Suite(202, false, true),
  new Suite(203, true, false),
];
const services = t.servicesList.map(([n, p, d]) => new Service(n, p, d));
const reservations = [];

// --- Dates -------------------------------------------------------------------------------
const dayMs = 86_400_000;
const toUTC = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
function nightsBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((toUTC(b) - toUTC(a)) / dayMs);
}
const iso = (date) => date.toISOString().slice(0, 10);
const human = (s) => new Date(toUTC(s)).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const overlaps = (r, from, to) => r.statut === 'active' && toUTC(from) < toUTC(r.dateFin) && toUTC(r.dateDebut) < toUTC(to);

// --- Interface ---------------------------------------------------------------------------
const $in = $('[data-in]');
const $out = $('[data-out]');
const $guests = $('[data-guests]');
const $type = $('[data-type]');
const $budget = $('[data-budget]');
const $budgetOut = $('[data-budget-out]');
const $nights = $('[data-nights]');
const $rooms = $('[data-rooms]');
const $selected = $('[data-selected]');
const $invoice = $('[data-invoice]');
const $total = $('[data-total]');
const $confirm = $('[data-confirm]');
const $bookStatus = $('[data-book-status]');
const $bookings = $('[data-bookings]');
const noRoomText = $selected.textContent;
let selected = null;

const today = new Date();
$in.value = iso(new Date(today.getTime() + 7 * dayMs));
$out.value = iso(new Date(today.getTime() + 10 * dayMs));
$in.min = iso(today);

$('[data-services]').replaceChildren(
  ...services.map((s, i) =>
    h(
      'label',
      { class: 'check' },
      h('input', { type: 'checkbox', 'data-service': i }),
      `${s.nom} · ${money(s.prix)} `,
      h('span', { class: 'hint' }, `(${s.description})`)
    )
  )
);

const nights = () => nightsBetween($in.value, $out.value);
const perNight = (c) => c.calculerPrix(1);
const busy = (c) => reservations.some((r) => r.chambre === c && overlaps(r, $in.value, $out.value));

function renderRooms() {
  const n = nights();
  $budgetOut.textContent = money(Number($budget.value));
  $nights.className = `status ${n > 0 ? 'status--ok' : 'status--ko'}`;
  $nights.textContent = n > 0 ? fill(t.nights, { n, from: human($in.value), to: human($out.value) }) : t.badDates;
  const list = chambres.filter(
    (c) =>
      ($type.value === 'all' || c.getType() === $type.value) &&
      c.capacite >= Number($guests.value) &&
      perNight(c) <= Number($budget.value)
  );
  if (!list.length) {
    $rooms.replaceChildren(h('li', { class: 'hint' }, t.none));
  } else {
    $rooms.replaceChildren(
      ...list.map((c) => {
        const isBusy = busy(c);
        const opts = c.options().map((o) => t.opts[o]);
        return h(
          'li',
          { class: `room${selected === c ? ' is-selected' : ''}${isBusy ? ' is-busy' : ''}` },
          h('h3', {}, `${c.numero} · ${t.types[c.getType()]}`),
          h('span', { class: 'price' }, fill(t.perNight, { p: money(perNight(c)) })),
          h('span', { class: 'opts' }, [fill(t.capacity, { n: c.capacite }), ...opts].join(' · ')),
          n > 0 ? h('span', { class: 'opts' }, fill(t.stay, { p: money(c.calculerPrix(n)), n })) : null,
          isBusy
            ? h('span', { class: 'badge badge--block' }, t.busy)
            : h(
                'button',
                {
                  class: `btn btn--small${selected === c ? '' : ' btn--ghost'}`,
                  type: 'button',
                  'aria-pressed': String(selected === c),
                  onclick: () => {
                    selected = c;
                    renderAll();
                  },
                },
                selected === c ? t.chosen : t.choose
              )
        );
      })
    );
  }
}

// Une réservation « brouillon » calcule la facture avec les vraies méthodes.
function draft() {
  if (!selected || nights() <= 0) return null;
  const r = new Reservation($('#h-name').value.trim(), selected, $in.value, $out.value);
  Reservation.compteur--; // brouillon : on ne consomme pas de numéro
  document.querySelectorAll('[data-service]:checked').forEach((cb) => r.ajouterService(services[Number(cb.dataset.service)]));
  return r;
}

function renderInvoice() {
  const r = draft();
  $selected.textContent = selected ? fill(t.selected, { num: selected.numero, type: t.types[selected.getType()], n: Math.max(0, nights()) }) : noRoomText;
  if (!r) {
    $invoice.replaceChildren();
    $total.textContent = '–';
    $confirm.disabled = true;
    return;
  }
  const rows = [
    [fill(t.roomLine, { num: selected.numero, n: r.calculerNombreNuits(), p: money(perNight(selected)) }), r.calculerPrixChambre()],
    ...r.services.map((s) => [fill(t.serviceLine, { name: s.nom, desc: s.description }), s.prix]),
  ];
  $invoice.replaceChildren(...rows.map(([label, v]) => h('tr', {}, h('td', {}, label), h('td', { class: 'num' }, money(v)))));
  $total.textContent = money(r.calculerPrixTotal());
  $confirm.disabled = busy(selected);
}

function renderBookings() {
  if (!reservations.length) return;
  $bookings.replaceChildren(
    ...reservations
      .slice()
      .reverse()
      .map((r) =>
        h(
          'li',
          {},
          h(
            'span',
            {},
            fill(t.bookingLine, {
              id: r.numeroReservation,
              client: r.client || '—',
              num: r.chambre.numero,
              from: human(r.dateDebut),
              to: human(r.dateFin),
              total: money(r.calculerPrixTotal()),
            })
          ),
          h('span', { class: `badge ${r.statut === 'active' ? 'badge--ok' : 'badge--muted'}` }, t.status[r.statut]),
          r.statut === 'active'
            ? h(
                'button',
                {
                  class: 'btn btn--small btn--ghost',
                  type: 'button',
                  onclick: () => {
                    r.annuler();
                    renderAll();
                  },
                },
                t.cancel
              )
            : null
        )
      )
  );
}

function renderAll() {
  renderRooms();
  renderInvoice();
  renderBookings();
}

$('[data-book]').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#h-mail').value.trim();
  if (!validerEmail(email)) {
    $bookStatus.className = 'status status--ko';
    $bookStatus.textContent = t.badEmail;
    return;
  }
  if (!selected || nights() <= 0) return;
  if (busy(selected)) {
    $bookStatus.className = 'status status--ko';
    $bookStatus.textContent = fill(t.overbooking, { num: selected.numero });
    return;
  }
  const r = new Reservation($('#h-name').value.trim(), selected, $in.value, $out.value);
  document.querySelectorAll('[data-service]:checked').forEach((cb) => r.ajouterService(services[Number(cb.dataset.service)]));
  reservations.push(r);
  $bookStatus.className = 'status status--ok';
  $bookStatus.textContent = fill(t.booked, { id: r.numeroReservation, total: money(r.calculerPrixTotal()) });
  selected = null;
  document.querySelectorAll('[data-service]').forEach((cb) => (cb.checked = false));
  renderAll();
});

[$in, $out, $guests, $type, $budget].forEach((el) => el.addEventListener('input', renderAll));
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-service]')) renderInvoice();
});

renderAll();
