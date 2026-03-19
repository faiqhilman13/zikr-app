import SwiftUI
import ZikrCore

struct SettingsView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors
    @State private var customTitle = ""
    @State private var customArabic = ""
    @State private var customTransliteration = ""

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                Form {
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Daily goal")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(colors.textPrimary)
                            HStack {
                                Text("\(viewModel.state.dailyGoal.targetCount)")
                                    .font(.system(size: 28, weight: .bold, design: .serif))
                                    .foregroundStyle(ZikrPalette.royalBlue)
                                Text("counts")
                                    .foregroundStyle(colors.textSecondary)
                            }
                            Slider(
                                value: Binding(
                                    get: { Double(viewModel.state.dailyGoal.targetCount) },
                                    set: { viewModel.updateDailyGoal(Int($0)) }
                                ),
                                in: 33...2000,
                                step: 33
                            )
                            .tint(ZikrPalette.gold)
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowBackground(colors.surface)

                    Section("Reminders") {
                        Toggle("Daily reminder", isOn: Binding(
                            get: { viewModel.state.reminderPreference.simpleDailyEnabled },
                            set: { viewModel.setSimpleDailyEnabled($0) }
                        ))
                        .tint(ZikrPalette.gold)
                        .foregroundStyle(colors.textPrimary)

                        if viewModel.state.reminderPreference.simpleDailyEnabled {
                            Picker("Time", selection: Binding(
                                get: { viewModel.state.reminderPreference.simpleReminderTimes.first ?? .init(hour: 21, minute: 0) },
                                set: { viewModel.setSimpleReminderTime($0) }
                            )) {
                                ForEach(TimeOfDay.commonChoices) { time in
                                    Text(time.label).tag(time)
                                }
                            }
                            .foregroundStyle(colors.textPrimary)
                        }

                        Toggle("Smart nudges", isOn: Binding(
                            get: { viewModel.state.reminderPreference.smartNudgesEnabled },
                            set: { viewModel.setSmartNudgesEnabled($0) }
                        ))
                        .tint(ZikrPalette.gold)
                        .foregroundStyle(colors.textPrimary)

                        Toggle("After prayer reminders", isOn: Binding(
                            get: { viewModel.state.reminderPreference.prayerTimesEnabled },
                            set: { viewModel.setPrayerTimesEnabled($0) }
                        ))
                        .tint(ZikrPalette.gold)
                        .foregroundStyle(colors.textPrimary)
                    }
                    .listRowBackground(colors.surface)

                    Section("Lock screen") {
                        Toggle("Live Activity", isOn: Binding(
                            get: { viewModel.state.liveActivityEnabled },
                            set: { viewModel.toggleLiveActivity($0) }
                        ))
                        .tint(ZikrPalette.gold)
                        .foregroundStyle(colors.textPrimary)

                        Text("Track your dhikr from the iPhone lock screen.")
                            .font(.caption)
                            .foregroundStyle(colors.textSecondary)
                    }
                    .listRowBackground(colors.surface)

                    Section("Custom dhikr") {
                        TextField("Title", text: $customTitle)
                            .foregroundStyle(colors.textPrimary)
                        TextField("Arabic", text: $customArabic)
                            .foregroundStyle(colors.textPrimary)
                        TextField("Transliteration", text: $customTransliteration)
                            .foregroundStyle(colors.textPrimary)
                        Button {
                            viewModel.addCustomPreset(title: customTitle, arabic: customArabic, transliteration: customTransliteration)
                            customTitle = ""
                            customArabic = ""
                            customTransliteration = ""
                        } label: {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                Text("Add preset")
                            }
                            .foregroundStyle(ZikrPalette.gold)
                        }
                        .disabled(customTitle.isEmpty)
                    }
                    .listRowBackground(colors.surface)
                }
                .scrollContentBackground(.hidden)
                .background(colors.background)
            }
            .navigationTitle("Settings")
            .toolbarBackground(colors.navBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
}
