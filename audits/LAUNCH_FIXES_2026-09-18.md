# Launch fixes and verification — 18 September 2026

All actionable findings from the original launch audit have been addressed. The remaining release sign-off is physical-device testing, described below. A passing audit cannot prove the absence of every possible defect.

## Changes

- **Concurrent saves:** every mutation reads and updates the latest record in one IndexedDB transaction. Windows receive live database updates. Counts only advance after successful writes; failed storage pauses editing instead of accepting unsaved counts.
- **Safe recovery:** reads never write fallback state. Failed reads/validation preserve the stored row and show a retry/support screen. Queued actions stop after a storage failure. An error boundary prevents a rendering failure from becoming a blank screen.
- **Migration:** database version 2 copies the original row unchanged into a dedicated `records` store. Legacy `state` is retained as a recovery copy; old clients cannot overwrite the new record. Reset/import clear the legacy copy atomically. Both windows reloaded to the new app during the tested service-worker upgrade.
- **Import/reset conflicts:** revisions reject stale replacements, and a generation token rejects queued actions from before a reset/import. Restore does not resurrect a running timer, analytics opt-in, or notification subscription from another device.
- **Input validation:** real calendar dates, unique days/phrase IDs, integer nonnegative counts and safe identifiers are validated. Invalid data is rejected rather than partly overwriting history. Targets are consistently clamped to integer 0–9999. Backup size, salt/IV sizes and key-derivation work are bounded.
- **Goals/history:** today's completion is recalculated after goal changes without rewriting older completions. No-goal days are not automatically completed. Deleted custom phrases are archived with their names and counts; old orphan counts remain visible. Garden progress only counts repetitions toward their respective intentions.
- **Timers:** deleting/switching a phrase banks its timer. Suspended sessions stop at their starting day's midnight, without manufacturing overnight practice; this behavior is explained in the app and support page.
- **Local-only launch:** the unsafe shared-blob cloud-sync implementation and UI have been removed. Unconfigured reminders are explicitly unavailable; unconfigured analytics has no enable switch. If push is configured later, unsubscribe happens locally before contacting the server, failures are surfaced, and reset/import unsubscribe first.
- **Backups:** cancelled sharing does not claim success; iPad desktop-style user agents are recognized. On installed Apple devices, encryption prepares the backup and a separate Save backup tap opens the share sheet with a fresh user gesture. Browser downloads remain available.
- **PWA updates:** update checks run on registration, returning to the app, and hourly while visible/online. Update/offline notices also appear before onboarding. The update action is disabled while writes are pending. Install prompt failures fall back to instructions; app-installed events remove the install offer.
- **Layout/accessibility:** Settings fits 320px in English/Malay/Arabic. Counter, Progress and Settings fit at 200% root text size at 320px. Long counter text can expand rather than becoming an inaccessible nested scroll area. The backup file input is hidden behind its labeled button.
- **Dependencies:** regenerated lockfile, security patch updates including sharp 0.35.4. Full and production-only npm audits report zero vulnerabilities. Standard `npm ci` succeeds.

## Evidence

- 61 automated tests across 13 files, including transaction concurrency (100 competing taps), failed reads followed by attempted edits, corrupt-row preservation, write/quota failure rollback, stale imports, reset conflicts, legacy migration/isolation, malformed backups, goal changes, archived history, midnight timers, iPad detection, sharing cancellation and Apple backup preparation.
- ESLint, TypeScript/Vite production build and `git diff --check` passed.
- Browser reproduction now produces **11**, not 6: both windows begin at 5, one adds 5 and the other adds 1. Both show 11 after reload.
- Offline cached relaunch + tap + reload preserved **12**.
- Old commit `46bd012` was built separately and served from an isolated test origin. With two windows open, five taps and an active timer, the actual update prompt activated the new service worker, reloaded both windows and preserved count/timer state.
- A browser-injected IndexedDB read failure during a tap displayed the protected-history screen. Retry/reload preserved the previous **12**; the failed tap was not shown as saved. The temporary fault was removed by reload.
- A real browser-exported encrypted JSON file was downloaded and independently decrypted: **12 taps and 52 timed seconds**. Importing it after adding another tap restored **12**, which remained after reload.
- Axe WCAG A/AA checks returned no violations on checked Counter, Progress and Settings screens after the two detected issues were fixed. Light/dark settings were checked. Automated checks do not replace VoiceOver/TalkBack.
- Install instruction dialog: Shift+Tab/Tab wrapped correctly, Escape closed it, and focus returned to Install Zikr.
- 320px document-width checks passed in English/Malay/Arabic. At 200% root text size the three main views also measured 320px without horizontal overflow. This is text-resize emulation, not a claim about every mobile OS accessibility setting.

## What only the device owner needs to test

Use **https://myzikr.netlify.app/** after the fixed deployment is verified. If an update is offered, choose Update now and close any remaining old windows first.

On an iPhone (Safari) and an Android phone (Chrome), with iPad included if available:

1. Install/Add to Home Screen, then launch from the icon. Confirm the icon, standalone screen, safe-area spacing and Arabic text look correct.
2. Record a known count, turn on airplane mode, force-close the app, reopen, and confirm the count. Add one more offline and repeat.
3. Export a backup and save it to Files/Downloads. On Apple devices, tap Save backup after encryption. Cancel once and verify no success claim; then save successfully.
4. Add one temporary test count, import that backup, confirm replacement, and verify the earlier count returns. Keep the backup file/passphrase until satisfied. Do not reset real history just for testing.
5. Try VoiceOver/TalkBack, large system text, and a timer while locking/unlocking the phone. Verify controls are reachable, the count is announced sensibly, and the timer behavior is acceptable.

No cloud account, push-service credentials or analytics setup are required for this launch. The existing Netlify URL can remain the launch URL. A custom domain is optional; choose it before growing a user base because browser storage is origin-specific.

## Operational notes

- Database migration is forward-compatible with old data, but old code does not read the new `records` store. **Do not roll back to pre-fix app code after users have migrated.** Use a forward fix or a version aware of `records`; encrypted backups remain the portable recovery path.
- Legacy windows are isolated, not merged after migration. Apply the update and close old windows before continuing practice. The tested service-worker update reloaded both open clients automatically.
- Backups larger than 20 MB are rejected with an error rather than risking uncontrolled import work.
- Browser test data was synthetic and used localhost; actual production history was not reset/imported.
- Dependency maintenance used a temporary newer npm because npm 10's dependency resolver crashed. Normal npm 10 `npm ci` then succeeded with the generated lockfile. Per-command release-age exceptions were limited to the specific patched packages; no global npm configuration was changed.
