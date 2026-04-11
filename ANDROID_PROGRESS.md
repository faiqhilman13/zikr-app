# Android Version — Progress & Pending

## Project Setup

Kotlin Multiplatform project initialized with:
- **shared/** — KMP shared module (Android + iOS targets configured)
- **androidApp/** — Android app module (Jetpack Compose, Material3)
- Gradle 8.7, AGP 8.5.2, Kotlin 1.9.25, Compose BOM 2024.09.02
- shared dependencies: `kotlinx-datetime`, `kotlinx-serialization-json`

> **Note:** Gradle 8.7 download is slow due to ISP throttling of GitHub/Azure CDN.
> To build, either use a VPN or download `gradle-8.7-bin.zip` manually and place it in
> `~/.gradle/wrapper/dists/gradle-8.7-bin/`.

---

## What's Done

### Shared Module (`shared/src/commonMain/`)
| File | Description |
|------|-------------|
| `Models.kt` | All data models — DhikrPreset, DhikrKind, CountEvent, DayProgress, DailyGoal, ActiveDhikrTimer, StreakState, Badge, RewardState, PrayerTimes, etc. |
| `Engines.kt` | StreakEngine (streak counting, multiplier tiers), RewardEngine (XP, levels, badges), ReminderPlanner (simple/smart/prayer schedules) |
| `Store.kt` | ZikrStore — state management, persistence via KeyValueStorage interface, mutations (increment, undo, timer, onboarding, custom presets, daily rollover), JSON serialization |
| `DayKey.kt` | Date utilities using kotlinx-datetime |
| `commonTest/` | 7 unit tests covering store mutations, streak logic, timer behavior |

### Android App (`androidApp/`)
| Feature | Status |
|---------|--------|
| SharedPreferences persistence | Done — `AndroidPrefsStorage` bridges shared module |
| Onboarding flow | Done — name, daily goal, preset picker |
| Counter (tap +1/+10/+33) | Done |
| Preset switching (5 built-in + custom) | Done |
| Timer (start/pause, per-preset targets) | Done |
| Undo last increment | Done |
| Streak tracking + reward badges | Done (via shared module) |
| Daily goal + per-preset targets | Done |
| Custom preset CRUD | Done |
| Reminder preference toggles | Done (state only, no scheduling) |
| History view | Basic — plain list of days, no charts |
| Settings screen | Done |

---

## What's Pending

### UX / Visual (parity with iOS)
- [ ] **Theme** — custom colors (royal blue + gold + ivory), dark mode support
- [ ] **Navigation icons** — replace single-letter labels ("C", "R", "G", "H", "S") with proper Material Icons
- [ ] **App icon & splash screen** — branded assets
- [ ] **Arabic text styling** — custom font for dhikr text
- [ ] **Haptic feedback** — vibration on tap (Android `HapticFeedbackConstants`)
- [ ] **Localization** — extract hardcoded English strings to `strings.xml`

### Features (parity with iOS)
- [ ] **History improvements** — bar chart, calendar heatmap, stats row (iOS has weekly chart + 35-day calendar)
- [ ] **Garden visualization** — tree/garden animation with growth stages (currently just a progress bar)
- [ ] **Notifications/reminders** — actual scheduling via `AlarmManager` / `WorkManager` (toggles save state but don't schedule)
- [ ] **Live Activity equivalent** — ongoing notification for active dhikr session

### Architecture / Quality
- [ ] **Add navigation library** — Compose Navigation for type-safe routing
- [ ] **DI framework** — Hilt or Koin for dependency injection
- [ ] **R8/ProGuard** — enable minification for release builds
- [ ] **androidMain/ platform code** — add actual implementations if needed (currently empty)
- [ ] **iOS-KMP integration** — connect shared module to iOS app via KMP framework (iosMain/, Xcode integration)
- [ ] **Unify dual core** — iOS currently uses native Swift `ZikrCore` SPM package, not the KMP shared module

### Build & CI
- [ ] **Resolve Gradle download** — VPN, manual download, or mirror
- [ ] **Verify build compiles** — hasn't been tested yet
- [ ] **Add CI pipeline** — GitHub Actions for Android builds
- [ ] **Add instrumentation tests** — Android UI tests

---

## iOS ↔ Android Logic Split

There are currently **two parallel implementations** of the same business logic:

| | iOS (Swift) | Android (Kotlin/KMP) |
|---|---|---|
| Models | `Sources/ZikrCore/ZikrModels.swift` | `shared/.../Models.kt` |
| Store | `Sources/ZikrCore/SharedZikrStore.swift` | `shared/.../Store.kt` |
| Engines | `Sources/ZikrCore/StreakRewardEngine.swift` | `shared/.../Engines.kt` |
| Reminders | `Sources/ZikrCore/ReminderPlanner.swift` | `shared/.../Engines.kt` |
| Day utils | `Sources/ZikrCore/DayKey.swift` | `shared/.../DayKey.kt` |
| Community | `Sources/ZikrCore/CommunityRepository.swift` | `shared/.../Store.kt` (mock) |

Long-term goal: iOS should consume the KMP shared module instead of the native Swift package, but this requires Xcode/KMP framework integration that hasn't been done yet.