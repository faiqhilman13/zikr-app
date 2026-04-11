package com.faiqhilman.zikr.shared

import kotlin.math.max
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.serialization.Serializable

object StreakEngine {
    fun recalculate(
        history: List<DayProgress>,
        referenceDayKey: String,
        timeZone: TimeZone = TimeZone.currentSystemDefault()
    ): StreakState {
        val completedKeys = history
            .filter { it.goalCompleted }
            .map { it.isoDate }
            .toSet()
            .sorted()

        val latestCompletedKey = completedKeys.lastOrNull() ?: return StreakState()
        val latestGap = DayKey.dayDifference(latestCompletedKey, referenceDayKey, timeZone) ?: 2
        val current = if (latestGap > 1) {
            0
        } else {
            var run = 1
            var index = completedKeys.lastIndex
            while (index > 0) {
                val diff = DayKey.dayDifference(completedKeys[index - 1], completedKeys[index], timeZone)
                if (diff == 1) {
                    run += 1
                    index -= 1
                } else {
                    break
                }
            }
            run
        }

        var longest = 0
        var running = 0
        var previousKey: String? = null
        for (key in completedKeys) {
            if (previousKey == null) {
                running = 1
            } else {
                val diff = DayKey.dayDifference(previousKey, key, timeZone)
                running = if (diff == 1) running + 1 else 1
            }
            longest = max(longest, running)
            previousKey = key
        }

        val multiplier = when {
            current >= 10 -> 5
            current >= 7 -> 4
            current >= 3 -> 3
            current >= 2 -> 2
            else -> 1
        }

        return StreakState(
            current = current,
            longest = max(longest, current),
            multiplier = multiplier,
            lastCompletedDate = latestCompletedKey
        )
    }
}

object RewardEngine {
    fun recalculate(
        history: List<DayProgress>,
        goal: DailyGoal,
        currentStreak: StreakState,
        activityCount: (DayProgress) -> Int = { it.totalCount }
    ): RewardState {
        val completedDays = history.count { it.goalCompleted }
        val totalActivity = history.sumOf(activityCount)
        val peakActivity = history.maxOfOrNull(activityCount) ?: 0
        val xp = totalActivity + (completedDays * 100) + (currentStreak.current * 25)
        val level = max((xp / 250) + 1, 1)

        val badges = mutableListOf<Badge>()
        if (completedDays >= 1) {
            badges += Badge(
                id = "first-light",
                title = "First Light",
                detail = "Completed your first daily target.",
                iconName = "sun.max.fill"
            )
        }
        if (currentStreak.current >= 3) {
            badges += Badge(
                id = "flame-streak",
                title = "Flame Streak",
                detail = "Three straight days of completed dhikr goals.",
                iconName = "flame.fill"
            )
        }
        if (currentStreak.current >= 7) {
            badges += Badge(
                id = "week-of-noor",
                title = "Week of Noor",
                detail = "Seven consecutive days of presence.",
                iconName = "sparkles"
            )
        }
        if (peakActivity >= goal.effectiveTargetCount * 2) {
            badges += Badge(
                id = "barakah-overdrive",
                title = "Barakah Overdrive",
                detail = "Surpassed the goal by 2x in a single day.",
                iconName = "bolt.heart.fill"
            )
        }
        if (totalActivity >= 1000) {
            badges += Badge(
                id = "thousand-club",
                title = "Thousand Club",
                detail = "Accumulated 1,000 combined dhikr repetitions.",
                iconName = "star.circle.fill"
            )
        }

        return RewardState(xp = xp, level = level, badges = badges)
    }
}

@Serializable
enum class ReminderCategory {
    simple,
    smartNudge,
    prayerTime
}

@Serializable
data class ReminderDateComponents(
    var year: Int? = null,
    var month: Int? = null,
    var day: Int? = null,
    var hour: Int? = null,
    var minute: Int? = null
)

@Serializable
data class ScheduledReminder(
    var id: String,
    var title: String,
    var body: String,
    var category: ReminderCategory,
    var components: ReminderDateComponents,
    var repeats: Boolean
)

object ReminderPlanner {
    fun buildSchedule(
        state: ZikrAppState,
        now: Instant = Clock.System.now(),
        timeZone: TimeZone = TimeZone.currentSystemDefault()
    ): List<ScheduledReminder> {
        val reminders = mutableListOf<ScheduledReminder>()

        if (state.reminderPreference.simpleDailyEnabled) {
            state.reminderPreference.simpleReminderTimes.forEachIndexed { index, time ->
                reminders += ScheduledReminder(
                    id = "zikr.simple.$index",
                    title = "Daily dhikr check-in",
                    body = "You still have ${state.remainingToGoal(state.today, now)} counts left to reach today's target.",
                    category = ReminderCategory.simple,
                    components = ReminderDateComponents(hour = time.hour, minute = time.minute),
                    repeats = true
                )
            }
        }

        if (state.reminderPreference.smartNudgesEnabled && !state.isGoalCompleted(state.today, now)) {
            val currentDay = now.toLocalDateTime(timeZone).date
            state.reminderPreference.smartNudgeTimes.forEachIndexed { index, time ->
                if (isLaterToday(time, now, timeZone)) {
                    reminders += ScheduledReminder(
                        id = "zikr.nudge.$index",
                        title = "Keep the streak alive",
                        body = "Only ${state.remainingToGoal(state.today, now)} dhikr left for today's ${state.dailyGoal.rewardName.lowercase()}.",
                        category = ReminderCategory.smartNudge,
                        components = ReminderDateComponents(
                            year = currentDay.year,
                            month = currentDay.monthNumber,
                            day = currentDay.dayOfMonth,
                            hour = time.hour,
                            minute = time.minute
                        ),
                        repeats = false
                    )
                }
            }
        }

        if (state.reminderPreference.prayerTimesEnabled) {
            state.reminderPreference.prayerTimes.all().forEach { (prayer, time) ->
                reminders += ScheduledReminder(
                    id = "zikr.prayer.${prayer.name}",
                    title = "${prayer.displayName} dhikr moment",
                    body = "Pause for your selected dhikr after ${prayer.displayName.lowercase()}.",
                    category = ReminderCategory.prayerTime,
                    components = ReminderDateComponents(hour = time.hour, minute = time.minute),
                    repeats = true
                )
            }
        }

        return reminders
    }

    private fun isLaterToday(
        time: TimeOfDay,
        now: Instant,
        timeZone: TimeZone
    ): Boolean {
        val nowComponents = now.toLocalDateTime(timeZone).time
        val nowMinutes = nowComponents.hour * 60 + nowComponents.minute
        val targetMinutes = time.hour * 60 + time.minute
        return targetMinutes > nowMinutes
    }
}
