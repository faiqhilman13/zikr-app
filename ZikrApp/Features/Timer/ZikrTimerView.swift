import SwiftUI
import ZikrCore

struct ZikrTimerView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.zikrColors) private var colors

    @State private var currentTime = Date()
    @State private var targetMinutesInput = 30
    @State private var secondsPerRepInput = 1

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var selectedPreset: DhikrPreset {
        viewModel.selectedPreset
    }

    private var storedTargetMinutes: Int {
        viewModel.timerTargetMinutes(for: selectedPreset.id)
    }

    private var displayedTargetMinutes: Int {
        max(targetMinutesInput, 5)
    }

    private var displayedSecondsPerRep: Int {
        max(secondsPerRepInput, 1)
    }

    private var elapsedSeconds: Int {
        viewModel.timerElapsedSeconds(for: selectedPreset.id, at: currentTime)
    }

    private var estimatedRepetitions: Int {
        viewModel.timerEstimatedRepetitions(for: selectedPreset.id, at: currentTime)
    }

    private var estimatedTargetRepetitions: Int {
        (displayedTargetMinutes * 60) / displayedSecondsPerRep
    }

    private var progressRatio: Double {
        min(Double(elapsedSeconds) / Double(displayedTargetMinutes * 60), 1)
    }

    private var activePreset: DhikrPreset? {
        guard let activePresetID = viewModel.activeTimedPresetID else { return nil }
        return viewModel.state.presets.first { $0.id == activePresetID }
    }

    private var timerStatusText: String {
        if viewModel.isTimerRunning(for: selectedPreset.id) {
            return "Running now"
        }
        if elapsedSeconds > 0 {
            return "Paused. Resume any time today."
        }
        return "Ready when you are"
    }

    private var primaryButtonLabel: String {
        if viewModel.isTimerRunning(for: selectedPreset.id) {
            return "Pause timer"
        }
        if activePreset?.id != nil, activePreset?.id != selectedPreset.id {
            return "Switch and start"
        }
        return elapsedSeconds > 0 ? "Resume timer" : "Start timer"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                heroCard
                if let activePreset, activePreset.id != selectedPreset.id {
                    activeElsewhereCard(activePreset: activePreset)
                }
                targetCard
                cadenceCard
                presetScroller
            }
            .padding(20)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Timer")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            syncInputs()
        }
        .onReceive(ticker) { newDate in
            currentTime = newDate
        }
        .onChange(of: selectedPreset.id) { _, _ in
            syncInputs()
        }
    }

    private var heroCard: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .stroke(colors.progressTrack, lineWidth: 16)
                Circle()
                    .trim(from: 0, to: progressRatio)
                    .stroke(
                        LinearGradient(
                            colors: [ZikrPalette.gold, ZikrPalette.goldLight],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 16, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 8) {
                    Text(selectedPreset.title)
                        .font(.headline)
                        .foregroundStyle(colors.textSecondary)
                    Text(formattedClock(elapsedSeconds))
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(colors.textPrimary)
                    Text("\(estimatedRepetitions) reps of \(viewModel.targetCount(for: selectedPreset.id)) today")
                        .font(.subheadline)
                        .foregroundStyle(colors.textSecondary)
                }
                .padding(24)
            }
            .frame(width: 250, height: 250)

            VStack(spacing: 6) {
                Text("\(formattedMinutes(elapsedSeconds)) tracked • ~\(displayedSecondsPerRep)s per repetition")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(colors.textPrimary)
                Text("\(displayedTargetMinutes) min target is about \(estimatedTargetRepetitions) repetitions")
                    .font(.caption)
                    .foregroundStyle(colors.textSecondary)
            }

            Text(timerStatusText)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(colors.textPrimary)

            Button {
                if storedTargetMinutes != displayedTargetMinutes {
                    viewModel.setTimerTargetMinutes(displayedTargetMinutes, for: selectedPreset.id)
                } else if storedTargetMinutes == 0 {
                    viewModel.setTimerTargetMinutes(displayedTargetMinutes, for: selectedPreset.id)
                }
                if viewModel.secondsPerRepetition(for: selectedPreset.id) != displayedSecondsPerRep {
                    viewModel.setSecondsPerRepetition(displayedSecondsPerRep, for: selectedPreset.id)
                }
                viewModel.toggleTimer(for: selectedPreset.id)
                currentTime = Date()
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: viewModel.isTimerRunning(for: selectedPreset.id) ? "pause.fill" : "play.fill")
                    Text(primaryButtonLabel)
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .foregroundStyle(ZikrPalette.ivory)
                .background(
                    RoundedRectangle(cornerRadius: 18)
                        .fill(
                            LinearGradient(
                                colors: [ZikrPalette.royalBlue, ZikrPalette.royalBlueLight],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                )
            }
            .buttonStyle(.plain)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.08), radius: 14, x: 0, y: 6)
        )
    }

    private func activeElsewhereCard(activePreset: DhikrPreset) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "clock.badge.fill")
                .foregroundStyle(ZikrPalette.gold)
            VStack(alignment: .leading, spacing: 4) {
                Text("\(activePreset.title) is still running")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colors.textPrimary)
                Text("Press play to switch the active timer to \(selectedPreset.title).")
                    .font(.caption)
                    .foregroundStyle(colors.textSecondary)
            }
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(colors.surface)
        )
    }

    private var targetCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Daily target")
                    .font(.headline)
                    .foregroundStyle(colors.textPrimary)
                Spacer()
                Text("\(displayedTargetMinutes) min")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(colors.accentText)
            }

            Stepper(value: Binding(
                get: { displayedTargetMinutes },
                set: { newValue in
                    targetMinutesInput = min(max(newValue, 5), 180)
                    viewModel.setTimerTargetMinutes(targetMinutesInput, for: selectedPreset.id)
                }
            ), in: 5...180, step: 5) {
                Text("Choose how many minutes you want to spend on this dhikr each day")
                    .font(.subheadline)
                    .foregroundStyle(colors.textSecondary)
            }

            Text("This timer saves your progress for today and resets after midnight.")
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

    private var cadenceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Zikr pace")
                    .font(.headline)
                    .foregroundStyle(colors.textPrimary)
                Spacer()
                Text("\(displayedSecondsPerRep)s each")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(colors.accentText)
            }

            Stepper(value: Binding(
                get: { displayedSecondsPerRep },
                set: { newValue in
                    secondsPerRepInput = min(max(newValue, 1), 10)
                    viewModel.setSecondsPerRepetition(secondsPerRepInput, for: selectedPreset.id)
                }
            ), in: 1...10, step: 1) {
                Text("How many seconds does it take you to complete this zikr once?")
                    .font(.subheadline)
                    .foregroundStyle(colors.textSecondary)
            }

            Text("We use this to convert timer seconds into estimated repetitions so the timer counts toward your daily goal.")
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

    private var presetScroller: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Per-zikr progress")
                .font(.headline)
                .foregroundStyle(colors.textPrimary)

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
        let elapsed = viewModel.timerElapsedSeconds(for: preset.id, at: currentTime)
        let targetMinutes = max(viewModel.timerTargetMinutes(for: preset.id), preset.id == selectedPreset.id ? displayedTargetMinutes : 30)
        let secondsPerRep = viewModel.secondsPerRepetition(for: preset.id)
        let repetitions = viewModel.state.repetitionCount(for: preset.id, on: viewModel.state.today, now: currentTime)

        return Button {
            viewModel.selectPreset(preset)
            currentTime = Date()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(preset.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colors.textPrimary)
                    Spacer(minLength: 8)
                    if viewModel.isTimerRunning(for: preset.id) {
                        Image(systemName: "waveform.circle.fill")
                            .foregroundStyle(ZikrPalette.gold)
                    }
                }
                Text("\(repetitions) reps")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(colors.accentText)
                Text("\(formattedMinutes(elapsed)) • \(secondsPerRep)s each")
                    .font(.caption)
                    .foregroundStyle(colors.textSecondary)
                Text("of \(targetMinutes) min target")
                    .font(.caption2)
                    .foregroundStyle(colors.textSecondary)
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(colors.progressTrack)
                        Capsule()
                            .fill(ZikrPalette.gold)
                            .frame(width: geometry.size.width * min(Double(elapsed) / Double(targetMinutes * 60), 1))
                    }
                }
                .frame(height: 6)
            }
            .padding(16)
            .frame(width: 170, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(preset.id == selectedPreset.id ? colors.selectedPresetBg : colors.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(preset.id == selectedPreset.id ? ZikrPalette.gold : colors.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func syncInputs() {
        let storedMinutes = viewModel.timerTargetMinutes(for: selectedPreset.id)
        targetMinutesInput = storedMinutes > 0 ? storedMinutes : 30
        secondsPerRepInput = viewModel.secondsPerRepetition(for: selectedPreset.id)
        currentTime = Date()
    }

    private func formattedClock(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }

    private func formattedMinutes(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        if minutes > 0 {
            return "\(minutes)m \(seconds)s"
        }
        return "\(seconds)s"
    }
}
