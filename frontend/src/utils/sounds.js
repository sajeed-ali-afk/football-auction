// Web Audio API sound effects — no external assets needed

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};

const playTone = (frequency, type = 'sine', duration = 0.15, volume = 0.3, delay = 0) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) { /* silently fail */ }
};

export const sounds = {
  bid: () => {
    playTone(523, 'sine', 0.1, 0.25);
    playTone(659, 'sine', 0.1, 0.2, 0.08);
  },
  sold: () => {
    playTone(392, 'square', 0.12, 0.2);
    playTone(523, 'square', 0.12, 0.2, 0.12);
    playTone(659, 'square', 0.2, 0.3, 0.24);
    playTone(784, 'sine', 0.4, 0.35, 0.4);
  },
  unsold: () => {
    playTone(220, 'sawtooth', 0.3, 0.2);
    playTone(196, 'sawtooth', 0.3, 0.2, 0.2);
  },
  goingOnce: () => {
    playTone(440, 'sine', 0.15, 0.2);
  },
  goingTwice: () => {
    playTone(494, 'sine', 0.15, 0.2);
    playTone(523, 'sine', 0.15, 0.2, 0.18);
  },
  timerTick: () => {
    playTone(880, 'sine', 0.05, 0.1);
  },
  bidRejected: () => {
    playTone(200, 'sawtooth', 0.2, 0.2);
  },
  join: () => {
    playTone(440, 'sine', 0.15, 0.15);
    playTone(554, 'sine', 0.15, 0.15, 0.15);
  },
  chat: () => {
    playTone(660, 'sine', 0.08, 0.1);
  },
};
