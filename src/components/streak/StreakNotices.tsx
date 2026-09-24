import { Flame, Snowflake } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { recentLoss, type StreakSummary } from '../../domain/streak';
import { formatDays, formatWeekdays } from './format';

const STORAGE_KEY = 'zikr-streak-notices';

// Dismissals are a courtesy, not practice data: if storage is unavailable a notice
// simply comes back next launch until the day it describes has passed.
const readDismissed = (): string[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/** What happened to the streak while the app was closed: a freeze that saved it, or a
 * run that ended. Each is told once, keyed by the day it happened, and then dismissed. */
export function StreakNotices({ streak, today }: { streak: StreakSummary; today: string }) {
  const { t, i18n } = useTranslation();
  const [dismissed, setDismissed] = useState(readDismissed);
  const language = i18n.language;
  const lost = recentLoss(streak, today);
  const frozen = streak.recentlyFrozen;
  const notices: { id: string; kind: 'freeze' | 'lost'; text: string }[] = [];
  if (frozen.length > 0) notices.push({
    id: `freeze:${frozen[frozen.length - 1]}`, kind: 'freeze',
    text: t(frozen.length === 1 ? 'freezeUsedOne' : 'freezeUsedMany', { days: formatWeekdays(frozen, language) })
  });
  if (lost) notices.push({ id: `lost:${lost.date}`, kind: 'lost', text: t('streakLostNotice', { days: formatDays(lost.length, language) }) });
  const visible = notices.filter((notice) => !dismissed.includes(notice.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...dismissed, id].slice(-20);
    setDismissed(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* shown again next launch */ }
  };

  return <div className="streak-notices">
    {visible.map(({ id, kind, text }) => <aside key={id} className={`streak-notice ${kind}`}>
      {kind === 'freeze' ? <Snowflake aria-hidden="true" /> : <Flame aria-hidden="true" />}<p>{text}</p>
      <button className="text-link" onClick={() => dismiss(id)}>{t('done')}</button>
    </aside>)}
  </div>;
}
