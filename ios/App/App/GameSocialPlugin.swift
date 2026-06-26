import Capacitor
import Photos
import UIKit

@objc(GameSocialPlugin)
public class GameSocialPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameSocialPlugin"
    public let jsName = "GameSocial"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "shareImage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareVideo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveVideo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLaunchDeepLink", returnType: CAPPluginReturnPromise)
    ]

    @objc func shareImage(_ call: CAPPluginCall) {
        shareMedia(call, defaultFileName: "battle-report.png", defaultContentType: "image/png")
    }

    @objc func shareVideo(_ call: CAPPluginCall) {
        shareMedia(call, defaultFileName: "match-short.mp4", defaultContentType: "video/mp4")
    }

    @objc func saveVideo(_ call: CAPPluginCall) {
        do {
            let media = try writeTemporaryMedia(call, defaultFileName: "match-short.mp4", defaultContentType: "video/mp4")
            saveVideoToPhotoLibrary(media.url, call: call)
        } catch {
            call.reject("Video save failed: \(error.localizedDescription)")
        }
    }

    @objc func getLaunchDeepLink(_ call: CAPPluginCall) {
        call.resolve([
            "url": "",
            "source": "none",
            "native": true
        ])
    }

    private func shareMedia(_ call: CAPPluginCall, defaultFileName: String, defaultContentType: String) {
        do {
            let media = try writeTemporaryMedia(call, defaultFileName: defaultFileName, defaultContentType: defaultContentType)
            let text = buildShareText(call)
            var activityItems: [Any] = [media.url]
            if !text.isEmpty {
                activityItems.append(text)
            }

            DispatchQueue.main.async {
                guard let presenter = self.bridge?.viewController else {
                    call.reject("No view controller available for sharing")
                    return
                }

                let activityViewController = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
                if let title = call.getString("title"), !title.isEmpty {
                    activityViewController.setValue(title, forKey: "subject")
                }
                if let popover = activityViewController.popoverPresentationController {
                    popover.sourceView = presenter.view
                    popover.sourceRect = CGRect(
                        x: presenter.view.bounds.midX,
                        y: presenter.view.bounds.midY,
                        width: 1,
                        height: 1
                    )
                    popover.permittedArrowDirections = []
                }

                presenter.present(activityViewController, animated: true) {
                    call.resolve([
                        "shared": true,
                        "target": call.getString("target") ?? "system",
                        "transport": "ios_activity_view_controller",
                        "uri": media.url.absoluteString,
                        "contentType": media.contentType
                    ])
                }
            }
        } catch {
            call.reject("Media sharing failed: \(error.localizedDescription)")
        }
    }

    private func saveVideoToPhotoLibrary(_ fileUrl: URL, call: CAPPluginCall) {
        let performSave = {
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: fileUrl)
            }) { success, error in
                DispatchQueue.main.async {
                    if success {
                        call.resolve([
                            "saved": true,
                            "transport": "ios_photo_library",
                            "uri": fileUrl.absoluteString
                        ])
                    } else {
                        call.reject("Video save failed: \(error?.localizedDescription ?? "unknown error")")
                    }
                }
            }
        }

        if #available(iOS 14, *) {
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                guard status == .authorized || status == .limited else {
                    DispatchQueue.main.async {
                        call.reject("Photo library permission denied")
                    }
                    return
                }
                performSave()
            }
        } else {
            PHPhotoLibrary.requestAuthorization { status in
                guard status == .authorized else {
                    DispatchQueue.main.async {
                        call.reject("Photo library permission denied")
                    }
                    return
                }
                performSave()
            }
        }
    }

    private func writeTemporaryMedia(_ call: CAPPluginCall, defaultFileName: String, defaultContentType: String) throws -> (url: URL, contentType: String) {
        guard let base64Data = call.getString("base64Data"), !base64Data.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw GameSocialError.missingBase64Data
        }

        let payload = base64Data.split(separator: ",", maxSplits: 1, omittingEmptySubsequences: false).last.map(String.init) ?? base64Data
        guard let data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters) else {
            throw GameSocialError.invalidBase64Data
        }

        let contentType = call.getString("contentType") ?? defaultContentType
        let fileName = sanitizeFileName(
            call.getString("fileName") ?? defaultFileName,
            fallback: defaultFileName,
            defaultExtension: defaultExtension(for: contentType, fallbackFileName: defaultFileName)
        )
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent("social-share", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let fileUrl = directory.appendingPathComponent(fileName, isDirectory: false)
        try data.write(to: fileUrl, options: .atomic)
        return (fileUrl, contentType)
    }

    private func buildShareText(_ call: CAPPluginCall) -> String {
        let text = call.getString("text") ?? ""
        let deepLinkUrl = call.getString("deepLinkUrl") ?? ""
        if deepLinkUrl.isEmpty || text.contains(deepLinkUrl) {
            return text
        }
        return text.isEmpty ? deepLinkUrl : "\(text)\n\(deepLinkUrl)"
    }

    private func sanitizeFileName(_ value: String, fallback: String, defaultExtension: String) -> String {
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
        let sanitized = String(value.unicodeScalars.map { allowed.contains($0) ? Character($0) : "-" })
            .trimmingCharacters(in: CharacterSet(charactersIn: ".-"))
        let baseName = sanitized.isEmpty ? fallback : sanitized
        return baseName.contains(".") ? baseName : baseName + defaultExtension
    }

    private func defaultExtension(for contentType: String, fallbackFileName: String) -> String {
        if let extensionStart = fallbackFileName.lastIndex(of: ".") {
            return String(fallbackFileName[extensionStart...])
        }
        return contentType.lowercased().contains("webm") ? ".webm" : ".mp4"
    }
}

private enum GameSocialError: LocalizedError {
    case missingBase64Data
    case invalidBase64Data

    var errorDescription: String? {
        switch self {
        case .missingBase64Data:
            return "base64Data is required"
        case .invalidBase64Data:
            return "base64Data is not valid"
        }
    }
}
