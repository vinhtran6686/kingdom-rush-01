// Hiệu ứng âm thanh tổng hợp bằng Web Audio — không cần file âm thanh.
// AudioContext chỉ được tạo sau lần chạm đầu tiên (yêu cầu của trình duyệt mobile).

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = false;
const lastPlayed = {};

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.5;
}

function tone({ type = 'sine', freq, freqEnd, dur, vol = 0.3, delay = 0 }) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur, vol = 0.3, filter = 'lowpass', freq = 1000, freqEnd, delay = 0 }) {
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t0);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  click: () => tone({ type: 'triangle', freq: 660, freqEnd: 880, dur: 0.06, vol: 0.15 }),
  arrow: () => noise({ dur: 0.08, vol: 0.12, filter: 'highpass', freq: 2500 }),
  magic: () => tone({ type: 'sine', freq: 500, freqEnd: 1400, dur: 0.18, vol: 0.12 }),
  cannon: () => noise({ dur: 0.25, vol: 0.3, freq: 400, freqEnd: 80 }),
  boom: () => {
    noise({ dur: 0.4, vol: 0.35, freq: 900, freqEnd: 60 });
    tone({ type: 'sine', freq: 120, freqEnd: 40, dur: 0.3, vol: 0.3 });
  },
  meteor: () => {
    noise({ dur: 0.7, vol: 0.45, freq: 1200, freqEnd: 50 });
    tone({ type: 'sawtooth', freq: 90, freqEnd: 30, dur: 0.5, vol: 0.2 });
  },
  meteorCast: () => noise({ dur: 0.6, vol: 0.15, filter: 'bandpass', freq: 400, freqEnd: 2000 }),
  sword: () => noise({ dur: 0.05, vol: 0.08, filter: 'bandpass', freq: 3000 }),
  whirl: () => noise({ dur: 0.35, vol: 0.2, filter: 'bandpass', freq: 600, freqEnd: 3000 }),
  die: () => tone({ type: 'square', freq: 300, freqEnd: 80, dur: 0.12, vol: 0.06 }),
  bossDie: () => {
    noise({ dur: 1.2, vol: 0.5, freq: 600, freqEnd: 40 });
    tone({ type: 'sawtooth', freq: 160, freqEnd: 30, dur: 1.2, vol: 0.25 });
  },
  boss: () => tone({ type: 'sawtooth', freq: 70, freqEnd: 50, dur: 1.2, vol: 0.3 }),
  leak: () => tone({ type: 'square', freq: 220, freqEnd: 110, dur: 0.25, vol: 0.15 }),
  build: () => {
    noise({ dur: 0.08, vol: 0.25, freq: 800 });
    noise({ dur: 0.08, vol: 0.25, freq: 800, delay: 0.1 });
    tone({ type: 'triangle', freq: 520, dur: 0.15, vol: 0.12, delay: 0.2 });
  },
  sell: () => {
    tone({ type: 'triangle', freq: 1200, dur: 0.08, vol: 0.12 });
    tone({ type: 'triangle', freq: 1600, dur: 0.12, vol: 0.12, delay: 0.07 });
  },
  militia: () => [392, 523].forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.15, vol: 0.15, delay: i * 0.1 })),
  horn: () => {
    tone({ type: 'sawtooth', freq: 196, dur: 0.5, vol: 0.12 });
    tone({ type: 'sawtooth', freq: 294, dur: 0.7, vol: 0.1, delay: 0.25 });
  },
  heroDown: () => tone({ type: 'triangle', freq: 330, freqEnd: 110, dur: 0.6, vol: 0.2 }),
  victory: () =>
    [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.3, vol: 0.2, delay: i * 0.15 })),
  defeat: () =>
    [392, 330, 262, 196].forEach((f, i) => tone({ type: 'sawtooth', freq: f, dur: 0.35, vol: 0.12, delay: i * 0.2 })),
};

// Giới hạn tần suất để tránh "nổ tai" khi nhiều tháp bắn cùng lúc.
const MIN_GAP = { arrow: 0.05, sword: 0.08, die: 0.04, magic: 0.06, boom: 0.06, cannon: 0.08 };

export function playSfx(name) {
  if (!ctx || muted || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (now - (lastPlayed[name] || 0) < (MIN_GAP[name] || 0.02)) return;
  lastPlayed[name] = now;
  SOUNDS[name]?.();
}
