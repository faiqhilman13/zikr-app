#if canImport(ActivityKit)
import ActivityKit

struct ZikrActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var presetTitle: String
        var totalCount: Int
        var targetCount: Int
        var streak: Int
        var multiplier: Int
    }

    var userName: String
}
#endif
