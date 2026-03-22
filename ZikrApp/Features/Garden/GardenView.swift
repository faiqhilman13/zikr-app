import SwiftUI
import ZikrCore

// MARK: - Tree Kinds

enum TreeKind: String, CaseIterable, Identifiable {
    case olive   = "olive"
    case palm    = "palm"
    case lote    = "lote"
    case cedar   = "cedar"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .olive:  return "Olive"
        case .palm:   return "Date Palm"
        case .lote:   return "Lote Tree"
        case .cedar:  return "Cedar"
        }
    }

    var emoji: String {
        switch self {
        case .olive:  return "🫒"
        case .palm:   return "🌴"
        case .lote:   return "🌿"
        case .cedar:  return "🌲"
        }
    }

    // Stage descriptions: 0 = seed, 1 = sprout, 2 = sapling, 3 = young, 4 = full
    var stageNames: [String] {
        switch self {
        case .olive:  return ["Seed", "Sprout", "Sapling", "Growing", "Blessed Olive"]
        case .palm:   return ["Seed", "Sprout", "Sapling", "Growing", "Majestic Palm"]
        case .lote:   return ["Seed", "Sprout", "Sapling", "Growing", "Lote of the Limit"]
        case .cedar:  return ["Seed", "Sprout", "Sapling", "Growing", "Ancient Cedar"]
        }
    }

    /// Trunk color
    var trunkColor: Color {
        switch self {
        case .olive:  return Color(hex: "8B6F47")
        case .palm:   return Color(hex: "A0522D")
        case .lote:   return Color(hex: "6B8E5A")
        case .cedar:  return Color(hex: "5C4033")
        }
    }

    /// Canopy / leaf colors (gradient pair)
    var leafColors: (Color, Color) {
        switch self {
        case .olive:  return (Color(hex: "6B8E23"), Color(hex: "9DC84B"))
        case .palm:   return (Color(hex: "2D7A3A"), Color(hex: "52C06A"))
        case .lote:   return (Color(hex: "3B7A57"), Color(hex: "7BC17E"))
        case .cedar:  return (Color(hex: "1A5C3A"), Color(hex: "2E8B57"))
        }
    }

    /// Fruit / accent color shown at full bloom
    var accentColor: Color {
        switch self {
        case .olive:  return Color(hex: "556B2F")
        case .palm:   return Color(hex: "DAA520")
        case .lote:   return Color(hex: "90EE90")
        case .cedar:  return Color(hex: "8FBC8F")
        }
    }
}

// MARK: - GardenView

struct GardenView: View {
    @ObservedObject var viewModel: ZikrAppViewModel
    @Environment(\.zikrColors) var colors
    @Environment(\.colorScheme) var colorScheme

    @AppStorage("garden.selectedTree") private var selectedTreeRaw = TreeKind.olive.rawValue
    @State private var showTreePicker = false
    @State private var animatePulse = false
    @State private var showHadith = false

    private var selectedTree: TreeKind {
        TreeKind(rawValue: selectedTreeRaw) ?? .olive
    }

    private var ratio: Double {
        viewModel.state.completionRatio
    }

