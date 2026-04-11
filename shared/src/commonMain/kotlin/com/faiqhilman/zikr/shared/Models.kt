package com.faiqhilman.zikr.shared

import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.serialization.Serializable

@Serializable
enum class DhikrKind {
    salawat,
    tahlil,
    tasbih,
    takbir,
    tahmid,
    custom;

    val displayName: String
        get() = when (this) {
            salawat -> "Salawat"
            tahlil -> "Tahlil"
            tasbih -> "Tasbih"
            takbir -> "Takbir"
            tahmid -> "Alhamdulillah"
            custom -> "Custom"
        }
}

@Serializable
data class DhikrPreset(
    var id: String = generateID(),
    var title: String,
    var arabic: String,
    var transliteration: String,
    var kind: DhikrKind,
    var colorName: String
) {
    val defaultSecondsPerRepetition: Int
        get() = when (kind) {
            DhikrKind.salawat -> 3
            DhikrKind.custom -> 2
            else -> 1
        }

    companion object {
        val starterPresets: MutableList<DhikrPreset> = mutableListOf(
            DhikrPreset(
                id = "salawat",
                title = "Salawat",
                arabic = "اللهم صل على سيدنا محمد",
                transliteration = "Allahumma salli 'ala Sayyidina Muhammad",
                kind = DhikrKind.salawat,
                colorName = "rose"
            ),
            DhikrPreset(
                id = "tahlil",
                title = "Tahlil",
                arabic = "لا إله إلا الله",
                transliteration = "La ilaha illa Allah",
                kind = DhikrKind.tahlil,
                colorName = "emerald"
            ),
            DhikrPreset(
                id = "tasbih",
                title = "Tasbih",
                arabic = "سبحان الله",
                transliteration = "SubhanAllah",
                kind = DhikrKind.tasbih,
                colorName = "indigo"
            ),
            DhikrPreset(
                id = "takbir",
                title = "Takbir",
                arabic = "الله أكبر",
                transliteration = "Allahu Akbar",
                kind = DhikrKind.takbir,
                colorName = "amber"
            ),
            DhikrPreset(
                id = "tahmid",
                title = "Alhamdulillah",
                arabic = "الحمد لله",
                transliteration = "Alhamdulillah",
                kind = DhikrKind.tahmid,
                colorName = "teal"
            )
        )
    }
}

@Serializable
data class CountEvent(
    var id: String = generateID(),
    var presetID: String,
    var amount: Int,
    var occurredAt: Instant
)

@Serializable
data class DayProgress(
    var isoDate: String,
    var counts: MutableMap<String, Int> = mutableMapOf(),
    var elapsedSecondsByPreset: MutableMap<String, Int> = mutableMapOf(),
    var totalCount: Int = 0,
    var goalCompleted: Boolean = false,
    var completedAt: Instant? = null
) {
    val totalElapsedSeconds: Int
        get() = elapsedSecondsByPreset.values.sum()

    val trackedMinutes: Int
        get() = totalElapsedSeconds / 60

    val activityPoints: Int
        get() = totalCount + trackedMinutes

    val hasActivity: Boolean
        get() = totalCount > 0 || totalElapsedSeconds > 0
}

@Serializable
data class DailyGoal(
    var targetCount: Int = 100,
    var perPresetTargets: MutableMap<String, Int> = mutableMapOf(),
    var rewardName: String = "Noor Chest"
) {
    val effectiveTargetCount: Int
        get() {
            val sum = perPresetTargets.values.sum()
            return if (sum > 0) sum else targetCount
        }
}

@Serializable
data class ActiveDhikrTimer(
    var presetID: String,
    var startedAt: Instant
)

@Serializable
data class DailyTimerProgress(
    var isoDate: String,
    var elapsedSecondsByPreset: MutableMap<String, Int> = mutableMapOf(),
    var activeTimer: ActiveDhikrTimer? = null
)

