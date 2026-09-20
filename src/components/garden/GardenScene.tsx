import { useEffect } from 'react';
import oliveStage0 from '../../assets/garden/olive-stage-0.webp';
import oliveStage1 from '../../assets/garden/olive-stage-1.webp';
import oliveStage2 from '../../assets/garden/olive-stage-2.webp';
import oliveStage3 from '../../assets/garden/olive-stage-3.webp';
import oliveStage4 from '../../assets/garden/olive-stage-4.webp';

/** Authored 4:3 plates for the five daily-progress stages. */
const OLIVE_ART = [oliveStage0, oliveStage1, oliveStage2, oliveStage3, oliveStage4] as const;

export function GardenScene({ stage, label }: { stage: number; label: string }) {
  const oliveSource = OLIVE_ART[stage] ?? OLIVE_ART[0];

  useEffect(() => {
    if (stage >= OLIVE_ART.length - 1) return;

    const nextStage = new Image();
    nextStage.src = OLIVE_ART[stage + 1];
    return () => { nextStage.src = ''; };
  }, [oliveSource, stage]);

  return (
    <img
      key={`garden-${stage}`}
      className="garden-scene garden-scene-image"
      src={oliveSource}
      alt={label}
      decoding="async"
      loading="lazy"
    />
  );
}
