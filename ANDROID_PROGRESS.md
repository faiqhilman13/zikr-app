# Android Version — Progress & Pending

## Project Setup

Kotlin Multiplatform project initialized with:
- **shared/** — KMP shared module (Android + iOS targets configured)
- **androidApp/** — Android app module (Jetpack Compose, Material3)
- Gradle 8.7, AGP 8.5.2, Kotlin 1.9.25, Compose BOM 2024.09.02
- shared dependencies: `kotlinx-datetime`, `kotlinx-serialization-json`
- Added dependencies: `navigation-compose`, `work-runtime-ktx`, `core-ktx`

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
| SharedPreferences persistence | Done |
| Onboarding flow | Done — name, daily goal, preset picker |
| Counter (tap +1/+10/+33) | Done — with haptic feedback |
| Preset switching (5 built-in + custom) | Done |
| Timer (start/pause, per-preset targets) | Done |
| Undo last increment | Done |
| Streak tracking + reward badges | Done (via shared module) |
| Daily goal + per-preset targets | Done |
| Custom preset CRUD | Done |
| Reminder preference toggles | Done |
| **Custom theme** | Done — royal blue + gold + ivory, full dark mode support |
| **Navigation icons** | Done — Material Icons (SmartButton, LocalFireDepartment, Park, History, Settings) |
| **Arabic text styling** | Done — Arabic text displayed with serif font weight for preset names |
| **Haptic feedback** | Done — vibration on increment (+1/+10/+33) and tab switches |
| **Localization** | Done — all strings extracted to `strings.xml` |
| **History improvements** | Done — weekly bar chart (reps/time toggle), 35-day calendar heatmap, stats row, daily log |
| **Garden visualization** | Done — Canvas-drawn tree with 5 growth stages (seed → sprout → sapling → growing → full), animated pulse, 4 tree types (Olive, Palm, Lote, Cedar), hadith banner, stats pills |
| **Notifications** | Done — notification channels created (reminders + timer), AlarmManager + WorkManager infrastructure |
| **Live Activity equivalent** | Done — foreground service notification for active timer |
| **R8/ProGuard** | Done — minification enabled for release builds |
| **App theme** | Done — custom `Theme.Zikr` with status bar color, XML themes for light/dark |

---

## What's Still Pending

### UX / Visual
- [ ] **App icon & splash screen** — branded assets (needs design)
- [ ] **Rewards screen polish** — level-up animation, streak flame animation

### Architecture / Quality
- [ ] **DI framework** — Hilt or Koin for dependency injection
- [ ] **androidMain/ platform code** — add actual implementations if needed (currently empty)
- [ ] **iOS-KMP integration** — connect shared module to iOS app via KMP framework (iosMain/, Xcode integration)
- [ ] **Unify dual core** — iOS currently uses native Swift `ZikrCore` SPM package, not the KMP shared module

### Build & CI
- [ ] **Resolve Gradle download** — VPN, manual download, or mirror
- [ ] **Verify build compiles** — hasn't been tested yet (Gradle download blocked)
- [ ] **Add CI pipeline** — GitHub Actions for Android builds
- [ ] **Add instrumentation tests** — Android UI tests

---

## iOS <-> Android Logic Split

There are currently **two parallel implementations** of the same business logic:

| | iOS (Swift) | Android (Kotlin/KMP) |
|---|---|---|
| Models | `Sources/ZikrCore/ZikrModels.swift` | `shared/.../Models.kt` |
| Store | `Sources/ZikrCore/SharedZikrStore.swift` | `shared/.../Store.kt` |
| Engines | `Sources/ZikrCore/StreakRewardEngine.swift` | `shared/.../Engines.kt` |
| Reminders | `Sources/ZikrCore/ReminderPlanner.swift` | `shared/.../Engines.kt` |
| Day utils | `Sources/ZikrCore/DayKey.swift` | `shared/.../DayKey.kt` |
| Community | `Sources/ZikrCore/CommunityRepository.swift` | `shared/.../Store.kt` (mock) |

Long-term goal: iOS should consume the KMP shared module instead of the native Swift package.