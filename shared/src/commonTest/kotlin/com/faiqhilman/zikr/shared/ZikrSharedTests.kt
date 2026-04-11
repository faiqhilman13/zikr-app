package com.faiqhilman.zikr.shared

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone

private class MutableClock(var value: Instant) : Clock {
    override fun now(): Instant = value
}

class ZikrSharedTests {
    @Test
    fun streakEngineBuildsConsecutiveRun() {
        val history = listOf(
            DayProgress(isoDate = "2026-03-19", totalCount = 120, goalCompleted = true),
            DayProgress(isoDate = "2026-03-18", totalCount = 110, goalCompleted = true),
            DayProgress(isoDate = "2026-03-17", totalCount = 90, goalCompleted = true),
            DayProgress(isoDate = "2026-03-15", totalCount = 120, goalCompleted = true)
        )

        val streak = StreakEngine.recalculate(
            history = history,
            referenceDayKey = "2026-03-19",
            timeZone = TimeZone.UTC
        )

        assertEquals(3, streak.current)
        assertEquals(3, streak.longest)
        assertEquals(3, streak.multiplier)
    }

    @Test
    fun rewardEngineUnlocksKillStreakBadge() {
        val history = listOf(
            DayProgress(isoDate = "2026-03-19", totalCount = 200, goalCompleted = true),
            DayProgress(isoDate = "2026-03-18", totalCount = 180, goalCompleted = true),
            DayProgress(isoDate = "2026-03-17", totalCount = 160, goalCompleted = true)
        )

        val rewards = RewardEngine.recalculate(
            history = history,
            goal = DailyGoal(targetCount = 100),
            currentStreak = StreakState(current = 3, longest = 3, multiplier = 3, lastCompletedDate = "2026-03-19")
        )

        assertTrue(rewards.badges.any { it.id == "flame-streak" })
        assertTrue(rewards.xp > 0)
        assertTrue(rewards.level > 1)
    }

    @Test
    fun rewardEngineCountsDerivedTimerRepetitionsAsActivity() {
        val referenceDate = Instant.parse("2026-03-19T12:00:00Z")
        val state = ZikrAppState.initial(now = referenceDate, timeZone = TimeZone.UTC).apply {
            timerGoals.perPresetSecondsPerRep["salawat"] = 3
        }

        val history = listOf(
            DayProgress(
                isoDate = "2026-03-19",
                elapsedSecondsByPreset = mutableMapOf("salawat" to 45 * 60),
                goalCompleted = false
            )
        )

        val rewards = RewardEngine.recalculate(
            history = history,
            goal = DailyGoal(targetCount = 100),
            currentStreak = StreakState(),
            activityCount = { progress ->
                state.activityPoints(progress, referenceDate)
            }
        )

        assertEquals(900, rewards.xp)
        assertEquals(4, rewards.level)
    }

    @Test
    fun reminderPlannerDropsSmartNudgesAfterGoalCompletion() {
        val state = ZikrAppState.initial(
            now = Instant.parse("2026-03-19T00:00:00Z"),
            timeZone = TimeZone.UTC
        ).apply {
            today = DayProgress(isoDate = "2026-03-19", totalCount = 100, goalCompleted = true)
            dailyGoal = DailyGoal(targetCount = 100)
        }

        val reminders = ReminderPlanner.buildSchedule(
            state = state,
            now = Instant.parse("2026-03-19T12:00:00Z"),
            timeZone = TimeZone.UTC
        )

        assertFalse(reminders.any { it.category == ReminderCategory.smartNudge })
        assertTrue(reminders.any { it.category == ReminderCategory.simple })
        assertTrue(reminders.any { it.category == ReminderCategory.prayerTime })
    }

