# Google Play Release Pack

Updated: 2026-05-29

This document is the Google Play submission checklist for `职业球球斗技场` / `Profession Ball Arena`.

## Current GP Readiness

Status: ready for Play Console internal testing, pending manual Play Console account/app setup.

- Package name: `com.professionballarena.game`
- App label: `职业球球斗技场`
- Version: `versionCode 1`, `versionName 1.0`
- Min SDK: 24
- Target SDK: 36
- Upload artifact: `android/app/build/outputs/bundle/release/app-release.aab`
- AAB size: about 22 MB
- AAB SHA-256: `fc20115cd2ac0ab37ebc4efb0480e8d9ee5b3fe9eee866693400079033906354`
- Release signing SHA-256: `35:59:BE:53:A5:E0:B3:D2:DB:DE:02:95:A6:42:27:E4:DB:25:07:3D:3E:6F:FD:49:D6:F2:77:6D:34:C7:FF:84`
- Release signing valid until: 2053-10-08

Official requirement note: Google Play requires Android App Bundles for new apps, and target API level requirements move over time. This project currently targets SDK 36, which is above the current Android 15 / API 35 requirement for new apps and updates after 2025-08-31.

## Build Commands

Use Android Studio's bundled JBR because this project compiles with Java 21:

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Build the Play upload bundle:

```sh
npm run android:gp:bundle
```

Verify:

```sh
ls -lh android/app/build/outputs/bundle/release/app-release.aab
shasum -a 256 android/app/build/outputs/bundle/release/app-release.aab
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
cd android && ./gradlew :app:signingReport
```

`jarsigner` reports a self-signed upload key warning, which is expected for a local upload key. Keep the keystore private and enable Google Play App Signing in Play Console.

## Store Listing

Use the Google Play metadata from `docs/aso-store-listing.md`.

Recommended production listing:

- App name: `职业球球斗技场`
- Short description: `选择职业与道具，观看球球在像素竞技场自动开战。`
- Full description: use the zh-CN Google Play full description from `docs/aso-store-listing.md`.
- App category: Game
- Suggested type: Casual / Action
- Tags to consider in Play Console: Casual, Action, Offline, Single player, Pixel, Strategy
- Contact email: `j.n.young0209@gmail.com`
- Website: `https://professionballarena.top/`
- Privacy policy: `https://professionballarena.top/privacy/`

Preview assets:

- App icon: `public/icon-512.png`
- Feature graphic: still needed if Play Console requests it; recommended export size is 1024 x 500.
- Phone screenshots: `store-assets/screenshots/google-phone/`
  - `01-classic-battle.png`
  - `02-profession-select.png`
  - `03-item-mode.png`
  - `04-hero-battle.png`
  - `05-settings-privacy.png`

## App Content Answers

### App Access

- Does your app require login or restricted access? `No`
- Notes for reviewer:

```text
No login is required. On first launch, accept the Privacy Policy and User Agreement, then tap Start Game, choose a mode or profession setup, and tap Start Game again to enter a match.
```

### Ads

- Does your app contain ads? `Yes`
- Ad SDK/provider: Google AdMob
- Notes: Ads are consent-gated in the app runtime. Android release builds use the configured production AdMob app id and ad units. Requests default to non-personalized ads.

### Target Audience

- Target age group: `13+` recommended.
- Designed for children: `No`
- Family policy / Designed for Families: `Do not enroll`
- Rationale: The game contains mild cartoon/fantasy combat, HP values, weapons, and ads; it is not designed as a child-directed product.

### Content Rating

Suggested answers:

- Violence: mild cartoon/fantasy violence.
- Blood/gore: none.
- Fear/horror: none.
- Gambling: none.
- User-generated content: none.
- Online interaction/chat: none.
- Location sharing: none.
- In-app purchases: no real IAP in current version.
- Ads: yes.

### News, Health, Financial, Government, COVID, VPN

Answer `No` for these special app categories.

## Data Safety Draft

The final form must match the live SDK behavior at submission time. Current recommended answers:

### Data Collection

Does the app collect or share user data?

