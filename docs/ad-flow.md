# Ad Flow

The current build uses a local mock ad chain so layout, timing, and Firebase Analytics reporting can be tested before a real ad SDK is connected.

## Placements

| Placement | Format | Surface | Current behavior |
| --- | --- | --- | --- |
| `app_open` | Interstitial | After legal consent, or app boot when consent is already valid | Shows a short canvas overlay with a close countdown and auto-close timer |
| `battle_banner` | Banner | Below the `Shake` battle control when there is safe area | Shows a compact test banner during active battle |

## Runtime Chain

1. The game requests an ad through `services.ads`.
2. If a future native Capacitor ad plugin is present (`GameAds` or `AdMob`), the service can delegate to it.
3. Without a native plugin, the service returns a `mock` ad result.
4. Canvas renders the mock creative for app-open and battle-banner placements.
5. Firebase Analytics receives `ad_request`, `ad_show`, `ad_click`, and `ad_close` events.

## Test Notes

- Mock ads do not open real ad destinations, use ad identifiers, or trigger charges.
- The battle banner reserves layout space below `Shake`, so it should not overlap the arena or controls.
- App-open ads are shown only after the current legal consent is accepted.
- Real ad SDK integration should update the privacy policy and replace the service-layer implementation without changing game layout code.
