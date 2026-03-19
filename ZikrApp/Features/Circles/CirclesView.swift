import SwiftUI
import ZikrCore

struct CirclesView: View {
    @ObservedObject var viewModel: ZikrAppViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let circle = viewModel.state.circles.first {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(circle.name)
                                .font(.title2.bold())
                            Text(circle.motto)
                                .foregroundStyle(.secondary)
                            HStack {
                                Label("\(circle.members.count) members", systemImage: "person.3.fill")
                                Spacer()
                                Label("\(circle.groupTotal) total", systemImage: "chart.bar.fill")
                            }
                            .font(.subheadline.weight(.medium))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 24).fill(.indigo.opacity(0.12)))

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Friends leaderboard")
                                .font(.headline)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            ForEach(Array(circle.members.enumerated()), id: \.element.id) { index, member in
                                HStack(spacing: 14) {
                                    Text("#\(index + 1)")
                                        .font(.headline)
                                        .frame(width: 34)
                                    Image(systemName: member.avatar)
                                        .frame(width: 38, height: 38)
                                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack {
                                            Text(member.userName)
                                                .font(.headline)
                                            if member.isCurrentUser {
                                                Text("You")
                                                    .font(.caption.bold())
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 4)
                                                    .background(.green.opacity(0.18), in: Capsule())
                                            }
                                        }
                                        Text("\(member.totalCount) today · \(member.streakCount)d streak")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                }
                                .padding()
                                .background(RoundedRectangle(cornerRadius: 18).fill(.thinMaterial))
                            }
                        }
                    } else {
                        ContentUnavailableView("No circles yet", systemImage: "person.3.sequence.fill", description: Text("Firebase-backed circles are scaffolded. The mock circle will appear after onboarding and refresh."))
                    }

                    Button {
                        Task {
                            await viewModel.refreshCircles()
                        }
                    } label: {
                        Label("Refresh circle", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(20)
            }
            .navigationTitle("Circles")
        }
    }
}
