/**
 * Optional garden sounds while counting: a river and birdsong, looped quietly. Off unless
 * turned on, remembered per device, and only ever started by a tap, since browsers will
 * not play sound before one.
 */
const KEY = 'zikr-garden-sound';
const VOLUME = 0.35;
let audio: HTMLAudioElement | null = null;
const listeners = new Set<(on: boolean) => void>();

export function gardenSoundWanted() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

const element = () => {
  if (!audio) {
    audio = new Audio('/sounds/garden.mp3');
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = VOLUME;
    // Quiet while the app is in the background; back on return if it was playing.
    let resume = false;
    document.addEventListener('visibilitychange', () => {
      if (!audio) return;
      if (document.visibilityState === 'hidden') { resume = !audio.paused; audio.pause(); }
      else if (resume && gardenSoundWanted()) void audio.play().catch(() => undefined);
      announce();
    });
  }
  return audio;
};

export const gardenSoundPlaying = () => !!audio && !audio.paused;

function announce() { listeners.forEach((listener) => listener(gardenSoundPlaying())); }

export function onGardenSound(listener: (on: boolean) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Starts the sounds if they were wanted and are not playing. Call from a tap. */
export function resumeGardenSound() {
  if (!gardenSoundWanted() || gardenSoundPlaying() || typeof Audio === 'undefined') return;
  void element().play().then(announce).catch(() => undefined);
}

export function setGardenSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* For this visit only. */ }
  if (typeof Audio === 'undefined') return;
  if (on) void element().play().then(announce).catch(announce);
  else { audio?.pause(); announce(); }
}