    @Test
    fun sharedStoreIncrementMarksGoalComplete() {
        val clock = MutableClock(Instant.parse("2026-03-19T10:00:00Z"))
        val store = ZikrStore(
            storage = InMemoryKeyValueStorage(),
            clock = clock,
            timeZone = TimeZone.UTC
        )

        store.updateDailyGoal(99)
        val state = store.incrementSelectedDhikr(100)

        assertEquals(100, state.today.totalCount)
        assertTrue(state.today.goalCompleted)
        assertEquals(0, state.remainingToGoal(state.today, clock.value))
    }

    @Test
    fun timedDhikrProgressPersistsPauseAndResumeOnSameDay() {
        val clock = MutableClock(Instant.parse("2026-03-19T10:00:00Z"))
        val store = ZikrStore(
            storage = InMemoryKeyValueStorage(),
            clock = clock,
            timeZone = TimeZone.UTC
        )

        store.setTimerTargetMinutes(presetID = "salawat", minutes = 30)
        store.startTimer("salawat")

        clock.value = Instant.parse("2026-03-19T10:19:00Z")
        val runningState = store.snapshot()
        assertTrue(runningState.isTimerRunning("salawat"))
        assertEquals(19 * 60, runningState.timerElapsedSeconds("salawat", clock.value))
        assertEquals(30, runningState.timerTargetMinutes("salawat"))

        store.pauseActiveTimer()
        val pausedState = store.snapshot()
        assertFalse(pausedState.isTimerRunning("salawat"))
        assertEquals(19 * 60, pausedState.timerElapsedSeconds("salawat", clock.value))

        clock.value = Instant.parse("2026-03-19T10:24:00Z")
        store.startTimer("salawat")
        clock.value = Instant.parse("2026-03-19T10:35:00Z")
        val resumedState = store.pauseActiveTimer()

        assertEquals(30 * 60, resumedState.timerElapsedSeconds("salawat", clock.value))
        assertEquals(30, resumedState.timerTargetMinutes("salawat"))
        assertEquals(30 * 60, resumedState.today.elapsedSecondsByPreset["salawat"])
    }

    @Test
    fun timedDhikrProgressResetsAcrossDayBoundary() {
        val clock = MutableClock(Instant.parse("2026-03-19T23:50:00Z"))
        val store = ZikrStore(
            storage = InMemoryKeyValueStorage(),
            clock = clock,
            timeZone = TimeZone.UTC
        )

        store.setTimerTargetMinutes(presetID = "salawat", minutes = 30)
        store.startTimer("salawat")

        clock.value = Instant.parse("2026-03-20T08:00:00Z")
        val rolledState = store.snapshot()

        assertNull(rolledState.activeTimerPresetID())
        assertEquals("2026-03-20", rolledState.dailyTimerProgress.isoDate)
        assertEquals(0, rolledState.timerElapsedSeconds("salawat", clock.value))
        assertEquals(30, rolledState.timerTargetMinutes("salawat"))
        assertEquals("2026-03-19", rolledState.history.firstOrNull()?.isoDate)
        assertEquals(10 * 60, rolledState.history.firstOrNull()?.elapsedSecondsByPreset?.get("salawat"))
    }

    @Test
    fun timedDhikrProgressCompletesGoalUsingSecondsPerRepetition() {
        val clock = MutableClock(Instant.parse("2026-03-19T10:00:00Z"))
        val store = ZikrStore(
            storage = InMemoryKeyValueStorage(),
            clock = clock,
            timeZone = TimeZone.UTC
        )

        store.updateDailyGoal(600)
        store.setTimerTargetMinutes(presetID = "salawat", minutes = 30)
        store.setSecondsPerRepetition(presetID = "salawat", seconds = 3)
        store.startTimer("salawat")

        clock.value = Instant.parse("2026-03-19T10:30:00Z")
        val state = store.snapshot()

        assertEquals(30 * 60, state.timerElapsedSeconds("salawat", clock.value))
        assertEquals(600, state.repetitionCount("salawat", state.today, clock.value))
        assertEquals(0, state.remainingToGoal(state.today, clock.value))
        assertTrue(state.today.goalCompleted)
        assertNotNull(state.today.completedAt)
    }
}
