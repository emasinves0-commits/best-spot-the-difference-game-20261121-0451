// All sound is synthesised with WebAudio: no audio files anywhere.
// The context is created lazily on the first user gesture (browser policy).

let ctx = null;
let master = null;
const MUTE_KEY = 'neonpalms.muted';
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* storage unavailable: stay unmuted */ }

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

// One enveloped oscillator note.
function tone(freq, start, length, type = 'sine', peak = 0.3, slideTo = null) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + length);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(amp);
  amp.connect(master);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

// Two rising notes: a difference was found.
export function playChime() {
  tone(880, 0, 0.18, 'sine', 0.32);
  tone(1318.5, 0.09, 0.34, 'sine', 0.3);
  tone(2637, 0.09, 0.2, 'triangle', 0.06);
}

// Low square buzz: nothing there.
export function playBuzz() {
  tone(150, 0, 0.2, 'square', 0.16, 105);
}

// Sparkly upward sweep for a hint.
export function playShimmer() {
  for (let i = 0; i < 6; i++) tone(1200 + i * 260, i * 0.05, 0.28, 'triangle', 0.1);
}

// Major arpeggio for a cleared level.
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => tone(f, i * 0.12, 0.42, 'triangle', 0.26));
  tone(1046.5, 0.65, 0.8, 'sine', 0.18);
}

// Short dry tick for the last ten seconds of a level.
export function playTick() {
  tone(1760, 0, 0.05, 'square', 0.05);
}

// Descending minor fall for running out of time.
export function playTimeUp() {
  [392, 329.6, 261.6, 196].forEach((f, i) => tone(f, i * 0.16, 0.34, 'sawtooth', 0.12));
}
