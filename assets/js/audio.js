// Bruitages 100 % synthétisés (Web Audio), aucun fichier son.
// Coupés par défaut ; activés seulement sur action de l'utilisateur.

let ctx = null;
let master = null;
let enabled = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export const isSoundOn = () => enabled;

export function setSound(on) {
  enabled = on;
  if (on) ensure();
}

// Débloque le contexte audio au premier geste si le son était mémorisé « on ».
export function armOnGesture() {
  const unlock = () => {
    if (enabled) ensure();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

function tone(freq, dur, { type = 'square', vol = 1, slide = 0, delay = 0 } = {}) {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

function noise(dur, { vol = 0.8, freq = 1200, delay = 0 } = {}) {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
}

const arp = (notes, step = 0.06, opts = {}) => notes.forEach((f, i) => tone(f, step * 1.4, { vol: 0.5, ...opts, delay: i * step }));

export const sfx = {
  move: () => tone(760, 0.04, { vol: 0.35 }),
  confirm: () => arp([523, 784], 0.07, { vol: 0.6 }),
  back: () => tone(420, 0.09, { vol: 0.45, slide: -160 }),
  deny: () => tone(150, 0.16, { type: 'sawtooth', vol: 0.45 }),
  start: () => arp([262, 330, 392, 523], 0.07, { vol: 0.55 }),
  hit: () => {
    noise(0.09, { vol: 0.9, freq: 1700 });
    tone(150, 0.1, { type: 'sawtooth', vol: 0.55, slide: -90 });
  },
  special: () => {
    arp([523, 659, 784, 1046], 0.05);
    noise(0.12, { vol: 0.6, freq: 2400, delay: 0.18 });
  },
  super: () => {
    arp([392, 523, 659, 784, 1046, 1318], 0.05);
    noise(0.45, { vol: 0.65, freq: 700, delay: 0.3 });
  },
  ko: () => {
    tone(880, 0.7, { type: 'sawtooth', vol: 0.45, slide: -800 });
    noise(0.6, { vol: 0.7, freq: 450, delay: 0.1 });
  },
  coin: () => {
    tone(988, 0.08, { vol: 0.55 });
    tone(1319, 0.35, { vol: 0.55, delay: 0.08 });
  },
};
