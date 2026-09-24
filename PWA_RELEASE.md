# Zikr PWA release guide

## Product guarantees

- Confirmed taps and timed practice are stored separately. A timed session only becomes
  repetitions when the person opts in by entering their own seconds-per-repetition pace;
  time-only remains available and converts nothing. Counting sessions stop at midnight or
  after an hour, so a forgotten timer cannot invent practice.
- Complete history is retained in IndexedDB; it is not truncated after 30 days.
- Analytics and push are optional and opt-in. Unconfigured reminders are visibly unavailable; cloud sync is not shipped.
- Prayer-time reminders are excluded until a trustworthy manual or location-aware schedule exists.
- No account is required. Encrypted export/import is the default recovery path.

## Optional services

Copy `.env.example` to `.env` and configure only the services being deployed. The application works without any of them.

- Usage analytics are served by this site's own function and need no endpoint. `ANALYTICS_ADMIN_KEY` (Functions scope) is the password for the private dashboard at `/analytics.html`.
- Cloud sync is not shipped. Use encrypted backup export/import; never wire a public deployment to a shared backup blob.
- Daily reminders are sent by this site's own functions. Run `npm run vapid-keys` once, fill in its `VAPID_SUBJECT`, and set the four variables it prints in Netlify in the scopes it names: `VITE_PUSH_ENDPOINT`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`. Keep the pair once browsers are subscribed with it.

Never put a private key in a `VITE_*` variable; Vite exposes these values to browsers.

## Pre-release checks

1. Run `npm test` and `npm run build`.
2. Start `npm run preview -- --host 127.0.0.1` and verify `/manifest.json`, `/icons/apple-touch-icon.png`, `/privacy.html`, and `/support.html` return the intended files.
3. In Chrome DevTools, check Application → Manifest and Service Workers.
4. On an iPhone with iOS 16.4 or later, open the HTTPS deployment in Safari, use Share → Add to Home Screen, and confirm the opaque icon and full-screen launch.
5. On Android Chrome, use the in-app Install Zikr action and confirm the native install prompt.
6. Count offline, close the app, relaunch, and confirm the count remains.
7. Deploy a new version and confirm the update prompt replaces the cached version.
8. Export an encrypted backup, reset data, and restore the backup.
9. Test VoiceOver/TalkBack, keyboard focus, 200% text zoom, dark mode, reduced motion, and 320px responsive reflow.
10. With reminders configured, switch the reminder on in the installed app on a phone with a time about ten minutes ahead. Confirm it arrives within five minutes of that time, worded from the day's practice, and that the `push-send` function log shows the run that sent it.

## Truthful release assets

Capture public screenshots only from the deployed product. Do not reuse the previous AI-generated App Store artwork: it depicts controls and screens that are not part of this PWA.