@Serializable
data class TimerGoalState(
    var perPresetMinutes: MutableMap<String, Int> = mutableMapOf(),
    var perPresetSecondsPerRep: MutableMap<String, Int> = mutableMapOf()
)

@Serializable
data class StreakState(
    var current: Int = 0,
    var longest: Int = 0,
    var multiplier: Int = 1,
    var lastCompletedDate: String? = null
)

@Serializable
data class Badge(
    var id: String,
    var title: String,
    var detail: String,
    var iconName: String
)

@Serializable
data class RewardState(
    var xp: Int = 0,
    var level: Int = 1,
    var badges: MutableList<Badge> = mutableListOf()
)

@Serializable
data class TimeOfDay(
    var hour: Int,
    var minute: Int
) {
    val id: String
        get() = "${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}"

    val label: String
        get() {
            val hour12 = when {
                hour == 0 -> 12
                hour > 12 -> hour - 12
                else -> hour
            }
            val suffix = if (hour >= 12) "PM" else "AM"
            return "$hour12:${minute.toString().padStart(2, '0')} $suffix"
        }

    companion object {
        val commonChoices: List<TimeOfDay> = listOf(
            TimeOfDay(hour = 7, minute = 0),
            TimeOfDay(hour = 9, minute = 0),
            TimeOfDay(hour = 13, minute = 0),
            TimeOfDay(hour = 17, minute = 30),
            TimeOfDay(hour = 20, minute = 0),
            TimeOfDay(hour = 21, minute = 0)
        )
    }
}

@Serializable
enum class PrayerName {
    fajr,
    dhuhr,
    asr,
    maghrib,
    isha;

    val displayName: String
        get() = when (this) {
            fajr -> "Fajr"
            dhuhr -> "Dhuhr"
            asr -> "Asr"
            maghrib -> "Maghrib"
            isha -> "Isha"
        }
}

@Serializable
data class PrayerTimes(
    var fajr: TimeOfDay = TimeOfDay(hour = 5, minute = 30),
    var dhuhr: TimeOfDay = TimeOfDay(hour = 13, minute = 10),
    var asr: TimeOfDay = TimeOfDay(hour = 16, minute = 30),
    var maghrib: TimeOfDay = TimeOfDay(hour = 19, minute = 20),
    var isha: TimeOfDay = TimeOfDay(hour = 20, minute = 45)
) {
    fun all(): List<Pair<PrayerName, TimeOfDay>> = listOf(
        PrayerName.fajr to fajr,
        PrayerName.dhuhr to dhuhr,
        PrayerName.asr to asr,
        PrayerName.maghrib to maghrib,
        PrayerName.isha to isha
    )
}

@Serializable
data class ReminderPreference(
    var simpleDailyEnabled: Boolean = true,
    var simpleReminderTimes: MutableList<TimeOfDay> = mutableListOf(TimeOfDay(hour = 21, minute = 0)),
    var smartNudgesEnabled: Boolean = true,
    var smartNudgeTimes: MutableList<TimeOfDay> = mutableListOf(
        TimeOfDay(hour = 13, minute = 0),
        TimeOfDay(hour = 17, minute = 30),
        TimeOfDay(hour = 20, minute = 30)
    ),
    var prayerTimesEnabled: Boolean = true,
    var prayerTimes: PrayerTimes = PrayerTimes()
)

@Serializable
data class FriendProgress(
    var id: String = generateID(),
    var userName: String,
    var avatar: String,
    var totalCount: Int,
    var streakCount: Int,
    var isCurrentUser: Boolean = false
)

@Serializable
data class CircleSummary(
    var id: String = generateID(),
    var name: String,
    var motto: String,
    var members: MutableList<FriendProgress>
) {
    init {
        members.sortWith(
            compareByDescending<FriendProgress> { it.totalCount }
                .thenBy { it.userName }
        )
    }

    val groupTotal: Int
        get() = members.sumOf { it.totalCount }
}

