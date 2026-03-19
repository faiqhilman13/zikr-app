import XCTest
@testable import ZikrCore

final class ZikrCoreTests: XCTestCase {
    func testStreakEngineBuildsConsecutiveRun() {
        let history = [
            DayProgress(isoDate: "2026-03-19", totalCount: 120, goalCompleted: true),
            DayProgress(isoDate: "2026-03-18", totalCount: 110, goalCompleted: true),
            DayProgress(isoDate: "2026-03-17", totalCount: 90, goalCompleted: true),
            DayProgress(isoDate: "2026-03-15", totalCount: 120, goalCompleted: true)
        ]

        let streak = StreakEngine.recalculate(history: history, referenceDayKey: "2026-03-19")
        XCTAssertEqual(streak.current, 3)
        XCTAssertEqual(streak.longest, 3)
        XCTAssertEqual(streak.multiplier, 3)
    }

    func testRewardEngineUnlocksKillStreakBadge() {
        let history = [
            DayProgress(isoDate: "2026-03-19", totalCount: 200, goalCompleted: true),
            DayProgress(isoDate: "2026-03-18", totalCount: 180, goalCompleted: true),
            DayProgress(isoDate: "2026-03-17", totalCount: 160, goalCompleted: true)
        ]
        let rewards = RewardEngine.recalculate(
            history: history,
            goal: DailyGoal(targetCount: 100),
            currentStreak: StreakState(current: 3, longest: 3, multiplier: 3, lastCompletedDate: "2026-03-19")
        )

        XCTAssertTrue(rewards.badges.contains { $0.id == "flame-streak" })
        XCTAssertGreaterThan(rewards.xp, 0)
        XCTAssertGreaterThan(rewards.level, 1)
    }

    func testReminderPlannerDropsSmartNudgesAfterGoalCompletion() {
        var state = ZikrAppState.initial(now: Date(timeIntervalSince1970: 0))
        state.today = DayProgress(isoDate: "2026-03-19", totalCount: 100, goalCompleted: true)
        state.dailyGoal = DailyGoal(targetCount: 100)

        let reminders = ReminderPlanner.buildSchedule(
            state: state,
            now: Calendar.current.date(from: DateComponents(year: 2026, month: 3, day: 19, hour: 12, minute: 0)) ?? Date()
        )

        XCTAssertFalse(reminders.contains { $0.category == .smartNudge })
        XCTAssertTrue(reminders.contains { $0.category == .simple })
        XCTAssertTrue(reminders.contains { $0.category == .prayerTime })
    }

    func testSharedStoreIncrementMarksGoalComplete() {
        let suiteName = "test.zikr.store.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let fixedDate = Calendar.current.date(from: DateComponents(year: 2026, month: 3, day: 19, hour: 10, minute: 0)) ?? Date()
        let store = SharedZikrStore(suiteName: suiteName, defaults: defaults, now: { fixedDate })

        _ = store.updateDailyGoal(99)
        let state = store.incrementSelectedDhikr(by: 100)

        XCTAssertEqual(state.today.totalCount, 100)
        XCTAssertTrue(state.today.goalCompleted)
        XCTAssertEqual(state.remainingToGoal, 0)
    }
}
