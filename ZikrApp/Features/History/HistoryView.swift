import SwiftUI
import ZikrCore

struct HistoryView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                if viewModel.timeline.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(ZikrPalette.gold.opacity(0.4))
                        Text("No history yet")
                            .font(.headline)
                            .foregroundStyle(colors.textPrimary)
                        Text("Start counting to build your history")
                            .font(.subheadline)
                            .foregroundStyle(colors.textSecondary)
                    }
                } else {
                    List {
                        ForEach(viewModel.timeline) { day in
                            dayRow(day)
                                .listRowBackground(colors.surface)
                                .listRowSeparator(.hidden)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("History")
            .toolbarBackground(colors.navBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    private func dayRow(_ day: DayProgress) -> some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(formattedDate(day.isoDate))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colors.textPrimary)
                HStack(spacing: 4) {
                    Text("\(day.totalCount)")
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .foregroundStyle(ZikrPalette.royalBlue)
                    Text("counts")
                        .font(.caption)
                        .foregroundStyle(colors.textSecondary)
                }
                if !day.counts.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(day.counts.sorted(by: { $0.key < $1.key }), id: \.key) { entry in
                                Text("\(title(for: entry.key)): \(entry.value)")
                                    .font(.caption2)
                                    .foregroundStyle(ZikrPalette.royalBlue)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(ZikrPalette.royalBlue.opacity(0.12), in: Capsule())
                            }
                        }
                    }
                }
            }
            Spacer()
            if day.goalCompleted {
                VStack(spacing: 2) {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(ZikrPalette.gold)
                    Text("Goal")
                        .font(.caption2)
                        .foregroundStyle(ZikrPalette.gold)
                }
            } else {
                VStack(spacing: 2) {
                    Text("\(max(viewModel.state.dailyGoal.targetCount - day.totalCount, 0))")
                        .font(.headline)
                        .foregroundStyle(colors.textSecondary)
                    Text("left")
                        .font(.caption2)
                        .foregroundStyle(colors.textSecondary)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 6, x: 0, y: 2)
        )
    }

    private func formattedDate(_ isoDate: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        guard let date = formatter.date(from: isoDate) else { return isoDate }
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "EEEE, MMM d"
        return displayFormatter.string(from: date)
    }

    private func title(for presetID: String) -> String {
        viewModel.state.presets.first(where: { $0.id == presetID })?.title ?? presetID
    }
}
