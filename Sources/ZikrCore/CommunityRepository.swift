import Foundation

public protocol CommunityRepository: Sendable {
    func loadCircles(for userName: String, currentTotal: Int, streak: Int) async throws -> [CircleSummary]
}

public struct MockCommunityRepository: CommunityRepository {
    public init() {}

    public func loadCircles(for userName: String, currentTotal: Int, streak: Int) async throws -> [CircleSummary] {
        let currentUser = FriendProgress(
            id: "current-user",
            userName: userName.isEmpty ? "You" : userName,
            avatar: "sparkles",
            totalCount: currentTotal,
            streakCount: streak,
            isCurrentUser: true
        )

        let circle = CircleSummary(
            id: "circle-barakah",
            name: "Barakah Circle",
            motto: "Keep one another consistent through small daily wins.",
            members: [
                currentUser,
                .init(userName: "Aminah", avatar: "moon.stars.fill", totalCount: max(currentTotal + 33, 180), streakCount: max(streak + 1, 4)),
                .init(userName: "Yusuf", avatar: "leaf.fill", totalCount: max(currentTotal - 12, 96), streakCount: max(streak, 2)),
                .init(userName: "Maryam", avatar: "heart.fill", totalCount: max(currentTotal / 2, 72), streakCount: 1)
            ]
        )

        return [circle]
    }
}

#if canImport(FirebaseAuth) && canImport(FirebaseFirestore)
import FirebaseAuth
import FirebaseFirestore

public struct FirebaseCommunityRepository: CommunityRepository {
    public init() {}

    public func loadCircles(for userName: String, currentTotal: Int, streak: Int) async throws -> [CircleSummary] {
        guard let currentUserID = Auth.auth().currentUser?.uid else {
            return try await MockCommunityRepository().loadCircles(for: userName, currentTotal: currentTotal, streak: streak)
        }

        let db = Firestore.firestore()
        let memberships = try await db.collection("circleMemberships")
            .whereField("userID", isEqualTo: currentUserID)
            .getDocuments()

        let circleIDs = memberships.documents.compactMap { $0["circleID"] as? String }
        guard !circleIDs.isEmpty else {
            return try await MockCommunityRepository().loadCircles(for: userName, currentTotal: currentTotal, streak: streak)
        }

        return try await withThrowingTaskGroup(of: CircleSummary?.self) { group in
            for circleID in circleIDs {
                group.addTask {
                    let circleDocument = try await db.collection("circles").document(circleID).getDocument()
                    let membersDocument = try await db.collection("circles").document(circleID).collection("members").getDocuments()

                    let members: [FriendProgress] = membersDocument.documents.compactMap { document in
                        guard let memberName = document["displayName"] as? String else { return nil }
                        let totalCount = document["totalCount"] as? Int ?? 0
                        let streakCount = document["streakCount"] as? Int ?? 0
                        let avatar = document["avatar"] as? String ?? "person.fill"
                        let memberID = document.documentID
                        return FriendProgress(
                            id: memberID,
                            userName: memberName,
                            avatar: avatar,
                            totalCount: memberID == currentUserID ? currentTotal : totalCount,
                            streakCount: memberID == currentUserID ? streak : streakCount,
                            isCurrentUser: memberID == currentUserID
                        )
                    }

                    return CircleSummary(
                        id: circleDocument.documentID,
                        name: circleDocument["name"] as? String ?? "Dhikr Circle",
                        motto: circleDocument["motto"] as? String ?? "Small acts done daily.",
                        members: members
                    )
                }
            }

            var circles: [CircleSummary] = []
            for try await circle in group {
                if let circle {
                    circles.append(circle)
                }
            }
            return circles
        }
    }
}
#else
public struct FirebaseCommunityRepository: CommunityRepository {
    public init() {}

    public func loadCircles(for userName: String, currentTotal: Int, streak: Int) async throws -> [CircleSummary] {
        try await MockCommunityRepository().loadCircles(for: userName, currentTotal: currentTotal, streak: streak)
    }
}
#endif