    /// 0…4 growth stage
    private var stage: Int {
        switch ratio {
        case 0:          return 0
        case 0..<0.25:   return 1
        case 0.25..<0.55: return 2
        case 0.55..<0.85: return 3
        default:         return 4
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        hadithBanner
                        treeCard
                        progressRow
                        treePicker
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                }
            }
            .navigationTitle("Garden")
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
        }
        .onAppear { withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { animatePulse = true } }
    }

    // MARK: Hadith Banner

    private var hadithBanner: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.4)) { showHadith.toggle() }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "leaf.fill")
                        .foregroundStyle(Color(hex: "4A7C59"))
                    Text("The Trees of Paradise")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colors.textPrimary)
                    Spacer()
                    Image(systemName: showHadith ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(colors.textSecondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
            }
            .buttonStyle(.plain)

            if showHadith {
                VStack(alignment: .leading, spacing: 12) {
                    Divider()
                        .background(colors.border)

                    Text("سُبْحَانَ اللهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللهُ، وَاللهُ أَكْبَرُ")
                        .font(.system(size: 18, weight: .medium, design: .serif))
                        .foregroundStyle(ZikrPalette.royalBlue)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: .infinity, alignment: .trailing)

                    Text("\"SubhanAllah, Alhamdulillah, La ilaha illallah, and Allahu Akbar — these are the trees of Paradise. For every time you say one of them, a tree is planted for you in Paradise.\"")
                        .font(.subheadline)
                        .foregroundStyle(colors.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("— Reported by Ibn Hibban & Al-Hakim")
                        .font(.caption)
                        .foregroundStyle(colors.textSecondary)
                        .italic()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 14)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(colorScheme == .dark
                    ? Color(hex: "0D2B1A")
                    : Color(hex: "EDF7F0"))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color(hex: "4A7C59").opacity(0.4), lineWidth: 1)
                )
        )
    }

    // MARK: Tree Card

    private var treeCard: some View {
        VStack(spacing: 16) {
            // Stage label
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(selectedTree.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colors.textSecondary)
                    Text(selectedTree.stageNames[stage])
                        .font(.title3.weight(.bold))
                        .foregroundStyle(colors.textPrimary)
                }
                Spacer()
                Text("\(Int(ratio * 100))%")
                    .font(.system(size: 32, weight: .bold, design: .serif))
                    .foregroundStyle(ZikrPalette.royalBlue)
            }
            .padding(.horizontal, 4)

            // Tree illustration
            ZStack {
                // Sky / ground background
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: colorScheme == .dark
                                ? [Color(hex: "0A1628"), Color(hex: "0D2B1A")]
                                : [Color(hex: "E8F4FD"), Color(hex: "D4EDDA")],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: 280)

                // Ground strip
                VStack {
                    Spacer()
                    RoundedRectangle(cornerRadius: 12)
                        .fill(colorScheme == .dark
                            ? Color(hex: "1A3A2A")
                            : Color(hex: "C8E6C9"))
                        .frame(height: 36)
                }
                .frame(height: 280)
                .clipShape(RoundedRectangle(cornerRadius: 20))

                // Stars when complete
                if stage == 4 {
                    ForEach(0..<6, id: \.self) { i in
                        Image(systemName: "sparkle")
                            .font(.system(size: CGFloat([12, 8, 10, 14, 9, 11][i])))
                            .foregroundStyle(ZikrPalette.goldLight)
                            .offset(
                                x: CGFloat([-80, 70, -50, 60, -30, 40][i]),
                                y: CGFloat([-90, -80, -60, -100, -40, -70][i])
                            )
                            .opacity(animatePulse ? 1.0 : 0.3)
                            .animation(
                                .easeInOut(duration: 1.2)
                                    .repeatForever(autoreverses: true)
                                    .delay(Double(i) * 0.2),
                                value: animatePulse
                            )
                    }
                }

                TreeIllustration(tree: selectedTree, stage: stage, animatePulse: animatePulse)
            }
            .frame(height: 280)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colors.card)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.06), radius: 10, x: 0, y: 4)
        )
    }

    // MARK: Progress Row

    private var progressRow: some View {
        HStack(spacing: 12) {
            statPill(
                icon: "hand.tap.fill",
                value: "\(viewModel.state.today.totalCount)",
                label: "Today"
            )
            statPill(
                icon: "flag.checkered",
                value: "\(viewModel.state.dailyGoal.targetCount)",
                label: "Target"
            )
            statPill(
                icon: "flame.fill",
                value: "\(viewModel.state.streak.current)",
                label: "Streak"
            )
        }
    }

    private func statPill(icon: String, value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(ZikrPalette.gold)
            Text(value)
                .font(.system(size: 18, weight: .bold, design: .serif))
                .foregroundStyle(colors.textPrimary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colors.surface)
                .shadow(color: ZikrPalette.royalBlue.opacity(0.05), radius: 6, x: 0, y: 2)
        )
    }

    // MARK: Tree Picker

    private var treePicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Choose your tree")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colors.textSecondary)
                .padding(.leading, 4)

            HStack(spacing: 10) {
                ForEach(TreeKind.allCases) { kind in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            selectedTreeRaw = kind.rawValue
                        }
                    } label: {
                        VStack(spacing: 6) {
                            Text(kind.emoji)
                                .font(.system(size: 28))
                            Text(kind.displayName)
                                .font(.caption2.weight(.medium))
                                .foregroundStyle(selectedTreeRaw == kind.rawValue
                                    ? ZikrPalette.royalBlue
                                    : colors.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(selectedTreeRaw == kind.rawValue
                                    ? colors.selectedPresetBg
                                    : colors.surface)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(selectedTreeRaw == kind.rawValue
                                            ? ZikrPalette.gold
                                            : colors.border,
                                            lineWidth: 1.5)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.bottom, 8)
    }
}

