# Zikr PWA release guide

## Product guarantees

- Confirmed taps and timed practice are stored separately.
- Complete history is retained in IndexedDB; it is not truncated after 30 days.
- Reminder, analytics, sync, and push features are opt-in.
- Prayer-time reminders are excluded until a trustworthy manual or location-aware schedule exists.
- No account is required. Encrypted export/import is the default recovery path.

## Optional services

Copy `.env.example` to `.env` and configure only the services being deployed. The application works without any of them.

- `VITE_ANALYTICS_ENDPOINT`: accepts anonymous JSON product events after explicit opt-in.
- `VITE_SYNC_ENDPOINT`: accepts encrypted backup text via `PUT` and returns it via `GET`.
- `VITE_PUSH_ENDPOINT`: accepts a Web Push subscription.
- `VITE_VAPID_PUBLIC_KEY`: the public VAPID key paired with the push service.

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

## Truthful release assets

Capture public screenshots only from the deployed product. Do not reuse the previous AI-generated App Store artwork: it depicts controls and screens that are not part of this PWA.
