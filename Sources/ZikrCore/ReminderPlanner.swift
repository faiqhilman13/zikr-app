import Foundation

public enum ReminderCategory: String, Codable, Hashable, Sendable {
    case simple
    case smartNudge
    case prayerTime
}

public struct ReminderDateComponents: Codable, Hashable, Sendable {
    public var year: Int?
    public var month: Int?
    public var day: Int?
    public var hour: Int?
    public var minute: Int?

    public init(year: Int? = nil, month: Int? = nil, day: Int? = nil, hour: Int? = nil, minute: Int? = nil) {
        self.year = year
        self.month = month
        self.day = day
        self.hour = hour
        self.minute = minute
    }
}

public struct ScheduledReminder: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var title: String
    public var body: String
    public var category: ReminderCategory
    public var components: ReminderDateComponents
    public var repeats: Bool

    public init(
        id: String,
        title: String,
        body: String,
        category: ReminderCategory,
        components: ReminderDateComponents,
        repeats: Bool
    ) {
        self.id = id
        self.title = title
        self.body = body
        self.category = category
        self.components = components
        self.repeats = repeats
    }
}

public enum ReminderPlanner {
    public static func buildSchedule(
        state: ZikrAppState,
        now: Date = Date(),
        calendar: Calendar = .current
    ) -> [ScheduledReminder] {
        var reminders: [ScheduledReminder] = []

        if state.reminderPreference.simpleDailyEnabled {
            reminders += state.reminderPreference.simpleReminderTimes.enumerated().map { index, time in
                ScheduledReminder(
                    id: "zikr.simple.\(index)",
                    title: "Daily dhikr check-in",
                    body: "You still have \(state.remainingToGoal) counts left to reach today's target.",
                    category: .simple,
                    components: .init(hour: time.hour, minute: time.minute),
                    repeats: true
                )
            }
        }

        if state.reminderPreference.smartNudgesEnabled, !state.isGoalCompleted(on: state.today, now: now) {
            let currentDay = calendar.dateComponents([.year, .month, .day], from: now)
            for (index, time) in state.reminderPreference.smartNudgeTimes.enumerated() {
                if isLaterToday(time, now: now, calendar: calendar) {
                    reminders.append(
                        ScheduledReminder(
                            id: "zikr.nudge.\(index)",
                            title: "Keep the streak alive",
                            body: "Only \(state.remainingToGoal) dhikr left for today's \(state.dailyGoal.rewardName.lowercased()).",
                            category: .smartNudge,
                            components: .init(
                                year: currentDay.year,
                                month: currentDay.month,
                                day: currentDay.day,
                                hour: time.hour,
                                minute: time.minute
                            ),
                            repeats: false
                        )
                    )
                }
            }
        }

        if state.reminderPreference.prayerTimesEnabled {
            for (prayer, time) in state.reminderPreference.prayerTimes.all() {
                reminders.append(
                    ScheduledReminder(
                        id: "zikr.prayer.\(prayer.rawValue)",
                        title: "\(prayer.displayName) dhikr moment",
                        body: "Pause for your selected dhikr after \(prayer.displayName.lowercased()).",
                        category: .prayerTime,
                        components: .init(hour: time.hour, minute: time.minute),
                        repeats: true
                    )
                )
            }
        }

        return reminders
    }

    private static func isLaterToday(_ time: TimeOfDay, now: Date, calendar: Calendar) -> Bool {
        let nowComponents = calendar.dateComponents([.hour, .minute], from: now)
        let nowMinutes = (nowComponents.hour ?? 0) * 60 + (nowComponents.minute ?? 0)
        let targetMinutes = time.hour * 60 + time.minute
        return targetMinutes > nowMinutes
    }
}
