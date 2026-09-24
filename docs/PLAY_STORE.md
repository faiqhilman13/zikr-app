# Shipping Zikr to Google Play as a TWA

This wraps the existing PWA at https://myzikr.netlify.app in a Trusted Web Activity.
A TWA is a thin Android shell that runs the live site full screen with no browser UI,
so the Play listing and the web app stay the same product. Nothing in `androidApp/`
(the Kotlin app) is used here, and the two are independent.

Files in this repo that support it:

| File | Purpose |
| --- | --- |
| `twa-manifest.json` | Bubblewrap config: package id, colors, icons, signing key |
| `public/.well-known/assetlinks.json` | Digital Asset Links, proves the site and app share an owner |
| `netlify.toml` | Serves assetlinks as `application/json` with a short cache |
| `vite.config.ts` | Keeps `.well-known` out of the service worker precache |

## Prerequisites

- JDK 17 and the Android SDK. `bubblewrap doctor` will offer to install both.
- A Play Console account, $25 one-time.
- `npm install -g @bubblewrap/cli`

## 1. Build the app bundle

**Do not run Bubblewrap in the repo root.** It generates a full Android project
(`build.gradle`, `settings.gradle`, `gradlew`, `app/`) and those names already belong to
the Kotlin Multiplatform app here. Use a sibling directory instead:

```bash
mkdir ../zikr-twa && cp twa-manifest.json ../zikr-twa/ && cd ../zikr-twa
bubblewrap init --manifest https://myzikr.netlify.app/manifest.json
```

The copy in this repo is the version-controlled reference. If you change it, copy it
across again before building.

Bubblewrap asks a series of questions. The answers are already in `twa-manifest.json`,
so accept the defaults it reads from there, or point it at the file directly. It will
offer to create a signing key: say yes, and save it as `android-upload.keystore` with
alias `zikr-upload` to match the config.

**Keep that keystore and its password safe and out of git.** Losing it means you can
never update the app under the same listing.

```bash
bubblewrap build
```

This produces `app-release-bundle.aab` (upload this to Play) and `app-release-signed.apk`
(for local testing).

## 2. Fill in the two fingerprints

`public/.well-known/assetlinks.json` ships with two placeholders. Both need real values,
and this is the step that most often goes wrong.

**Upload key** (what you just created):

```bash
bubblewrap fingerprint list
```

**App signing key** (what Google re-signs your app with). This one only exists after you
have uploaded the bundle once. In Play Console: **Setup → App integrity → App signing →
SHA-256 certificate fingerprint**.

Google re-signs every install with the app signing key, so if you only list the upload
key, verification fails for everyone who installs from Play, even though it works on
your own test device. Put **both** in the array, deploy, and the file will look like:

```json
"sha256_cert_fingerprints": [
  "AA:BB:CC:...",
  "DD:EE:FF:..."
]
```

Commit and push so Netlify serves the updated file.

## 3. Verify the association

After deploying, confirm the file is reachable and correctly typed:

```bash
curl -i https://myzikr.netlify.app/.well-known/assetlinks.json
```

Expect `200` and `content-type: application/json`. The `/* /index.html 200` rule in
`public/_redirects` does not shadow it, because Netlify serves existing static files
ahead of non-forced rewrites.

Then check Google's verifier:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://myzikr.netlify.app&relation=delegate_permission/common.handle_all_urls
```

If verification is wrong, the app still runs but shows a browser URL bar across the top.
That is the symptom to look for on device.

## 4. Play Console listing

Required before review:

- **Privacy policy URL**: https://myzikr.netlify.app/privacy.html (already live)
- **Data safety form**: the app collects nothing by default. Analytics and reminders are
  off until the user opts in, and counts never leave the device. With reminders on, the
  site keeps the browser's push subscription, the reminder time and the time zone to send
  them; the privacy page lists exactly what each keeps. Answer it honestly and it is a
  short form.
- **Content rating questionnaire**
- **Icon** 512x512: `public/icons/icon-512.png` works
- **Feature graphic** 1024x500: **not in the repo yet, you need to make one**
- **Screenshots**: at least two phone screenshots

`enableNotifications` is set to `false` in `twa-manifest.json`. The app's reminders only
work once their environment variables are set in Netlify (see `.env.example`). Until
then, requesting the notification permission would ask for something the app cannot use
and adds a permission you would have to justify. Once reminders arrive on the website,
flip it to `true` and build a new bundle.

## 5. Updating later

The web app updates on its own: a Netlify deploy reaches TWA users immediately, with no
Play review, because the shell just loads the live site. You only need a new bundle when
something in `twa-manifest.json` changes, such as the icon, name, or colors. When you do,
bump both `appVersionName` and `appVersionCode` before `bubblewrap build`.
