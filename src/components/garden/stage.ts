/**
 * The garden's five growth stages, from the day's completion ratio.
 *
 * The garden is at full growth exactly when the daily intention is met, not
 * before, so the last threshold sits at 1 rather than short of it. iOS and
 * Android read the same table from `GardenStage` in ZikrCore and the shared
 * module; if you change it here, change it there.
 */
export const GARDEN_STAGES = 5;

const THRESHOLDS: number[] = [0.4, 0.75, 1];

export function gardenStage(ratio: number): number {
  if (!(ratio > 0)) return 0;
  return THRESHOLDS.reduce((stage, threshold) => (ratio >= threshold ? stage + 1 : stage), 1);
}
