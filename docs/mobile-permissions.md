# Mobile Permissions and Consent

## Current Release Artifacts

- Android release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Android release AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- iOS signed IPA: not present locally. The iOS workflow can produce an unsigned archive artifact, but App Store/TestFlight export still needs Xcode signing credentials.

## Android

Release permissions to account for:

- `android.permission.INTERNET`: required by the WebView shell and Firebase Analytics upload.
- `android.permission.VIBRATE`: required for the optional vibration feedback setting.
- `android.permission.ACCESS_NETWORK_STATE`: brought in by Firebase dependencies in the merged manifest for network availability checks.
- `android.permission.WRITE_EXTERNAL_STORAGE` with `maxSdkVersion=28`: only used on Android 9 and below when the user explicitly taps Save Short for a recorded match video. Android 10+ uses MediaStore scoped writes.

Removed or disabled analytics-advertising identifiers:

- `com.google.android.gms.permission.AD_ID` is removed from the merged manifest.
- Android Privacy Sandbox ad-services ID, attribution, and topics permissions are removed from the merged manifest.
- Dependency-added `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, and `FOREGROUND_SERVICE` permissions are removed from the merged manifest because the game does not use background services.
- Firebase Analytics collection and ad ID collection default to disabled at process start.

Ad configuration:

- The current build does not include the native AdMob plugin.
- Android has no AdMob app id metadata and no ad unit configuration.
- The runtime does not request or show ads.

Runtime flow:

1. First launch shows the privacy policy and user agreement.
2. Before consent, Firebase Analytics collection remains disabled and game events are not sent.
3. Accepting the policy enables analytics, then logs `legal_accept` plus `game_init_success`.
4. The Settings screen includes an Analytics toggle. Turning it off disables analytics collection.
5. Review-prompt throttling state is saved locally so native rating prompts are not repeated too frequently.
6. Withdrawing consent disables analytics and returns the user to the consent screen.

No notification, camera, microphone, contacts, or location permissions are requested. Storage/photo-library access is only requested by explicit user action for saving recorded match Shorts.

## iOS

The iOS target does not request camera, microphone, location, contacts, calendar, Bluetooth, tracking, or notification permissions. Photo library add-only permission is requested only when the user taps Save Short for a recorded match video.

Ad configuration:

- The current iOS target does not include AdMob.
- `Info.plist` does not include `GADApplicationIdentifier` or ad SKAdNetwork entries.
- The app does not call the ATT prompt in the current runtime flow.

Configured privacy files:

- `ios/App/App/Info.plist`: includes `NSPhotoLibraryAddUsageDescription` for explicit Save Short exports.
- `ios/App/App/PrivacyInfo.xcprivacy`: declares no tracking, no tracking domains, no collected data types, and the app-container UserDefaults required-reason API category for app-local preferences.

Runtime flow mirrors Android at the Web layer. The current iOS native shell includes StoreKit review and system share/save bridges but does not include Firebase Analytics, so the Analytics setting will only become active on iOS after an iOS analytics bridge is added.
