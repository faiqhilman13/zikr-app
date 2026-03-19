import Foundation

public enum DhikrKind: String, CaseIterable, Codable, Sendable, Identifiable {
    case salawat
    case tahlil
    case tasbih
    case takbir
    case tahmid
    case custom

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .salawat: return "Salawat"
        case .tahlil: return "Tahlil"
        case .tasbih: return "Tasbih"
        case .takbir: return "Takbir"
        case .tahmid: return "Alhamdulillah"
        case .custom: return "Custom"
        }
    }
}

public struct DhikrPreset: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var title: String
    public var arabic: String
    public var transliteration: String
    public var kind: DhikrKind
    public var colorName: String

    public init(
        id: String = UUID().uuidString,
        title: String,
        arabic: String,
        transliteration: String,
        kind: DhikrKind,
        colorName: String
    ) {
        self.id = id
        self.title = title
        self.arabic = arabic
        self.transliteration = transliteration
        self.kind = kind
        self.colorName = colorName
    }

    public static let starterPresets: [DhikrPreset] = [
        .init(
            id: "salawat",
            title: "Salawat",
            arabic: "اللهم صل على سيدنا محمد",
            transliteration: "Allahumma salli 'ala Sayyidina Muhammad",
            kind: .salawat,
            colorName: "rose"
        ),
        .init(
            id: "tahlil",
            title: "Tahlil",
            arabic: "لا إله إلا الله",
            transliteration: "La ilaha illa Allah",
            kind: .tahlil,
            colorName: "emerald"
        ),
        .init(
            id: "tasbih",
            title: "Tasbih",
            arabic: "سبحان الله",
            transliteration: "SubhanAllah",
            kind: .tasbih,
            colorName: "indigo"
        ),
        .init(
            id: "takbir",
            title: "Takbir",
            arabic: "الله أكبر",
            transliteration: "Allahu Akbar",
            kind: .takbir,
            colorName: "amber"
        ),
        .init(
            id: "tahmid",
            title: "Alhamdulillah",
            arabic: "الحمد لله",
            transliteration: "Alhamdulillah",
            kind: .tahmid,
            colorName: "teal"
        )
    ]
}

public struct CountEvent: Identifiable, Codable, Hashable, Sendable {
    public var id: UUID
    public var presetID: String
    public var amount: Int
    public var occurredAt: Date

    public init(id: UUID = UUID(), presetID: String, amount: Int, occurredAt: Date) {
        self.id = id
        self.presetID = presetID
        self.amount = amount
        self.occurredAt = occurredAt
    }
}

public struct DayProgress: Identifiable, Codable, Hashable, Sendable {
    public var isoDate: String
    public var counts: [String: Int]
    public var totalCount: Int
    public var goalCompleted: Bool
    public var completedAt: Date?

    public init(
        isoDate: String,
        counts: [String: Int] = [:],
        totalCount: Int = 0,
        goalCompleted: Bool = false,
        completedAt: Date? = nil
    ) {
        self.isoDate = isoDate
        self.counts = counts
        self.totalCount = totalCount
        self.goalCompleted = goalCompleted
        self.completedAt = completedAt
    }

    public var id: String { isoDate }
}

public struct DailyGoal: Codable, Hashable, Sendable {
    public var targetCount: Int
    public var rewardName: String

    public init(targetCount: Int = 100, rewardName: String = "Noor Chest") {
        self.targetCount = targetCount
        self.rewardName = rewardName
    }
}

public struct StreakState: Codable, Hashable, Sendable {
    public var current: Int
    public var longest: Int
    public var multiplier: Int
    public var lastCompletedDate: String?

    public init(current: Int = 0, longest: Int = 0, multiplier: Int = 1, lastCompletedDate: String? = nil) {
        self.current = current
        self.longest = longest
        self.multiplier = multiplier
        self.lastCompletedDate = lastCompletedDate
    }
}

public struct Badge: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var title: String
    public var detail: String
    public var iconName: String

    public init(id: String, title: String, detail: String, iconName: String) {
        self.id = id
        self.title = title
        self.detail = detail
        self.iconName = iconName
    }
}

public struct RewardState: Codable, Hashable, Sendable {
    public var xp: Int
    public var level: Int
    public var badges: [Badge]

    public init(xp: Int = 0, level: Int = 1, badges: [Badge] = []) {
        self.xp = xp
        self.level = level
        self.badges = badges
    }
}

public struct TimeOfDay: Codable, Hashable, Sendable, Identifiable {
    public var hour: Int
    public var minute: Int

    public init(hour: Int, minute: Int) {
        self.hour = hour
        self.minute = minute
    }

    public var id: String {
        String(format: "%02d:%02d", hour, minute)
    }

    public var label: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        let calendar = Calendar(identifier: .gregorian)
        let date = calendar.date(from: DateComponents(year: 2024, month: 1, day: 1, hour: hour, minute: minute)) ?? Date()
        return formatter.string(from: date)
    }

    public static let commonChoices: [TimeOfDay] = [
        .init(hour: 7, minute: 0),
        .init(hour: 9, minute: 0),
        .init(hour: 13, minute: 0),
        .init(hour: 17, minute: 30),
        .init(hour: 20, minute: 0),
        .init(hour: 21, minute: 0)
    ]
}

public enum PrayerName: String, CaseIterable, Codable, Sendable, Identifiable {
    case fajr
    case dhuhr
    case asr
    case maghrib
    case isha

    public var id: String { rawValue }

    public var displayName: String {
        rawValue.capitalized
    }
}

public struct PrayerTimes: Codable, Hashable, Sendable {
    public var fajr: TimeOfDay
    public var dhuhr: TimeOfDay
    public var asr: TimeOfDay
    public var maghrib: TimeOfDay
    public var isha: TimeOfDay

