# Zikr PWA launch check — 18 September 2026

**Historical audit: the findings below have since been addressed. See [launch fixes and verification](LAUNCH_FIXES_2026-09-18.md).**

Original verdict: hold the public launch until the two data-loss defects below are fixed. The PWA foundation is present and basic offline behavior works. This audit does not certify absence of all defects.

## Scope and version

- `git pull --ff-only`: already up to date; clean starting checkout, `main`, commit `46bd012`.
- Live site: https://myzikr.netlify.app (discovered through the existing Netlify project link).
- No production deployment or app-source changes were made. Only this audit and reproduction probes were added.
- Tested local production build in Chromium through the Codex browser. Live landing page also loaded without captured console errors.

## Launch blockers

### P1 — Opening two windows can silently lose counts

Sources: `src/hooks/useZikrState.ts:11-30`, `src/data/db.ts:41-42`.

Each window holds its own state snapshot and saves the entire snapshot without reading the latest database state in a transaction. There is no cross-window coordination.

Browser reproduction: start at 5 in windows A and B; add 5 in A (10); tap once in B; reload A. The saved count is **6**, not **11**. The same whole-state overwrite can roll back settings/history. This matters when a browser tab and an installed app share storage, as well as ordinary tabs.

Fix: apply mutations against the latest stored state inside a serialized read/write transaction, notify other windows, and explicitly handle reset/import conflicts. Refresh-on-focus alone does not resolve simultaneous writes.

### P1 — Recovery can overwrite existing history after a read failure

Source: `src/data/db.ts:25-35`.

`loadState()` catches both database read and validation errors, creates fresh state, then immediately writes it back. If that write succeeds, it reports `persisted: true`; the user receives no failure warning.

Fault-injection reproduction: save 123 taps; reject the next database get once; call `loadState()`. Existing taps are erased and the function reports persistence success. This demonstrates the failure path; it does not establish how frequently a device will encounter it.

Fix: distinguish missing data from failed reads/invalid data. Preserve or quarantine the existing row, show an explicit recovery state, and do not allow fallback state to overwrite the original through subsequent edits.

## Other issues to address

| Priority | Finding and evidence | Suggested action |
| --- | --- | --- |
| P2 | Invalid dates survive backup validation: `2026-99-99` passes the regex in `src/domain/state.ts`, then rendering Progress throws. Reproduced through `sanitizeState` and `ProgressView`. This requires malformed persisted/imported data, not normal counting. | Validate actual calendar dates; reject duplicates/invalid structures; add an app error boundary. |
| P2 | Completion/streak status becomes stale after editing targets. Reproduced: achieve 1/1, raise target to 100, and today's `completed` remains true at 1/100. `updatePreset` does not recompute completion. | Recompute today's completion after target changes; preserve historical completion separately. |
| P2 | Reminder preference is only stored locally, and switching it off does not unsubscribe push. Reset also does not unsubscribe. A separate disable button exists, but the controls can disagree. The default build has no push endpoint. | For a simple first launch, hide/disable unavailable reminders and explain availability. If shipping push, unify enable/disable/reset behavior and test the real scheduler. |
| P2, conditional | Optional sync uses one shared endpoint with no client user identity/authentication. `.env.example` correctly warns it is single-user. It is disabled in the tested build. | Keep sync disabled for public launch until storage is isolated and authenticated per user. Encryption alone does not prevent overwrites. |
| P2 | Deleted custom phrases disappear from the per-phrase history view, though aggregate counts remain. `BreakdownRows` only iterates current presets. | Archive phrases or preserve historical phrase metadata. |
| P2 | Target input min/max are HTML hints only: handlers accept decimals and values over 9999, while loading clamps/floors them. Values can change after restart. | Enforce one finite integer range at mutation time. |
| P2 | iOS share cancellation returns normally from `saveTextFile`, so Settings announces backup saved even if the user cancels. iPad desktop-style user agents are also missed by the iOS regex. | Return an explicit saved/cancelled result and verify iPhone/iPad backup export on-device. |
| P3 | At a measured 320px viewport, English Settings had 324px document width; Counter and Progress were 320px. Arabic Settings measured 320px. | Remove horizontal overflow and verify long translations/custom phrase content. |

## Checks that passed

- Existing suite: **21 tests across 7 files** passed; ESLint and TypeScript/Vite production build passed.
- Three additional temporary reproduction probes confirmed the read-recovery, completion, and malformed-date defects. Their passing assertions describe the defects, not correct behavior.
- Manifest parsed without errors: stable ID, root scope, standalone display, start URL, 192/512 icons and maskable icon.
- Service worker generated with 19 precached entries, approximately 1 MB.
- Local onboarding and counting; 5 taps survived a reload.
- Network disabled through browser emulation: cached app relaunched, one additional tap saved, reload retained it (6 → 7).
- Settings language switch to Arabic set `lang=ar` and `dir=rtl`; light/dark controls responded.
- Live HTML, manifest, service worker, push handler, checked icons, privacy and support files returned HTTP 200 with appropriate content types and byte-matched the local build.
- Live service worker and push handler use `Cache-Control: no-cache`; deployment serves CSP, nosniff and referrer protections.
- Public GitHub support issue URL returned HTTP 200.
- No captured warning/error logs in the tested local UI flow or live landing page.
- Encrypted backup unit tests cover round-trip, wrong passphrase, invalid payload and 1,200-day history. Native file export/import was not exercised end-to-end.

## Dependency audit

`npm audit --omit=dev`: **0 reported production dependency vulnerabilities**.
Full audit: **10 findings (7 high, 3 moderate)**, all in development/build dependencies, including sharp, postcss, browserslist, js-yaml, nanoid and Vitest-related tooling. This is not evidence of a remotely exploitable runtime flaw in the static app. Update the build dependencies and rerun checks before release; sharp's proposed fix crosses its current declared version range. No automatic dependency changes were applied during this audit.

## Remaining release gates

1. Fix both P1s and add permanent regression tests, including simultaneous writes and failed reads followed by user edits.
2. Resolve the P2 recovery issues; choose a clear local-only launch with unavailable optional services disabled.
3. Test actual Add to Home Screen / installed standalone launch on iPhone Safari and Android Chrome. Desktop manifest parsing and viewport simulation do not prove OS installation.
4. On both devices: airplane-mode count, force-close/reopen, export/share, restore, and verify all history. Include iPad if supported.
5. Exercise a real old-build → new-build service-worker update, including an open app and unsaved/active timer state. Update hooks exist, but upgrade behavior was not tested by deploying another version.
6. Verify VoiceOver/TalkBack, 200% text zoom, background/midnight timer behavior and low-storage failure UX. These were not exhaustively tested.
7. Decide the permanent HTTPS domain before inviting users; local browser history belongs to its origin and will not automatically migrate to another domain.

## PWA distribution

A PWA suits this product: distribute an HTTPS link and users install/add it to their Home Screen; app stores are optional. Installation and prompts vary by browser. See https://web.dev/learn/pwa/installation and https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ . Web Push on supported iOS Home Screen apps requires a push service; see https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ .

## Regression coverage

The original one-off probes have been replaced by permanent tests in `src/data/db.test.ts`, `src/hooks/useZikrState.test.tsx`, `src/domain/state.test.ts` and related backup/UI suites. Run `npm test` to exercise the corrected behavior.
