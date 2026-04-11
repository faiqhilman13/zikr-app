package com.faiqhilman.zikr.android

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.faiqhilman.zikr.shared.KeyValueStorage
import com.faiqhilman.zikr.shared.DhikrKind
import com.faiqhilman.zikr.shared.TimeOfDay
import com.faiqhilman.zikr.shared.ZikrStore
import com.faiqhilman.zikr.shared.completionRatio
import com.faiqhilman.zikr.shared.isGoalCompleted
import com.faiqhilman.zikr.shared.isTimerRunning
import com.faiqhilman.zikr.shared.remainingToGoal
import com.faiqhilman.zikr.shared.repetitionCount
import com.faiqhilman.zikr.shared.secondsPerRepetition
import com.faiqhilman.zikr.shared.selectedPreset
import com.faiqhilman.zikr.shared.targetCount
import com.faiqhilman.zikr.shared.timerElapsedSeconds
import com.faiqhilman.zikr.shared.timerTargetMinutes
import com.faiqhilman.zikr.shared.totalRepetitionCount
import kotlinx.coroutines.delay
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

enum class AppTab(val label: String, val short: String) {
    Counter("Count", "C"),
    Rewards("Rewards", "R"),
    Garden("Garden", "G"),
    History("History", "H"),
    Settings("Settings", "S")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                val viewModel: ZikrAndroidViewModel = viewModel()
                ZikrAndroidApp(viewModel)
            }
        }
    }
}

private class AndroidPrefsStorage(
    private val sharedPreferences: SharedPreferences
) : KeyValueStorage {
    override fun getString(key: String): String? = sharedPreferences.getString(key, null)

    override fun putString(key: String, value: String) {
        sharedPreferences.edit().putString(key, value).apply()
    }

    override fun remove(key: String) {
        sharedPreferences.edit().remove(key).apply()
    }
}

class ZikrAndroidViewModel(
    application: Application
) : AndroidViewModel(application) {
    private val store = ZikrStore(
        storage = AndroidPrefsStorage(
            application.getSharedPreferences("zikr.android.state", Context.MODE_PRIVATE)
        )
    )

    var state by mutableStateOf(store.snapshot())
        private set

    var currentTab by mutableStateOf(AppTab.Counter)
        private set

    var now by mutableStateOf(Clock.System.now())
        private set

    private var sessionStartAt by mutableStateOf<Instant?>(null)
    private var sessionDayKey by mutableStateOf(state.today.isoDate)

    fun tick() {
        now = Clock.System.now()
        state = store.snapshot()
        if (state.today.isoDate != sessionDayKey) {
            sessionDayKey = state.today.isoDate
            sessionStartAt = null
        }
    }

    fun selectTab(tab: AppTab) {
        currentTab = tab
    }

    fun increment(by: Int = 1) {
        if (sessionStartAt == null) {
            sessionStartAt = now
        }
        state = store.incrementSelectedDhikr(by)
        now = Clock.System.now()
    }

    fun selectPreset(presetID: String) {
        state = store.selectPreset(presetID)
    }

    fun completeOnboarding(name: String, target: Int, presetID: String) {
        state = store.completeOnboarding(
            userName = name,
            selectedPresetID = presetID,
            dailyTarget = target
        )
    }

    fun toggleTimer() {
        val presetID = state.selectedPreset()?.id ?: return
        state = if (state.isTimerRunning(presetID)) {
            store.pauseActiveTimer()
        } else {
            store.startTimer(presetID)
        }
        now = Clock.System.now()
    }

    fun setTimerTargetMinutes(minutes: Int) {
        val presetID = state.selectedPreset()?.id ?: return
        state = store.setTimerTargetMinutes(
            presetID = presetID,
            minutes = minutes
        )
    }

    fun setSecondsPerRepetition(seconds: Int) {
        val presetID = state.selectedPreset()?.id ?: return
        state = store.setSecondsPerRepetition(
            presetID = presetID,
            seconds = seconds
        )
    }

    fun undoLastIncrement() {
        state = store.undoLastIncrement()
    }

    fun updateDailyGoal(target: Int) {
        state = store.updateDailyGoal(target)
    }

    fun updatePresetTarget(presetID: String, target: Int) {
        state = store.updatePresetTarget(presetID, target)
    }

    fun toggleLiveActivity(enabled: Boolean) {
        state = store.setLiveActivityEnabled(enabled)
    }

    fun addCustomPreset(title: String, arabic: String, transliteration: String) {
        state = store.addCustomPreset(
            title = title,
            arabic = arabic,
            transliteration = transliteration
        )
    }

    fun deletePreset(id: String) {
        state = store.deletePreset(id)
    }

    fun sessionElapsedSeconds(): Int {
        val start = sessionStartAt ?: return 0
        return (now - start).inWholeSeconds.toInt().coerceAtLeast(0)
    }

    fun toggleSimpleDaily(enabled: Boolean) {
        val updated = state.reminderPreference.copy(
            simpleDailyEnabled = enabled,
            simpleReminderTimes = state.reminderPreference.simpleReminderTimes.toMutableList(),
            smartNudgeTimes = state.reminderPreference.smartNudgeTimes.toMutableList()
        )
        state = store.updateReminderPreference(updated)
    }

    fun toggleSmartNudges(enabled: Boolean) {
        val updated = state.reminderPreference.copy(
            smartNudgesEnabled = enabled,
            simpleReminderTimes = state.reminderPreference.simpleReminderTimes.toMutableList(),
            smartNudgeTimes = state.reminderPreference.smartNudgeTimes.toMutableList()
        )
        state = store.updateReminderPreference(updated)
    }

    fun togglePrayerTimes(enabled: Boolean) {
        val updated = state.reminderPreference.copy(
            prayerTimesEnabled = enabled,
            simpleReminderTimes = state.reminderPreference.simpleReminderTimes.toMutableList(),
            smartNudgeTimes = state.reminderPreference.smartNudgeTimes.toMutableList()
        )
        state = store.updateReminderPreference(updated)
    }

    fun setSimpleReminderTime(time: TimeOfDay) {
        val updated = state.reminderPreference.copy(
            simpleReminderTimes = mutableListOf(time),
            smartNudgeTimes = state.reminderPreference.smartNudgeTimes.toMutableList()
        )
        state = store.updateReminderPreference(updated)
    }
}

