import AppIntents
import WidgetKit
import ZikrCore

#if canImport(ActivityKit)
import ActivityKit
#endif

struct IncrementDhikrIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Add Dhikr"
    static var description = IntentDescription("Add a dhikr count from the lock screen widget or Live Activity.")
    static var openAppWhenRun = false
    static var authenticationPolicy: IntentAuthenticationPolicy = .alwaysAllowed
    static var isDiscoverable = false

    @Parameter(title: "Amount")
    var amount: Int

    init() {
        self.amount = 1
    }

    init(amount: Int) {
        self.amount = amount
    }

    func perform() async throws -> some IntentResult {
        let store = SharedZikrStore()
        let state = store.incrementSelectedDhikr(by: amount)
        WidgetCenter.shared.reloadAllTimelines()
        Task {
            try? await Task.sleep(for: .milliseconds(500))
            WidgetCenter.shared.reloadAllTimelines()
        }

        #if canImport(ActivityKit)
        let presetTitle = state.selectedPreset?.title ?? "Dhikr"
        let contentState = ZikrActivityAttributes.ContentState(
            presetTitle: presetTitle,
            totalCount: state.today.totalCount,
            targetCount: state.dailyGoal.targetCount,
            streak: state.streak.current,
            multiplier: state.streak.multiplier
        )
        for activity in Activity<ZikrActivityAttributes>.activities {
            await activity.update(ActivityContent(state: contentState, staleDate: nil))
        }
        #endif

        return .result()
    }
}
