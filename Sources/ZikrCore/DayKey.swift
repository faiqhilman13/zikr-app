import Foundation

public enum DayKey {
    public static func string(from date: Date, calendar: Calendar = .current) -> String {
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d",
            components.year ?? 0,
            components.month ?? 0,
            components.day ?? 0
        )
    }

    public static func date(from key: String, calendar: Calendar = .current) -> Date? {
        let values = key.split(separator: "-").compactMap { Int($0) }
        guard values.count == 3 else { return nil }
        return calendar.date(from: DateComponents(year: values[0], month: values[1], day: values[2]))
    }

    public static func dayDifference(from lhs: String, to rhs: String, calendar: Calendar = .current) -> Int? {
        guard let start = date(from: lhs, calendar: calendar), let end = date(from: rhs, calendar: calendar) else {
            return nil
        }
        return calendar.dateComponents([.day], from: start, to: end).day
    }
}
