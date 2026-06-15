/**
 * Web Audio API chime — no asset file needed.
 * Call primeAudio() on a user gesture first (browser autoplay policy).
 */

const STORAGE_KEY = "salonpro-queue-sound";

let ctx: AudioContext | null = null;
let primed = false;

/**
 * Call once on the first user gesture to unlock the AudioContext.
 * Does NOT touch the user's enabled/muted preference — only unlocks playback.
 */
export function primeAudio(): void {
  if (typeof window === "undefined") return;
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => null);
  }
  primed = true;
}

/** Play a short two-tone chime. Safe to call even before priming (silently skipped). */
export function playChime(): void {
  if (!primed || !ctx || !isSoundEnabled()) return;

  const now = ctx.currentTime;
  const notes = [880, 1108.73]; // A5 + C#6

  notes.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.4);
    osc.connect(gain);
    gain.connect(ctx!.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.4);
  });
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
}
