# Production Access Checklist

Updated: 2026-06-15

This checklist is for applying for Google Play production access for `斗球球` / `Profession Ball Arena`.

## Current Local Readiness

- Package name: `com.professionballarena.game`
- Current release: `versionCode 4`, `versionName 1.0.3`
- Target SDK: 36
- Release artifact: `android/app/build/outputs/bundle/release/app-release.aab`
- AAB SHA-256: `0e9825347caf14bd6c009baf607a52378164b1509c1ce08e06d9c5aeb0f069c4`
- Privacy policy: `https://professionballarena.top/privacy/`
- Data deletion page: `https://professionballarena.top/data-deletion/`
- App ads file: `https://professionballarena.top/app-ads.txt`
- Store assets exist locally:
  - `store-assets/google-play/feature-graphic.png`
  - `store-assets/google-play/feature-graphic.jpg`
  - `store-assets/screenshots/google-phone/01-classic-battle.png`
  - `store-assets/screenshots/google-phone/02-profession-select.png`
  - `store-assets/screenshots/google-phone/03-item-mode.png`
  - `store-assets/screenshots/google-phone/04-hero-battle.png`
  - `store-assets/screenshots/google-phone/05-settings-privacy.png`

## Production Access Gate

For new personal developer accounts, production access depends on the closed testing requirement:

- Closed testing release is reviewed and available to testers.
- At least 12 testers are opted in to the closed test.
- Those testers remain opted in for at least 14 continuous days.
- After the requirement is met, Play Console should enable the production access application from the app dashboard.

The tester opt-in link alone is not enough. Testers must be on the tester list or Google Group, opt in, install from Google Play, and stay opted in through the 14-day window.

## Play Console Verification

Check these in Play Console:

1. Go to `Testing > Closed testing`.
2. Confirm the closed testing track release status is live or available to testers, not only draft or under review.
3. Confirm the tester list uses the intended Google Group or email list.
4. Confirm at least 12 testers are opted in.
5. Confirm the 14-day continuous testing requirement is complete.
6. Go to the app dashboard and check whether `Apply for production` is enabled.

Record the result here:

```text
Closed testing release status:
Tester group or list:
Opted-in tester count:
Closed test start date:
14-day completion date:
Apply for production enabled: yes/no
Blocking Play Console warnings:
```

## Suggested Production Access Answers

Use these as a starting point, then adjust to match the actual closed-test feedback.

### What is the app?

`斗球球` is a lightweight pixel auto-battle game. Players choose professions, heroes, or item mode, then watch short automatic arena matches with battle reports, replay links, and optional sharing.

### Who tested it?

The closed test included at least 12 opted-in Google Play testers using different Android devices and network conditions. Testers were asked to complete first launch consent, start classic battles, try item mode, try hero mode, toggle settings, background and resume the app, and report crashes or confusing flows.

### What feedback did testers give?

Summarize actual notes here before submitting. Suggested categories:

- First launch and consent clarity.
- Battle readability and match pacing.
- Performance, startup, crashes, or blank screens.
- Store listing clarity.
- Ads/analytics consent expectations.

### What changed after testing?

Use real changes only. Current local examples that may apply:

- Added release and compliance documentation.
- Improved automated validation for game configs, consent state, ads path, i18n, battle replay links, and YouTube operations tooling.
- Verified public privacy, data deletion, and app ads URLs.
- Confirmed risky advertising ID permissions are removed from the Android manifest merge.

### Why is it ready for production?

The app does not require login, has completed Play app content declarations, provides privacy and data deletion links, uses a signed Android App Bundle, targets SDK 36, and has passed local syntax/unit validation. Production readiness should be claimed only after the closed-test requirement and Play Console warnings are fully cleared.

## Final Pre-Submission Commands

```sh
npm run lint:syntax
npm test
npm run test:matchups
npm run test:artifacts
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
shasum -a 256 android/app/build/outputs/bundle/release/app-release.aab
```

## Official References

- Closed testing and production access: https://support.google.com/googleplay/android-developer/answer/14151465
- Set up internal, closed, or open testing: https://support.google.com/googleplay/android-developer/answer/9845334
- Target API level requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Prepare and roll out a release: https://support.google.com/googleplay/android-developer/answer/9859348

## Tester Invitation

Replace `{groupSlug}` if the actual Google Group slug differs.

```text
✅ 邀请加入《斗球球》封闭测试！

《斗球球》是一款像素风自动对战小游戏：选择职业、英雄或道具模式，观看球球在竞技场自动开战。

1️⃣ 第一步（加入测试群组）：
https://groups.google.com/g/professionballarena-testers

2️⃣ 第二步（加入 Google Play 测试并下载）：
网页测试：https://play.google.com/apps/testing/com.professionballarena.game

Google Play 下载：
https://play.google.com/store/apps/details?id=com.professionballarena.game

请安装后至少打开试玩一次，并在测试期内保持加入测试。感谢支持！如果你也有应用需要回测，请随时告诉我。
```