@Serializable
data class ZikrAppState(
    var hasCompletedOnboarding: Boolean,
    var userName: String,
    var selectedPresetID: String,
    var presets: MutableList<DhikrPreset>,
    var today: DayProgress,
    var history: MutableList<DayProgress>,
    var recentEvents: MutableList<CountEvent>,
    var dailyGoal: DailyGoal,
    var streak: StreakState,
    var rewards: RewardState,
    var reminderPreference: ReminderPreference,
    var circles: MutableList<CircleSummary>,
    var liveActivityEnabled: Boolean,
    var dailyTimerProgress: DailyTimerProgress = DailyTimerProgress(isoDate = today.isoDate),
    var timerGoals: TimerGoalState = TimerGoalState()
) {
    companion object {
        fun initial(
            now: Instant = Clock.System.now(),
            timeZone: TimeZone = TimeZone.currentSystemDefault()
        ): ZikrAppState {
            val dayKey = DayKey.string(now, timeZone)
            return ZikrAppState(
                hasCompletedOnboarding = false,
                userName = "",
                selectedPresetID = DhikrPreset.starterPresets.firstOrNull()?.id ?: "salawat",
                presets = DhikrPreset.starterPresets.toMutableList(),
                today = DayProgress(isoDate = dayKey),
                history = mutableListOf(),
                recentEvents = mutableListOf(),
                dailyGoal = DailyGoal(),
                streak = StreakState(),
                rewards = RewardState(),
                reminderPreference = ReminderPreference(),
                circles = mutableListOf(),
                liveActivityEnabled = true,
                dailyTimerProgress = DailyTimerProgress(isoDate = dayKey),
                timerGoals = TimerGoalState()
            )
        }
    }
}

fun ZikrAppState.selectedPreset(): DhikrPreset? = presets.firstOrNull { it.id == selectedPresetID }

fun ZikrAppState.activeTimerPresetID(): String? = dailyTimerProgress.activeTimer?.presetID

fun ZikrAppState.allProgress(): List<DayProgress> = listOf(today) + history

fun ZikrAppState.timerTargetMinutes(presetID: String): Int = timerGoals.perPresetMinutes[presetID] ?: 0

fun ZikrAppState.secondsPerRepetition(presetID: String): Int {
    val configured = timerGoals.perPresetSecondsPerRep[presetID]
    if (configured != null && configured > 0) {
        return configured
    }
    return presets.firstOrNull { it.id == presetID }?.defaultSecondsPerRepetition ?: 1
}

fun ZikrAppState.isTimerRunning(presetID: String): Boolean = dailyTimerProgress.activeTimer?.presetID == presetID

fun ZikrAppState.timerElapsedSeconds(
    presetID: String,
    now: Instant = Clock.System.now()
): Int {
    val storedSeconds = dailyTimerProgress.elapsedSecondsByPreset[presetID] ?: 0
    val activeTimer = dailyTimerProgress.activeTimer ?: return storedSeconds
    if (activeTimer.presetID != presetID) return storedSeconds
    return storedSeconds + max((now - activeTimer.startedAt).inWholeSeconds.toInt(), 0)
}

fun ZikrAppState.timerCompletionRatio(
    presetID: String,
    now: Instant = Clock.System.now()
): Double {
    val targetMinutes = timerTargetMinutes(presetID)
    if (targetMinutes <= 0) return 0.0
    return min(timerElapsedSeconds(presetID, now).toDouble() / (targetMinutes * 60).toDouble(), 1.0)
}

