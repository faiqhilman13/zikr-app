import Foundation

public final class SharedZikrStore: @unchecked Sendable {
    private let defaults: UserDefaults
    private let stateKey = "zikr.app.state"
    private let lock = NSLock()
    private let now: @Sendable () -> Date
    private var calendar: Calendar
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(
        suiteName: String = "group.com.faiqhilman.zikr",
        defaults: UserDefaults? = nil,
        now: @escaping @Sendable () -> Date = { Date() },
        calendar: Calendar = .current
    ) {
        self.defaults = defaults ?? UserDefaults(suiteName: suiteName) ?? .standard
        self.now = now
        self.calendar = calendar
    }

    public func snapshot() -> ZikrAppState {
        mutate { _ in }
    }

    @discardableResult
    public func incrementSelectedDhikr(by amount: Int) -> ZikrAppState {
        mutate { state in
            guard amount > 0 else { return }
            let presetID = state.selectedPresetID
            state.today.counts[presetID, default: 0] += amount
            state.today.totalCount += amount
            state.recentEvents.insert(.init(presetID: presetID, amount: amount, occurredAt: now()), at: 0)
            state.recentEvents = Array(state.recentEvents.prefix(50))
            if state.today.totalCount >= state.dailyGoal.targetCount, !state.today.goalCompleted {
                state.today.goalCompleted = true
                state.today.completedAt = now()
            }
        }
    }

    @discardableResult
    public func selectPreset(id: String) -> ZikrAppState {
        mutate { state in
            if state.presets.contains(where: { $0.id == id }) {
                state.selectedPresetID = id
            }
        }
    }

    @discardableResult
    public func completeOnboarding(userName: String, selectedPresetID: String, dailyTarget: Int) -> ZikrAppState {
        mutate { state in
            state.hasCompletedOnboarding = true
            state.userName = userName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Dhikr Hero" : userName.trimmingCharacters(in: .whitespacesAndNewlines)
            state.selectedPresetID = state.presets.contains(where: { $0.id == selectedPresetID }) ? selectedPresetID : state.selectedPresetID
            state.dailyGoal.targetCount = max(33, dailyTarget)
            if state.today.totalCount >= state.dailyGoal.targetCount {
                state.today.goalCompleted = true
                state.today.completedAt = state.today.completedAt ?? now()
            }
        }
    }

    @discardableResult
    public func updateDailyGoal(_ target: Int) -> ZikrAppState {
        mutate { state in
            state.dailyGoal.targetCount = max(33, target)
            if state.today.totalCount >= state.dailyGoal.targetCount {
                state.today.goalCompleted = true
                state.today.completedAt = state.today.completedAt ?? now()
            } else {
                state.today.goalCompleted = false
                state.today.completedAt = nil
            }
        }
    }

    @discardableResult
    public func updateReminderPreference(_ preference: ReminderPreference) -> ZikrAppState {
        mutate { state in
            state.reminderPreference = preference
        }
    }

    @discardableResult
    public func setCircles(_ circles: [CircleSummary]) -> ZikrAppState {
        mutate { state in
            state.circles = circles
        }
    }

    @discardableResult
    public func setLiveActivityEnabled(_ enabled: Bool) -> ZikrAppState {
        mutate { state in
            state.liveActivityEnabled = enabled
        }
    }

    @discardableResult
    public func addCustomPreset(title: String, arabic: String, transliteration: String) -> ZikrAppState {
        mutate { state in
            let cleanedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !cleanedTitle.isEmpty else { return }
            let preset = DhikrPreset(
                title: cleanedTitle,
                arabic: arabic.trimmingCharacters(in: .whitespacesAndNewlines),
                transliteration: transliteration.trimmingCharacters(in: .whitespacesAndNewlines),
                kind: .custom,
                colorName: "violet"
            )
            state.presets.append(preset)
            state.selectedPresetID = preset.id
        }
    }

    @discardableResult
    public func undoLastIncrement() -> ZikrAppState {
        mutate { state in
            guard let lastEvent = state.recentEvents.first else { return }
            state.recentEvents.removeFirst()
            state.today.counts[lastEvent.presetID, default: 0] -= lastEvent.amount
            state.today.totalCount -= lastEvent.amount
            if state.today.totalCount < state.dailyGoal.targetCount {
                state.today.goalCompleted = false
                state.today.completedAt = nil
            }
        }
    }

    @discardableResult
    public func updatePreset(id: String, title: String, arabic: String, transliteration: String) -> ZikrAppState {
        mutate { state in
            guard let index = state.presets.firstIndex(where: { $0.id == id }) else { return }
            state.presets[index].title = title.trimmingCharacters(in: .whitespacesAndNewlines)
            state.presets[index].arabic = arabic.trimmingCharacters(in: .whitespacesAndNewlines)
            state.presets[index].transliteration = transliteration.trimmingCharacters(in: .whitespacesAndNewlines)
        }
    }

    @discardableResult
    public func deletePreset(id: String) -> ZikrAppState {
        mutate { state in
            let starterIDs = ["salawat", "tahlil", "tasbih", "takbir", "tahmid"]
            guard !starterIDs.contains(id) else { return }
            guard let index = state.presets.firstIndex(where: { $0.id == id }) else { return }
            state.presets.remove(at: index)
            if state.selectedPresetID == id {
                state.selectedPresetID = state.presets.first?.id ?? "salawat"
            }
            state.today.counts.removeValue(forKey: id)
        }
    }

    @discardableResult
    private func mutate(_ transform: (inout ZikrAppState) -> Void) -> ZikrAppState {
        lock.lock()
        defer { lock.unlock() }

        var state = loadStateLocked()
        rolloverIfNeeded(state: &state)
        transform(&state)
        normalize(state: &state)
        saveStateLocked(state)
        return state
    }

    private func loadStateLocked() -> ZikrAppState {
        defaults.synchronize()
        guard let data = defaults.data(forKey: stateKey), let decoded = try? decoder.decode(ZikrAppState.self, from: data) else {
            return ZikrAppState.initial(now: now(), calendar: calendar)
        }
        return decoded
    }

    private func saveStateLocked(_ state: ZikrAppState) {
        guard let data = try? encoder.encode(state) else { return }
        defaults.set(data, forKey: stateKey)
        defaults.synchronize()
    }

    private func rolloverIfNeeded(state: inout ZikrAppState) {
        let todayKey = DayKey.string(from: now(), calendar: calendar)
        guard todayKey != state.today.isoDate else { return }
        state.history.insert(state.today, at: 0)
        state.history = Array(state.history.prefix(30))
        state.today = DayProgress(isoDate: todayKey)
    }

    private func normalize(state: inout ZikrAppState) {
        state.history.sort { $0.isoDate > $1.isoDate }
        state.streak = StreakEngine.recalculate(history: state.allProgress, referenceDayKey: state.today.isoDate, calendar: calendar)
        state.rewards = RewardEngine.recalculate(history: state.allProgress, goal: state.dailyGoal, currentStreak: state.streak)
    }
}
