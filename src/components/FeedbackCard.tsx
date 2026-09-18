import { MessageSquare } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function FeedbackCard() {
  const { t, i18n } = useTranslation();
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error' | 'offline'>('idle');
  return <section className="settings-card" aria-labelledby="feedback-title">
    <div className="settings-heading"><MessageSquare /><div><h2 id="feedback-title">{t('feedbackTitle')}</h2><p>{t('feedbackBody')}</p></div></div>
    <form name="zikr-feedback" onSubmit={async (event) => {
      event.preventDefault();
      if (sending.current) return;
      if (!navigator.onLine) { setStatus('offline'); return; }
      const form = event.currentTarget;
      const data = new FormData(form);
      const message = String(data.get('message') ?? '').trim();
      if (!message) return;
      sending.current = true; setBusy(true); setStatus('idle');
      try {
        const body = new URLSearchParams({ 'form-name': 'zikr-feedback', message,
          rating: String(data.get('rating') ?? ''), email: String(data.get('email') ?? '').trim(),
          language: i18n.resolvedLanguage ?? 'en', 'bot-field': String(data.get('bot-field') ?? '') });
        const response = await fetch('/feedback-received.html', { method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
          signal: AbortSignal.timeout(15000) });
        if (!response.ok || !(await response.text()).includes('zikr-feedback-received')) throw new Error('Not acknowledged');
        form.reset(); setStatus('sent');
      } catch { setStatus('error'); }
      finally { sending.current = false; setBusy(false); }
    }}>
      <fieldset disabled={busy} className="feedback-fields">
        <label className="full-field">{t('feedbackRating')}<select name="rating" defaultValue=""><option value="">{t('feedbackOptional')}</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></label>
        <label className="full-field">{t('feedbackMessage')}<textarea name="message" required maxLength={3000} rows={5} /></label>
        <label className="full-field">{t('feedbackEmail')}<input name="email" type="email" maxLength={254} autoComplete="email" /></label>
        <div hidden><label>Leave this empty<input name="bot-field" tabIndex={-1} autoComplete="off" /></label></div>
        <p className="fine-print">{t('feedbackPrivacy')} <a href="/privacy.html">{t('privacy')}</a></p>
        <button type="submit" className="button secondary">{t(busy ? 'feedbackSending' : 'feedbackSend')}</button>
      </fieldset>
      {status !== 'idle' && <p role={status === 'sent' ? 'status' : 'alert'}>{t(status === 'sent' ? 'feedbackSent' : status === 'offline' ? 'feedbackOffline' : 'feedbackError')}</p>}
    </form>
  </section>;
}
