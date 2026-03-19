import SwiftUI
import ZikrCore

struct OnboardingView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors
    @State private var name = ""
    @State private var target = 100
    @State private var selectedPresetID = DhikrPreset.starterPresets.first?.id ?? "salawat"

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        headerSection
                        nameSection
                        targetSection
                        presetSection
                        startButton
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Welcome")
            .toolbarBackground(colors.navBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Begin your")
                .font(.system(size: 28, weight: .light, design: .serif))
                .foregroundStyle(colors.textPrimary)
            Text("daily dhikr")
                .font(.system(size: 34, weight: .bold, design: .serif))
                .foregroundStyle(ZikrPalette.royalBlue)
            Text("Set a personal goal and build a consistent rhythm of remembrance.")
                .font(.subheadline)
                .foregroundStyle(colors.textSecondary)
                .padding(.top, 4)
        }
    }

    private var nameSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("What should we call you?")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textPrimary)
            TextField("Your name", text: $name)
                .font(.body)
                .foregroundStyle(colors.textPrimary)
                .padding(14)
                .background(colors.surface, in: RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(colors.border, lineWidth: 1)
                )
        }
    }

    private var targetSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Daily target")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textPrimary)

            HStack(alignment: .bottom, spacing: 4) {
                Text("\(target)")
                    .font(.system(size: 40, weight: .bold, design: .serif))
                    .foregroundStyle(ZikrPalette.royalBlue)
                Text("counts")
                    .font(.subheadline)
                    .foregroundStyle(colors.textSecondary)
                    .padding(.bottom, 6)
            }

            Slider(
                value: Binding(
                    get: { Double(target) },
                    set: { target = Int($0) }
                ),
                in: 33...2000,
                step: 33
            )
            .tint(ZikrPalette.gold)

            HStack {
                Text("33")
                    .font(.caption2)
                    .foregroundStyle(colors.textSecondary)
                Spacer()
                Text("Consistent")
                    .font(.caption2)
                    .foregroundStyle(colors.textSecondary)
                Spacer()
                Text("2,000")
                    .font(.caption2)
                    .foregroundStyle(colors.textSecondary)
            }
        }
        .padding(16)
        .background(colors.surface, in: RoundedRectangle(cornerRadius: 16))
    }

    private var presetSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Starter dhikr")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textPrimary)

            ForEach(DhikrPreset.starterPresets) { preset in
                Button {
                    selectedPresetID = preset.id
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(preset.title)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(colors.textPrimary)
                            Text(preset.arabic)
                                .font(.system(size: 16, weight: .medium, design: .serif))
                                .foregroundStyle(ZikrPalette.royalBlue)
                            Text(preset.transliteration)
                                .font(.caption2)
                                .foregroundStyle(colors.textSecondary)
                        }
                        Spacer()
                        ZStack {
                            Circle()
                                .stroke(selectedPresetID == preset.id ? ZikrPalette.gold : colors.border, lineWidth: 2)
                                .frame(width: 24, height: 24)
                            if selectedPresetID == preset.id {
                                Circle()
                                    .fill(ZikrPalette.gold)
                                    .frame(width: 24, height: 24)
                                Image(systemName: "checkmark")
                                    .font(.caption.bold())
                                    .foregroundStyle(Color.white)
                            }
                        }
                    }
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(selectedPresetID == preset.id ? colors.selectedPresetBg : colors.surface)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(selectedPresetID == preset.id ? ZikrPalette.gold : colors.border, lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var startButton: some View {
        Button {
            viewModel.completeOnboarding(name: name, target: target, presetID: selectedPresetID)
        } label: {
            Text("Start counting")
                .font(.headline)
                .foregroundStyle(Color.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        colors: [ZikrPalette.royalBlue, ZikrPalette.royalBlueLight],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: ZikrPalette.royalBlue.opacity(0.3), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}
