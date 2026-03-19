// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "ZikrCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v13)
    ],
    products: [
        .library(name: "ZikrCore", targets: ["ZikrCore"])
    ],
    targets: [
        .target(
            name: "ZikrCore",
            path: "Sources/ZikrCore"
        ),
        .testTarget(
            name: "ZikrCoreTests",
            dependencies: ["ZikrCore"],
            path: "Tests/ZikrCoreTests"
        )
    ]
)
