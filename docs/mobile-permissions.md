# Mobile Permissions and Consent

## Current Release Artifacts

- Android release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Android release AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- iOS signed IPA: not present locally. The iOS workflow can produce an unsigned archive artifact, but App Store/TestFlight export still needs Xcode signing credentials.

## Android

Declared app permissions:

- `android.permission.INTERNET`: required by the WebView shell and Firebase Analytics upload.
- `android.permission.VIBRATE`: required for the optional vibration feedback setting.

Removed or disabled analytics-advertising identifiers:

- `com.google.android.gms.permission.AD_ID` is removed from the merged manifest.
- Android Privacy Sandbox ad-services ID and attribution permissions are removed from the merged manifest.
- Firebase Analytics collection and ad ID collection default to disabled at process start.

AdMob configuration:

- The native AdMob plugin is configured with the Google sample Android app ID for debug builds.
- Ad requests default to non-personalized mode (`VITE_ADMOB_NPA=true`) and Google test ad units (`VITE_ADMOB_TESTING=true`) unless release env vars provide real ad units.
- The app adds game-context metadata in the ad service, but final "game ads only" category filtering must be configured in the AdMob console.

Runtime flow:

1. First launch shows the privacy policy and user agreement.
2. Before consent, Firebase Analytics collection remains disabled and game events are not sent.
3. Accepting the policy enables analytics and ads, then logs `legal_accept` plus `game_init_success`.
4. The Settings screen includes Analytics and Ads toggles. Turning them off disables the corresponding runtime capability.
5. Withdrawing consent disables analytics and ads and returns the user to the consent screen.

No notification, camera, microphone, contacts, location, storage, or photo permissions are requested.

## iOS

The iOS target does not request camera, microphone, location, contacts, calendar, photo library, Bluetooth, tracking, or notification permissions.

AdMob configuration:

- `GADApplicationIdentifier` currently uses the Google sample iOS app ID for debug builds.
- `SKAdNetworkItems` includes Google's SKAdNetwork identifier for install attribution support.
- The app does not call the ATT prompt in the current runtime flow; ad requests default to non-personalized mode.

Configured privacy files:

- `ios/App/App/Info.plist`: no sensitive permission usage descriptions are present because the app does not request those capabilities; it does include AdMob app and SKAdNetwork configuration.
- `ios/App/App/PrivacyInfo.xcprivacy`: declares no tracking, no tracking domains, no collected data types, and the app-container UserDefaults required-reason API category for app-local preferences.

Runtime flow mirrors Android at the Web layer. The current iOS native shell does not include Firebase Analytics, so the Analytics setting will only become active on iOS after an iOS analytics bridge is added.
