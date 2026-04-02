import SwiftUI
import ZikrCore

struct RewardsView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors

    @State private var currentTime = Date()

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var liveRewardState: RewardState {
        RewardEngine.recalculate(
            history: [liveToday] + viewModel.state.history,
            goal: viewModel.state.dailyGoal,
            currentStreak: viewModel.state.streak,
            activityCount: { progress in
                viewModel.state.activityPoints(on: progress, now: currentTime)
            }
        )
    }

    private var liveToday: DayProgress {
        var today = viewModel.state.today
        today.elapsedSecondsByPreset = liveElapsedSecondsByPreset(for: today)
        return today
    }

    private var todayManualCount: Int {
        viewModel.state.today.totalCount
    }

    private var todayActivityPoints: Int {
        viewModel.state.activityPoints(on: viewModel.state.today, now: currentTime)
    }

    private var todayTrackedTime: Int {
        viewModel.state.totalElapsedSeconds(on: viewModel.state.today, now: currentTime)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        streakCard
                        xpCard
                        todayActivityCard
                        badgesSection
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Rewards")
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

    private var streakCard: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(ZikrPalette.gold)
                        Text("Streak")
                            .font(.subheadline)
                            .foregroundStyle(colors.textSecondary)
                    }
                    Text("\(viewModel.state.streak.current)")
                        .font(.system(size: 56, weight: .bold, design: .serif))
                        .foregroundStyle(colors.textPrimary)
                    Text("days")
                        .font(.subheadline)
                        .foregroundStyle(colors.textSecondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    VStack(spacing: 2) {
                        Text("Longest")
                            .font(.caption2)
                            .foregroundStyle(colors.textSecondary)
                        Text("\(viewModel.state.streak.longest)d")
                            .font(.headline)
                            .foregroundStyle(colors.accentText)
                    }
                    if viewModel.state.streak.multiplier > 1 {
                        HStack(spacing: 4) {
                            Image(systemName: "bolt.fill")
                                .foregroundStyle(ZikrPalette.gold)
                            Text("x\(viewModel.state.streak.multiplier) multiplier")
                                .font(.caption.weight(.medium))
                                .foregroundStyle(ZikrPalette.gold)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(ZikrPalette.goldPale, in: Capsule())
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 12, x: 0, y: 4)
        )
    }

    private var xpCard: some View {
        let rewards = liveRewardState

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Level \(rewards.level)")
                        .font(.system(size: 24, weight: .bold, design: .serif))
                        .foregroundStyle(colors.textPrimary)
                    Text("\(rewards.xp) unified XP earned")
                        .font(.caption)
                        .foregroundStyle(colors.textSecondary)
                }
                Spacer()
                Image(systemName: "star.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(ZikrPalette.gold)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(colors.progressTrack)
                        .frame(height: 6)

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [ZikrPalette.royalBlue, ZikrPalette.royalBlueLight],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * (Double(rewards.xp % 250) / 250.0), height: 6)
                }
            }
            .frame(height: 6)

            Text("Earn \(250 - (rewards.xp % 250)) more XP to reach Level \(rewards.level + 1)")
                .font(.caption)
                .foregroundStyle(colors.textSecondary)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 12, x: 0, y: 4)
        )
    }

    private var todayActivityCard: some View {
        HStack(spacing: 12) {
            todayMetricCard(title: "Manual", value: "\(todayManualCount)", icon: "hand.tap.fill")
            todayMetricCard(title: "Timer", value: formattedDuration(todayTrackedTime), icon: "timer")
            todayMetricCard(title: "Reps", value: "\(todayActivityPoints)", icon: "leaf.fill")
        }
    }

    private func todayMetricCard(title: String, value: String, icon: String) -> some View {
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
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 6, x: 0, y: 2)
        )
    }

    private var badgesSection: some View {
        let rewards = liveRewardState

        return VStack(alignment: .leading, spacing: 14) {
            Text("Badges")
                .font(.headline)
                .foregroundStyle(colors.textPrimary)

            if rewards.badges.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "medal.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(ZikrPalette.gold.opacity(0.4))
                    Text("Keep counting or tracking timer sessions to earn badges")
                        .font(.subheadline)
                        .foregroundStyle(colors.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 32)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(colors.surface)
                        .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 8, x: 0, y: 2)
                )
            } else {
                ForEach(rewards.badges) { badge in
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(ZikrPalette.goldPale)
                                .frame(width: 48, height: 48)
                            Image(systemName: badge.iconName)
                                .font(.title3)
                                .foregroundStyle(ZikrPalette.gold)
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(badge.title)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(colors.textPrimary)
                            Text(badge.detail)
                                .font(.caption)
                                .foregroundStyle(colors.textSecondary)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(colors.surface)
                            .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 6, x: 0, y: 2)
                    )
                }
            }
        }
    }

    private func liveElapsedSecondsByPreset(for day: DayProgress) -> [String: Int] {
        var presetIDs = Set(day.elapsedSecondsByPreset.keys)
        if day.isoDate == viewModel.state.today.isoDate, let activePresetID = viewModel.activeTimedPresetID {
            presetIDs.insert(activePresetID)
        }

        return Dictionary(uniqueKeysWithValues: presetIDs.compactMap { presetID in
            let seconds = viewModel.state.elapsedSeconds(for: presetID, on: day, now: currentTime)
            return seconds > 0 ? (presetID, seconds) : nil
        })
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
}
