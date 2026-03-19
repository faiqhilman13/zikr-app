import SwiftUI
import ZikrCore

struct RewardsView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        streakCard
                        xpCard
                        badgesSection
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Rewards")
            .toolbarBackground(colors.navBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
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
                            .foregroundStyle(ZikrPalette.royalBlue)
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
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Level \(viewModel.state.rewards.level)")
                        .font(.system(size: 24, weight: .bold, design: .serif))
                        .foregroundStyle(colors.textPrimary)
                    Text("\(viewModel.state.rewards.xp) XP earned")
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
                        .frame(width: geometry.size.width * (Double(viewModel.state.rewards.xp % 250) / 250.0), height: 6)
                }
            }
            .frame(height: 6)

            Text("Earn \(250 - (viewModel.state.rewards.xp % 250)) more XP to reach Level \(viewModel.state.rewards.level + 1)")
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

    private var badgesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Badges")
                .font(.headline)
                .foregroundStyle(colors.textPrimary)

            if viewModel.state.rewards.badges.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "medal.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(ZikrPalette.gold.opacity(0.4))
                    Text("Complete your daily goal to earn badges")
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
                ForEach(viewModel.state.rewards.badges) { badge in
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
}
