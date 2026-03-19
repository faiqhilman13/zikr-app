import SwiftUI
import WidgetKit
import ZikrCore

#if canImport(ActivityKit)
import ActivityKit
#endif

private struct ZikrEntry: TimelineEntry {
    let date: Date
    let state: ZikrAppState
}

private struct ZikrProvider: TimelineProvider {
    private let store = SharedZikrStore()

    func placeholder(in context: Context) -> ZikrEntry {
        ZikrEntry(date: Date(), state: store.snapshot())
    }

    func getSnapshot(in context: Context, completion: @escaping (ZikrEntry) -> Void) {
        completion(ZikrEntry(date: Date(), state: store.snapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ZikrEntry>) -> Void) {
        let entry = ZikrEntry(date: Date(), state: store.snapshot())
        let refresh = Calendar.current.date(byAdding: .minute, value: 1, to: Date()) ?? Date().addingTimeInterval(60)
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

private struct ZikrLockScreenWidget: Widget {
    let kind = "ZikrLockScreenWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ZikrProvider()) { entry in
            LockScreenCounterView(entry: entry)
        }
        .configurationDisplayName("Zikr Counter")
        .description("Add dhikr counts from the lock screen.")
        .supportedFamilies([.accessoryRectangular, .systemSmall])
    }
}

private struct LockScreenCounterView: View {
    @Environment(\.widgetFamily) private var family
    let entry: ZikrEntry

    var body: some View {
        let preset = entry.state.selectedPreset ?? entry.state.presets[0]
        Group {
            switch family {
            case .accessoryRectangular:
                VStack(alignment: .leading, spacing: 4) {
                    Text(preset.title)
                        .font(.headline)
                    Text("\(entry.state.today.counts[preset.id] ?? 0)/\(entry.state.dailyGoal.targetCount)")
                        .font(.caption)
                    Button(intent: IncrementDhikrIntent(amount: 1)) {
                        Text("+1")
                            .font(.caption.bold())
                    }
                }
            default:
                VStack(spacing: 8) {
                    Text(preset.title)
                        .font(.headline)
                        .multilineTextAlignment(.center)
                    Text("\(entry.state.today.counts[preset.id] ?? 0)")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                    Button(intent: IncrementDhikrIntent(amount: 1)) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
                .padding(10)
            }
        }
        .containerBackground(for: .widget) {
            RoundedRectangle(cornerRadius: 20).fill(Color.indigo.opacity(0.16))
        }
    }
}

#if canImport(ActivityKit)
private struct ZikrLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ZikrActivityAttributes.self) { context in
            VStack(alignment: .leading, spacing: 12) {
                Text("\(context.attributes.userName)'s dhikr")
                    .font(.headline)
                Text(context.state.presetTitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                HStack {
                    Text("\(context.state.totalCount)/\(context.state.targetCount)")
                        .font(.title3.bold())
                    Spacer()
                    Text("x\(context.state.multiplier)")
                        .font(.headline)
                }
                Button(intent: IncrementDhikrIntent(amount: 1)) {
                    Text("+1")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .activityBackgroundTint(.indigo.opacity(0.2))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.presetTitle)
                        .font(.caption.bold())
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("x\(context.state.multiplier)")
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack(spacing: 12) {
                        Button(intent: IncrementDhikrIntent(amount: 1)) {
                            Text("+1")
                        }
                        Spacer()
                        Text("\(context.state.totalCount)/\(context.state.targetCount)")
                            .font(.headline)
                    }
                }
            } compactLeading: {
                Text("\(context.state.totalCount)")
            } compactTrailing: {
                Text("x\(context.state.multiplier)")
            } minimal: {
                Text("\(context.state.totalCount)")
            }
        }
    }
}
#endif

@main
struct ZikrWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        ZikrLockScreenWidget()
        #if canImport(ActivityKit)
        ZikrLiveActivityWidget()
        #endif
    }
}
