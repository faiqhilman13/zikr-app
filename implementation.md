# Zikr App — Implementation Summary

## Overview

**Zikr** is an iOS dhikr (Islamic remembrance) counter app built with SwiftUI. It tracks daily recitations across multiple dhikr presets, maintains streaks, and rewards consistent practice.

---

## Current State

### What Works

- **Counter** — Tap the orb to increment. Shows current dhikr's individual count + daily progress ring
- **Preset switching** — Switching presets shows that preset's own count (per-dhikr counting)
- **Streaks** — App tracks consecutive days of any activity. Streak multiplier: x3 (3+ days), x4 (7+ days), x5 (30+ days)
- **Rewards** — Flame-streak badge, milestone count badges (10, 100, 500, 1000), milestone labels
- **Haptics** — Light impact haptic fires on every orb tap
- **History** — Calendar heatmap showing activity days in current month
- **Settings** — Toggle haptics, reset all data, app version
- **Onboarding** — 4-step intro flow with preset selection
- **Theme** — Royal blue (#1E3A8A) + gold (#D4A017) + ivory (#FAF8F5) with full dark mode support
- **Dark mode** — Automatically follows system light/dark setting via `ZikrColors` environment; deep navy (#0A1628) background + light ivory text in dark mode. Toggle via iPhone Settings → Display & Brightness or Control Center.
- **Live Activity (Dynamic Island)** — Tracks dhikr in the Dynamic Island (lock screen widget removed)
- **Build** — Compiles cleanly on Xcode 26 / iOS 26 simulator
- **Tests** — 4 Swift package tests pass

### What's Broken / Known Issues

1. **Lock screen widget removed** — User preferred not to use it. `ZikrWidgetExtension/` directory still exists with all code intact. Can be restored by re-adding the target in `project.pbxproj`.
2. **No physical device verification since redesign** — Last confirmed working on physical iPhone was before the full UI redesign. Needs user validation.
3. **Circles tab hidden** — Firebase Community feature is not wired up. The Circles tab was removed from navigation. To re-enable: add it back to `RootView.swift` and implement `FirebaseCommunityRepository`.
4. **No App Store distribution** — Physical device signing requires Xcode automatic signing + user trusting the developer profile on-device (Settings → General → VPN & Device Management).

---

## Architecture

```
ZikrApp/
├── App/
│   ├── ZikrApp.swift              — @main entry point
│   ├── RootView.swift             — TabView (Counter, Rewards, History, Settings)
│   ├── ZikrAppViewModel.swift     — ObservableObject, bridges UI to ZikrCore
│   └── DhikrTheme.swift           — ZikrPalette colors, ZikrColors semantic colors, badge/theme configs
├── Features/
│   ├── Counter/CounterView.swift  — Main counting UI
│   ├── Rewards/RewardsView.swift  — Streak + milestone badges
│   ├── History/HistoryView.swift  — Calendar heatmap
│   ├── Settings/SettingsView.swift
│   └── Onboarding/OnboardingView.swift
├── Services/
│   └── LiveActivityManager.swift   — Dynamic Island Live Activity (separate from lock screen widget)
├── SharedActivity/
│   └── ZikrActivityAttributes.swift — ActivityAttributes for Live Activities
Sources/ZikrCore/
│   ├── ZikrModels.swift           — Data models (DhikrPreset, DayProgress, etc.)
│   ├── SharedZikrStore.swift      — UserDefaults persistence (App Group)
│   ├── StreakRewardEngine.swift   — Streak calculation + badge definitions
│   └── CommunityRepository.swift  — MockCommunityRepository (Firebase unimplemented)
Tests/
│   └── ZikrCoreTests/             — 4 passing tests
```

### Key Data Model

- **`ZikrAppState`** — `today: DayProgress`, `streak: StreakState`, `reward: RewardState`, `selectedPresetID: String`
- **`DayProgress`** — `counts: [presetID: Int]` (per-dhikr counts), `date: Date`
- **`DhikrPreset`** — id, name, emoji, targetDaily, countToday, countTotal, lastCountDate
- **App Group** — `group.com.faiqhilman.zikr` (shared between main app and widget)

---

## How to Run

### Simulator
```bash
cd /Users/faiqhilman/Projects/zikr-app
open Zikr.xcodeproj
# Build and Run (Cmd+R) in Xcode to iPhone 17 simulator
```

### Physical iPhone
1. Open `Zikr.xcodeproj` in Xcode
2. Select your iPhone as the target device
3. Enable **Automatic Signing** in the Signing & Capabilities tab
4. Build and Run (Cmd+R)
5. On iPhone: Settings → General → VPN & Device Management → Trust your developer profile

---

## Next Steps (Manual)

- [ ] **Validate on physical iPhone** — Confirm the redesigned UI + dark mode + per-dhikr counting works correctly
- [ ] **Re-add lock screen widget** — Restore `ZikrWidgetExtension/` files and add target back to `project.pbxproj`
- [ ] **Re-enable Circles tab** — Implement Firebase integration and add tab back to `RootView.swift`
- [ ] **App Store** — Create App Store listing, set up App Store Connect, archive for distribution

---

## Changelog

### 2026-03-19
- Complete UI redesign: royal blue (#1E3A8A) + gold (#D4A017) + ivory (#FAF8F5)
- **Dark mode** — Full system dark mode support: deep navy (#0A1628) backgrounds, ivory text, dark card surfaces. `ZikrColors` environment struct drives adaptive colors across all views. Follows iPhone system setting (Settings → Display & Brightness or Control Center).
- Per-dhikr counter: switching presets shows individual preset count
- Removed +10 lock screen button (user preference: 1 tap = 1 recitation)
- Added haptics on orb tap
- Added streak multiplier explanation below x3/x4/x5 pill
- Removed Circles tab (Firebase not configured)
- Renamed "kill-streak" badge → "flame-streak"
- **Lock screen widget removed** — Widget extension target removed from project. `ZikrWidgetExtension/` code still exists. Live Activity (Dynamic Island) still works.
- 4/4 tests passing
