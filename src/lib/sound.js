import { config } from './store.svelte.js';

let ctx;
function tone(freq, dur = 0.15, type = 'sine', when = 0, vol = 0.2) {
  if (!config.settings.sound) return;
  ctx ??= new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + when;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sfx = {
  click: () => tone(660, 0.06, 'triangle', 0, 0.12),
  swap: () => { tone(520, 0.08, 'triangle'); tone(780, 0.1, 'triangle', 0.06); },
  tick: () => tone(1000, 0.05, 'square', 0, 0.06),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', i * 0.12)),
  fail: () => { tone(300, 0.25, 'sawtooth', 0, 0.12); tone(200, 0.4, 'sawtooth', 0.2, 0.12); },
  heart: () => { tone(440, 0.15, 'sine'); tone(330, 0.3, 'sine', 0.15); },
  reveal: () => { tone(880, 0.12, 'sine'); tone(1320, 0.2, 'sine', 0.1); },
  drum: () => tone(120 + Math.random() * 60, 0.08, 'triangle', 0, 0.25),
};