@Composable
private fun ZikrAndroidApp(viewModel: ZikrAndroidViewModel) {
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            viewModel.tick()
        }
    }

    val state = viewModel.state
    val now = viewModel.now

    if (!state.hasCompletedOnboarding) {
        OnboardingScreen(viewModel)
        return
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = tab == viewModel.currentTab,
                        onClick = { viewModel.selectTab(tab) },
                        icon = { Text(tab.short) },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (viewModel.currentTab) {
                AppTab.Counter -> CounterScreen(viewModel, now)
                AppTab.Rewards -> RewardsScreen(viewModel)
                AppTab.Garden -> GardenScreen(viewModel, now)
                AppTab.History -> HistoryScreen(viewModel, now)
                AppTab.Settings -> SettingsScreen(viewModel)
            }
        }
    }
}

@Composable
private fun OnboardingScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    var name by rememberSaveable { mutableStateOf("") }
    var goalText by rememberSaveable { mutableStateOf("100") }
    var selectedPresetID by rememberSaveable {
        mutableStateOf(state.presets.firstOrNull()?.id ?: "salawat")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Welcome to Zikr", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("Set up your daily dhikr flow.")

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Name") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = goalText,
                    onValueChange = { goalText = it.filter { ch -> ch.isDigit() } },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Daily goal") },
                    singleLine = true
                )

                Text("Default preset", fontWeight = FontWeight.SemiBold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.presets, key = { it.id }) { preset ->
                        val selected = preset.id == selectedPresetID
                        AssistChip(
                            onClick = { selectedPresetID = preset.id },
                            label = { Text(preset.title) },
                            colors = AssistChipDefaults.assistChipColors(
                                labelColor = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                                containerColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                    }
                }

                Button(
                    onClick = {
                        val target = goalText.toIntOrNull()?.coerceAtLeast(33) ?: 100
                        viewModel.completeOnboarding(
                            name = name,
                            target = target,
                            presetID = selectedPresetID
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Start")
                }
            }
        }
    }
}

