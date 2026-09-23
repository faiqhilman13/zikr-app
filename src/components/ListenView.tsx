import { ExternalLink, Headphones, Play, Square, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { embedUrl, watchUrl, type ListenItem, type ListenKind } from '../data/listen';

type Filter = 'all' | ListenKind;

/**
 * Stays mounted while another tab is open (see App), so a nasheed keeps playing while
 * someone counts. Nothing is requested from YouTube until play is tapped: no thumbnails,
 * no preloaded players.
 */
export function ListenView({ items, playingId, onPlay, onStop }: {
  items: ListenItem[];
  playingId: string | null;
  onPlay: (id: string) => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const online = useOnline();
  const kinds = new Set(items.map((item) => item.kind));
  const shown = filter === 'all' ? items : items.filter((item) => item.kind === filter);

  return <div className="view listen-view">
    <header className="view-title"><p className="eyebrow">{t('listen')}</p><h1>{t('listenTitle')}</h1><p>{t('listenBody')}</p></header>
    {kinds.size > 1 && <div className="listen-filters" role="group" aria-label={t('listenFilter')}>
      {(['all', 'nasheed', 'zikr'] as const).map((value) => <button key={value} type="button" className={`quiet-button ${filter === value ? 'selected' : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(`listenKind_${value}`)}</button>)}
    </div>}
    {!online && <p className="listen-offline" role="status"><WifiOff aria-hidden="true" />{t('listenOffline')}</p>}
    <ul className="listen-list">
      {shown.map((item) => {
        const playing = item.id === playingId;
        return <li key={item.id} className={`listen-item ${playing ? 'playing' : ''}`}>
          <div className="listen-row">
            <span className="listen-glyph" aria-hidden="true"><Headphones /></span>
            <div className="listen-meta">
              <strong>{item.title}</strong>
              {item.arabic && <span className="listen-arabic" lang="ar" dir="rtl">{item.arabic}</span>}
              <small>{item.artist ? `${item.artist} · ` : ''}{t(`listenKind_${item.kind}`)}</small>
            </div>
            {playing
              ? <button type="button" className="icon-button listen-toggle" aria-label={t('listenStop', { title: item.title })} onClick={onStop}><Square /></button>
              : <button type="button" className="icon-button listen-toggle" aria-label={t('listenPlay', { title: item.title })} disabled={!online} onClick={() => onPlay(item.id)}><Play /></button>}
          </div>
          {playing && <div className="listen-player">
            <iframe src={embedUrl(item.id, item.start)} title={item.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          </div>}
          {playing && <a className="text-link listen-external" href={watchUrl(item.id, item.start)} target="_blank" rel="noopener noreferrer">{t('listenOpenYoutube')}<ExternalLink aria-hidden="true" /></a>}
        </li>;
      })}
    </ul>
    <p className="fine-print">{t('listenPrivacy')}</p>
  </div>;
}

/** Compact control shown above the nav while something plays on another tab. */
export function NowPlaying({ item, onOpen, onStop }: { item: ListenItem; onOpen: () => void; onStop: () => void }) {
  const { t } = useTranslation();
  return <aside className="now-playing" aria-label={t('listenNowPlaying')}>
    <button type="button" className="now-playing-open" onClick={onOpen}><Headphones aria-hidden="true" /><span><small>{t('listenNowPlaying')}</small><strong>{item.title}</strong></span></button>
    <button type="button" className="icon-button" aria-label={t('listenStop', { title: item.title })} onClick={onStop}><Square /></button>
  </aside>;
}

function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online;
}
