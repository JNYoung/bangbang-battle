# Review, Feedback, And Retention Workstream

Updated: 2026-06-02

## What Changed Today

- Added a shared review service in `services.js` with native delegation for Android/iOS and safe fallback for Meta/Web.
- Added Android `GameReviewPlugin` using the Google Play In-App Review API plus a manual Play Store listing opener.
- Added iOS `GameReviewPlugin` using `SKStoreReviewController`, registered through `BangbangBridgeViewController`.
- Added persistent review throttling state: session count, last prompted version, last prompt time, attempt count, and manual store-open time.
- Added a Settings `Rate App` button. It opens the store listing / write-review page, while `Contact Developer` remains the direct support path.
- Added automatic review prompt eligibility after result screens only when all of these are true:
  - player-side win,
  - at least 4 total matches,
  - at least 2 separated app sessions,
  - current app version has not already requested a review,
  - last request was at least 30 days ago,
  - native review bridge is available.

## Platform Guardrails

- Do not buy, gate, incentivize, or pre-filter reviews.
- Do not ask "Do you like this app?" before showing the native review card.
- Do not show a custom "please give us 5 stars" prompt.
- Keep manual rating actions as store-page opens, not forced native in-app review requests.
- Treat the native review card as best-effort: the OS/store can silently suppress it because of quota or policy.

## Account-Ready Follow-Ups

- App Store Connect: after the app record exists, set `VITE_APP_STORE_APP_ID` so the Settings `Rate App` button can open the iOS write-review URL.
- Google Play Console: keep package id `com.professionballarena.game`; the Android manual button already targets that package by default.
- Meta Instant Games: keep feedback routed to sharing/support. Meta does not use the native mobile review APIs.
- Store metadata: update screenshots after the latest Settings page is captured so the feedback/rating/support controls are visible in one compliance screenshot.

## Official References

- Apple ratings and reviews: https://developer.apple.com/app-store/ratings-and-reviews/
- Google Play In-App Review API: https://developer.android.com/guide/playcore/in-app-review
- Google Play metadata policy: https://support.google.com/googleplay/android-developer/answer/9898842
