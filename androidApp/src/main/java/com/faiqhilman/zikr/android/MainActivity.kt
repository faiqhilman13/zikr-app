package com.faiqhilman.zikr.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.outlined.Eco
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Park
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.SmartButton
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import com.faiqhilman.zikr.android.ui.theme.ZikrPalette
import com.faiqhilman.zikr.android.ui.theme.ZikrTheme
import com.faiqhilman.zikr.shared.DhikrKind
import com.faiqhilman.zikr.shared.KeyValueStorage
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
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

enum class AppTab(val label: String) {
    Counter("Count"),
    Rewards("Rewards"),
    Garden("Garden"),
    History("History"),
    Settings("Settings")
}

enum class TreeKind(val displayName: String) {
    Olive("Olive"),
    Palm("Date Palm"),
    Lote("Lote Tree"),
    Cedar("Cedar");

    val trunkColor: Color
        get() = when (this) {
            Olive -> Color(0xFF8B6F47)
            Palm -> Color(0xFFA0522D)
            Lote -> Color(0xFF6B8E5A)
            Cedar -> Color(0xFF5C4033)
        }

    val leafColors: Pair<Color, Color>
        get() = when (this) {
            Olive -> Color(0xFF6B8E23) to Color(0xFF9DC84B)
            Palm -> Color(0xFF2D7A3A) to Color(0xFF52C06A)
            Lote -> Color(0xFF3B7A57) to Color(0xFF7BC17E)
            Cedar -> Color(0xFF1A5C3A) to Color(0xFF2E8B57)
        }

    val accentColor: Color
        get() = when (this) {
            Olive -> Color(0xFF556B2F)
            Palm -> Color(0xFFDAA520)
            Lote -> Color(0xFF90EE90)
            Cedar -> Color(0xFF8FBC8F)
        }

    fun stageName(stage: Int): String = when (stage) {
        0 -> "Seed"
        1 -> "Sprout"
        2 -> "Sapling"
        3 -> "Growing"
        else -> when (this) {
            Olive -> "Blessed Olive"
            Palm -> "Majestic Palm"
            Lote -> "Lote of the Limit"
            Cedar -> "Ancient Cedar"
        }
    }
}

class ZikrApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        val reminderChannel = NotificationChannel(
            "dhikr_reminders",
            "Dhikr Reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Reminders for your daily dhikr"
        }
        val timerChannel = NotificationChannel(
            "dhikr_timer",
            "Dhikr Timer",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Ongoing notification for active dhikr timer"
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannels(listOf(reminderChannel, timerChannel))
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

    var selectedTree by mutableStateOf(TreeKind.Olive)
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

    fun selectTree(tree: TreeKind) {
        selectedTree = tree
    }

    fun increment(by: Int = 1) {
        if (sessionStartAt == null) {
            sessionStartAt = now
        }
        state = store.incrementSelectedDhikr(by)
        now = Clock.System.now()
        hapticTap()
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
        state = store.setTimerTargetMinutes(presetID = presetID, minutes = minutes)
    }

    fun setSecondsPerRepetition(seconds: Int) {
        val presetID = state.selectedPreset()?.id ?: return
        state = store.setSecondsPerRepetition(presetID = presetID, seconds = seconds)
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
        state = store.addCustomPreset(title = title, arabic = arabic, transliteration = transliteration)
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

    private fun hapticTap() {
        val context = getApplication<Application>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            val vibrator = vibratorManager.defaultVibrator
            vibrator.vibrate(VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            (context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator)
                .vibrate(10)
        }
    }
}

private fun hapticLight(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        val vibrator = vibratorManager.defaultVibrator
        vibrator.vibrate(VibrationEffect.createOneShot(5, 30))
    } else {
        @Suppress("DEPRECATION")
        (context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator).vibrate(5)
    }
}

private fun formattedDuration(totalSeconds: Int): String {
    if (totalSeconds <= 0) return "0s"
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    return when {
        hours > 0 -> "${hours}h ${minutes}m"
        minutes > 0 -> "${minutes}m"
        else -> "${totalSeconds}s"
    }
}

private fun formatLargeNumber(value: Int): String {
    return if (value >= 1000) String.format("%.1fk", value / 1000.0) else "$value"
}

private fun shortDayLabel(isoDate: String): String {
    return try {
        val date = LocalDate.parse(isoDate)
        val dayNames = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
        dayNames.getOrElse(date.dayOfWeek.value - 1) { "?" }
    } catch (_: Exception) { "?" }
}

