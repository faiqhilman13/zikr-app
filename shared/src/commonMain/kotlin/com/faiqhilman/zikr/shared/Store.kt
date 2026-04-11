package com.faiqhilman.zikr.shared

import kotlin.math.max
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

interface KeyValueStorage {
    fun getString(key: String): String?
    fun putString(key: String, value: String)
    fun remove(key: String)
}

class InMemoryKeyValueStorage : KeyValueStorage {
    private val data = mutableMapOf<String, String>()

    override fun getString(key: String): String? = data[key]

    override fun putString(key: String, value: String) {
        data[key] = value
    }

    override fun remove(key: String) {
        data.remove(key)
    }
}

interface CommunityRepository {
    suspend fun loadCircles(userName: String, currentTotal: Int, streak: Int): List<CircleSummary>
}

class MockCommunityRepository : CommunityRepository {
    override suspend fun loadCircles(userName: String, currentTotal: Int, streak: Int): List<CircleSummary> {
        val currentUser = FriendProgress(
            id = "current-user",
            userName = userName.ifBlank { "You" },
            avatar = "sparkles",
            totalCount = currentTotal,
            streakCount = streak,
            isCurrentUser = true
        )

        val circle = CircleSummary(
            id = "circle-barakah",
            name = "Barakah Circle",
            motto = "Keep one another consistent through small daily wins.",
            members = mutableListOf(
                currentUser,
                FriendProgress(
                    userName = "Aminah",
                    avatar = "moon.stars.fill",
                    totalCount = max(currentTotal + 33, 180),
                    streakCount = max(streak + 1, 4)
                ),
                FriendProgress(
                    userName = "Yusuf",
                    avatar = "leaf.fill",
                    totalCount = max(currentTotal - 12, 96),
                    streakCount = max(streak, 2)
                ),
                FriendProgress(
                    userName = "Maryam",
                    avatar = "heart.fill",
                    totalCount = max(currentTotal / 2, 72),
                    streakCount = 1
                )
            )
        )

        return listOf(circle)
    }
}

