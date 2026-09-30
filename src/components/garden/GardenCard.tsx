import { useTranslation } from 'react-i18next';
import { getToday, totalTarget, totalToday } from '../../domain/state';
import type { ZikrState } from '../../domain/types';
import { GardenScene } from './GardenScene';
import { gardenStage } from './stage';

/** Today's garden, grown by how much of the day's intention is done. */
export function GardenCard({ state }: { state: ZikrState }) {
  const { t, i18n } = useTranslation();
  const target = Math.max(1, totalTarget(state));
  const intendedCount = state.presets.reduce((sum, preset) => sum + Math.min(preset.target, getToday(state).counts[preset.id] ?? 0), 0);
  const ratio = intendedCount / target;
  const stage = gardenStage(ratio);
  return <section className="garden-card" aria-labelledby="garden-title">
    <div className={`garden-visual stage-${stage}`}><GardenScene stage={stage} label={t('gardenAria', { stage: stage + 1 })} /></div>
    <div className="garden-copy"><p className="eyebrow">{t('garden')}</p><h2 id="garden-title">{t(`gardenStage${stage}`)}</h2><p>{t('gardenBody')}</p><div className="fine-progress"><i style={{ '--fill': ratio } as React.CSSProperties} /></div><small>{t('intentionSummary', { percent: Math.round(ratio * 100), count: totalToday(state).toLocaleString(i18n.language), target: target.toLocaleString(i18n.language) })}</small></div>
  </section>;
}
