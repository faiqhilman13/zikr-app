import Foundation
import UserNotifications
import ZikrCore

struct NotificationScheduler {
    private let center = UNUserNotificationCenter.current()

    func requestAuthorizationIfNeeded() async {
        _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    func refresh(for state: ZikrAppState) async {
        center.removeAllPendingNotificationRequests()
        let reminders = ReminderPlanner.buildSchedule(state: state, now: Date())
        for reminder in reminders {
            let content = UNMutableNotificationContent()
            content.title = reminder.title
            content.body = reminder.body
            content.sound = .default
            let trigger = UNCalendarNotificationTrigger(dateMatching: reminder.components.asDateComponents, repeats: reminder.repeats)
            let request = UNNotificationRequest(identifier: reminder.id, content: content, trigger: trigger)
            try? await center.add(request)
        }
    }
}

private extension ReminderDateComponents {
    var asDateComponents: DateComponents {
        DateComponents(year: year, month: month, day: day, hour: hour, minute: minute)
    }
}
