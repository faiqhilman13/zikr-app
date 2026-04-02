import SwiftUI
import ZikrCore

struct HistoryView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.zikrColors) private var colors

    @State private var currentTime = Date()
    @State private var summaryRange: ActivityRange = .daily
    @State private var weeklyMetric: WeeklyMetric = .reps

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private enum ActivityRange: String, CaseIterable, Identifiable {
        case daily = "Daily"
        case weekly = "Weekly"
        case monthly = "Monthly"

        var id: Self { self }
    }

    private enum WeeklyMetric: String, CaseIterable, Identifiable {
        case reps = "Reps"
        case time = "Time"

        var id: Self { self }
    }

    private struct RangeSummary {
        let label: String
        let totalRepetitions: Int
        let totalSeconds: Int
        let activeDays: Int
    }

    private struct DailyLogPresetEntry: Identifiable {
        let id: String
        let title: String
        let repetitions: Int
        let seconds: Int
    }

    private var timeline: [DayProgress] {
        viewModel.timeline
    }

    private var last7Days: [DayProgress] {
        let calendar = Calendar.current
        return (0..<7).reversed().map { offset in
            let date = calendar.date(byAdding: .day, value: -offset, to: currentTime) ?? currentTime
            return dayProgress(for: date)
        }
    }

    private var heatmapDays: [DayProgress] {
        let calendar = Calendar.current
        return (0..<35).reversed().map { offset in
            let date = calendar.date(byAdding: .day, value: -offset, to: currentTime) ?? currentTime
            return dayProgress(for: date)
        }
    }

    private var allTimeSummary: (bestStreak: Int, totalRepetitions: Int, totalSeconds: Int) {
        (
            bestStreak: viewModel.state.streak.longest,
            totalRepetitions: timeline.reduce(0) { partialResult, day in
                partialResult + totalRepetitions(for: day)
            },
            totalSeconds: timeline.reduce(0) { partialResult, day in
                partialResult + totalTrackedSeconds(for: day)
            }
        )
    }

    private var selectedRangeSummary: RangeSummary {
        let calendar = Calendar.current
        let referenceDate = currentTime

        let days: [DayProgress]
        let label: String

        switch summaryRange {
        case .daily:
            days = [dayProgress(for: referenceDate)]
            label = "Today"
        case .weekly:
            let interval = calendar.dateInterval(of: .weekOfYear, for: referenceDate) ?? DateInterval(start: referenceDate, end: referenceDate)
            days = timelineDays(in: interval)
            label = "This Week"
        case .monthly:
            let interval = calendar.dateInterval(of: .month, for: referenceDate) ?? DateInterval(start: referenceDate, end: referenceDate)
            days = timelineDays(in: interval)
            label = "This Month"
        }

        return RangeSummary(
            label: label,
            totalRepetitions: days.reduce(0) { partialResult, day in
                partialResult + totalRepetitions(for: day)
            },
            totalSeconds: days.reduce(0) { partialResult, day in
                partialResult + totalTrackedSeconds(for: day)
            },
            activeDays: days.filter(hasAnyActivity).count
        )
    }

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 20) {
                        weeklyBarChart
                        activityRangeCard
                        statsRow
                        calendarHeatmap
                        sectionHeader("Daily Log")
                        ForEach(timeline) { day in
                            dayRow(day)
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
        .onReceive(ticker) { newDate in
            currentTime = newDate
        }
    }

    private var weeklyBarChart: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Last 7 Days")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colors.textSecondary)
                Spacer()
                Picker("Weekly metric", selection: $weeklyMetric) {
                    ForEach(WeeklyMetric.allCases) { metric in
                        Text(metric.rawValue).tag(metric)
                    }
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 180)
            }

            let maxValue = max(last7Days.map(chartValue(for:)).max() ?? 1, 1)

            GeometryReader { geometry in
                let barWidth = (geometry.size.width - CGFloat(last7Days.count - 1) * 8) / CGFloat(last7Days.count)
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(last7Days, id: \.isoDate) { day in
                        let value = chartValue(for: day)
                        let ratio = Double(value) / Double(maxValue)
                        let isToday = day.isoDate == viewModel.state.today.isoDate

                        VStack(spacing: 4) {
                            Text(chartLabel(for: day))
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundStyle(isToday ? ZikrPalette.gold : colors.textSecondary)
                                .lineLimit(1)

                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    isToday
                                    ? LinearGradient(colors: [ZikrPalette.gold, ZikrPalette.goldLight], startPoint: .bottom, endPoint: .top)
                                    : LinearGradient(colors: [ZikrPalette.royalBlue.opacity(0.5), ZikrPalette.royalBlue.opacity(0.7)], startPoint: .bottom, endPoint: .top)
                                )
                                .frame(width: barWidth, height: max(CGFloat(ratio) * 120, value > 0 ? 4 : 2))

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

    private var activityRangeCard: some View {
        let summary = selectedRangeSummary

        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Tracked Activity")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colors.textSecondary)
                Spacer()
                Text(summary.label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ZikrPalette.gold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(ZikrPalette.goldPale, in: Capsule())
            }

            Picker("Activity range", selection: $summaryRange) {
                ForEach(ActivityRange.allCases) { range in
                    Text(range.rawValue).tag(range)
                }
            }
            .pickerStyle(.segmented)

            HStack(spacing: 12) {
                summaryMetricCard(title: "Reps", value: "\(summary.totalRepetitions)", icon: "leaf.fill")
                summaryMetricCard(title: "Time", value: formattedDuration(summary.totalSeconds), icon: "timer")
                summaryMetricCard(title: "Active Days", value: "\(summary.activeDays)", icon: "calendar")
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 12, x: 0, y: 4)
        )
    }

    private func summaryMetricCard(title: String, value: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(ZikrPalette.gold)
            Text(value)
                .font(.headline)
                .foregroundStyle(colors.textPrimary)
                .minimumScaleFactor(0.75)
                .lineLimit(1)
            Text(title)
                .font(.caption2)
                .foregroundStyle(colors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colors.selectedPresetBg)
        )
    }

    private var statsRow: some View {
        let summary = allTimeSummary

        return HStack(spacing: 12) {
            statCard(title: "Best Streak", value: "\(summary.bestStreak)d", icon: "flame.fill")
            statCard(title: "All Time Reps", value: formatLargeNumber(summary.totalRepetitions), icon: "leaf.fill")
            statCard(title: "All Time Time", value: formattedDuration(summary.totalSeconds), icon: "clock.arrow.circlepath")
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
                .minimumScaleFactor(0.75)
                .lineLimit(1)
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

    private var calendarHeatmap: some View {
        let days = heatmapDays
        let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 7)
        let dayLetters = ["M", "T", "W", "T", "F", "S", "S"]
        let todayKey = viewModel.state.today.isoDate

        return VStack(alignment: .leading, spacing: 12) {
            Text("Daily Consistency")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textSecondary)

            HStack(spacing: 6) {
                ForEach(dayLetters.indices, id: \.self) { index in
                    Text(dayLetters[index])
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(colors.textSecondary)
                        .frame(maxWidth: .infinity)
                }
            }

            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(days, id: \.isoDate) { day in
                    let isToday = day.isoDate == todayKey
                    let isFuture = day.isoDate > todayKey

                    Circle()
                        .fill(heatmapColor(hasActivity: hasAnyActivity(day), goalMet: goalMet(for: day), isFuture: isFuture))
                        .overlay(
                            Circle()
                                .stroke(isToday ? ZikrPalette.gold : Color.clear, lineWidth: 1.5)
                        )
                        .frame(height: 28)
                }
            }

            HStack(spacing: 16) {
                legendItem(color: colors.progressTrack, label: "None")
                legendItem(color: ZikrPalette.royalBlue.opacity(0.4), label: "Active")
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

    private func heatmapColor(hasActivity: Bool, goalMet: Bool, isFuture: Bool) -> Color {
        if isFuture { return colors.progressTrack.opacity(0.4) }
        if goalMet { return ZikrPalette.gold }
        if hasActivity { return ZikrPalette.royalBlue.opacity(0.4) }
        return colors.progressTrack
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text(label)
                .font(.caption2)
                .foregroundStyle(colors.textSecondary)
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(colors.textSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func dayRow(_ day: DayProgress) -> some View {
        let trackedSeconds = totalTrackedSeconds(for: day)
        let hasActivity = hasAnyActivity(day)
        let goalMet = goalMet(for: day)
        let presetEntries = dailyLogEntries(for: day)

        return HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 8) {
                Text(formattedDate(day.isoDate))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colors.textPrimary)

                HStack(spacing: 8) {
                    logMetricPill(value: "\(totalRepetitions(for: day))", label: "reps", tint: ZikrPalette.royalBlue)
                    logMetricPill(value: formattedDuration(trackedSeconds), label: "time", tint: ZikrPalette.gold)
                }

                if !presetEntries.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(presetEntries) { entry in
                                Text(logEntryLabel(for: entry))
                                    .font(.caption2)
                                    .foregroundStyle(colorScheme == .dark ? Color.gray.opacity(0.7) : ZikrPalette.royalBlue)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(
                                        (colorScheme == .dark ? Color.gray.opacity(0.7) : ZikrPalette.royalBlue)
                                            .opacity(0.12),
                                        in: Capsule()
                                    )
                            }
                        }
                    }
                }
            }

            Spacer()

            VStack(spacing: 2) {
                if goalMet {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(ZikrPalette.gold)
                    Text("Goal")
                        .font(.caption2)
                        .foregroundStyle(ZikrPalette.gold)
                } else if hasActivity {
                    Image(systemName: "timer")
                        .foregroundStyle(ZikrPalette.royalBlue)
                    Text("Active")
                        .font(.caption2)
                        .foregroundStyle(colors.textSecondary)
                } else {
                    Text("Rest")
                        .font(.caption2.weight(.semibold))
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

    private func logMetricPill(value: String, label: String, tint: Color) -> some View {
        HStack(spacing: 4) {
            Text(value)
                .font(.system(size: 16, weight: .semibold, design: .serif))
            Text(label)
                .font(.caption)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(tint.opacity(0.12), in: Capsule())
    }

    private func dayProgress(for date: Date) -> DayProgress {
        let key = DayKey.string(from: date, calendar: .current)
        return timeline.first(where: { $0.isoDate == key }) ?? DayProgress(isoDate: key)
    }

    private func timelineDays(in interval: DateInterval) -> [DayProgress] {
        timeline.filter { day in
            guard let date = DayKey.date(from: day.isoDate, calendar: .current) else { return false }
            return interval.contains(date)
        }
    }

    private func chartValue(for day: DayProgress) -> Int {
        switch weeklyMetric {
        case .reps:
            return totalRepetitions(for: day)
        case .time:
            return totalTrackedSeconds(for: day)
        }
    }

    private func chartLabel(for day: DayProgress) -> String {
        let value = chartValue(for: day)
        guard value > 0 else { return "" }

        switch weeklyMetric {
        case .reps:
            return "\(value)"
        case .time:
            return abbreviatedDuration(value)
        }
    }

    private func totalTrackedSeconds(for day: DayProgress) -> Int {
        viewModel.state.totalElapsedSeconds(on: day, now: currentTime)
    }

    private func totalRepetitions(for day: DayProgress) -> Int {
        viewModel.state.totalRepetitionCount(on: day, now: currentTime)
    }

    private func elapsedSecondsByPreset(for day: DayProgress) -> [String: Int] {
        var presetIDs = Set(day.elapsedSecondsByPreset.keys)
        if day.isoDate == viewModel.state.today.isoDate, let activePresetID = viewModel.activeTimedPresetID {
            presetIDs.insert(activePresetID)
        }

        return Dictionary(uniqueKeysWithValues: presetIDs.compactMap { presetID in
            let seconds = viewModel.state.elapsedSeconds(for: presetID, on: day, now: currentTime)
            return seconds > 0 ? (presetID, seconds) : nil
        })
    }

    private func goalMet(for day: DayProgress) -> Bool {
        if day.isoDate == viewModel.state.today.isoDate {
            return viewModel.state.isGoalCompleted(on: day, now: currentTime)
        }
        return day.goalCompleted
    }

    private func hasAnyActivity(_ day: DayProgress) -> Bool {
        totalRepetitions(for: day) > 0 || totalTrackedSeconds(for: day) > 0
    }

    private func dailyLogEntries(for day: DayProgress) -> [DailyLogPresetEntry] {
        let countIDs = Set(day.counts.keys)
        let timerIDs = Set(elapsedSecondsByPreset(for: day).keys)
        let presetIDs = countIDs.union(timerIDs)
        let elapsedByPreset = elapsedSecondsByPreset(for: day)

        return presetIDs.map { presetID in
            DailyLogPresetEntry(
                id: presetID,
                title: title(for: presetID),
                repetitions: viewModel.state.repetitionCount(for: presetID, on: day, now: currentTime),
                seconds: elapsedByPreset[presetID] ?? 0
            )
        }
        .sorted { lhs, rhs in
            if lhs.repetitions == rhs.repetitions {
                if lhs.seconds == rhs.seconds {
                    return lhs.title < rhs.title
                }
                return lhs.seconds > rhs.seconds
            }
            return lhs.repetitions > rhs.repetitions
        }
    }

    private func logEntryLabel(for entry: DailyLogPresetEntry) -> String {
        if entry.repetitions > 0, entry.seconds > 0 {
            return "\(entry.title): \(entry.repetitions) reps / \(formattedDuration(entry.seconds))"
        }
        if entry.repetitions > 0 {
            return "\(entry.title): \(entry.repetitions) reps"
        }
        return "\(entry.title): \(formattedDuration(entry.seconds))"
    }

    private func shortDayLabel(_ isoDate: String) -> String {
        guard let date = DayKey.date(from: isoDate, calendar: .current) else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return String(formatter.string(from: date).prefix(3))
    }

    private func formattedDate(_ isoDate: String) -> String {
        guard let date = DayKey.date(from: isoDate, calendar: .current) else { return isoDate }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: date)
    }

    private func title(for presetID: String) -> String {
        viewModel.state.presets.first(where: { $0.id == presetID })?.title ?? presetID
    }

    private func formatLargeNumber(_ value: Int) -> String {
        if value >= 1000 {
            return String(format: "%.1fk", Double(value) / 1000)
        }
        return "\(value)"
    }

    private func formattedDuration(_ totalSeconds: Int) -> String {
        guard totalSeconds > 0 else { return "0s" }

        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        if minutes > 0 {
            return "\(minutes)m"
        }
        return "\(totalSeconds)s"
    }

    private func abbreviatedDuration(_ totalSeconds: Int) -> String {
        guard totalSeconds > 0 else { return "" }

        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60

        if hours > 0 {
            return "\(hours)h"
        }
        if minutes > 0 {
            return "\(minutes)m"
        }
        return "\(totalSeconds)s"
    }
}
