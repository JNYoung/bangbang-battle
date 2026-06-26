import Capacitor

@objc(BangbangBridgeViewController)
class BangbangBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(GameReviewPlugin())
        bridge?.registerPluginInstance(GameSocialPlugin())
    }
}
