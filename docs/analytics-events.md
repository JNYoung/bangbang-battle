# Analytics Events

The Android build sends game telemetry through Firebase Analytics via the native `GameAnalytics` Capacitor plugin. Collection is disabled by default and starts only after the user accepts the current privacy policy and user agreement.

## GA/Firebase Configuration

Current Android analytics configuration:

- Firebase project ID: `profession-ball-arena`
- Firebase project number: `933439959875`
- Android package name: `com.professionballarena.game`
- Android app nickname: `Profession Ball Arena Android`
- Android app ID: `1:933439959875:android:76d88a27e9123f538d35f6`
- Local config file: `android/app/google-services.json`

Useful console links:

- Firebase project: `https://console.firebase.google.com/project/profession-ball-arena`
- Analytics events: `https://console.firebase.google.com/project/profession-ball-arena/analytics/events`
- DebugView: `https://console.firebase.google.com/project/profession-ball-arena/analytics/debugview`

When creating a replacement Firebase project, keep the Android package name as `com.professionballarena.game`, download a fresh `google-services.json`, replace `android/app/google-services.json`, then rebuild and reinstall the Android app before validating events.

## Daily GA Validation

Use the release smoke test when validating GA aggregate reports:

```sh
npm run android:ga:smoke
```

The script builds and installs the Android release APK, disables Firebase debug mode with `debug.firebase.analytics.app=.none.`, clears the emulator Google Play services analytics queue, starts a match, and checks logcat for:

- runtime Firebase app id `1:933439959875:android:76d88a27e9123f538d35f6`
- at least one `game_init_success` and `game_start`
- at least one successful Firebase upload response
- no old `gmp_app_id`, debug `_dbg`, or upload failure evidence

For a faster rerun after the APK is already current, use:

```sh
npm run android:ga:smoke -- --skip-build
```

Do not use Firebase DebugView runs to judge the next-day aggregate Events report. Debug-mode events are useful for live inspection, but they are isolated from normal GA reporting. If yesterday's report is empty while logcat shows events, first check for `Network upload failed`, `Gms url request failed`, `_dbg`, or an old `gmp_app_id` in the saved smoke-test log.

## Event Schema

| Event | When | Key parameters |
| --- | --- | --- |
| `ad_request` | An ad placement is requested | `placement`, `ad_format`, `ad_network`, `creative_id`, `scene`, `surface`, `locale`, optional `match_id` |
| `ad_show` | An ad placement becomes visible or native SDK reports it shown | `placement`, `ad_format`, `ad_network`, `creative_id`, `scene`, `surface`, `locale`, optional `match_id`, `source` |
| `ad_click` | A test ad slot or future native ad is tapped | `placement`, `ad_format`, `ad_network`, `creative_id`, `scene`, `surface`, `locale`, optional `match_id`, `source` |
| `ad_close` | An app-open ad closes, auto-closes, or fails to show | `placement`, `ad_format`, `ad_network`, `creative_id`, `scene`, `surface`, `locale`, `reason`, optional `source` |
| `game_init_success` | App boot finishes platform initialization | `scene`, `locale`, `surface`, `analytics_enabled` |
| `game_start` | A match starts | `match_id`, `scene`, `ball_count`, `own_side`, `opponent_side`, `own_role`, `opponent_role`, `locale`, `surface` |
| `game_end` | A match reaches the result screen | `match_id`, `scene`, `ball_count`, `own_role`, `opponent_role`, `duration_sec`, `result`, `winner_side`, `own_result`, `own_attack_count`, `opponent_attack_count`, `own_attacked_count`, `opponent_attacked_count`, `own_damage_dealt`, `opponent_damage_dealt`, `own_damage_taken`, `opponent_damage_taken`, `total_attack_count`, `total_attacked_count` |
| `performance_snapshot` | A throttled performance sample is captured during a match or at match end | `match_id`, `sample_type`, `sample_frames`, `match_time_sec`, `wall_time_sec`, `fps_avg`, `frame_ms_avg`, `frame_ms_p95`, `frame_ms_max`, `long_frame_pct`, `jank_frame_pct`, `match_fps_avg`, `match_jank_pct`, `memory_mb`, plus match base parameters |
| `setting_select` | A configurable option changes | `setting_name`, `setting_value`, `previous_value`, `scene`, `locale` |

## Definitions

- `own_side` is currently side `A`; `opponent_side` is side `B`.
- `own_role` and `opponent_role` are the selected profession or hero ids. In item mode they are reported as `item_ball`.
- Attack counts are aggregated successful damaging hits, not every animation attempt.
- Attacked counts are aggregated successful damaging hits received.
- Damage values are aggregated applied damage after health clamping.
- `performance_snapshot` is throttled to avoid noisy analytics. Periodic samples are emitted about every 15 real seconds during active matches, and a final `sample_type=match_end` snapshot is emitted before `game_end` when enough frames were observed.
- `long_frame_pct` uses frames at or above roughly 30 FPS frame time (`33.3ms`), while `jank_frame_pct` uses frames at or above `50ms`.
- `memory_mb` is included only on runtimes that expose JavaScript heap usage.
- Ad events currently use the local mock ad chain (`ad_network=mock`) unless a native Capacitor ad plugin is present. Mock ads are for layout and analytics-flow testing only.

## Additional Events To Consider

- `scene_select` and `role_select` can be split out from `setting_select` if reporting needs dedicated funnels.
- `item_pickup` and `skill_cast` are useful once the design needs balance, economy, or monetization dashboards.
- `game_error` or `asset_load_error` would help diagnose WebView/device issues in production.
