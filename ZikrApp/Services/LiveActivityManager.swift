import Foundation
import ZikrCore

#if canImport(ActivityKit)
import ActivityKit

struct LiveActivityManager {
    func refresh(for state: ZikrAppState, selectedPreset: DhikrPreset) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let referenceDate = Date()
        let presetRepetitions = state.repetitionCount(for: selectedPreset.id, on: state.today, now: referenceDate)

        let contentState = ZikrActivityAttributes.ContentState(
            presetTitle: selectedPreset.title,
            totalCount: presetRepetitions,
            targetCount: state.targetCount(for: selectedPreset.id),
            streak: state.streak.current,
            multiplier: state.streak.multiplier
        )

        if state.liveActivityEnabled {
            if let activity = Activity<ZikrActivityAttributes>.activities.first {
                await activity.update(ActivityContent(state: contentState, staleDate: nil))
            } else {
                let attributes = ZikrActivityAttributes(userName: state.userName.isEmpty ? "You" : state.userName)
                _ = try? Activity.request(
                    attributes: attributes,
                    content: ActivityContent(state: contentState, staleDate: nil),
                    pushType: nil
                )
            }
        } else {
            for activity in Activity<ZikrActivityAttributes>.activities {
                await activity.end(ActivityContent(state: contentState, staleDate: nil), dismissalPolicy: .immediate)
            }
        }
    }
}
#else
struct LiveActivityManager {
    func refresh(for state: ZikrAppState, selectedPreset: DhikrPreset) async {}
}
#endif