    public init(
        fajr: TimeOfDay = .init(hour: 5, minute: 30),
        dhuhr: TimeOfDay = .init(hour: 13, minute: 10),
        asr: TimeOfDay = .init(hour: 16, minute: 30),
        maghrib: TimeOfDay = .init(hour: 19, minute: 20),
        isha: TimeOfDay = .init(hour: 20, minute: 45)
    ) {
        self.fajr = fajr
        self.dhuhr = dhuhr
        self.asr = asr
        self.maghrib = maghrib
        self.isha = isha
    }

    public func all() -> [(PrayerName, TimeOfDay)] {
        [
            (.fajr, fajr),
            (.dhuhr, dhuhr),
            (.asr, asr),
            (.maghrib, maghrib),
            (.isha, isha)
        ]
    }
}

public struct ReminderPreference: Codable, Hashable, Sendable {
    public var simpleDailyEnabled: Bool
    public var simpleReminderTimes: [TimeOfDay]
    public var smartNudgesEnabled: Bool
    public var smartNudgeTimes: [TimeOfDay]
    public var prayerTimesEnabled: Bool
    public var prayerTimes: PrayerTimes

    public init(
        simpleDailyEnabled: Bool = true,
        simpleReminderTimes: [TimeOfDay] = [.init(hour: 21, minute: 0)],
        smartNudgesEnabled: Bool = true,
        smartNudgeTimes: [TimeOfDay] = [.init(hour: 13, minute: 0), .init(hour: 17, minute: 30), .init(hour: 20, minute: 30)],
        prayerTimesEnabled: Bool = true,
        prayerTimes: PrayerTimes = PrayerTimes()
    ) {
        self.simpleDailyEnabled = simpleDailyEnabled
        self.simpleReminderTimes = simpleReminderTimes
        self.smartNudgesEnabled = smartNudgesEnabled
        self.smartNudgeTimes = smartNudgeTimes
        self.prayerTimesEnabled = prayerTimesEnabled
        self.prayerTimes = prayerTimes
    }
}

public struct FriendProgress: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var userName: String
    public var avatar: String
    public var totalCount: Int
    public var streakCount: Int
    public var isCurrentUser: Bool

    public init(
        id: String = UUID().uuidString,
        userName: String,
        avatar: String,
        totalCount: Int,
        streakCount: Int,
        isCurrentUser: Bool = false
    ) {
        self.id = id
        self.userName = userName
        self.avatar = avatar
        self.totalCount = totalCount
        self.streakCount = streakCount
        self.isCurrentUser = isCurrentUser
    }
}

public struct CircleSummary: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var motto: String
    public var members: [FriendProgress]

    public init(id: String = UUID().uuidString, name: String, motto: String, members: [FriendProgress]) {
        self.id = id
        self.name = name
        self.motto = motto
        self.members = members.sorted { lhs, rhs in
            if lhs.totalCount == rhs.totalCount {
                return lhs.userName < rhs.userName
            }
            return lhs.totalCount > rhs.totalCount
        }
    }

    public var groupTotal: Int {
        members.reduce(0) { $0 + $1.totalCount }
    }
}

public struct ZikrAppState: Codable, Hashable, Sendable {
    public var hasCompletedOnboarding: Bool
    public var userName: String
    public var selectedPresetID: String
    public var presets: [DhikrPreset]
    public var today: DayProgress
    public var history: [DayProgress]
    public var recentEvents: [CountEvent]
    public var dailyGoal: DailyGoal
    public var streak: StreakState
    public var rewards: RewardState
    public var reminderPreference: ReminderPreference
    public var circles: [CircleSummary]
    public var liveActivityEnabled: Bool

    public init(
        hasCompletedOnboarding: Bool,
        userName: String,
        selectedPresetID: String,
        presets: [DhikrPreset],
        today: DayProgress,
        history: [DayProgress],
        recentEvents: [CountEvent],
        dailyGoal: DailyGoal,
        streak: StreakState,
        rewards: RewardState,
        reminderPreference: ReminderPreference,
        circles: [CircleSummary],
        liveActivityEnabled: Bool
    ) {
        self.hasCompletedOnboarding = hasCompletedOnboarding
        self.userName = userName
        self.selectedPresetID = selectedPresetID
        self.presets = presets
        self.today = today
        self.history = history
        self.recentEvents = recentEvents
        self.dailyGoal = dailyGoal
        self.streak = streak
        self.rewards = rewards
        self.reminderPreference = reminderPreference
        self.circles = circles
        self.liveActivityEnabled = liveActivityEnabled
    }

    public static func initial(now: Date = Date(), calendar: Calendar = .current) -> ZikrAppState {
        let dayKey = DayKey.string(from: now, calendar: calendar)
        return ZikrAppState(
            hasCompletedOnboarding: false,
            userName: "",
            selectedPresetID: DhikrPreset.starterPresets.first?.id ?? "salawat",
            presets: DhikrPreset.starterPresets,
            today: DayProgress(isoDate: dayKey),
            history: [],
            recentEvents: [],
            dailyGoal: DailyGoal(),
            streak: StreakState(),
            rewards: RewardState(),
            reminderPreference: ReminderPreference(),
            circles: [],
            liveActivityEnabled: true
        )
    }
}

public extension ZikrAppState {
    var selectedPreset: DhikrPreset? {
        presets.first { $0.id == selectedPresetID }
    }

    var remainingToGoal: Int {
        max(dailyGoal.targetCount - today.totalCount, 0)
    }

    var completionRatio: Double {
        guard dailyGoal.targetCount > 0 else { return 0 }
        return min(Double(today.totalCount) / Double(dailyGoal.targetCount), 1)
    }

    var allProgress: [DayProgress] {
        [today] + history
    }
}
