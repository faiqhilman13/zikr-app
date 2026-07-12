import { Bell, BellOff, Cloud, Download, Languages, LockKeyhole, Moon, Plus, RotateCcw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createEncryptedBackup, readEncryptedBackup, saveTextFile } from '../data/backup';
import { downloadEncryptedSync, syncConfigured, uploadEncryptedSync } from '../data/sync';
import { disablePushNotifications, enablePushNotifications } from '../services/push';
import type { DhikrPreset, Language, ThemePreference, UserSettings, ZikrState } from '../domain/types';
import { InstallCard } from './InstallCard';

export function SettingsView({ state, setState, patchSettings, setLanguage, setTheme, updatePreset, addPreset, removePreset, onReset }: {
  state: ZikrState;
  setState: (state: ZikrState) => void;
  patchSettings: (changes: Partial<UserSettings>) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  updatePreset: (id: string, changes: Partial<DhikrPreset>) => void;
  addPreset: (preset: DhikrPreset) => void;
  removePreset: (id: string) => void;
  onReset: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState('');
  const [custom, setCustom] = useState({ title: '', arabic: '', transliteration: '', target: 100 });
  const pushEnabled = state.settings.reminders.pushEnabled;

  const announce = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(''), 5000); };
  const exportBackup = async () => {
    try { await saveTextFile(`zikr-backup-${new Date().toISOString().slice(0, 10)}.json`, await createEncryptedBackup(state, passphrase)); announce(t('backupSaved')); }
    catch (error) { announce(error instanceof Error ? error.message : t('backupFailed')); }
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const restored = await readEncryptedBackup(await file.text(), passphrase);
      if (window.confirm(t('importConfirm'))) { setState(restored); announce(t('backupRestored')); }
    } catch { announce(t('backupInvalid')); }
    if (fileInput.current) fileInput.current.value = '';
  };
  const changeReminderTime = (time: string) => {
    patchSettings({ reminders: { ...state.settings.reminders, time } });
    if (pushEnabled) {
      void enablePushNotifications(time)
        .then(() => announce(t('reminderTimeUpdated')))
        .catch((error: Error) => announce(error.message));
    }
  };
  const enablePush = () => void enablePushNotifications(state.settings.reminders.time)
    .then(() => { patchSettings({ reminders: { ...state.settings.reminders, pushEnabled: true } }); announce(t('pushEnabledMsg')); })
    .catch((error: Error) => announce(error.message));
  const disablePush = () => void disablePushNotifications()
    .then(() => { patchSettings({ reminders: { ...state.settings.reminders, pushEnabled: false } }); announce(t('pushDisabledMsg')); })
    .catch((error: Error) => announce(error.message));

  return <div className="view settings-view">
    <header className="view-title"><p className="eyebrow">{t('settings')}</p><h1>{t('settingsTitle')}</h1><p>{t('settingsBody')}</p></header>
    <InstallCard compact />

    <section className="settings-card" aria-labelledby="goals-title"><div className="settings-heading"><LeafIcon /><div><h2 id="goals-title">{t('dailyIntentions')}</h2><p>{t('dailyIntentionsBody')}</p></div></div>
      <div className="target-list">{state.presets.map((preset) => <div className="target-row" key={preset.id}><label htmlFor={`target-${preset.id}`}><b>{preset.title}</b><small lang="ar" dir="rtl">{preset.arabic}</small></label><input id={`target-${preset.id}`} type="number" min="0" max="9999" value={preset.target} onChange={(e) => updatePreset(preset.id, { target: Math.max(0, Number(e.target.value)) })} />{preset.custom && <button className="icon-button danger" aria-label={t('deletePreset', { title: preset.title })} onClick={() => removePreset(preset.id)}><Trash2 /></button>}</div>)}</div>
    </section>

    <section className="settings-card" aria-labelledby="custom-title"><div className="settings-heading"><Plus /><div><h2 id="custom-title">{t('customDhikr')}</h2><p>{t('customBody')}</p></div></div>
      <div className="form-grid"><label>{t('title')}<input value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} /></label><label>{t('arabic')}<input lang="ar" dir="rtl" value={custom.arabic} onChange={(e) => setCustom({ ...custom, arabic: e.target.value })} /></label><label>{t('transliteration')}<input value={custom.transliteration} onChange={(e) => setCustom({ ...custom, transliteration: e.target.value })} /></label><label>{t('target')}<input type="number" min="0" max="9999" value={custom.target} onChange={(e) => setCustom({ ...custom, target: Math.max(0, Number(e.target.value)) })} /></label></div>
      <button className="button secondary" disabled={!custom.title.trim() || !custom.arabic.trim()} onClick={() => { const id = `custom-${crypto.randomUUID()}`; addPreset({ id, ...custom, custom: true }); setCustom({ title: '', arabic: '', transliteration: '', target: 100 }); }}>{t('add')}</button>
    </section>

    <section className="settings-card" aria-labelledby="appearance-title"><div className="settings-heading"><Moon /><div><h2 id="appearance-title">{t('appearance')}</h2><p>{t('appearanceBody')}</p></div></div>
      <div className="setting-row"><label htmlFor="language"><Languages />{t('language')}</label><select id="language" value={state.settings.language} onChange={(e) => setLanguage(e.target.value as Language)}><option value="en">English</option><option value="ms">Bahasa Melayu</option><option value="ar">العربية</option></select></div>
      <div className="setting-row"><label htmlFor="theme">{t('theme')}</label><select id="theme" value={state.settings.theme} onChange={(e) => setTheme(e.target.value as ThemePreference)}><option value="system">{t('system')}</option><option value="light">{t('light')}</option><option value="dark">{t('dark')}</option></select></div>
      <Toggle label={t('reducedMotion')} checked={state.settings.reducedMotion} onChange={(checked) => patchSettings({ reducedMotion: checked })} />
      <Toggle label={t('hapticsLabel')} checked={state.settings.haptics} onChange={(checked) => patchSettings({ haptics: checked })} />
    </section>

    <section className="settings-card" aria-labelledby="reminders-title"><div className="settings-heading"><Bell /><div><h2 id="reminders-title">{t('reminders')}</h2><p>{t('reminderBody')}</p></div></div>
      <Toggle label={t('reminderToggle')} checked={state.settings.reminders.enabled} onChange={(checked) => patchSettings({ reminders: { ...state.settings.reminders, enabled: checked } })} />
      {state.settings.reminders.enabled && <div className="setting-row"><label htmlFor="reminder-time">{t('preferredTime')}</label><input id="reminder-time" type="time" value={state.settings.reminders.time} onChange={(e) => changeReminderTime(e.target.value)} /></div>}
      {pushEnabled
        ? <><p className="fine-print push-state">{t('pushActive')}</p><button className="button secondary" onClick={disablePush}><BellOff />{t('disablePush')}</button></>
        : <button className="button secondary" onClick={enablePush}><Bell />{t('enablePush')}</button>}
      <p className="fine-print">{t('prayerNote')}</p>
    </section>

    <section className="settings-card" aria-labelledby="data-title"><div className="settings-heading"><LockKeyhole /><div><h2 id="data-title">{t('data')}</h2><p>{t('dataBody')}</p></div></div>
      <label className="full-field">{t('passphrase')}<input type="password" minLength={8} autoComplete="new-password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder={t('passphrasePlaceholder')} /></label>
      <div className="button-stack"><button className="button secondary" onClick={() => void exportBackup()}><Download />{t('export')}</button><button className="button secondary" onClick={() => fileInput.current?.click()}><Upload />{t('import')}</button><input className="sr-only" ref={fileInput} type="file" accept="application/json,.json" onChange={(e) => void importBackup(e.target.files?.[0])} /></div>
      <div className="sync-block"><div><Cloud /><b>{t('syncTitle')}</b><small>{syncConfigured ? t('syncOn') : t('syncOff')}</small></div><div className="button-stack"><button className="quiet-button" disabled={!syncConfigured} onClick={() => void uploadEncryptedSync(state, passphrase).then(() => announce(t('syncUploaded'))).catch((e: Error) => announce(e.message))}>{t('upload')}</button><button className="quiet-button" disabled={!syncConfigured} onClick={() => void downloadEncryptedSync(passphrase).then((restored) => { setState(restored); announce(t('syncRestored')); }).catch((e: Error) => announce(e.message))}>{t('restoreAction')}</button></div></div>
    </section>

    <section className="settings-card" aria-labelledby="privacy-title"><div className="settings-heading"><ShieldCheck /><div><h2 id="privacy-title">{t('privacyAnalytics')}</h2><p>{t('analyticsBody')}</p></div></div><Toggle label={t('analyticsToggle')} checked={state.settings.analyticsOptIn} onChange={(checked) => patchSettings({ analyticsOptIn: checked })} /><div className="footer-links"><a href="/privacy.html">{t('privacy')}</a><a href="/support.html">{t('support')}</a></div></section>

    <section className="danger-zone"><div><h2>{t('startOver')}</h2><p>{t('startOverBody')}</p></div><button className="button danger" onClick={() => { if (window.confirm(t('resetConfirm'))) void onReset(); }}><RotateCcw />{t('reset')}</button></section>
    <p className="status-message" role="status" aria-live="polite">{status}</p>
  </div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i aria-hidden="true" /></label>;
}

function LeafIcon() { return <span aria-hidden="true" className="leaf-icon">◌</span>; }
