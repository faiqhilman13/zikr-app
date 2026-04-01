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
    public var perPresetTargets: [String: Int]
    public var rewardName: String

    public init(targetCount: Int = 100, perPresetTargets: [String: Int] = [:], rewardName: String = "Noor Chest") {
        self.targetCount = targetCount
        self.perPresetTargets = perPresetTargets
        self.rewardName = rewardName
    }

    public var effectiveTargetCount: Int {
        let sum = perPresetTargets.values.reduce(0, +)
        return sum > 0 ? sum : targetCount
    }
}

public struct ActiveDhikrTimer: Codable, Hashable, Sendable {
    public var presetID: String
    public var startedAt: Date

    public init(presetID: String, startedAt: Date) {
        self.presetID = presetID
        self.startedAt = startedAt
    }
}

public struct DailyTimerProgress: Codable, Hashable, Sendable {
    public var isoDate: String
    public var elapsedSecondsByPreset: [String: Int]
    public var activeTimer: ActiveDhikrTimer?

    public init(
        isoDate: String,
        elapsedSecondsByPreset: [String: Int] = [:],
        activeTimer: ActiveDhikrTimer? = nil
    ) {
        self.isoDate = isoDate
        self.elapsedSecondsByPreset = elapsedSecondsByPreset
        self.activeTimer = activeTimer
    }
}

public struct TimerGoalState: Codable, Hashable, Sendable {
    public var perPresetMinutes: [String: Int]

    public init(perPresetMinutes: [String: Int] = [:]) {
        self.perPresetMinutes = perPresetMinutes
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
    public var dailyTimerProgress: DailyTimerProgress
    public var timerGoals: TimerGoalState

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
        liveActivityEnabled: Bool,
        dailyTimerProgress: DailyTimerProgress? = nil,
        timerGoals: TimerGoalState = TimerGoalState()
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
        self.dailyTimerProgress = dailyTimerProgress ?? DailyTimerProgress(isoDate: today.isoDate)
        self.timerGoals = timerGoals
    }

    private enum CodingKeys: String, CodingKey {
        case hasCompletedOnboarding
        case userName
        case selectedPresetID
        case presets
        case today
        case history
        case recentEvents
        case dailyGoal
        case streak
        case rewards
        case reminderPreference
        case circles
        case liveActivityEnabled
        case dailyTimerProgress
        case timerGoals
    }

    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        hasCompletedOnboarding = try container.decode(Bool.self, forKey: .hasCompletedOnboarding)
        userName = try container.decode(String.self, forKey: .userName)
        selectedPresetID = try container.decode(String.self, forKey: .selectedPresetID)
        presets = try container.decode([DhikrPreset].self, forKey: .presets)
        today = try container.decode(DayProgress.self, forKey: .today)
        history = try container.decode([DayProgress].self, forKey: .history)
        recentEvents = try container.decode([CountEvent].self, forKey: .recentEvents)
        dailyGoal = try container.decode(DailyGoal.self, forKey: .dailyGoal)
        streak = try container.decode(StreakState.self, forKey: .streak)
        rewards = try container.decode(RewardState.self, forKey: .rewards)
        reminderPreference = try container.decode(ReminderPreference.self, forKey: .reminderPreference)
        circles = try container.decode([CircleSummary].self, forKey: .circles)
        liveActivityEnabled = try container.decodeIfPresent(Bool.self, forKey: .liveActivityEnabled) ?? true
        dailyTimerProgress = try container.decodeIfPresent(DailyTimerProgress.self, forKey: .dailyTimerProgress) ?? DailyTimerProgress(isoDate: today.isoDate)
        timerGoals = try container.decodeIfPresent(TimerGoalState.self, forKey: .timerGoals) ?? TimerGoalState()
    }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(hasCompletedOnboarding, forKey: .hasCompletedOnboarding)
        try container.encode(userName, forKey: .userName)
        try container.encode(selectedPresetID, forKey: .selectedPresetID)
        try container.encode(presets, forKey: .presets)
        try container.encode(today, forKey: .today)
        try container.encode(history, forKey: .history)
        try container.encode(recentEvents, forKey: .recentEvents)
        try container.encode(dailyGoal, forKey: .dailyGoal)
        try container.encode(streak, forKey: .streak)
        try container.encode(rewards, forKey: .rewards)
        try container.encode(reminderPreference, forKey: .reminderPreference)
        try container.encode(circles, forKey: .circles)
        try container.encode(liveActivityEnabled, forKey: .liveActivityEnabled)
        try container.encode(dailyTimerProgress, forKey: .dailyTimerProgress)
        try container.encode(timerGoals, forKey: .timerGoals)
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
            liveActivityEnabled: true,
            dailyTimerProgress: DailyTimerProgress(isoDate: dayKey),
            timerGoals: TimerGoalState()
        )
    }
}

public extension ZikrAppState {
    var selectedPreset: DhikrPreset? {
        presets.first { $0.id == selectedPresetID }
    }

    var activeTimerPresetID: String? {
        dailyTimerProgress.activeTimer?.presetID
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

    func timerTargetMinutes(for presetID: String) -> Int {
        timerGoals.perPresetMinutes[presetID] ?? 0
    }

    func isTimerRunning(for presetID: String) -> Bool {
        dailyTimerProgress.activeTimer?.presetID == presetID
    }

    func timerElapsedSeconds(for presetID: String, now: Date = Date()) -> Int {
        let storedSeconds = dailyTimerProgress.elapsedSecondsByPreset[presetID] ?? 0
        guard let activeTimer = dailyTimerProgress.activeTimer, activeTimer.presetID == presetID else {
            return storedSeconds
        }

        return storedSeconds + max(Int(now.timeIntervalSince(activeTimer.startedAt)), 0)
    }

    func timerCompletionRatio(for presetID: String, now: Date = Date()) -> Double {
        let targetMinutes = timerTargetMinutes(for: presetID)
        guard targetMinutes > 0 else { return 0 }
        return min(Double(timerElapsedSeconds(for: presetID, now: now)) / Double(targetMinutes * 60), 1)
    }
}
