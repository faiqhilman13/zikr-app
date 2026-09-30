import { useEffect, useState } from 'react';
import { getToday, totalTarget } from '../../../domain/state';
import type { ZikrState } from '../../../domain/types';
import { useNow } from '../../../hooks/useNow';
import { gardenDays } from './growth';

export const GARDEN_ANCHOR = 'todays-garden';

function useReducedMotion(setting: boolean) {
  const [system, setSystem] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setSystem(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return setting || system;
}

/** Everything the garden is drawn from, shared by the full garden and the small one beside the counter. */
export function useGarden(state: ZikrState) {
  const now = useNow(60_000);
  const reduced = useReducedMotion(state.settings.reducedMotion);
  const target = Math.max(1, totalTarget(state));
  const intended = state.presets.reduce((sum, preset) => sum + Math.min(preset.target, getToday(state).counts[preset.id] ?? 0), 0);
  const ratio = Math.min(1, intended / target);
  const { tended, full } = gardenDays(state.logs, state.presets);
  return { now: new Date(now), motion: !reduced, target, ratio, tended, full };
}

export const scrollToGarden = (smooth: boolean) => document.getElementById(GARDEN_ANCHOR)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });

