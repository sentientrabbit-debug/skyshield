// Minimal WebAudio cue generator. No audio files — short synthesised blips so
// detection, classification, engagement and impact each have a distinct, calm cue.
// Respects a global mute flag.

type Cue = "detect" | "classify" | "engage" | "hit" | "impact" | "win";

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function blip(freq: number, dur: number, type: OscillatorType, gain = 0.05, delay = 0) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playCue(cue: Cue) {
  switch (cue) {
    case "detect": // soft high ping
      blip(880, 0.12, "sine", 0.035);
      break;
    case "classify": // two-step rising — "understood"
      blip(660, 0.09, "triangle", 0.035);
      blip(990, 0.1, "triangle", 0.035, 0.08);
      break;
    case "engage": // short square — launch
      blip(330, 0.08, "square", 0.04);
      break;
    case "hit": // clean confirm
      blip(1320, 0.14, "sine", 0.045);
      break;
    case "impact": // low thud — consequence
      blip(110, 0.22, "sawtooth", 0.06);
      blip(70, 0.26, "sine", 0.05, 0.02);
      break;
    case "win": // small arpeggio
      blip(523, 0.12, "sine", 0.04);
      blip(659, 0.12, "sine", 0.04, 0.1);
      blip(784, 0.16, "sine", 0.04, 0.2);
      break;
  }
}

/** Resume audio context after a user gesture (browsers require this). */
export function unlockAudio() {
  const c = ac();
  if (c && c.state === "suspended") c.resume();
}
