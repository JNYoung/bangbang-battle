# Ad Flow

The current build uses a service-layer ad chain with platform-specific adapters. Meta Instant Games builds use `FBInstant` ad APIs; native Capacitor builds can show Google AdMob through `@capacitor-community/admob`; browser debug builds render a local game-themed mock ad chain for layout and analytics testing.

## Placements

| Placement | Format | Surface | Current behavior |
| --- | --- | --- | --- |
| `app_open` | Interstitial | After legal consent, or app boot when consent is already valid | Meta Instant interstitial in Meta, native AdMob interstitial on Android/iOS, canvas mock overlay on debug web |
| `battle_banner` | Banner | Below the `Shake` battle control when there is safe area | Native AdMob banner on Android/iOS, canvas mock banner on debug web; disabled in Meta because Instant Games ads are interstitial/rewarded placements, not AdMob banners |
| `rewarded_video` | Rewarded video | Reserved for future reward flows | Meta rewarded video when a placement ID is configured; currently no gameplay reward consumes it |

## Runtime Chain

1. The game requests an ad through `services.ads`.
2. If a native `GameAds` bridge is present, the service delegates to it with game-context metadata.
3. If `window.FBInstant` is present, the service uses Meta Instant Games ad APIs:
   - `FBInstant.getInterstitialAdAsync(placementId)` for `app_open`.
   - `FBInstant.getRewardedVideoAsync(placementId)` for the reserved rewarded placement.
   - Banner requests fail closed with `meta_banner_not_supported`, so the battle banner slot is not reserved in Meta layout.
4. Otherwise, native Capacitor builds initialize `@capacitor-community/admob`; native builds use Google test ad units by default until live ads are explicitly enabled for release.
5. Browser builds return a `mock_game_ads` result and Canvas renders the mock creative for app-open and battle-banner placements.
6. Firebase Analytics receives `ad_request`, `ad_show`, `ad_click`, and `ad_close` events when analytics consent is enabled.

## Meta Instant Games Configuration

- Meta builds are produced with `VITE_PLATFORM_TARGET=meta`, so the Meta ZIP does not include the AdMob SDK import path.
- App-open ads require a Meta placement ID from the Instant Games monetization dashboard:
  - `VITE_META_APP_OPEN_AD_PLACEMENT_ID`
  - Compatibility aliases: `VITE_META_INTERSTITIAL_PLACEMENT_ID`, `VITE_META_APP_OPEN_PLACEMENT_ID`
- Reserved rewarded video support can be configured with:
  - `VITE_META_REWARDED_VIDEO_PLACEMENT_ID`
  - Compatibility aliases: `VITE_META_REWARDED_AD_PLACEMENT_ID`, `VITE_META_REWARDED_PLACEMENT_ID`
- If a Meta placement ID is missing, the request returns `meta_placement_id_missing` and no ad is shown.
- Meta does not use the Google AdMob app ID or ad unit IDs.

## Native AdMob Configuration

- Android is configured with the production AdMob application ID `ca-app-pub-2481288993515154~4798979229`.
- Android production ad units are configured in the service layer:
  - `app_open` interstitial: `ca-app-pub-2481288993515154/2687290972`
  - `battle_banner` banner: `ca-app-pub-2481288993515154/6818107670`
- iOS is still configured with the Google sample AdMob application ID until an iOS AdMob app and units are created.
- Release builds can override ad unit IDs via build env:
  - `VITE_ADMOB_ANDROID_APP_OPEN_AD_UNIT_ID`
  - `VITE_ADMOB_ANDROID_BATTLE_BANNER_AD_UNIT_ID`
  - `VITE_ADMOB_IOS_APP_OPEN_AD_UNIT_ID`
  - `VITE_ADMOB_IOS_BATTLE_BANNER_AD_UNIT_ID`
- `VITE_ADMOB_MODE` controls the runtime ad chain:
  - `auto` or unset: native builds use Google test ad units; browser builds use the local canvas mock.
  - `test`: force Google test ad units on native builds.
  - `real`: use configured production ad units when both placements are available; otherwise fall back to Google test ad units.
  - `mock`: force the local canvas mock path.
- `VITE_ADMOB_TESTING=false` is still supported as a compatibility shortcut for `VITE_ADMOB_MODE=real`; `VITE_ADMOB_TESTING=true` maps to `VITE_ADMOB_MODE=test`.
- `VITE_ADMOB_RELEASE_ADS=true` also enables live AdMob units for release automation.
- `VITE_ADMOB_NPA` defaults to `true`, so requests are non-personalized by default.
- The code marks the ad context as games, but AdMob category filtering must still be enforced in the AdMob console under blocking controls.

## Build Commands

- `npm run android:debug` builds an Android debug APK with Google test ad units.
- `npm run android:internal-test` builds an Android release artifact with Google test ad units for closed/internal QA.
- `npm run android:release` builds an Android release artifact with `VITE_ADMOB_MODE=real`; live fill still depends on AdMob account and app approval.

## Test Notes

- Treat platform-specific packaging as a regression target: Meta builds must contain the `FBInstant` SDK and must not include the AdMob SDK import path; Android/iOS builds must continue to initialize AdMob only through the native path.
- Mock ads do not open real ad destinations, use ad identifiers, or trigger charges.
- Google test ad units are the default for local/debug/internal verification; they do not generate revenue or billable traffic.
- New AdMob apps and ad units can take up to one hour, plus app review time, before live fill is available.
- If runtime logs report `Account not approved yet`, the app is already requesting live AdMob units, but AdMob is blocking fill until the account/app review is complete.
- Failed native banner loads are rate-limited before retrying, so AdMob review or fill failures do not hammer the SDK or disrupt gameplay.
- The battle banner reserves layout space below `Shake`, so it should not overlap the arena or controls.
- App-open ads are shown only after the current legal consent is accepted.
- Leaving the battle screen hides the native banner so it does not remain over menus or result screens.
