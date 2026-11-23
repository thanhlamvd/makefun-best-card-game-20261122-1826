// Synthesised sound effects: plain WebAudio oscillators, no audio files,
// nothing fetched. Created lazily on the first user gesture (browsers
// block audio before one); M toggles mute.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.08); },
  select() { tone(520, 0.07, 'triangle', 0.09); tone(780, 0.07, 'triangle', 0.06, 0.05); },
  play() { tone(392, 0.1, 'triangle', 0.12); tone(523, 0.12, 'triangle', 0.1, 0.07); },
  hit() { tone(180, 0.16, 'sawtooth', 0.12, 0, 90); },
  heal() { tone(523, 0.14, 'sine', 0.1); tone(659, 0.16, 'sine', 0.09, 0.09); },
  draw() { tone(880, 0.05, 'sine', 0.06); tone(1174, 0.06, 'sine', 0.05, 0.04); },
  ward() { tone(330, 0.12, 'square', 0.05); tone(415, 0.14, 'square', 0.04, 0.08); },
  turn() { tone(440, 0.08, 'triangle', 0.09); },
  deny() { tone(140, 0.12, 'square', 0.07); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.13)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'triangle', 0.1, i * 0.15)); },
};
