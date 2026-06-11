# Ad Flow

The current build does not request or show ads on any platform.

## Runtime Behavior

- `services.ads` is a disabled compatibility adapter. It reports `mode: "disabled"`, `available: false`, and returns `reason: "ads_removed"` for placement calls.
- The game no longer calls app-open, battle-banner, or rewarded-video request paths.
- The battle layout no longer reserves banner space below the `Shake` control.
- The result screen no longer offers a rewarded-ad encore claim. Existing locally saved pending encore passes can still be consumed so older local state is not stranded.
- Firebase Analytics does not receive ad request, show, click, close, or rewarded grant events from the current runtime flow.

## Native Builds

- `@capacitor-community/admob` is not installed.
- Android has no AdMob Gradle module, app id metadata, or `admob_app_id` resource.
- iOS has no AdMob Swift package, `GADApplicationIdentifier`, or ad SKAdNetwork entries.
- Build scripts do not set `VITE_ADMOB_*` flags.

## Regression Checks

- `npm test` verifies that the ads adapter never delegates to native or Meta ad APIs.
- `npm run test:artifacts` continues to verify the Meta ZIP does not include the removed AdMob package path.
