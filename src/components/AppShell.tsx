import { BarChart3, Hand, Headphones, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export type Tab = 'count' | 'progress' | 'listen' | 'settings';

export function AppShell({ tab, setTab, showListen = false, leading, children }: { tab: Tab; setTab: (tab: Tab) => void; showListen?: boolean; leading?: ReactNode; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const items = [
    { id: 'count' as const, label: t('count'), icon: Hand },
    { id: 'progress' as const, label: t('progress'), icon: BarChart3 },
    ...(showListen ? [{ id: 'listen' as const, label: t('listen'), icon: Headphones }] : []),
    { id: 'settings' as const, label: t('settings'), icon: Settings }
  ];
  return <div className="app-shell">
    <header className="app-header">{leading}<a className="brand" href="#count" aria-label={t('brandHome')} onClick={(e) => { e.preventDefault(); setTab('count'); }}><span className="brand-mark"><img src="/brand-symbol.png" alt="" /></span></a><span className="header-date">{new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())}</span></header>
    <main className="app-main" id="main-content">{children}</main>
    <nav className="bottom-nav" aria-label={t('primaryNav')}>{items.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><Icon /><span>{label}</span></button>)}</nav>
  </div>;
}