class ZikrStore(
    private val storage: KeyValueStorage,
    private val clock: Clock = Clock.System,
    private val timeZone: TimeZone = TimeZone.currentSystemDefault()
) {
    private val stateKey = "zikr.app.state"
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    fun snapshot(): ZikrAppState = mutate { }

    fun incrementSelectedDhikr(amount: Int): ZikrAppState = mutate { state ->
        if (amount <= 0) return@mutate
        val presetID = state.selectedPresetID
        state.today.counts[presetID] = (state.today.counts[presetID] ?: 0) + amount
        state.today.totalCount += amount
        state.recentEvents.add(
            index = 0,
            element = CountEvent(
                presetID = presetID,
                amount = amount,
                occurredAt = now()
            )
        )
        if (state.recentEvents.size > 50) {
            state.recentEvents = state.recentEvents.take(50).toMutableList()
        }
    }

    fun selectPreset(id: String): ZikrAppState = mutate { state ->
        if (state.presets.any { it.id == id }) {
            state.selectedPresetID = id
        }
    }

    fun completeOnboarding(userName: String, selectedPresetID: String, dailyTarget: Int): ZikrAppState = mutate { state ->
        val cleanedName = userName.trim()
        state.hasCompletedOnboarding = true
        state.userName = if (cleanedName.isBlank()) "Dhikr Hero" else cleanedName
        state.selectedPresetID = if (state.presets.any { it.id == selectedPresetID }) selectedPresetID else state.selectedPresetID
        state.dailyGoal.targetCount = max(33, dailyTarget)
    }

    fun updateDailyGoal(target: Int): ZikrAppState = mutate { state ->
        state.dailyGoal.targetCount = max(33, target)
    }

    fun updatePresetTarget(presetID: String, target: Int): ZikrAppState = mutate { state ->
        state.dailyGoal.perPresetTargets[presetID] = max(0, target)
        val sum = state.dailyGoal.perPresetTargets.values.sum()
        if (sum > 0) {
            state.dailyGoal.targetCount = sum
        }
    }

    fun updateReminderPreference(preference: ReminderPreference): ZikrAppState = mutate { state ->
        state.reminderPreference = preference
    }

    fun setCircles(circles: List<CircleSummary>): ZikrAppState = mutate { state ->
        state.circles = circles.toMutableList()
    }

    fun setLiveActivityEnabled(enabled: Boolean): ZikrAppState = mutate { state ->
        state.liveActivityEnabled = enabled
    }

    fun setTimerTargetMinutes(presetID: String, minutes: Int): ZikrAppState = mutate { state ->
        if (!state.presets.any { it.id == presetID }) return@mutate
        val sanitizedMinutes = max(0, minutes)
        if (sanitizedMinutes == 0) {
            state.timerGoals.perPresetMinutes.remove(presetID)
        } else {
            state.timerGoals.perPresetMinutes[presetID] = sanitizedMinutes
        }
    }

    fun setSecondsPerRepetition(presetID: String, seconds: Int): ZikrAppState = mutate { state ->
        if (!state.presets.any { it.id == presetID }) return@mutate
        val sanitizedSeconds = max(1, seconds)
        state.timerGoals.perPresetSecondsPerRep[presetID] = sanitizedSeconds
    }

    fun startTimer(presetID: String): ZikrAppState = mutate { state ->
        if (!state.presets.any { it.id == presetID }) return@mutate
        val timestamp = now()
        if (state.dailyTimerProgress.activeTimer?.presetID == presetID) return@mutate

        pauseActiveTimerLocked(state, timestamp)
        state.selectedPresetID = presetID
        state.dailyTimerProgress.activeTimer = ActiveDhikrTimer(
            presetID = presetID,
            startedAt = timestamp
        )
    }

    fun pauseActiveTimer(): ZikrAppState = mutate { state ->
        pauseActiveTimerLocked(state, now())
    }

    fun addCustomPreset(title: String, arabic: String, transliteration: String): ZikrAppState = mutate { state ->
        val cleanedTitle = title.trim()
        if (cleanedTitle.isEmpty()) return@mutate
        val preset = DhikrPreset(
            title = cleanedTitle,
            arabic = arabic.trim(),
            transliteration = transliteration.trim(),
            kind = DhikrKind.custom,
            colorName = "violet"
        )
        state.presets.add(preset)
        state.selectedPresetID = preset.id
    }

    fun undoLastIncrement(): ZikrAppState = mutate { state ->
        val lastEvent = state.recentEvents.firstOrNull() ?: return@mutate
        state.recentEvents.removeAt(0)
        state.today.counts[lastEvent.presetID] = (state.today.counts[lastEvent.presetID] ?: 0) - lastEvent.amount
        state.today.totalCount -= lastEvent.amount
    }

    fun updatePreset(id: String, title: String, arabic: String, transliteration: String): ZikrAppState = mutate { state ->
        val index = state.presets.indexOfFirst { it.id == id }
        if (index == -1) return@mutate
        state.presets[index].title = title.trim()
        state.presets[index].arabic = arabic.trim()
        state.presets[index].transliteration = transliteration.trim()
    }

    fun deletePreset(id: String): ZikrAppState = mutate { state ->
        val starterIDs = setOf("salawat", "tahlil", "tasbih", "takbir", "tahmid")
        if (starterIDs.contains(id)) return@mutate

        val index = state.presets.indexOfFirst { it.id == id }
        if (index == -1) return@mutate
        state.presets.removeAt(index)
        if (state.selectedPresetID == id) {
            state.selectedPresetID = state.presets.firstOrNull()?.id ?: "salawat"
        }

        state.today.counts.remove(id)
        state.timerGoals.perPresetMinutes.remove(id)
        state.timerGoals.perPresetSecondsPerRep.remove(id)
        state.dailyTimerProgress.elapsedSecondsByPreset.remove(id)
        if (state.dailyTimerProgress.activeTimer?.presetID == id) {
            state.dailyTimerProgress.activeTimer = null
        }
    }

    private fun mutate(transform: (ZikrAppState) -> Unit): ZikrAppState {
        val state = loadState()
        rolloverIfNeeded(state)
        transform(state)
        normalize(state)
        saveState(state)
        return state
    }

    private fun loadState(): ZikrAppState {
        val raw = storage.getString(stateKey) ?: return ZikrAppState.initial(now(), timeZone)
        return runCatching {
            json.decodeFromString<ZikrAppState>(raw)
        }.getOrElse {
            ZikrAppState.initial(now(), timeZone)
        }
    }

    private fun saveState(state: ZikrAppState) {
        storage.putString(stateKey, json.encodeToString(state))
    }

    private fun rolloverIfNeeded(state: ZikrAppState) {
        val currentDate = now()
        val todayKey = DayKey.string(currentDate, timeZone)
        if (todayKey == state.today.isoDate) return

        pauseActiveTimerLocked(state, DayKey.startOfDay(currentDate, timeZone))
        syncTodayTimerProgressLocked(state)
        state.history.add(index = 0, element = state.today)
        if (state.history.size > 30) {
            state.history = state.history.take(30).toMutableList()
        }
        state.today = DayProgress(isoDate = todayKey)
        state.dailyTimerProgress = DailyTimerProgress(isoDate = todayKey)
    }

    private fun normalize(state: ZikrAppState) {
        val evaluationNow = now()
        val validPresetIDs = state.presets.map { it.id }.toSet()
        state.dailyTimerProgress.isoDate = state.today.isoDate

        state.today.elapsedSecondsByPreset = state.today.elapsedSecondsByPreset
            .filter { (key, value) -> validPresetIDs.contains(key) && value > 0 }
            .toMutableMap()

        state.dailyTimerProgress.elapsedSecondsByPreset = state.dailyTimerProgress.elapsedSecondsByPreset
            .filter { (key, value) -> validPresetIDs.contains(key) && value > 0 }
            .toMutableMap()

        syncTodayTimerProgressLocked(state)

        state.timerGoals.perPresetMinutes = state.timerGoals.perPresetMinutes
            .filter { (key, value) -> validPresetIDs.contains(key) && value > 0 }
            .toMutableMap()
        state.timerGoals.perPresetSecondsPerRep = state.timerGoals.perPresetSecondsPerRep
            .filter { (key, value) -> validPresetIDs.contains(key) && value > 0 }
            .toMutableMap()

        val active = state.dailyTimerProgress.activeTimer
        if (active != null && !validPresetIDs.contains(active.presetID)) {
            state.dailyTimerProgress.activeTimer = null
        }

        recalculateTodayGoalStateLocked(state, evaluationNow)
        state.history = state.history.sortedByDescending { it.isoDate }.toMutableList()
        state.streak = StreakEngine.recalculate(
            history = state.allProgress(),
            referenceDayKey = state.today.isoDate,
            timeZone = timeZone
        )
        state.rewards = RewardEngine.recalculate(
            history = state.allProgress(),
            goal = state.dailyGoal,
            currentStreak = state.streak,
            activityCount = { progress ->
                state.activityPoints(progress, evaluationNow)
            }
        )
    }

    private fun pauseActiveTimerLocked(state: ZikrAppState, timestamp: Instant) {
        val activeTimer = state.dailyTimerProgress.activeTimer ?: return
        val elapsedSeconds = max((timestamp - activeTimer.startedAt).inWholeSeconds.toInt(), 0)
        if (elapsedSeconds > 0) {
            state.dailyTimerProgress.elapsedSecondsByPreset[activeTimer.presetID] =
                (state.dailyTimerProgress.elapsedSecondsByPreset[activeTimer.presetID] ?: 0) + elapsedSeconds
        }
        state.dailyTimerProgress.activeTimer = null
        syncTodayTimerProgressLocked(state)
    }

    private fun syncTodayTimerProgressLocked(state: ZikrAppState) {
        val merged = state.today.elapsedSecondsByPreset.toMutableMap()
        state.dailyTimerProgress.elapsedSecondsByPreset.forEach { (presetID, timerValue) ->
            val currentValue = merged[presetID] ?: 0
            merged[presetID] = max(currentValue, timerValue)
        }
        state.today.elapsedSecondsByPreset = merged
    }

    private fun recalculateTodayGoalStateLocked(state: ZikrAppState, timestamp: Instant) {
        val goalCompleted = state.isGoalCompleted(state.today, timestamp)
        if (goalCompleted) {
            state.today.goalCompleted = true
            state.today.completedAt = state.today.completedAt ?: timestamp
        } else {
            state.today.goalCompleted = false
            state.today.completedAt = null
        }
    }

    private fun now(): Instant = clock.now()
}