fun ZikrAppState.elapsedSeconds(
    presetID: String,
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int {
    val storedSeconds = day.elapsedSecondsByPreset[presetID] ?: 0
    if (day.isoDate != today.isoDate) return storedSeconds
    return max(storedSeconds, timerElapsedSeconds(presetID, now))
}

fun ZikrAppState.totalElapsedSeconds(
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int {
    var total = day.elapsedSecondsByPreset.values.sum()
    val activeTimer = dailyTimerProgress.activeTimer
    if (day.isoDate != today.isoDate || activeTimer == null) return total

    val liveElapsed = timerElapsedSeconds(activeTimer.presetID, now)
    val storedElapsed = day.elapsedSecondsByPreset[activeTimer.presetID] ?: 0
    total += max(liveElapsed - storedElapsed, 0)
    return total
}

fun ZikrAppState.estimatedTimerRepetitions(
    presetID: String,
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int {
    val secondsPerRep = max(secondsPerRepetition(presetID), 1)
    return elapsedSeconds(presetID, day, now) / secondsPerRep
}

fun ZikrAppState.repetitionCount(
    presetID: String,
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int = (day.counts[presetID] ?: 0) + estimatedTimerRepetitions(presetID, day, now)

fun ZikrAppState.totalRepetitionCount(
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int {
    val liveTimerKeys = if (day.isoDate == today.isoDate) dailyTimerProgress.elapsedSecondsByPreset.keys else emptySet()
    val activeTimerKey = if (day.isoDate == today.isoDate) setOfNotNull(activeTimerPresetID()) else emptySet()
    val presetIDs = day.counts.keys + day.elapsedSecondsByPreset.keys + liveTimerKeys + activeTimerKey
    val detailedManualCount = day.counts.values.sum()
    val fallbackManualCount = max(day.totalCount - detailedManualCount, 0)
    return fallbackManualCount + presetIDs.sumOf { repetitionCount(it, day, now) }
}

fun ZikrAppState.activityPoints(
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int = totalRepetitionCount(day, now)

fun ZikrAppState.targetCount(presetID: String): Int {
    val presetTarget = dailyGoal.perPresetTargets[presetID] ?: 0
    return if (presetTarget > 0) presetTarget else dailyGoal.effectiveTargetCount
}

fun ZikrAppState.isGoalCompleted(
    day: DayProgress,
    now: Instant = Clock.System.now()
): Boolean {
    val presetTargets = dailyGoal.perPresetTargets.filterValues { it > 0 }
    if (presetTargets.isNotEmpty()) {
        return presetTargets.all { (presetID, target) ->
            repetitionCount(presetID, day, now) >= target
        }
    }
    return totalRepetitionCount(day, now) >= dailyGoal.effectiveTargetCount
}

fun ZikrAppState.remainingToGoal(
    day: DayProgress,
    now: Instant = Clock.System.now()
): Int {
    val presetTargets = dailyGoal.perPresetTargets.filterValues { it > 0 }
    if (presetTargets.isNotEmpty()) {
        return presetTargets.entries.sumOf { (presetID, target) ->
            max(target - repetitionCount(presetID, day, now), 0)
        }
    }
    return max(dailyGoal.effectiveTargetCount - totalRepetitionCount(day, now), 0)
}

fun ZikrAppState.completionRatio(
    day: DayProgress,
    now: Instant = Clock.System.now()
): Double {
    val presetTargets = dailyGoal.perPresetTargets.filterValues { it > 0 }
    if (presetTargets.isNotEmpty()) {
        val targetTotal = presetTargets.values.sum()
        if (targetTotal <= 0) return 0.0
        val completedTotal = presetTargets.entries.sumOf { (presetID, target) ->
            min(repetitionCount(presetID, day, now), target)
        }
        return min(completedTotal.toDouble() / targetTotal.toDouble(), 1.0)
    }
    if (dailyGoal.effectiveTargetCount <= 0) return 0.0
    return min(totalRepetitionCount(day, now).toDouble() / dailyGoal.effectiveTargetCount.toDouble(), 1.0)
}

fun ZikrAppState.unifiedCompletionRatio(
    now: Instant = Clock.System.now()
): Double = completionRatio(today, now)

private fun generateID(): String = "${Clock.System.now().toEpochMilliseconds()}-${Random.nextLong()}"
