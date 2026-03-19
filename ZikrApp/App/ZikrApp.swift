import SwiftUI

@main
struct ZikrApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var viewModel = ZikrAppViewModel()

    init() {
        FirebaseBootstrap.configureIfAvailable()
    }

    var body: some Scene {
        WindowGroup {
            RootView(viewModel: viewModel)
                .task {
                    await viewModel.bootstrap()
                }
                .onChange(of: scenePhase) { _, newPhase in
                    guard newPhase == .active else { return }
                    Task {
                        await viewModel.reloadFromStore()
                    }
                }
        }
    }
}
