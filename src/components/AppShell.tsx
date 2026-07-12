import { BarChart3, Hand, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export type Tab = 'count' | 'progress' | 'settings';

export function AppShell({ tab, setTab, children }: { tab: Tab; setTab: (tab: Tab) => void; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const items = [
    { id: 'count' as const, label: t('count'), icon: Hand },
    { id: 'progress' as const, label: t('progress'), icon: BarChart3 },
    { id: 'settings' as const, label: t('settings'), icon: Settings }
  ];
  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="#count" aria-label={t('brandHome')} onClick={(e) => { e.preventDefault(); setTab('count'); }}><span className="brand-mark"><img src="/brand-symbol.png" alt="" /></span></a><span className="header-date">{new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())}</span></header>
    <main className="app-main" id="main-content">{children}</main>
    <nav className="bottom-nav" aria-label={t('primaryNav')}>{items.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><Icon /><span>{label}</span></button>)}</nav>
  </div>;
}