@Composable
private fun CounterScreen(viewModel: ZikrAndroidViewModel, now: Instant) {
    val state = viewModel.state
    val selectedPreset = state.selectedPreset() ?: return
    val selectedCount = state.repetitionCount(selectedPreset.id, state.today, now)
    val target = state.targetCount(selectedPreset.id)
    val totalToday = state.totalRepetitionCount(state.today, now)
    val remaining = state.remainingToGoal(state.today, now)
    val timerElapsed = state.timerElapsedSeconds(selectedPreset.id, now)
    val timerTargetMinutes = state.timerTargetMinutes(selectedPreset.id)
    val secondsPerRepetition = state.secondsPerRepetition(selectedPreset.id).coerceAtLeast(1)
    val timerEstimatedRepetitions = timerElapsed / secondsPerRepetition
    val completion = (selectedCount.toFloat() / target.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f)
    val sessionElapsedSeconds = viewModel.sessionElapsedSeconds()

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(selectedPreset.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("$selectedCount of $target", style = MaterialTheme.typography.headlineMedium)
            LinearProgressIndicator(progress = { completion }, modifier = Modifier.fillMaxWidth())
            Text("Total today: $totalToday")
            if (state.isGoalCompleted(state.today, now)) {
                Text("Goal reached")
            } else {
                Text("$remaining remaining")
            }
            Text("Timer: ${timerElapsed / 60}m ${timerElapsed % 60}s • est $timerEstimatedRepetitions reps")
            Text("Streak: ${state.streak.current} days")
            if (sessionElapsedSeconds > 0) {
                Text("Session: ${sessionElapsedSeconds / 60}m ${sessionElapsedSeconds % 60}s")
            }
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(onClick = { viewModel.increment(1) }, modifier = Modifier.weight(1f)) {
            Text("+1")
        }
        Button(onClick = { viewModel.increment(10) }, modifier = Modifier.weight(1f)) {
            Text("+10")
        }
        Button(onClick = { viewModel.increment(33) }, modifier = Modifier.weight(1f)) {
            Text("+33")
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(
            onClick = { viewModel.undoLastIncrement() },
            modifier = Modifier.weight(1f)
        ) {
            Text("Undo")
        }
        Button(
            onClick = { viewModel.toggleTimer() },
            modifier = Modifier.weight(1f)
        ) {
            Text(if (state.isTimerRunning(selectedPreset.id)) "Pause Timer" else "Start Timer")
        }
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Timer Settings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Target: ${timerTargetMinutes} min")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { viewModel.setTimerTargetMinutes((timerTargetMinutes - 5).coerceAtLeast(0)) },
                    modifier = Modifier.weight(1f)
                ) { Text("-5m") }
                Button(
                    onClick = { viewModel.setTimerTargetMinutes(timerTargetMinutes + 5) },
                    modifier = Modifier.weight(1f)
                ) { Text("+5m") }
            }
            Text("Seconds / repetition: $secondsPerRepetition")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { viewModel.setSecondsPerRepetition((secondsPerRepetition - 1).coerceAtLeast(1)) },
                    modifier = Modifier.weight(1f)
                ) { Text("-1s") }
                Button(
                    onClick = { viewModel.setSecondsPerRepetition(secondsPerRepetition + 1) },
                    modifier = Modifier.weight(1f)
                ) { Text("+1s") }
            }
        }
    }

    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(state.presets, key = { it.id }) { preset ->
            val selected = preset.id == state.selectedPresetID
            AssistChip(
                onClick = { viewModel.selectPreset(preset.id) },
                label = { Text(preset.title) },
                colors = AssistChipDefaults.assistChipColors(
                    labelColor = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                    containerColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                )
            )
        }
    }
}

@Composable
private fun RewardsScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Level ${state.rewards.level}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("XP ${state.rewards.xp}")
            Text("Current streak: ${state.streak.current} days")
            Spacer(modifier = Modifier.height(4.dp))
            if (state.rewards.badges.isEmpty()) {
                Text("No badges yet")
            } else {
                state.rewards.badges.forEach { badge ->
                    Text("• ${badge.title}: ${badge.detail}")
                }
            }
        }
    }
}

@Composable
private fun GardenScreen(viewModel: ZikrAndroidViewModel, now: Instant) {
    val state = viewModel.state
    val progress = state.completionRatio(state.today, now).toFloat().coerceIn(0f, 1f)
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Garden", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Your tree grows as your daily dhikr progress rises.")
            LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth())
            Text("Growth ${(progress * 100).toInt()}%")
        }
    }
}