private fun stageForRatio(ratio: Double): Int = when {
    ratio <= 0 -> 0
    ratio < 0.25 -> 1
    ratio < 0.55 -> 2
    ratio < 0.85 -> 3
    else -> 4
}

@Composable
fun ZikrAndroidApp(viewModel: ZikrAndroidViewModel) {
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            viewModel.tick()
        }
    }

    val state = viewModel.state

    if (!state.hasCompletedOnboarding) {
        OnboardingScreen(viewModel)
        return
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 2.dp
            ) {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = tab == viewModel.currentTab,
                        onClick = {
                            viewModel.selectTab(tab)
                            hapticLight(LocalContext.current)
                        },
                        icon = {
                            Icon(
                                imageVector = when (tab) {
                                    AppTab.Counter -> Icons.Outlined.SmartButton
                                    AppTab.Rewards -> Icons.Filled.LocalFireDepartment
                                    AppTab.Garden -> Icons.Outlined.Park
                                    AppTab.History -> Icons.Outlined.History
                                    AppTab.Settings -> Icons.Outlined.Settings
                                },
                                contentDescription = tab.label,
                                modifier = Modifier.size(22.dp)
                            )
                        },
                        label = { Text(tab.label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ZikrPalette.gold,
                            selectedTextColor = ZikrPalette.gold,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            indicatorColor = ZikrPalette.goldPale.copy(alpha = 0.3f)
                        )
                    )
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))
            when (viewModel.currentTab) {
                AppTab.Counter -> CounterScreen(viewModel)
                AppTab.Rewards -> RewardsScreen(viewModel)
                AppTab.Garden -> GardenScreen(viewModel)
                AppTab.History -> HistoryScreen(viewModel)
                AppTab.Settings -> SettingsScreen(viewModel)
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            "Welcome to Zikr",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = ZikrPalette.gold
        )
        Text("Set up your daily dhikr flow.", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
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
                                containerColor = if (selected) ZikrPalette.royalBlue else MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                    }
                }

                TextButton(
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
                    Text("Start", color = ZikrPalette.gold, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun CounterScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    val now = viewModel.now
    val selectedPreset = state.selectedPreset() ?: return
    val selectedCount = state.repetitionCount(selectedPreset.id, state.today, now)
    val target = state.targetCount(selectedPreset.id)
    val totalToday = state.totalRepetitionCount(state.today, now)
    val remaining = state.remainingToGoal(state.today, now)
    val timerElapsed = state.timerElapsedSeconds(selectedPreset.id, now)
    val timerTargetMinutesVal = state.timerTargetMinutes(selectedPreset.id)
    val secondsPerRep = state.secondsPerRepetition(selectedPreset.id).coerceAtLeast(1)
    val timerEstReps = timerElapsed / secondsPerRep
    val completion = (selectedCount.toFloat() / target.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f)
    val sessionElapsed = viewModel.sessionElapsedSeconds()

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    selectedPreset.arabic,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = ZikrPalette.gold
                )
                Text(
                    selectedPreset.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Text("$selectedCount of $target", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            LinearProgressIndicator(
                progress = { completion },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = ZikrPalette.gold,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Text("Total today: $totalToday", color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (state.isGoalCompleted(state.today, now)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Filled.CheckCircle, "Goal reached", tint = ZikrPalette.gold, modifier = Modifier.size(16.dp))
                    Text("Goal reached", color = ZikrPalette.gold, fontWeight = FontWeight.SemiBold)
                }
            } else {
                Text("$remaining remaining", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("${timerElapsed / 60}m ${timerElapsed % 60}s • est $timerEstReps reps", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
            Text("Streak: ${state.streak.current} days", color = ZikrPalette.gold, fontWeight = FontWeight.Medium)
            if (sessionElapsed > 0) {
                Text("Session: ${sessionElapsed / 60}m ${sessionElapsed % 60}s", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
            }
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(1, 10, 33).forEach { amount ->
            TextButton(
                onClick = { viewModel.increment(amount) },
                modifier = Modifier.weight(1f)
            ) {
                Text("+$amount", fontWeight = FontWeight.Bold)
            }
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        TextButton(
            onClick = { viewModel.undoLastIncrement() },
            modifier = Modifier.weight(1f)
        ) { Text("Undo") }
        TextButton(
            onClick = { viewModel.toggleTimer() },
            modifier = Modifier.weight(1f)
        ) {
            Text(
                if (state.isTimerRunning(selectedPreset.id)) "Pause Timer" else "Start Timer",
                color = ZikrPalette.gold
            )
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Timer Settings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Target: ${timerTargetMinutesVal} min")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { viewModel.setTimerTargetMinutes((timerTargetMinutesVal - 5).coerceAtLeast(0)) }, modifier = Modifier.weight(1f)) { Text("-5m") }
                TextButton(onClick = { viewModel.setTimerTargetMinutes(timerTargetMinutesVal + 5) }, modifier = Modifier.weight(1f)) { Text("+5m") }
            }
            Text("Seconds / repetition: $secondsPerRep")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { viewModel.setSecondsPerRepetition((secondsPerRep - 1).coerceAtLeast(1)) }, modifier = Modifier.weight(1f)) { Text("-1s") }
                TextButton(onClick = { viewModel.setSecondsPerRepetition(secondsPerRep + 1) }, modifier = Modifier.weight(1f)) { Text("+1s") }
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
                    containerColor = if (selected) ZikrPalette.royalBlue else MaterialTheme.colorScheme.surfaceVariant
                )
            )
        }
    }
}

@Composable
private fun RewardsScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.LocalFireDepartment, "Streak", tint = ZikrPalette.gold)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Streak", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("${state.streak.current}", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Text("days", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column {
                    Text("Longest", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${state.streak.longest}d", fontWeight = FontWeight.Bold, color = ZikrPalette.royalBlue)
                }
                if (state.streak.multiplier > 1) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Verified, "Multiplier", tint = ZikrPalette.gold, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("x${state.streak.multiplier} multiplier", fontSize = 12.sp, color = ZikrPalette.gold, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Level ${state.rewards.level}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("${state.rewards.xp} unified XP earned", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Icon(Icons.Filled.Verified, "Level", tint = ZikrPalette.gold, modifier = Modifier.size(36.dp))
            }
            LinearProgressIndicator(
                progress = { (state.rewards.xp % 250) / 250f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = ZikrPalette.royalBlue,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        StatPill(icon = "manual", value = "${state.today.totalCount}", label = "Manual")
        StatPill(icon = "timer", value = formattedDuration(state.today.totalElapsedSeconds), label = "Timer")
        StatPill(icon = "reps", value = "${state.activityPoints(state.today, now)}", label = "Reps")
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Badges", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            if (state.rewards.badges.isEmpty()) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
                    Icon(Icons.Filled.Verified, "No badges", tint = ZikrPalette.gold.copy(alpha = 0.4f), modifier = Modifier.size(40.dp))
                    Text("Keep counting to earn badges", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                }
            } else {
                state.rewards.badges.forEach { badge ->
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(ZikrPalette.goldPale),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Verified, badge.title, tint = ZikrPalette.gold, modifier = Modifier.size(20.dp))
                        }
                        Column {
                            Text(badge.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text(badge.detail, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
private fun StatPill(icon: String, value: String, label: String) {
    Column(
        modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            when (icon) {
                "manual" -> Icons.Outlined.SmartButton
                "timer" -> Icons.Filled.Timer
                else -> Icons.Outlined.Eco
            },
            label,
            tint = ZikrPalette.gold,
            modifier = Modifier.size(16.dp)
        )
        Text(value, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
    }
}

@Composable
private fun GardenScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    val now = viewModel.now
    val progress = state.completionRatio(state.today, now).toFloat().coerceIn(0f, 1f)
    val stage = stageForRatio(progress.toDouble())
    val tree = viewModel.selectedTree
    val infiniteTransition = rememberInfiniteTransition(label = "garden_pulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )
    var showHadith by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = if (isSystemInDarkTheme()) MaterialTheme.colorScheme.surfaceVariant else Color(0xFFEDF7F0))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { showHadith = !showHadith },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Outlined.Eco, "Tree", tint = Color(0xFF4A7C59))
                    Text("The Trees of Paradise", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.weight(1f))
                    Text(if (showHadith) "▲" else "▼", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                }
                if (showHadith) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "سُبْحَانَ اللهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللهُ، وَاللهُ أَكْبُرُ",
                        textAlign = TextAlign.End,
                        style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Medium),
                        color = ZikrPalette.gold,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "\"SubhanAllah, Alhamdulillah, La ilaha illallah, and Allahu Akbar — these are the trees of Paradise.\"",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 13.sp
                    )
                    Text("— Reported by Ibn Hibban & Al-Hakim", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(tree.displayName, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                        Text(tree.stageName(stage), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    }
                    Text("${(progress * 100).toInt()}%", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = ZikrPalette.gold)
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    val scale = if (stage == 4) pulse else 1f
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val canvasWidth = size.width
                        val canvasHeight = size.height
                        val groundY = canvasHeight - 24f
                        val cx = canvasWidth / 2f

                        drawRect(
                            color = Color(0xFFE8F4FD),
                            topLeft = Offset.Zero,
                            size = Size(canvasWidth, canvasHeight)
                        )
                        drawRect(
                            color = Color(0xFFC8E6C9),
                            topLeft = Offset(0f, groundY),
                            size = Size(canvasWidth, canvasHeight - groundY)
                        )

                        when (stage) {
                            0 -> drawSeed(cx, groundY)
                            1 -> drawSprout(cx, groundY)
                            2 -> drawSapling(cx, groundY, tree, scale)
                            3 -> drawYoungTree(cx, groundY, tree, scale)
                            else -> drawFullTree(cx, groundY, tree, scale)
                        }
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            StatPill(icon = "manual", value = "${state.today.totalCount}", label = "Manual")
            StatPill(icon = "timer", value = formattedDuration(state.today.totalElapsedSeconds), label = "Timer")
            StatPill(icon = "reps", value = "${state.activityPoints(state.today, now)}", label = "Reps")
        }

        Column {
            Text("Choose your tree", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                TreeKind.entries.forEach { kind ->
                    val selected = kind == tree
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (selected) ZikrPalette.goldPale else MaterialTheme.colorScheme.surfaceVariant)
                            .border(1.5.dp, if (selected) ZikrPalette.gold else MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
                            .clickable { viewModel.selectTree(kind) }
                            .padding(vertical = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(kind.displayName, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = if (selected) ZikrPalette.royalBlue else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

private fun DrawScope.drawSeed(cx: Float, groundY: Float) {
    drawOval(Color(0xFF8B6F47), cx - 7f, groundY - 12f, 14f, 12f)
}

private fun DrawScope.drawSprout(cx: Float, groundY: Float) {
    drawLine(Color(0xFF5A8C3C), Offset(cx, groundY), Offset(cx, groundY - 36f), 3f)
    drawOval(Color(0xFF5A8C3C), cx - 18f, groundY - 40f, 36f, 16f)
    drawOval(Color(0xFF5A8C3C), cx - 18f, groundY - 34f, 36f, 16f)
}

private fun DrawScope.drawSapling(cx: Float, groundY: Float, tree: TreeKind, scale: Float) {
    drawTrunk(cx, groundY, 60f, 7f, tree.trunkColor)
    drawCanopy(cx, groundY - 60f, 32f, tree.leafColors)
}

private fun DrawScope.drawYoungTree(cx: Float, groundY: Float, tree: TreeKind, scale: Float) {
    drawTrunk(cx, groundY, 90f, 10f, tree.trunkColor)
    drawCanopy(cx, groundY - 90f, 48f, tree.leafColors)
    drawCanopy(cx - 32f, groundY - 72f, 24f, tree.leafColors)
    drawCanopy(cx + 32f, groundY - 72f, 24f, tree.leafColors)
}

private fun DrawScope.drawFullTree(cx: Float, groundY: Float, tree: TreeKind, scale: Float) {
    drawTrunk(cx, groundY, 120f, 14f, tree.trunkColor)
    drawCanopy(cx, groundY - 120f, 60f, tree.leafColors)
    drawCanopy(cx - 44f, groundY - 92f, 34f, tree.leafColors)
    drawCanopy(cx + 44f, groundY - 92f, 34f, tree.leafColors)
    drawCanopy(cx - 22f, groundY - 136f, 28f, tree.leafColors)
    drawCanopy(cx + 22f, groundY - 136f, 28f, tree.leafColors)
    val fruits = listOf(-38f to -78f, 40f to -82f, -16f to -108f, 18f to -102f)
    fruits.forEach { (dx, dy) ->
        drawOval(tree.accentColor, cx + dx - 4f, groundY + dy - 4f, 8f, 8f)
    }
}

private fun DrawScope.drawTrunk(cx: Float, groundY: Float, height: Float, width: Float, color: Color) {
    val path = Path().apply {
        moveTo(cx - width / 2, groundY)
        lineTo(cx - width / 4, groundY - height)
        lineTo(cx + width / 4, groundY - height)
        lineTo(cx + width / 2, groundY)
        close()
    }
    drawPath(path, color)
}

private fun DrawScope.drawCanopy(cx: Float, topY: Float, radius: Float, colors: Pair<Color, Color>) {
    drawOval(colors.first, cx - radius, topY - radius * 0.4f, radius * 2, radius * 1.4f)
    drawOval(colors.second, cx - radius * 0.6f, topY - radius * 0.2f, radius * 1.2f, radius * 1f)
}

private fun DrawScope.drawOval(color: Color, left: Float, top: Float, width: Float, height: Float) {
    drawRoundRect(color, topLeft = Offset(left, top), size = Size(width, height), cornerRadius = CornerRadius(minOf(width, height) / 2f))
}

@Composable
private fun HistoryScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    val now = viewModel.now
    val timeline = listOf(state.today) + state.history

    var weeklyMetric by remember { mutableStateOf("reps") }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Last 7 Days", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                Row {
                    listOf("Reps", "Time").forEach { metric ->
                        TextButton(onClick = { weeklyMetric = metric.lowercase() }) {
                            Text(metric, fontSize = 12.sp, color = if (weeklyMetric == metric.lowercase()) ZikrPalette.gold else MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            val last7 = timeline.take(7)
            val maxVal = last7.maxOfOrNull { if (weeklyMetric == "reps") state.totalRepetitionCount(it, now) else it.totalElapsedSeconds }?.coerceAtLeast(1) ?: 1

            Row(modifier = Modifier.fillMaxWidth().height(120.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                last7.forEach { day ->
                    val value = if (weeklyMetric == "reps") state.totalRepetitionCount(day, now) else day.totalElapsedSeconds
                    val ratio = value.toFloat() / maxVal.toFloat()
                    val isToday = day.isoDate == state.today.isoDate
                    Column(
                        modifier = Modifier.weight(1f).fillMaxHeight(),
                        verticalArrangement = Arrangement.Bottom,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (value > 0) {
                            Text(if (weeklyMetric == "reps") "$value" else formattedDuration(value), fontSize = 9.sp, color = if (isToday) ZikrPalette.gold else MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Box(
                            modifier = Modifier
                                .width(20.dp)
                                .height(max(ratio * 80f, if (value > 0) 4f else 2f).dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (isToday) ZikrPalette.gold else ZikrPalette.royalBlue.copy(alpha = 0.6f))
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(shortDayLabel(day.isoDate), fontSize = 10.sp, color = if (isToday) ZikrPalette.gold else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        StatPill(icon = "flame", value = "${state.streak.longest}d", label = "Best Streak")
        StatPill(icon = "reps", value = formatLargeNumber(state.history.sumOf { it.totalCount } + state.today.totalCount), label = "All Time Reps")
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Daily Consistency", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)

            val dayNames = listOf("M", "T", "W", "T", "F", "S", "S")
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                dayNames.forEach { Text(it, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f), textAlign = TextAlign.Center) }
            }

            val heatDays = (0..34).map { offset ->
                val date = now.toLocalDateTime(TimeZone.currentSystemDefault()).date.minusDays((34 - offset).toLong())
                val isoDate = date.toString()
                val day = timeline.find { it.isoDate == isoDate } ?: com.faiqhilman.zikr.shared.DayProgress(isoDate = isoDate)
                Triple(day, isoDate == state.today.isoDate, isoDate > state.today.isoDate)
            }

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                heatDays.forEach { (day, isToday, isFuture) ->
                    val color = when {
                        isFuture -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                        day.goalCompleted -> ZikrPalette.gold
                        day.totalCount > 0 || day.totalElapsedSeconds > 0 -> ZikrPalette.royalBlue.copy(alpha = 0.4f)
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(color)
                            .then(if (isToday) Modifier.border(1.5.dp, ZikrPalette.gold, CircleShape) else Modifier)
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                LegendDot(MaterialTheme.colorScheme.surfaceVariant, "None")
                LegendDot(ZikrPalette.royalBlue.copy(alpha = 0.4f), "Active")
                LegendDot(ZikrPalette.gold, "Goal met")
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Daily Log", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            timeline.take(10).forEach { day ->
                val totalReps = state.totalRepetitionCount(day, now)
                val hasActivity = totalReps > 0 || day.totalElapsedSeconds > 0
                val goalMet = if (day.isoDate == state.today.isoDate) state.isGoalCompleted(day, now) else day.goalCompleted
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(day.isoDate, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("$totalReps reps • ${formattedDuration(day.totalElapsedSeconds)}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                    if (goalMet) {
                        Icon(Icons.Filled.CheckCircle, "Goal met", tint = ZikrPalette.gold, modifier = Modifier.size(20.dp))
                    } else if (hasActivity) {
                        Icon(Icons.Filled.Timer, "Active", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
                    } else {
                        Text("Rest", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(color))
        Text(label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun SettingsScreen(viewModel: ZikrAndroidViewModel) {
    val state = viewModel.state
    var customTitle by rememberSaveable { mutableStateOf("") }
    var customArabic by rememberSaveable { mutableStateOf("") }
    var customTransliteration by rememberSaveable { mutableStateOf("") }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Daily Goal", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("${state.dailyGoal.targetCount} reps", color = MaterialTheme.colorScheme.onSurface)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { viewModel.updateDailyGoal((state.dailyGoal.targetCount - 10).coerceAtLeast(33)) }, modifier = Modifier.weight(1f)) { Text("-10") }
                TextButton(onClick = { viewModel.updateDailyGoal(state.dailyGoal.targetCount + 10) }, modifier = Modifier.weight(1f)) { Text("+10") }
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Per-Preset Targets", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            state.presets.forEach { preset ->
                val currentTarget = state.dailyGoal.perPresetTargets[preset.id] ?: 0
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(preset.title, modifier = Modifier.weight(1f))
                    TextButton(onClick = { viewModel.updatePresetTarget(preset.id, (currentTarget - 10).coerceAtLeast(0)) }) { Text("-10") }
                    Text("$currentTarget")
                    TextButton(onClick = { viewModel.updatePresetTarget(preset.id, currentTarget + 10) }) { Text("+10") }
                }
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Reminders", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Simple daily")
                Switch(checked = state.reminderPreference.simpleDailyEnabled, onCheckedChange = viewModel::toggleSimpleDaily)
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Smart nudges")
                Switch(checked = state.reminderPreference.smartNudgesEnabled, onCheckedChange = viewModel::toggleSmartNudges)
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Prayer times")
                Switch(checked = state.reminderPreference.prayerTimesEnabled, onCheckedChange = viewModel::togglePrayerTimes)
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
                            containerColor = if (selected) ZikrPalette.royalBlue else MaterialTheme.colorScheme.surfaceVariant
                        )
                    )
                }
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("App", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Outlined.Notifications, "Live activity", modifier = Modifier.size(20.dp))
                    Text("Live activity")
                }
                Switch(checked = state.liveActivityEnabled, onCheckedChange = viewModel::toggleLiveActivity)
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Add Custom Preset", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            OutlinedTextField(value = customTitle, onValueChange = { customTitle = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Title") }, singleLine = true)
            OutlinedTextField(value = customArabic, onValueChange = { customArabic = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Arabic") }, singleLine = true)
            OutlinedTextField(value = customTransliteration, onValueChange = { customTransliteration = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Transliteration") }, singleLine = true)
            TextButton(
                onClick = {
                    viewModel.addCustomPreset(title = customTitle, arabic = customArabic, transliteration = customTransliteration)
                    customTitle = ""
                    customArabic = ""
                    customTransliteration = ""
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = customTitle.isNotBlank()
            ) { Text("Add Preset") }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Manage Custom Presets", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            state.presets.filter { it.kind == DhikrKind.custom }.forEach { preset ->
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(preset.title, modifier = Modifier.weight(1f))
                    TextButton(onClick = { viewModel.deletePreset(preset.id) }) { Text("Delete") }
                }
            }
            if (state.presets.none { it.kind == DhikrKind.custom }) {
                Text("No custom presets yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun MainActivityContent(viewModel: ZikrAndroidViewModel) {
    ZikrTheme {
        ZikrAndroidApp(viewModel)
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val viewModel = ZikrAndroidViewModel(application)
        setContent {
            MainActivityContent(viewModel)
        }
    }
}