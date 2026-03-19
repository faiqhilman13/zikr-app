import SwiftUI
import ZikrCore

struct HistoryView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.zikrColors) var colors

    // Last 7 days for the bar chart (oldest → newest)
    private var last7Days: [DayProgress] {
        let all = viewModel.timeline
        let calendar = Calendar.current
        return (0..<7).reversed().compactMap { offset -> DayProgress? in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: Date()) else { return nil }
            let key = DayKey.string(from: date, calendar: calendar)
            return all.first(where: { $0.isoDate == key }) ?? DayProgress(isoDate: key)
        }
    }

    private var summaryStats: (totalToday: Int, bestStreak: Int, allTime: Int) {
        let totalToday = viewModel.state.today.totalCount
        let bestStreak = viewModel.state.streak.longest
        let allTime = viewModel.timeline.reduce(0) { $0 + $1.totalCount }
        return (totalToday, bestStreak, allTime)
    }

    // Up to 35 days (5 weeks) for calendar heatmap
    private var heatmapDays: [DayProgress] {
        let all = viewModel.timeline
        let calendar = Calendar.current
        return (0..<35).reversed().compactMap { offset -> DayProgress? in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: Date()) else { return nil }
            let key = DayKey.string(from: date, calendar: calendar)
            return all.first(where: { $0.isoDate == key }) ?? DayProgress(isoDate: key)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 20) {
                        weeklyBarChart
                        statsRow
                        calendarHeatmap
                        if !viewModel.timeline.isEmpty {
                            sectionHeader("Daily Log")
                            ForEach(viewModel.timeline) { day in
                                dayRow(day)
                            }
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Image("symbol")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 54)
                }
            }
            .toolbarBackground(colors.navBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    // MARK: - Weekly Bar Chart

    private var weeklyBarChart: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Last 7 Days")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textSecondary)

            let maxCount = max(last7Days.map(\.totalCount).max() ?? 1, 1)

            GeometryReader { geo in
                let barWidth = (geo.size.width - CGFloat(last7Days.count - 1) * 8) / CGFloat(last7Days.count)
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(last7Days, id: \.isoDate) { day in
                        let ratio = Double(day.totalCount) / Double(maxCount)
                        let isToday = day.isoDate == DayKey.string(from: Date(), calendar: .current)
                        VStack(spacing: 4) {
                            if day.totalCount > 0 {
                                Text("\(day.totalCount)")
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundStyle(isToday ? ZikrPalette.gold : colors.textSecondary)
                                    .lineLimit(1)
                            } else {
                                Text("").font(.system(size: 9))
                            }
                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    isToday
                                    ? LinearGradient(colors: [ZikrPalette.gold, ZikrPalette.goldLight], startPoint: .bottom, endPoint: .top)
                                    : LinearGradient(colors: [ZikrPalette.royalBlue.opacity(0.5), ZikrPalette.royalBlue.opacity(0.7)], startPoint: .bottom, endPoint: .top)
                                )
                                .frame(width: barWidth, height: max(CGFloat(ratio) * 120, day.totalCount > 0 ? 4 : 2))
                            Text(shortDayLabel(day.isoDate))
                                .font(.system(size: 10))
                                .foregroundStyle(isToday ? ZikrPalette.gold : colors.textSecondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .bottom)
            }
            .frame(height: 160)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 12, x: 0, y: 4)
        )
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        let stats = summaryStats
        return HStack(spacing: 12) {
            statCard(title: "Today", value: "\(stats.totalToday)", icon: "hand.tap.fill")
            statCard(title: "Best Streak", value: "\(stats.bestStreak)d", icon: "flame.fill")
            statCard(title: "All Time", value: formatLargeNumber(stats.allTime), icon: "infinity")
        }
    }

    private func statCard(title: String, value: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(ZikrPalette.gold)
            Text(value)
                .font(.headline)
                .foregroundStyle(colors.textPrimary)
            Text(title)
                .font(.caption2)
                .foregroundStyle(colors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 6, x: 0, y: 2)
        )
    }

    // MARK: - Calendar Heatmap

    private var calendarHeatmap: some View {
        let days = heatmapDays
        let goalTarget = viewModel.state.dailyGoal.targetCount
        let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 7)
        let dayLetters = ["M", "T", "W", "T", "F", "S", "S"]

        return VStack(alignment: .leading, spacing: 12) {
            Text("Daily Consistency")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textSecondary)

            // Day-of-week headers
            HStack(spacing: 6) {
                ForEach(dayLetters.indices, id: \.self) { i in
                    Text(dayLetters[i])
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(colors.textSecondary)
                        .frame(maxWidth: .infinity)
                }
            }

            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(days, id: \.isoDate) { day in
                    let isToday = day.isoDate == DayKey.string(from: Date(), calendar: .current)
                    let isFuture = day.isoDate > DayKey.string(from: Date(), calendar: .current)
                    let ratio = goalTarget > 0 ? min(Double(day.totalCount) / Double(goalTarget), 1.0) : 0

                    Circle()
                        .fill(heatmapColor(ratio: ratio, isFuture: isFuture))
                        .overlay(
                            Circle()
                                .stroke(isToday ? ZikrPalette.gold : Color.clear, lineWidth: 1.5)
                        )
                        .frame(height: 28)
                }
            }

            // Legend
            HStack(spacing: 16) {
                legendItem(color: colors.progressTrack, label: "None")
                legendItem(color: ZikrPalette.royalBlue.opacity(0.4), label: "Started")
                legendItem(color: ZikrPalette.gold, label: "Goal met")
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 12, x: 0, y: 4)
        )
    }

    private func heatmapColor(ratio: Double, isFuture: Bool) -> Color {
        if isFuture { return colors.progressTrack.opacity(0.4) }
        if ratio == 0 { return colors.progressTrack }
        if ratio >= 1.0 { return ZikrPalette.gold }
        if ratio >= 0.5 { return ZikrPalette.royalBlue.opacity(0.6) }
        return ZikrPalette.royalBlue.opacity(0.3)
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 10, height: 10)
            Text(label).font(.caption2).foregroundStyle(colors.textSecondary)
        }
    }

    // MARK: - Day Log Row

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(colors.textSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
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
                                    .foregroundStyle(colorScheme == .dark ? Color.gray.opacity(0.7) : ZikrPalette.royalBlue)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background((colorScheme == .dark ? Color.gray.opacity(0.7) : ZikrPalette.royalBlue).opacity(0.12), in: Capsule())
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

    // MARK: - Helpers

    private func shortDayLabel(_ isoDate: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        guard let date = formatter.date(from: isoDate) else { return "" }
        let df = DateFormatter()
        df.dateFormat = "EEE"
        return String(df.string(from: date).prefix(3))
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

    private func formatLargeNumber(_ n: Int) -> String {
        if n >= 1000 { return String(format: "%.1fk", Double(n) / 1000) }
        return "\(n)"
    }
}
