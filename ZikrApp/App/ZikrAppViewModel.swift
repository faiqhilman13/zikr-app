import Foundation
import SwiftUI
import ZikrCore

@MainActor
final class ZikrAppViewModel: ObservableObject {
    enum Tab: Hashable {
        case counter
        case rewards
        case circles
        case history
        case settings
    }

    @Published private(set) var state: ZikrAppState
    @Published var selectedTab: Tab = .counter

    private let store: SharedZikrStore
    private let communityRepository: any CommunityRepository
    private let notificationScheduler: NotificationScheduler
    private let liveActivityManager: LiveActivityManager
    private var hasBootstrapped = false

    init(
        store: SharedZikrStore = SharedZikrStore(),
        communityRepository: any CommunityRepository = FirebaseCommunityRepository(),
        notificationScheduler: NotificationScheduler = NotificationScheduler(),
        liveActivityManager: LiveActivityManager = LiveActivityManager()
    ) {
        self.store = store
        self.communityRepository = communityRepository
        self.notificationScheduler = notificationScheduler
        self.liveActivityManager = liveActivityManager
        self.state = store.snapshot()
    }

    var selectedPreset: DhikrPreset {
        state.selectedPreset ?? state.presets[0]
    }

    var selectedPresetCount: Int {
        state.today.counts[selectedPreset.id] ?? 0
    }

    var timeline: [DayProgress] {
        [state.today] + state.history
    }

    func bootstrap() async {
        guard !hasBootstrapped else { return }
        hasBootstrapped = true
        await reloadFromStore()
    }

    func reloadFromStore() async {
        state = store.snapshot()
        await notificationScheduler.requestAuthorizationIfNeeded()
        await refreshNotifications()
        await refreshCircles()
        await refreshLiveActivity()
    }

    func increment(by amount: Int = 1) {
        state = store.incrementSelectedDhikr(by: amount)
        Task {
            await refreshNotifications()
            await refreshLiveActivity()
            await refreshCircles()
        }
    }

    func selectPreset(_ preset: DhikrPreset) {
        state = store.selectPreset(id: preset.id)
        Task {
            await refreshLiveActivity()
        }
    }

    func completeOnboarding(name: String, target: Int, presetID: String) {
        state = store.completeOnboarding(userName: name, selectedPresetID: presetID, dailyTarget: target)
        Task {
            await notificationScheduler.requestAuthorizationIfNeeded()
            await refreshNotifications()
            await refreshLiveActivity()
            await refreshCircles()
        }
    }

    func updateDailyGoal(_ target: Int) {
        state = store.updateDailyGoal(target)
        Task {
            await refreshNotifications()
            await refreshLiveActivity()
        }
    }

    func setSimpleDailyEnabled(_ isEnabled: Bool) {
        var preference = state.reminderPreference
        preference.simpleDailyEnabled = isEnabled
        updateReminderPreference(preference)
    }

    func setSmartNudgesEnabled(_ isEnabled: Bool) {
        var preference = state.reminderPreference
        preference.smartNudgesEnabled = isEnabled
        updateReminderPreference(preference)
    }

    func setPrayerTimesEnabled(_ isEnabled: Bool) {
        var preference = state.reminderPreference
        preference.prayerTimesEnabled = isEnabled
        updateReminderPreference(preference)
    }

    func setSimpleReminderTime(_ time: TimeOfDay) {
        var preference = state.reminderPreference
        preference.simpleReminderTimes = [time]
        updateReminderPreference(preference)
    }

    func toggleLiveActivity(_ enabled: Bool) {
        state = store.setLiveActivityEnabled(enabled)
        Task {
            await refreshLiveActivity()
        }
    }

    func addCustomPreset(title: String, arabic: String, transliteration: String) {
        state = store.addCustomPreset(title: title, arabic: arabic, transliteration: transliteration)
        Task {
            await refreshLiveActivity()
        }
    }

    func refreshCircles() async {
        guard state.hasCompletedOnboarding else { return }
        do {
            let circles = try await communityRepository.loadCircles(
                for: state.userName,
                currentTotal: state.today.totalCount,
                streak: state.streak.current
            )
            state = store.setCircles(circles)
        } catch {
            state = store.setCircles([])
        }
    }

    private func updateReminderPreference(_ preference: ReminderPreference) {
        state = store.updateReminderPreference(preference)
        Task {
            await refreshNotifications()
        }
    }

    private func refreshNotifications() async {
        await notificationScheduler.refresh(for: state)
    }

    private func refreshLiveActivity() async {
        await liveActivityManager.refresh(for: state, selectedPreset: selectedPreset)
    }
}
