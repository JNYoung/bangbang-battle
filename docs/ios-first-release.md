# iOS First Release Checklist

This checklist is for the first App Store or TestFlight release of `斗球球`.

## Current App Settings

- App name: `斗球球`
- Bundle ID: `com.professionballarena.game`
- Xcode project: `ios/App/App.xcodeproj`
- iOS deployment target: `15.0`
- Version/build in Xcode: `1.0` / `1`

Keep the bundle ID stable once the first build is uploaded to App Store Connect.

## Account Setup

1. Create or use an Apple Account.
2. Enroll in the Apple Developer Program as an individual or organization. Organization enrollment is better if the seller name should be a company name, but it needs company verification such as D-U-N-S.
3. After enrollment is active, open App Store Connect and accept the latest agreements. Paid apps, in-app purchases, subscriptions, or Apple Search Ads need extra banking/tax/commercial setup.
4. In Xcode, open Settings > Accounts and sign in with the Apple Account that belongs to the developer team.

Apple's current public pricing is a `$99 annual membership` for the Apple Developer Program. Free developer accounts can test directly on owned devices through Xcode, but TestFlight and App Store distribution require paid membership.

## Local Machine Setup

This Mac has Xcode at:

```sh
/Applications/Xcode.app
```

The terminal currently needs the full Xcode developer directory instead of Command Line Tools:

```sh
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
```

Or switch it globally:

```sh
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Before archiving, verify these commands pass:

```sh
xcodebuild -version
xcodebuild -showsdks
security find-identity -v -p codesigning
```

Current local blockers observed on 2026-06-18:

- `security find-identity -v -p codesigning` reports `0 valid identities found`.
- No provisioning profiles were found under `~/Library/MobileDevice/Provisioning Profiles`.
- `xcodebuild` fails storyboard compilation with `iOS 26.4 Platform Not Installed`.
- Xcode reports no simulator runtimes from `xcrun simctl list runtimes`.

Fix the Xcode platform blocker in Xcode > Settings > Components by installing the matching iOS 26.4 platform/runtime, then reopen Xcode once.

## App ID and Signing

1. In Apple Developer > Certificates, Identifiers & Profiles, register an explicit App ID for `com.professionballarena.game`.
2. In Xcode, open `ios/App/App.xcodeproj`.
3. Select target `App` > Signing & Capabilities.
4. Set Team to the enrolled developer team.
5. Keep Automatically manage signing enabled for the first release unless there is a CI/manual signing reason.
6. Confirm the bundle identifier remains `com.professionballarena.game`.

For command-line signing later, `xcodebuild -allowProvisioningUpdates` can create or update automatic signing assets after the developer account is added to Xcode.

## App Store Connect Record

Create the app record before uploading:

- Platform: iOS
- Name: `斗球球`
- Primary language: Simplified Chinese if the China store listing is primary, otherwise English
- Bundle ID: `com.professionballarena.game`
- SKU suggestion: `profession-ball-arena-ios`
- Category: Games

Before submission, prepare:

- Privacy Policy URL
- Support URL
- App icon and screenshots for required iPhone/iPad sizes
- Age rating questionnaire
- App Privacy answers
- Export compliance answer for encryption
- Copyright and contact info
- Review notes and test account, if the game ever requires login

## Build Levels

Unsigned IPA:

- Good for checking that an iOS package can be assembled.
- Not installable on normal devices.
- Not accepted by TestFlight or App Store Connect.

Development or release-testing IPA:

- Needs Apple Developer signing assets.
- Useful for registered-device QA outside TestFlight.

App Store Connect upload:

- Needs a signed archive with an Apple Distribution certificate/profile or automatic signing.
- Upload through Xcode Organizer, Transporter, `altool`, or App Store Connect API.

## Local Preflight

Run these before creating an archive:

```sh
npm run lint:syntax
npm test
npm run build
cap sync ios
```

Unsigned IPA check after Xcode platform install:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run ios:ipa:unsigned
```

Signed upload flow after account setup:

```sh
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
npm run build
cap sync ios
open ios/App/App.xcodeproj
```

Then in Xcode:

1. Select a generic iOS device or connected iPhone.
2. Product > Archive.
3. Organizer > Distribute App.
4. Choose App Store Connect upload for TestFlight/App Store.

## Release Notes Template

Use a short first TestFlight note:

```text
首个 iOS 测试版本：验证基础战斗、职业技能、碰撞表现、结算流程和性能稳定性。
```

## Source Notes

- Apple Developer Program: https://developer.apple.com/programs/
- App Store Connect app record: https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/
- Upload builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/
- TestFlight external testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/
- Required device capabilities: https://developer.apple.com/support/required-device-capabilities/
