import Foundation

public enum StreakEngine {
    public static func recalculate(
        history: [DayProgress],
        referenceDayKey: String,
        calendar: Calendar = .current
    ) -> StreakState {
        let completedKeys = Array(Set(history.filter(\.goalCompleted).map(\.isoDate))).sorted()
        guard let latestCompletedKey = completedKeys.last else {
            return StreakState()
        }

        let latestGap = DayKey.dayDifference(from: latestCompletedKey, to: referenceDayKey, calendar: calendar) ?? 2
        let current: Int
        if latestGap > 1 {
            current = 0
        } else {
            let completedSet = Set(completedKeys)
            var run = 0
            var cursor = latestCompletedKey
            while completedSet.contains(cursor) {
                run += 1
                guard
                    let cursorDate = DayKey.date(from: cursor, calendar: calendar),
                    let previous = calendar.date(byAdding: .day, value: -1, to: cursorDate)
                else {
                    break
                }
                cursor = DayKey.string(from: previous, calendar: calendar)
            }
            current = run
        }

        var longest = 0
        var running = 0
        var previousDate: Date?
        for key in completedKeys {
            guard let date = DayKey.date(from: key, calendar: calendar) else { continue }
            if let previousDate, let diff = calendar.dateComponents([.day], from: previousDate, to: date).day {
                running = diff == 1 ? running + 1 : 1
            } else {
                running = 1
            }
            longest = max(longest, running)
            previousDate = date
        }

        let multiplier: Int
        switch current {
        case 10...:
            multiplier = 5
        case 7...:
            multiplier = 4
        case 3...:
            multiplier = 3
        case 2...:
            multiplier = 2
        default:
            multiplier = 1
        }

        return StreakState(
            current: current,
            longest: max(longest, current),
            multiplier: multiplier,
            lastCompletedDate: latestCompletedKey
        )
    }
}

public enum RewardEngine {
    public static func recalculate(
        history: [DayProgress],
        goal: DailyGoal,
        currentStreak: StreakState,
        activityCount: (DayProgress) -> Int = { $0.totalCount }
    ) -> RewardState {
        let completedDays = history.filter(\.goalCompleted).count
        let totalActivity = history.reduce(0) { $0 + activityCount($1) }
        let peakActivity = history.map(activityCount).max() ?? 0
        let xp = totalActivity + (completedDays * 100) + (currentStreak.current * 25)
        let level = max(1, (xp / 250) + 1)

        var badges: [Badge] = []
        if completedDays >= 1 {
            badges.append(.init(id: "first-light", title: "First Light", detail: "Completed your first daily target.", iconName: "sun.max.fill"))
        }
        if currentStreak.current >= 3 {
            badges.append(.init(id: "flame-streak", title: "Flame Streak", detail: "Three straight days of completed dhikr goals.", iconName: "flame.fill"))
        }
        if currentStreak.current >= 7 {
            badges.append(.init(id: "week-of-noor", title: "Week of Noor", detail: "Seven consecutive days of presence.", iconName: "sparkles"))
        }
        if peakActivity >= goal.effectiveTargetCount * 2 {
            badges.append(.init(id: "barakah-overdrive", title: "Barakah Overdrive", detail: "Surpassed the goal by 2x in a single day.", iconName: "bolt.heart.fill"))
        }
        if totalActivity >= 1000 {
            badges.append(.init(id: "thousand-club", title: "Thousand Club", detail: "Accumulated 1,000 combined dhikr repetitions.", iconName: "star.circle.fill"))
        }

        return RewardState(xp: xp, level: level, badges: badges)
    }
}
