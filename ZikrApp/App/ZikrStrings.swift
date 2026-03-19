import Foundation

enum ZikrStrings {
    static let bundle: Bundle = .main

    private static func _l(_ key: String) -> String {
        NSLocalizedString(key, bundle: bundle, comment: "")
    }

    private static func _f(_ key: String, _ arg: CVarArg) -> String {
        String(format: _l(key), arg)
    }

    private static func _f(_ key: String, _ arg: Int) -> String {
        String(format: _l(key), arg)
    }

    enum Nav {
        static var zikr: String { _l("nav.zikr") }
        static var counter: String { _l("nav.counter") }
        static var rewards: String { _l("nav.rewards") }
        static var history: String { _l("nav.history") }
        static var settings: String { _l("nav.settings") }
    }

    enum Counter {
        static func of(_ value: Int) -> String { _f("counter.of", value) }
        static func remaining(_ value: Int) -> String { _f("counter.remaining", value) }
        static let goalReached: String { _l("counter.goal_reached") }
        static func totalToday(_ value: Int) -> String { _f("counter.total_today", value) }
        static let tap: String { _l("counter.tap") }
        static let addCount: String { _l("counter.add_count") }
        static let switchDhikr: String { _l("nav.counter") }
        static let session: String { _l("counter.session") }
        static let today: String { _l("counter.today") }
        static let level: String { _l("counter.level") }
        static let streak: String { _l("counter.streak") }
        static let buildStreak: String { _l("counter.build_streak") }
        static func dayStreak(_ days: Int) -> String { _f("counter.day_streak", days) }
        static func daysStreak(_ days: Int) -> String { _f("counter.days_streak", days) }
        static let bonus: String { _l("counter.bonus") }
    }

    enum Undo {
        static func banner(amount: Int, preset: String) -> String {
            String(format: _l("undo.banner"), amount, preset)
        }
        static let button: String { _l("undo.button") }
    }

    enum Settings {
        static let title: String { _l("settings.title") }
        static let dailyGoal: String { _l("settings.daily_goal") }
        static let counts: String { _l("settings.counts") }
        static let reminders: String { _l("settings.reminders") }
        static let dailyReminder: String { _l("settings.daily_reminder") }
        static let smartNudges: String { _l("settings.smart_nudges") }
        static let prayerReminders: String { _l("settings.prayer_reminders") }
        static let time: String { _l("settings.time") }
        static let lockScreen: String { _l("settings.lock_screen") }
        static let liveActivity: String { _l("settings.live_activity") }
        static let trackFromLock: String { _l("settings.track_from_lock") }
        static let customDhikr: String { _l("settings.custom_dhikr") }
        static let titlePlaceholder: String { _l("settings.title_placeholder") }
        static let arabicPlaceholder: String { _l("settings.arabic_placeholder") }
        static let transliterationPlaceholder: String { _l("settings.transliteration_placeholder") }
        static let addPreset: String { _l("settings.add_preset") }
        static let editPreset: String { _l("settings.edit_preset") }
        static let deletePreset: String { _l("settings.delete_preset") }
        static func deleteConfirm(_ name: String) -> String { String(format: _l("settings.delete_confirm"), name) }
        static let deleteConfirmMessage: String { _l("settings.delete_confirm_message") }
        static let cancel: String { _l("settings.cancel") }
        static let save: String { _l("settings.save") }
        static let resetData: String { _l("settings.reset_data") }
        static let haptics: String { _l("settings.haptics") }
        static let version: String { _l("settings.version") }
    }
}
