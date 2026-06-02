import Capacitor
import StoreKit
import UIKit

@objc(GameReviewPlugin)
public class GameReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameReviewPlugin"
    public let jsName = "GameReview"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openStoreListing", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise)
    ]

    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if #available(iOS 14.0, *), let scene = self.activeWindowScene() {
                SKStoreReviewController.requestReview(in: scene)
            } else {
                SKStoreReviewController.requestReview()
            }

            call.resolve([
                "requested": true,
                "shownMaybe": true,
                "transport": "skstore_review_controller",
                "reason": "completed_or_quota_not_shown"
            ])
        }
    }

    @objc func openStoreListing(_ call: CAPPluginCall) {
        let appStoreAppId = normalizeAppStoreId(call.getString("app_store_app_id") ?? "")
        if appStoreAppId.isEmpty {
            call.resolve([
                "opened": false,
                "transport": "app_store_url",
                "reason": "app_store_id_missing"
            ])
            return
        }

        let writeReview = call.getBool("writeReview", true)
        let action = writeReview ? "?action=write-review" : ""
        guard let url = URL(string: "itms-apps://itunes.apple.com/app/id\(appStoreAppId)\(action)") else {
            call.resolve([
                "opened": false,
                "transport": "app_store_url",
                "reason": "invalid_app_store_url"
            ])
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                call.resolve([
                    "opened": opened,
                    "transport": "app_store_url",
                    "url": url.absoluteString,
                    "reason": opened ? "opened" : "open_failed"
                ])
            }
        }
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "platform": "ios",
            "transport": "skstore_review_controller"
        ])
    }

    private func activeWindowScene() -> UIWindowScene? {
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
    }

    private func normalizeAppStoreId(_ value: String) -> String {
        return value.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
    }
}