Answer: `Yes`, because Firebase Analytics and AdMob may process analytics, diagnostics, app activity, device identifiers, and advertising-related signals after user consent.

### Data Types

Declare only what is actually active in the build:

- App activity
  - App interactions
  - In-app search history: `No`
  - Installed apps: `No`
  - Other user-generated content: `No`
- App info and performance
  - Crash logs: if Firebase Crashlytics is not enabled, answer `No`.
  - Diagnostics / performance data: `Yes` if Firebase Analytics performance events are treated here.
  - Other app performance data: `Yes` if using FPS/performance event analytics.
- Device or other IDs
  - Advertising ID: `No` for this build, because `AD_ID` and Privacy Sandbox ad services permissions are removed from the merged manifest.
  - Other device IDs: `Yes` if Firebase Installation ID / app instance ID is treated as device or other ID in the Play form.

### Purposes

Recommended purposes:

- Analytics
- Advertising or marketing
- Fraud prevention, security, and compliance
- App functionality

### Sharing

- AdMob/Firebase process data as SDK providers. In the Play form, answer according to Google's Data safety instructions for SDKs and service providers.
- If the form treats AdMob ad processing as sharing, declare sharing for advertising-related data.

### Security Practices

- Data is encrypted in transit: `Yes`
- Users can request data deletion: `Yes`
- Data deletion URL: `https://professionballarena.top/data-deletion/`
- Users can opt out of analytics/ads in-app: `Yes`, via Settings and consent withdrawal.

## Permissions And SDK Notes

Source manifest keeps only:

- `android.permission.INTERNET`
- `android.permission.VIBRATE`

Merged release manifest still includes dependency-normal permissions such as network state and Google Play install referrer support, but the risky/sensitive ad identifier and background service permissions are rejected by manifest merge:

- `com.google.android.gms.permission.AD_ID`: removed.
- `android.permission.ACCESS_ADSERVICES_AD_ID`: removed.
- `android.permission.ACCESS_ADSERVICES_ATTRIBUTION`: removed.
- `android.permission.ACCESS_ADSERVICES_TOPICS`: removed.
- `android.permission.WAKE_LOCK`: removed.
- `android.permission.RECEIVE_BOOT_COMPLETED`: removed.
- `android.permission.FOREGROUND_SERVICE`: removed.

## Release Track Plan

Recommended sequence:

1. Create app in Play Console using package `com.professionballarena.game`.
2. Enable Google Play App Signing.
3. Upload `android/app/build/outputs/bundle/release/app-release.aab` to Internal testing.
4. Add at least one internal tester account.
5. Complete App content:
   - Privacy policy
   - Ads declaration
   - App access
   - Content rating questionnaire
   - Target audience
   - Data safety
6. Add store listing and screenshots.
7. Roll out internal test.
8. Install from Play internal test link and run:
   - First launch consent flow
   - Start classic battle
   - Start item mode
   - Start hero mode
   - Settings toggles
   - No crash after resume/background
9. Promote to Closed testing or Production after Play review and tester smoke pass.

## Known Blockers Before Production

- Play Console app record must be created manually.
- Data safety answers must be confirmed in the live Play Console UI; SDK disclosures can change.
- Feature graphic 1024 x 500 should be generated/uploaded if Play Console marks it required.
- If publishing broadly outside test tracks, confirm AdMob app approval and ad serving status.
- If targeting mainland China distribution through Google Play is considered, confirm legal/commercial availability separately.

## Official References

- Target API level requirement: https://support.google.com/googleplay/android-developer/answer/11926878
- Create and set up your app: https://support.google.com/googleplay/android-developer/answer/9859152
- Prepare and roll out a release: https://support.google.com/googleplay/android-developer/answer/9859348
- App bundles and Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756
- Preview assets: https://support.google.com/googleplay/android-developer/answer/9866151
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Ads declaration: https://support.google.com/googleplay/android-developer/answer/9857753
- Content ratings: https://support.google.com/googleplay/android-developer/answer/9859655
- Google Play In-App Reviews API: https://developer.android.com/guide/playcore/in-app-review