// MARK: - Tree Illustration

struct TreeIllustration: View {
    let tree: TreeKind
    let stage: Int
    let animatePulse: Bool

    var body: some View {
        Canvas { ctx, size in
            let cx = size.width / 2
            let groundY = size.height - 36

            switch stage {
            case 0:
                drawSeed(ctx: ctx, cx: cx, groundY: groundY)
            case 1:
                drawSprout(ctx: ctx, cx: cx, groundY: groundY)
            case 2:
                drawSapling(ctx: ctx, cx: cx, groundY: groundY, tree: tree)
            case 3:
                drawYoung(ctx: ctx, cx: cx, groundY: groundY, tree: tree)
            default:
                drawFull(ctx: ctx, cx: cx, groundY: groundY, tree: tree)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .scaleEffect(stage == 4 && animatePulse ? 1.02 : 1.0)
        .animation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true), value: animatePulse)
    }

    // Stage 0: seed
    private func drawSeed(ctx: GraphicsContext, cx: Double, groundY: Double) {
        var path = Path()
        path.addEllipse(in: CGRect(x: cx - 8, y: groundY - 14, width: 16, height: 14))
        ctx.fill(path, with: .color(Color(hex: "8B6F47")))
    }

    // Stage 1: small sprout
    private func drawSprout(ctx: GraphicsContext, cx: Double, groundY: Double) {
        // Stem
        var stem = Path()
        stem.move(to: CGPoint(x: cx, y: groundY))
        stem.addLine(to: CGPoint(x: cx, y: groundY - 40))
        ctx.stroke(stem, with: .color(Color(hex: "5A8C3C")), lineWidth: 3)

        // Two small leaves
        for sign: Double in [-1, 1] {
            var leaf = Path()
            leaf.move(to: CGPoint(x: cx, y: groundY - 30))
            leaf.addQuadCurve(
                to: CGPoint(x: cx + sign * 22, y: groundY - 38),
                control: CGPoint(x: cx + sign * 14, y: groundY - 48)
            )
            leaf.addQuadCurve(
                to: CGPoint(x: cx, y: groundY - 30),
                control: CGPoint(x: cx + sign * 10, y: groundY - 22)
            )
            ctx.fill(leaf, with: .color(Color(hex: "5A8C3C")))
        }
    }

    // Stage 2: small tree
    private func drawSapling(ctx: GraphicsContext, cx: Double, groundY: Double, tree: TreeKind) {
        drawTrunk(ctx: ctx, cx: cx, groundY: groundY, height: 70, width: 8, color: tree.trunkColor)
        drawCanopy(ctx: ctx, cx: cx, topY: groundY - 70, radius: 36, tree: tree)
    }

