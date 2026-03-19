import SwiftUI
import ZikrCore

enum ZikrPalette {
    static let royalBlue = Color(hex: "1E3A8A")
    static let royalBlueLight = Color(hex: "3B5998")
    static let gold = Color(hex: "D4A017")
    static let goldLight = Color(hex: "F5D060")
    static let goldPale = Color(hex: "FBF0B2")
    static let ivory = Color(hex: "FAF8F5")
    static let ivoryDark = Color(hex: "F0EBE3")
    static let midnight = Color(hex: "0F1A2E")

    static let deepNavy = Color(hex: "0A1628")
    static let darkSurface = Color(hex: "111D35")
    static let darkCard = Color(hex: "1A2847")
    static let darkBorder = Color(hex: "2A3F5F")
    static let mutedBlue = Color(hex: "A8B4C8")
    static let lightText = Color(hex: "E8E4DF")
}

struct ZikrColors {
    let colorScheme: ColorScheme

    var background: Color { colorScheme == .dark ? ZikrPalette.deepNavy : ZikrPalette.ivory }
    var surface: Color { colorScheme == .dark ? ZikrPalette.darkSurface : .white }
    var card: Color { colorScheme == .dark ? ZikrPalette.darkCard : .white }
    var border: Color { colorScheme == .dark ? ZikrPalette.darkBorder : ZikrPalette.ivoryDark }
    var textPrimary: Color { colorScheme == .dark ? ZikrPalette.lightText : ZikrPalette.midnight }
    var textSecondary: Color { colorScheme == .dark ? ZikrPalette.mutedBlue : .secondary }
    var progressTrack: Color { colorScheme == .dark ? ZikrPalette.darkBorder : ZikrPalette.ivoryDark }
    var goldPaleAdaptive: Color { colorScheme == .dark ? ZikrPalette.gold.opacity(0.2) : ZikrPalette.goldPale }
    var navBackground: Color { colorScheme == .dark ? ZikrPalette.darkSurface : ZikrPalette.ivory }
    var selectedPresetBg: Color { colorScheme == .dark ? ZikrPalette.gold.opacity(0.2) : ZikrPalette.goldPale }
}

private struct ZikrColorsKey: EnvironmentKey {
    static let defaultValue = ZikrColors(colorScheme: .light)
}

extension EnvironmentValues {
    var zikrColors: ZikrColors {
        get { self[ZikrColorsKey.self] }
        set { self[ZikrColorsKey.self] = newValue }
    }
}

extension View {
    func zikrColors(_ colorScheme: ColorScheme) -> some View {
        environment(\.zikrColors, ZikrColors(colorScheme: colorScheme))
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

extension DhikrPreset {
    var themeColor: Color {
        switch colorName {
        case "rose": return ZikrPalette.royalBlue
        case "emerald": return ZikrPalette.royalBlueLight
        case "indigo": return ZikrPalette.royalBlue
        case "amber": return ZikrPalette.gold
        case "teal": return ZikrPalette.royalBlueLight
        case "violet": return ZikrPalette.royalBlue
        default: return ZikrPalette.royalBlue
        }
    }
}

extension Badge {
    var tint: Color {
        switch id {
        case "flame-streak": return ZikrPalette.gold
        case "week-of-noor": return ZikrPalette.goldLight
        case "barakah-overdrive": return ZikrPalette.gold
        default: return ZikrPalette.royalBlue
        }
    }
}