@Composable
private fun HistoryScreen(viewModel: ZikrAndroidViewModel, now: Instant) {
    val state = viewModel.state
    val timeline = listOf(state.today) + state.history
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(timeline, key = { it.isoDate }) { day ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(day.isoDate, fontWeight = FontWeight.Bold)
                        Text("Total ${state.totalRepetitionCount(day, now)}")
                    }
                    Text(if (day.goalCompleted) "Completed" else "In progress")
                }
            }
        }
    }
}

@Composable
private fun SettingsScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    val scrollState = rememberScrollState()
    var customTitle by rememberSaveable { mutableStateOf("") }
    var customArabic by rememberSaveable { mutableStateOf("") }
    var customTransliteration by rememberSaveable { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Daily Goal", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("${state.dailyGoal.targetCount} reps")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { viewModel.updateDailyGoal((state.dailyGoal.targetCount - 10).coerceAtLeast(33)) },
                        modifier = Modifier.weight(1f)
                    ) { Text("-10") }
                    Button(
                        onClick = { viewModel.updateDailyGoal(state.dailyGoal.targetCount + 10) },
                        modifier = Modifier.weight(1f)
                    ) { Text("+10") }
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Per-Preset Targets", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                state.presets.forEach { preset ->
                    val currentTarget = state.dailyGoal.perPresetTargets[preset.id] ?: 0
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = preset.title,
                            modifier = Modifier.weight(1f)
                        )
                        Button(onClick = {
                            viewModel.updatePresetTarget(
                                presetID = preset.id,
                                target = (currentTarget - 10).coerceAtLeast(0)
                            )
                        }) {
                            Text("-10")
                        }
                        Text(currentTarget.toString())
                        Button(onClick = {
                            viewModel.updatePresetTarget(
                                presetID = preset.id,
                                target = currentTarget + 10
                            )
                        }) {
                            Text("+10")
                        }
                    }
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Reminders", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Simple daily")
                    Switch(
                        checked = state.reminderPreference.simpleDailyEnabled,
                        onCheckedChange = viewModel::toggleSimpleDaily
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Smart nudges")
                    Switch(
                        checked = state.reminderPreference.smartNudgesEnabled,
                        onCheckedChange = viewModel::toggleSmartNudges
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Prayer times")
                    Switch(
                        checked = state.reminderPreference.prayerTimesEnabled,
                        onCheckedChange = viewModel::togglePrayerTimes
                    )
                }
                Text("Daily reminder time")
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(TimeOfDay.commonChoices, key = { it.id }) { choice ->
                        val selected = state.reminderPreference.simpleReminderTimes.firstOrNull()?.id == choice.id
                        AssistChip(
                            onClick = { viewModel.setSimpleReminderTime(choice) },
                            label = { Text(choice.label) },
                            colors = AssistChipDefaults.assistChipColors(
                                labelColor = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                                containerColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                    }
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("App", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Live activity")
                    Switch(
                        checked = state.liveActivityEnabled,
                        onCheckedChange = viewModel::toggleLiveActivity
                    )
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Add Custom Preset", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = customTitle,
                    onValueChange = { customTitle = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Title") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = customArabic,
                    onValueChange = { customArabic = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Arabic") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = customTransliteration,
                    onValueChange = { customTransliteration = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Transliteration") },
                    singleLine = true
                )
                Button(
                    onClick = {
                        viewModel.addCustomPreset(
                            title = customTitle,
                            arabic = customArabic,
                            transliteration = customTransliteration
                        )
                        customTitle = ""
                        customArabic = ""
                        customTransliteration = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = customTitle.isNotBlank()
                ) {
                    Text("Add Preset")
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Manage Custom Presets", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                state.presets.filter { it.kind == DhikrKind.custom }.forEach { preset ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(preset.title, modifier = Modifier.weight(1f))
                        Button(onClick = { viewModel.deletePreset(preset.id) }) {
                            Text("Delete")
                        }
                    }
                }
                if (state.presets.none { it.kind == DhikrKind.custom }) {
                    Text("No custom presets yet")
                }
            }
        }
    }
}
