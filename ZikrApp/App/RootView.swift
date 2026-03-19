import SwiftUI

struct RootView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        TabView(selection: $viewModel.selectedTab) {
            counterTab
            rewardsTab
            historyTab
            settingsTab
        }
        .preferredColorScheme(nil)
        .environment(\.zikrColors, ZikrColors(colorScheme: colorScheme))
        .sheet(
            isPresented: Binding(
                get: { !viewModel.state.hasCompletedOnboarding },
                set: { _ in }
            )
        ) {
            OnboardingView(viewModel: viewModel)
                .presentationDetents([.large])
                .interactiveDismissDisabled()
        }
    }

    @ViewBuilder
    private var counterTab: some View {
        CounterView(viewModel: viewModel)
            .tabItem {
                Label("Count", systemImage: "hand.tap.fill")
            }
            .tag(ZikrAppViewModel.Tab.counter)
    }

    @ViewBuilder
    private var rewardsTab: some View {
        RewardsView(viewModel: viewModel)
            .tabItem {
                Label("Rewards", systemImage: "flame.fill")
            }
            .tag(ZikrAppViewModel.Tab.rewards)
    }

    @ViewBuilder
    private var historyTab: some View {
        HistoryView(viewModel: viewModel)
            .tabItem {
                Label("History", systemImage: "clock.arrow.circlepath")
            }
            .tag(ZikrAppViewModel.Tab.history)
    }

    @ViewBuilder
    private var settingsTab: some View {
        SettingsView(viewModel: viewModel)
            .tabItem {
                Label("Settings", systemImage: "slider.horizontal.3")
            }
            .tag(ZikrAppViewModel.Tab.settings)
    }
}
