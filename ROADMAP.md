# Zikr App Roadmap

## Goal

Ship `Zikr` to the App Store as a polished iPhone app for daily dhikr tracking, lock-screen-friendly counting, reminders, streaks, rewards, and private friends circles.

## Current State

- Native SwiftUI app scaffold exists.
- Shared `ZikrCore` domain logic exists for counts, goals, streaks, rewards, reminders, and circles.
- WidgetKit/App Intents/Live Activity scaffolding exists.
- Xcode project builds successfully for `iphonesimulator`.
- Swift package tests are passing.
- iOS Simulator runtime is still not installed locally.
- Firebase/community is still scaffolded, not production-configured.

## Milestone 1 — Core Product Completion

### Counter Experience

- [ ] Refine the main counter UI for one-handed use.
- [ ] Add haptics/sound options for each tap.
- [ ] Add reset/undo safeguards for accidental counts.
- [ ] Add per-dhikr stats instead of only total counts.
- [ ] Add session timer / active session state if needed.

### Dhikr Presets

- [ ] Finalize built-in presets: salawat, tahlil, tasbih, takbir, tahmid.
- [ ] Improve custom dhikr creation/edit/delete.
- [ ] Add localization-ready strings for dhikr labels and UI copy.

### Daily Goal + Rewards

- [ ] Finalize streak rules.
- [ ] Finalize reward tiers, XP progression, and badge unlock logic.
- [ ] Decide whether to keep the label `kill streak` or rename it to something more App Review friendly such as `Noor streak` or `Barakah streak`.

## Milestone 2 — Lock Screen + Notification Experience

### Widget / Live Activity

- [ ] Test lock-screen widget behavior on device.
- [ ] Test Live Activity updates from in-app and App Intent increments.
- [ ] Confirm app-group shared state behavior is stable.
- [ ] Add fallback UX if Live Activities are disabled.

### Reminders

- [ ] Test simple daily reminders.
- [ ] Test smart nudges stopping after goal completion.
- [ ] Test prayer-time reminders.
- [ ] Add reminder copy tuning and quiet-hours behavior.

## Milestone 3 — Backend + Community

### Firebase Integration

- [ ] Add Firebase iOS SDK through Swift Package Manager in Xcode.
- [ ] Configure `GoogleService-Info.plist` for app target.
- [ ] Set up Firebase Auth.
- [ ] Set up Firestore collections for users, circles, memberships, daily aggregates, and invites.
- [ ] Replace mock community repository data with real Firestore-backed data.

### Friends Circles

- [ ] Create invite flow.
- [ ] Create join/leave circle flow.
- [ ] Add private leaderboard refresh logic.
- [ ] Add reactions or encouragement messages.
- [ ] Add anti-cheat / suspicious-count guardrails.

### Moderation / Safety

- [ ] Add report/block capability if social messaging or reactions are enabled.
- [ ] Define abuse handling and moderation policy.

## Milestone 4 — Production iOS Setup

### Apple Developer Configuration

- [ ] Set final bundle identifiers.
- [ ] Set Apple Team ID in Xcode.
- [ ] Enable signing for app and widget extension.
- [ ] Enable `App Groups` capability for both targets.
- [ ] Verify Live Activities capability requirements.

### Local Environment

- [ ] Install an iOS Simulator runtime in Xcode Settings > Components.
- [ ] Run on simulator.
- [ ] Run on at least one physical iPhone.
- [ ] Verify push/notification permissions on device.

## Milestone 5 — App Store Readiness

### Store Assets

- [ ] Create app icon set.
- [ ] Prepare iPhone screenshots.
- [ ] Write App Store title, subtitle, description, keywords, and promotional text.
- [ ] Add privacy policy URL.
- [ ] Add support URL.

### Legal / Review Readiness

- [ ] Complete App Privacy questionnaire in App Store Connect.
- [ ] Document what Firebase data is collected and why.
- [ ] Add account deletion flow if sign-in is required for community features.
- [ ] Review Islamic/religious wording and ensure tone is respectful and clear.
- [ ] Ensure lock-screen claims are accurate and do not imply unsupported iOS behavior.

## Milestone 6 — QA + Release Validation

### Functional Validation

- [ ] Add more unit tests for streak rollover, reward unlocks, and reminders.
- [ ] Add UI tests for onboarding, counting, and settings.
- [ ] Validate widget and Live Activity update paths.
- [ ] Validate fresh install, returning user, and day rollover flows.

### Build Validation

- [ ] `swift test`
- [ ] `xcodebuild -project Zikr.xcodeproj -target Zikr -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build`
- [ ] Archive successfully in Xcode.
- [ ] Upload successfully to TestFlight.

## Milestone 7 — Launch

- [ ] Internal device testing.
- [ ] TestFlight beta round.
- [ ] Fix beta issues.
- [ ] Final App Store Connect metadata review.
- [ ] Submit for App Review.
- [ ] Release.

## Recommended Immediate Next Steps

1. Install an iOS Simulator runtime.
2. Add Firebase SDK + real backend config.
3. Configure Apple signing, bundle IDs, and App Groups.
4. Test widget + Live Activity behavior on a real device.
5. Prepare App Store assets and privacy/compliance items.

## Publish Exit Criteria

The app is ready to submit when all of the following are true:

- The app builds, archives, and runs on device.
- Notifications, widget updates, and Live Activity flows work reliably.
- Community/auth flows are real, not mocked.
- App Store assets and privacy disclosures are complete.
- Signing/capabilities are configured for both the app and widget extension.
- TestFlight validation passes without blocking issues.
