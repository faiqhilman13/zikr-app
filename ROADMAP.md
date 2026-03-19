# Zikr App Roadmap

## Goal

Ship `Zikr` to the App Store as a polished iPhone app for daily dhikr tracking, reminders, streaks, rewards, and private friends circles.

## Current State

**Build:** Xcode 26 / iOS 26 — compiles and runs on iOS Simulator and physical iPhone.
**Tests:** 4/4 Swift package tests passing.
**Repo:** Pushed to `https://github.com/faiqhilman13/zikr-app`.

---

## Milestone 1 — Core Product Completion ✅

### Counter Experience

- [x] Main counter UI with tap orb — redesigned with royal blue + gold + ivory theme
- [x] Haptics on orb tap (`UIImpactFeedbackGenerator(.light)`)
- [x] Per-dhikr stats — switching presets shows individual preset count
- [x] Add reset/undo safeguards for accidental counts — undo banner appears for 5s after each tap with undo button
- [ ] Add session timer / active session state if needed

### Dhikr Presets

- [x] Built-in presets: salawat, tahlil, tasbih, takbir, tahmid
- [x] Improve custom dhikr creation/edit/delete — addCustomPreset, updatePreset, deletePreset (starter presets protected)
- [ ] Add localization-ready strings for dhikr labels and UI copy

### Daily Goal + Rewards

- [x] Streak rules finalized — x3 (3+ days), x4 (7+ days), x5 (30+ days)
- [x] Reward tiers, XP progression, and badge unlock logic finalized
- [x] Renamed "kill-streak" → "flame-streak" (App Store friendly)

### Theme

- [x] Royal blue (#1E3A8A) + gold (#D4A017) + ivory (#FAF8F5) theme
- [x] Full dark mode — follows iPhone system setting via `ZikrColors` environment

---

## Milestone 2 — Lock Screen + Notification Experience

### Widget / Live Activity

- [x] Lock screen widget built but **removed** — user preferred not to use it. Code exists in `ZikrWidgetExtension/` (target removed from project, can be restored).
- [x] Live Activity (Dynamic Island) implemented via `LiveActivityManager.swift`
- [ ] Test Live Activity updates on physical device
- [ ] Confirm app-group shared state behavior is stable
- [ ] Add fallback UX if Live Activities are disabled

### Reminders

- [ ] Test simple daily reminders
- [ ] Test smart nudges stopping after goal completion
- [ ] Test prayer-time reminders
- [ ] Add reminder copy tuning and quiet-hours behavior

---

## Milestone 3 — Backend + Community

### Firebase Integration

- [ ] Add Firebase iOS SDK through Swift Package Manager
- [ ] Configure `GoogleService-Info.plist` for app target
- [ ] Set up Firebase Auth
- [ ] Set up Firestore collections for users, circles, memberships, daily aggregates, and invites
- [ ] Replace mock community repository data with real Firestore-backed data

### Friends Circles

- [ ] Circles tab hidden — Firebase not configured. Re-enable by adding tab back to `RootView.swift` and implementing `FirebaseCommunityRepository`.
- [ ] Create invite flow
- [ ] Create join/leave circle flow
- [ ] Add private leaderboard refresh logic
- [ ] Add reactions or encouragement messages
- [ ] Add anti-cheat / suspicious-count guardrails

### Moderation / Safety

- [ ] Add report/block capability if social messaging or reactions are enabled
- [ ] Define abuse handling and moderation policy

---

## Milestone 4 — Production iOS Setup

### Apple Developer Configuration

- [ ] Set final bundle identifiers
- [ ] Set Apple Team ID in Xcode
- [ ] Enable signing for app (widget extension signing is the blocker for physical device)
- [ ] Enable `App Groups` capability for both targets
- [ ] Verify Live Activities capability requirements

### Local Environment

- [ ] Run on at least one physical iPhone — **pending**
- [ ] Verify push/notification permissions on device
- [ ] Validate dark mode on physical device

---

## Milestone 5 — App Store Readiness

### Store Assets

- [ ] Create app icon set
- [ ] Prepare iPhone screenshots
- [ ] Write App Store title, subtitle, description, keywords, and promotional text
- [ ] Add privacy policy URL
- [ ] Add support URL

### Legal / Review Readiness

- [ ] Complete App Privacy questionnaire in App Store Connect
- [ ] Document what Firebase data is collected and why (if community features are enabled)
- [ ] Add account deletion flow if sign-in is required for community features
- [ ] Review Islamic/religious wording and ensure tone is respectful and clear
- [ ] Ensure lock-screen claims are accurate and do not imply unsupported iOS behavior

---

## Milestone 6 — QA + Release Validation

### Functional Validation

- [ ] Add more unit tests for streak rollover, reward unlocks, and reminders
- [ ] Add UI tests for onboarding, counting, and settings
- [x] Validate widget and Live Activity update paths (widget removed, Live Activity pending device test)
- [ ] Validate fresh install, returning user, and day rollover flows
- [ ] Validate dark mode transitions on device

### Build Validation

- [x] `swift test`
- [x] `xcodebuild ... CODE_SIGNING_ALLOWED=NO build` (simulator passes)
- [ ] Archive successfully in Xcode
- [ ] Upload successfully to TestFlight

---

## Milestone 7 — Launch

- [ ] Internal device testing
- [ ] TestFlight beta round
- [ ] Fix beta issues
- [ ] Final App Store Connect metadata review
- [ ] Submit for App Review
- [ ] Release

---

## Publish Exit Criteria

The app is ready to submit when all of the following are true:

- [ ] The app builds, archives, and runs on a physical iPhone.
- [ ] Notifications and Live Activity flows work reliably on device.
- [ ] Community/auth flows are real, not mocked (or circles remain hidden).
- [ ] App Store assets and privacy disclosures are complete.
- [ ] Signing/capabilities are configured for the app target.
- [ ] TestFlight validation passes without blocking issues.
