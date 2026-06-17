# Google Play Release Pack

Updated: 2026-06-15

This document is the Google Play submission checklist for `斗球球` / `Profession Ball Arena`.

## Current GP Readiness

Status: Play Console app created; App content declarations completed; local release artifact is ready for closed testing / production access review. Production access still depends on Play Console closed-testing metrics.

- Package name: `com.professionballarena.game`
- App label: `斗球球`
- Play Console developer ID: `6475068404690112678`
- Play Console app ID: `4974008180505281318`
- Android developer verification package status: registered on 2026-06-04.
- Version: `versionCode 4`, `versionName 1.0.3`
- Min SDK: 24
- Target SDK: 36
- Upload artifact: `android/app/build/outputs/bundle/release/app-release.aab`
- AAB size: about 23 MB
- AAB SHA-256: `0e9825347caf14bd6c009baf607a52378164b1509c1ce08e06d9c5aeb0f069c4`
- Release signing SHA-256: `35:59:BE:53:A5:E0:B3:D2:DB:DE:02:95:A6:42:27:E4:DB:25:07:3D:3E:6F:FD:49:D6:F2:77:6D:34:C7:FF:84`
- Release signing valid until: 2053-10-08

Official requirement note: Google Play requires Android App Bundles for new apps, and target API level requirements move over time. This project currently targets SDK 36, which is above the Android 15 / API 35 requirement for new apps and updates after 2025-08-31.

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

- App name: `斗球球`
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
- Feature graphic: `store-assets/google-play/feature-graphic.png` and `store-assets/google-play/feature-graphic.jpg`.
- Phone screenshots: `store-assets/screenshots/google-phone/`
  - `01-classic-battle.png`
  - `02-profession-select.png`
  - `03-item-mode.png`
  - `04-hero-battle.png`
  - `05-settings-privacy.png`

## App Content Answers

Live Play Console status on 2026-06-04: all 10 App content declarations are completed, and the App content overview shows no declarations needing attention. Changes still need to be included in a release and sent through Publishing overview review.

### App Access

- Does your app require login or restricted access? `No`
- Notes for reviewer:

```text
No login is required. On first launch, accept the Privacy Policy and User Agreement, then tap Start Game, choose a mode or profession setup, and tap Start Game again to enter a match.
```

### Ads

- Does your app contain ads? `No`
- Notes: The current build does not include an ad SDK, ad app id, ad units, or runtime ad requests.

### Target Audience

- Target age group: `13-15`, `16-17`, and `18+`.
- Designed for children: `No`
- Family policy / Designed for Families: `Do not enroll`
- Rationale: The game contains mild cartoon/fantasy combat, HP values, weapons, and ads; it is not designed as a child-directed product.

### Content Rating

Submitted IARC summary:

- Violence: mild cartoon/fantasy violence.
- Blood/gore: none.
- Fear/horror: none.
- Gambling: none.
- User-generated content: none.
- Online interaction/chat: none.
- Location sharing: none.
- In-app purchases: no real IAP in current version.
- Ads: yes.
- Result shown in Play Console: ESRB Everyone, PEGI 7, IARC Generic 7+, with mild fantasy/cartoon violence style labels.

### News, Health, Financial, Government, COVID, VPN

Answer `No` for these special app categories.

## Data Safety Draft

The final form must match the live SDK behavior at submission time. Current recommended answers:

### Data Collection

Does the app collect or share user data?

Answer: `Yes`, because Firebase Analytics may process analytics, diagnostics, app activity, and device identifiers after user consent. The current build does not process advertising-related signals through an ad SDK.

### Data Types

Declared in the live Play Console form:

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

Declared purposes for collected and shared data:

- Analytics
- Advertising or marketing
- Fraud prevention, security, and compliance
- App functionality

### Sharing

- The live form declares these data types as both collected and shared: app interactions, diagnostics, other app performance data, and device or other IDs.

### Security Practices

- Data is encrypted in transit: `Yes`
- Users can request data deletion: `Yes`
- Data deletion URL: `https://professionballarena.top/data-deletion/`
- Users can opt out of analytics/ads in-app: `Yes`, via Settings and consent withdrawal.
- Account creation: `No`
- External account login: `No`

## Permissions And SDK Notes

Source manifest keeps only:

- `android.permission.INTERNET`
- `android.permission.VIBRATE`

Merged release manifest still includes dependency-normal permissions such as network state and Google Play install referrer support, but the risky/sensitive ad identifier and background service permissions are rejected by manifest merge:

- `com.google.android.gms.permission.AD_ID`: removed.
- `android.permission.ACCESS_ADSERVICES_AD_ID`: removed.
- `android.permission.ACCESS_ADSERVICES_ATTRIBUTION`: removed.
- `android.permission.ACCESS_ADSERVICES_TOPICS`: removed.
- `android.permission.ACCESS_ADSERVICES_CUSTOM_AUDIENCE`: removed.
- `android.permission.WAKE_LOCK`: removed.
- `android.permission.RECEIVE_BOOT_COMPLETED`: removed.
- `android.permission.FOREGROUND_SERVICE`: removed.

## Release Track Plan

Recommended sequence:

1. App record created in Play Console using package `com.professionballarena.game`.
2. Play App Signing terms accepted during app creation; choose/confirm the signing key when creating the first bundle release.
3. Upload `android/app/build/outputs/bundle/release/app-release.aab` to Internal testing for smoke verification, if not already done.
4. Add at least one internal tester account.
5. App content completed:
   - Privacy policy
   - Ads declaration
   - App access
   - Content rating questionnaire
   - Target audience
   - Data safety
   - Advertising ID
   - Government apps
   - Financial products and services
   - Health apps
6. Add store listing and screenshots.
7. Roll out internal test.
8. Install from Play internal test link and run:
   - First launch consent flow
   - Start classic battle
   - Start item mode
   - Start hero mode
   - Settings toggles
   - No crash after resume/background
9. Promote to Closed testing after internal smoke pass. Closed testing is the production-access gate for new personal developer accounts.
10. After the required closed test is satisfied, apply for production access from the Play Console app dashboard.

## Known Blockers Before Production

- Production access is locked until the app completes the required closed testing flow: at least 12 opted-in testers for at least 14 continuous days, then apply for production access from the app dashboard.
- App content changes must be sent for review through Publishing overview with a release.
- Play Console showed a crawler warning for `https://professionballarena.top/data-deletion/`, but local HTTP checks returned `200 OK`; recheck this warning before sending for review if it persists.
- Data safety answers must be rechecked if SDK behavior changes.
- Feature graphic exists locally; confirm it is uploaded in Play Console if the store listing still flags a missing graphic.
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
