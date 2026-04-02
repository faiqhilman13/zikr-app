import SwiftUI
import ZikrCore

struct SettingsView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors

    @State private var customTitle = ""
    @State private var customArabic = ""
    @State private var customTransliteration = ""
    @State private var editingPreset: DhikrPreset?
    @State private var editTitle = ""
    @State private var editArabic = ""
    @State private var editTransliteration = ""
    @State private var deletingPreset: DhikrPreset?
    @State private var showDeleteAlert = false
    @State private var targetInputs: [String: String] = [:]

    private let starterIDs = ["salawat", "tahlil", "tasbih", "takbir", "tahmid"]

    private var customPresets: [DhikrPreset] {
        viewModel.state.presets.filter { !starterIDs.contains($0.id) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                Form {
                    Section(header: Text("Daily targets").font(.subheadline.weight(.semibold)).foregroundStyle(colors.textPrimary).textCase(nil)) {
                        ForEach(viewModel.state.presets) { preset in
                            presetTargetRow(preset)
                        }
                        Divider()
                            .listRowSeparator(.hidden)
                        HStack {
                            Text("Total")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(colors.textPrimary)
                            Spacer()
                            HStack(alignment: .bottom, spacing: 4) {
                                Text("\(viewModel.state.dailyGoal.targetCount)")
                                    .font(.system(size: 24, weight: .bold, design: .serif))
                                    .foregroundStyle(colors.accentText)
                                Text("counts")
                                    .font(.caption)
                                    .foregroundStyle(colors.textSecondary)
                                    .padding(.bottom, 2)
                            }
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
                        if !customPresets.isEmpty {
                            ForEach(customPresets) { preset in
                                customPresetRow(preset)
                            }
                            .onDelete { indexSet in
                                if let idx = indexSet.first {
                                    deletingPreset = customPresets[idx]
                                    showDeleteAlert = true
                                }
                            }
                        }

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

                    Section {
                        Button(role: .destructive) {
                            // reset action
                        } label: {
                            Text("Reset all data")
                                .foregroundStyle(.red)
                        }
                    }
                    .listRowBackground(colors.surface)

                    Section {
                        HStack {
                            Text("Version")
                                .foregroundStyle(colors.textPrimary)
                            Spacer()
                            Text("1.0.0")
                                .foregroundStyle(colors.textSecondary)
                        }
                    }
                    .listRowBackground(colors.surface)
                }
                .scrollContentBackground(.hidden)
                .background(colors.background)
            }
            .navigationTitle("Settings")
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
            .sheet(item: $editingPreset) { preset in
                editPresetSheet(for: preset)
            }
            .alert("Delete \"\(deletingPreset?.title ?? "")\"?", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {
                    deletingPreset = nil
                }
                Button("Delete", role: .destructive) {
                    if let preset = deletingPreset {
                        viewModel.deletePreset(id: preset.id)
                    }
                    deletingPreset = nil
                }
            } message: {
                Text("This will remove the preset and all its count history.")
            }
        }
    }

    private func presetTargetRow(_ preset: DhikrPreset) -> some View {
        let currentTarget = viewModel.state.dailyGoal.perPresetTargets[preset.id] ?? 0
        let inputText = Binding<String>(
            get: { targetInputs[preset.id] ?? "\(currentTarget)" },
            set: { targetInputs[preset.id] = $0 }
        )
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(preset.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(colors.textPrimary)
                Spacer()
                TextField("0", text: inputText)
                    .font(.system(size: 16, weight: .semibold, design: .serif))
                    .foregroundStyle(colors.accentText)
                    .multilineTextAlignment(.trailing)
                    .keyboardType(.numberPad)
                    .frame(width: 60)
                    .onChange(of: inputText.wrappedValue) { _, newVal in
                        if let parsed = Int(newVal), parsed >= 0 {
                            viewModel.updatePresetTarget(presetID: preset.id, target: parsed)
                        }
                    }
                    .onSubmit {
                        if let parsed = Int(inputText.wrappedValue), parsed >= 0 {
                            viewModel.updatePresetTarget(presetID: preset.id, target: parsed)
                        }
                    }
                Text("counts")
                    .font(.caption)
                    .foregroundStyle(colors.textSecondary)
            }
            Slider(
                value: Binding(
                    get: { Double(currentTarget) },
                    set: { newVal in
                        let rounded = Int(newVal)
                        targetInputs[preset.id] = "\(rounded)"
                        viewModel.updatePresetTarget(presetID: preset.id, target: rounded)
                    }
                ),
                in: 0...500,
                step: 1
            )
            .tint(ZikrPalette.gold)
        }
        .padding(.vertical, 4)
    }

    private func customPresetRow(_ preset: DhikrPreset) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(preset.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(colors.textPrimary)
                Text(preset.arabic)
                    .font(.caption)
                    .foregroundStyle(colors.accentText)
            }
            Spacer()
            Button {
                editTitle = preset.title
                editArabic = preset.arabic
                editTransliteration = preset.transliteration
                editingPreset = preset
            } label: {
                Image(systemName: "pencil")
                    .foregroundStyle(ZikrPalette.gold)
            }
            .buttonStyle(.plain)
        }
    }

    private func editPresetSheet(for preset: DhikrPreset) -> some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                Form {
                    Section {
                        TextField("Title", text: $editTitle)
                            .foregroundStyle(colors.textPrimary)
                        TextField("Arabic", text: $editArabic)
                            .foregroundStyle(colors.textPrimary)
                        TextField("Transliteration", text: $editTransliteration)
                            .foregroundStyle(colors.textPrimary)
                    }
                    .listRowBackground(colors.surface)
                }
                .scrollContentBackground(.hidden)
                .background(colors.background)
            }
            .navigationTitle("Edit preset")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        editingPreset = nil
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        viewModel.updatePreset(id: preset.id, title: editTitle, arabic: editArabic, transliteration: editTransliteration)
                        editingPreset = nil
                    }
                    .disabled(editTitle.isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
}
