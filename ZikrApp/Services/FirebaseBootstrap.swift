#if canImport(FirebaseCore)
import FirebaseCore

enum FirebaseBootstrap {
    static func configureIfAvailable() {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
    }
}
#else
enum FirebaseBootstrap {
    static func configureIfAvailable() {}
}
#endif
