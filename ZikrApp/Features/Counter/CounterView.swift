import SwiftUI
import UIKit
import ZikrCore

struct CounterView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        progressCard
                        tapOrb
                        quickAddRow
                        presetScroller
                        statsRow
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Zikr")
            .toolbarBackground(colors.navBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    private var streakLabel: String {
        let streak = viewModel.state.streak.current
        switch streak {
        case 10...: return "10+ day streak"
        case 7...9: return "7+ day streak"
        case 3...6: return "3+ day streak"
        case 2: return "2 day streak"
        default: return "Build your streak"
        }
    }

    private var completionRatio: Double {
        guard viewModel.state.dailyGoal.targetCount > 0 else { return 0 }
        return min(Double(viewModel.selectedPresetCount) / Double(viewModel.state.dailyGoal.targetCount), 1.0)
    }

    private var progressCard: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.selectedPreset.title)
                        .font(.subheadline)
                        .foregroundStyle(colors.textSecondary)
                    Text("\(viewModel.selectedPresetCount)")
                        .font(.system(size: 42, weight: .bold, design: .serif))
                        .foregroundStyle(colors.textPrimary)
                    Text("of \(viewModel.state.dailyGoal.targetCount)")
                        .font(.subheadline)
                        .foregroundStyle(colors.textSecondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(ZikrPalette.gold)
                        Text("\(viewModel.state.streak.current)d")
                            .font(.headline)
                            .foregroundStyle(colors.textPrimary)
                    }
                    Text(streakLabel)
                        .font(.caption)
                        .foregroundStyle(colors.textSecondary)
                    if viewModel.state.streak.multiplier > 1 {
                        HStack(spacing: 2) {
                            Text("x\(viewModel.state.streak.multiplier)")
                                .font(.caption.bold())
                            Text("bonus")
                                .font(.caption)
                        }
                        .foregroundStyle(ZikrPalette.gold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(ZikrPalette.goldPale, in: Capsule())
                    }
                }
            }

            Spacer().frame(height: 16)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(colors.progressTrack)
                        .frame(height: 8)
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [ZikrPalette.gold, ZikrPalette.goldLight],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * completionRatio, height: 8)
                }
            }
            .frame(height: 8)

            Spacer().frame(height: 6)

            HStack {
                if viewModel.state.today.goalCompleted {
                    Label("Goal reached", systemImage: "checkmark.seal.fill")
                        .font(.caption)
                        .foregroundStyle(ZikrPalette.gold)
                } else {
                    Text("\(viewModel.state.remainingToGoal) remaining")
                        .font(.caption)
                        .foregroundStyle(colors.textSecondary)
                }
                Spacer()
                Text("Total today: \(viewModel.state.today.totalCount)")
                    .font(.caption)
                    .foregroundStyle(colors.textSecondary)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 12, x: 0, y: 4)
        )
    }

    private var tapOrb: some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            viewModel.increment()
        } label: {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                ZikrPalette.gold,
                                ZikrPalette.goldLight,
                                ZikrPalette.gold.opacity(0.7)
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 160
                        )
                    )
                    .frame(width: 220, height: 220)
                    .shadow(color: ZikrPalette.gold.opacity(0.4), radius: 20, x: 0, y: 8)

                VStack(spacing: 8) {
                    Text(viewModel.selectedPreset.title)
                        .font(.headline)
                        .foregroundStyle(ZikrPalette.ivory)
                    Text(viewModel.selectedPreset.arabic)
                        .font(.system(size: 30, weight: .semibold, design: .serif))
                        .foregroundStyle(Color.white)
                        .multilineTextAlignment(.center)
                        .frame(width: 160)
                    Text(viewModel.selectedPreset.transliteration)
                        .font(.caption)
                        .foregroundStyle(ZikrPalette.ivory.opacity(0.85))
                    Text("Tap")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(ZikrPalette.goldPale)
                        .padding(.top, 2)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var quickAddRow: some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            viewModel.increment(by: 1)
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle.fill")
                    .foregroundStyle(ZikrPalette.gold)
                Text("Add count")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(ZikrPalette.royalBlue)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(colors.surface)
                    .shadow(color: ZikrPalette.royalBlue.opacity(0.08), radius: 8, x: 0, y: 2)
            )
        }
        .buttonStyle(.plain)
    }

    private var presetScroller: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Switch dhikr")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textSecondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.state.presets) { preset in
                        presetButton(for: preset)
                    }
                }
            }
        }
    }

    private func presetButton(for preset: DhikrPreset) -> some View {
        Button {
            viewModel.selectPreset(preset)
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                Text(preset.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colors.textPrimary)
                Text(preset.arabic)
                    .font(.system(size: 15, weight: .medium, design: .serif))
                    .foregroundStyle(ZikrPalette.royalBlue)
                    .lineLimit(1)
                Text(preset.transliteration)
                    .font(.caption2)
                    .foregroundStyle(colors.textSecondary)
                    .lineLimit(1)
            }
            .frame(width: 150, alignment: .leading)
            .padding(14)
            .background(presetButtonBackground(for: preset))
            .overlay(presetButtonOverlay(for: preset))
        }
        .buttonStyle(.plain)
    }

    private func presetButtonBackground(for preset: DhikrPreset) -> Color {
        selectedPresetID == preset.id ? colors.selectedPresetBg : colors.surface
    }

    private func presetButtonOverlay(for preset: DhikrPreset) -> some View {
        RoundedRectangle(cornerRadius: 14)
            .stroke(
                selectedPresetID == preset.id ? ZikrPalette.gold : colors.border,
                lineWidth: selectedPresetID == preset.id ? 1.5 : 1
            )
    }

    private var selectedPresetID: String {
        viewModel.selectedPreset.id
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(title: "Today", value: "\(viewModel.state.today.totalCount)", icon: "hand.tap.fill")
            statCard(title: "Level", value: "\(viewModel.state.rewards.level)", icon: "star.fill")
            statCard(title: "Streak", value: "\(viewModel.state.streak.current)d", icon: "flame.fill")
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
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 6, x: 0, y: 2)
        )
    }
}