    // Stage 3: medium tree
    private func drawYoung(ctx: GraphicsContext, cx: Double, groundY: Double, tree: TreeKind) {
        drawTrunk(ctx: ctx, cx: cx, groundY: groundY, height: 100, width: 12, color: tree.trunkColor)
        // Side branches
        drawBranch(ctx: ctx, from: CGPoint(x: cx, y: groundY - 60), length: 32, angle: -0.8, color: tree.trunkColor)
        drawBranch(ctx: ctx, from: CGPoint(x: cx, y: groundY - 60), length: 32, angle: .pi + 0.8, color: tree.trunkColor)
        drawCanopy(ctx: ctx, cx: cx, topY: groundY - 100, radius: 54, tree: tree)
        // Side canopy blobs
        drawCanopy(ctx: ctx, cx: cx - 38, topY: groundY - 80, radius: 28, tree: tree)
        drawCanopy(ctx: ctx, cx: cx + 38, topY: groundY - 80, radius: 28, tree: tree)
    }

    // Stage 4: full tree
    private func drawFull(ctx: GraphicsContext, cx: Double, groundY: Double, tree: TreeKind) {
        drawTrunk(ctx: ctx, cx: cx, groundY: groundY, height: 130, width: 16, color: tree.trunkColor)
        // Branches
        for (angle, startFrac): (Double, Double) in [(-0.7, 0.45), (0.7 + .pi, 0.45), (-1.1, 0.65), (1.1 + .pi, 0.65)] {
            drawBranch(ctx: ctx, from: CGPoint(x: cx, y: groundY - 130 * startFrac), length: 44, angle: angle, color: tree.trunkColor)
        }
        // Main canopy
        drawCanopy(ctx: ctx, cx: cx, topY: groundY - 130, radius: 68, tree: tree)
        // Side blobs
        drawCanopy(ctx: ctx, cx: cx - 52, topY: groundY - 100, radius: 38, tree: tree)
        drawCanopy(ctx: ctx, cx: cx + 52, topY: groundY - 100, radius: 38, tree: tree)
        drawCanopy(ctx: ctx, cx: cx - 28, topY: groundY - 150, radius: 32, tree: tree)
        drawCanopy(ctx: ctx, cx: cx + 28, topY: groundY - 150, radius: 32, tree: tree)

        // Fruits / accents
        let fruitPositions: [(Double, Double)] = [(-42, -88), (44, -92), (-18, -116), (20, -110), (-56, -70), (58, -72)]
        for (dx, dy) in fruitPositions {
            var fruit = Path()
            fruit.addEllipse(in: CGRect(x: cx + dx - 5, y: groundY + dy - 5, width: 10, height: 10))
            ctx.fill(fruit, with: .color(tree.accentColor))
        }
    }

    // MARK: Helpers

    private func drawTrunk(ctx: GraphicsContext, cx: Double, groundY: Double, height: Double, width: Double, color: Color) {
        var path = Path()
        path.move(to: CGPoint(x: cx - width / 2, y: groundY))
        path.addLine(to: CGPoint(x: cx - width / 4, y: groundY - height))
        path.addLine(to: CGPoint(x: cx + width / 4, y: groundY - height))
        path.addLine(to: CGPoint(x: cx + width / 2, y: groundY))
        path.closeSubpath()
        ctx.fill(path, with: .color(color))
    }

    private func drawBranch(ctx: GraphicsContext, from start: CGPoint, length: Double, angle: Double, color: Color) {
        let end = CGPoint(x: start.x + cos(angle) * length, y: start.y + sin(angle) * length)
        var path = Path()
        path.move(to: start)
        path.addLine(to: end)
        ctx.stroke(path, with: .color(color), lineWidth: 5)
    }

    private func drawCanopy(ctx: GraphicsContext, cx: Double, topY: Double, radius: Double, tree: TreeKind) {
        let (c1, c2) = tree.leafColors
        let rect = CGRect(x: cx - radius, y: topY - radius * 0.5, width: radius * 2, height: radius * 1.5)
        var path = Path()
        path.addEllipse(in: rect)
        ctx.fill(path, with: .linearGradient(
            Gradient(colors: [c1, c2]),
            startPoint: CGPoint(x: cx, y: topY - radius * 0.5),
            endPoint: CGPoint(x: cx, y: topY + radius)
        ))
    }
}
