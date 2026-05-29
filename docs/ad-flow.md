# Ad Flow

The current build uses a service-layer ad chain. Browser builds render a local game-themed mock ad chain for layout and analytics testing; native Capacitor builds can show Google AdMob through `@capacitor-community/admob`.

## Placements

| Placement | Format | Surface | Current behavior |
| --- | --- | --- | --- |
| `app_open` | Interstitial | After legal consent, or app boot when consent is already valid | Native AdMob interstitial on Android/iOS, canvas mock overlay on web |
| `battle_banner` | Banner | Below the `Shake` battle control when there is safe area | Native AdMob banner aligned to the reserved slot, canvas mock banner on web |

## Runtime Chain

1. The game requests an ad through `services.ads`.
2. If a native `GameAds` bridge is present, the service delegates to it with game-context metadata.
3. Otherwise, native Capacitor builds initialize `@capacitor-community/admob` and use Google test ad units unless real ad unit env vars are provided.
4. Browser builds return a `mock_game_ads` result and Canvas renders the mock creative for app-open and battle-banner placements.
5. Firebase Analytics receives `ad_request`, `ad_show`, `ad_click`, and `ad_close` events.

## Native AdMob Configuration

- Android and iOS are configured with Google sample AdMob application IDs for debug safety.
- Real release builds should replace the app IDs and provide real ad unit IDs via build env:
  - `VITE_ADMOB_ANDROID_APP_OPEN_AD_UNIT_ID`
  - `VITE_ADMOB_ANDROID_BATTLE_BANNER_AD_UNIT_ID`
  - `VITE_ADMOB_IOS_APP_OPEN_AD_UNIT_ID`
  - `VITE_ADMOB_IOS_BATTLE_BANNER_AD_UNIT_ID`
- `VITE_ADMOB_TESTING` defaults to `true`; set it to `false` only for a release build with real ad units.
- `VITE_ADMOB_NPA` defaults to `true`, so requests are non-personalized by default.
- The code marks the ad context as games, but AdMob category filtering must still be enforced in the AdMob console under blocking controls.

## Test Notes

- Mock ads do not open real ad destinations, use ad identifiers, or trigger charges.
- Google test ad units must be used for local/debug verification; they do not generate revenue or billable traffic.
- The battle banner reserves layout space below `Shake`, so it should not overlap the arena or controls.
- App-open ads are shown only after the current legal consent is accepted.
- Leaving the battle screen hides the native banner so it does not remain over menus or result screens.
