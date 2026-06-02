# Analytics Events

The Android build sends game telemetry through Firebase Analytics and Facebook App Events via the native `GameAnalytics` Capacitor plugin. Collection is disabled by default and starts only after the user accepts the current privacy policy and user agreement.

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

## Facebook App Events Configuration

The same normalized events listed below are also forwarded to Facebook App Events after analytics consent is granted. The app initializes the Facebook SDK from the configured `facebookAppId` and `facebookClientToken`, keeps automatic app event logging disabled, and keeps advertiser ID collection disabled.

Validation evidence to look for in logcat:

- `GameAnalytics: setCollectionEnabled: true`
- Capacitor callback result containing `facebook_app_events_sent=true`
- app process traffic to `https://graph.facebook.com/.../<facebookAppId>/activities`

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
| `ad_click` | A mock ad slot or native ad is tapped | `placement`, `ad_format`, `ad_network`, `creative_id`, `scene`, `surface`, `locale`, optional `match_id`, `source` |
| `ad_close` | An app-open ad closes, auto-closes, or fails to show | `placement`, `ad_format`, `ad_network`, `creative_id`, `scene`, `surface`, `locale`, `reason`, optional `source` |
| `rewarded_ad_grant` | A rewarded ad successfully grants one result-screen encore pass | `match_id`, match base parameters, `placement`, `reward_type`, `daily_claim_count`, `total_claim_count`, `pending_passes`, `ad_network`, `creative_id` |
| `game_init_success` | App boot finishes platform initialization | `scene`, `locale`, `surface`, `analytics_enabled`, `render_quality`, `render_reason`, `render_dpr` |
| `game_start` | A match starts | `match_id`, `scene`, `ball_count`, `own_side`, `opponent_side`, `own_role`, `opponent_role`, `locale`, `surface`, `start_source`, `daily_match_index`, `total_matches_before`, `reward_source`, `render_quality`, `render_reason`, `render_dpr` |
| `game_end` | A match reaches the result screen | `match_id`, `scene`, `ball_count`, `own_role`, `opponent_role`, `duration_sec`, `result`, `winner_side`, `own_result`, `own_attack_count`, `opponent_attack_count`, `own_attacked_count`, `opponent_attacked_count`, `own_damage_dealt`, `opponent_damage_dealt`, `own_damage_taken`, `opponent_damage_taken`, `own_map_event_victim_count`, `opponent_map_event_victim_count`, `total_map_event_victim_count`, `total_attack_count`, `total_attacked_count` |
| `first_battle_start` | The user's first local match starts | `match_id`, match base parameters, `start_source`, `daily_match_index`, `total_matches_before` |
| `first_battle_complete` | The user's first local match reaches the result screen | `match_id`, match base parameters, `daily_match_count`, `daily_win_count`, `total_matches`, `winner_side`, `own_result`, `duration_sec` |
| `second_battle_start` | The user's second local match starts | `match_id`, match base parameters, `start_source`, `daily_match_index`, `total_matches_before` |
| `daily_match_complete` | Any match completes, with daily progress context | `match_id`, match base parameters, `daily_match_count`, `daily_win_count`, `total_matches`, `winner_side`, `own_result`, `duration_sec`, `daily_goal_reached` |
| `report_card_click` | The result screen battle-report image button is clicked | `match_id`, match base parameters, `winner_side`, `own_result`, `daily_match_count`, `total_matches` |
| `next_match_recommend_click` | The result screen recommended-next-match button is clicked | `match_id`, match base parameters, `recommendation_reason`, `recommended_matchup`, `winner_side`, `own_result` |
| `review_prompt_request` | The app schedules a native in-app review request after an eligible result screen | `match_id`, match base parameters, `review_reason`, `review_session_count`, `review_attempt_count`, `app_version`, `daily_match_count`, `total_matches` |
| `review_prompt_result` | The native review bridge returns after requesting the system review card | `match_id`, match base parameters, `requested`, `transport`, `reason`, `platform`, `app_version`, `daily_match_count`, `total_matches` |
| `store_review_click` | The Settings screen manual rating/store button is clicked | `match_id`, match base parameters, `opened`, `transport`, `reason`, `platform`, `daily_match_count`, `total_matches` |
| `next_day_return` | A returning user opens the app on a later local date | `previous_date`, `current_date`, `days_elapsed`, `previous_daily_matches`, `previous_daily_wins`, `total_matches`, `scene`, `locale`, `surface` |
| `performance_snapshot` | A throttled performance sample is captured during a match or at match end | `match_id`, `sample_type`, `sample_frames`, `match_time_sec`, `fps_avg`, `frame_ms_avg`, `frame_ms_p95`, `frame_ms_max`, `long_frame_pct`, `jank_frame_pct`, `match_fps_avg`, `match_jank_pct`, `render_quality`, `render_reason`, `render_dpr`, plus match base parameters |
| `render_quality_change` | Runtime performance triggers an automatic render-quality downgrade during a match | `match_id`, match base parameters, `previous_quality`, `render_quality`, `render_reason`, `render_dpr`, `frame_ms_p95`, `jank_frame_pct`, `sample_frames`, `match_time_sec`, `change_count` |
| `setting_select` | A configurable option changes | `setting_name`, `setting_value`, `previous_value`, `scene`, `locale` |

## Definitions

- `own_side` is currently side `A`; `opponent_side` is side `B`.
- `own_role` and `opponent_role` are the selected profession or hero ids. In item mode they are reported as `item_ball`.
- Attack counts are aggregated successful damaging hits, not every animation attempt.
- Attacked counts are aggregated successful damaging hits received.
- Damage values are aggregated applied damage after health clamping.
- `performance_snapshot` is throttled to avoid noisy analytics. Periodic samples are emitted about every 15 real seconds during active matches, and a final `sample_type=match_end` snapshot is emitted before `game_end` when enough frames were observed.
- `long_frame_pct` uses frames at or above roughly 30 FPS frame time (`33.3ms`), while `jank_frame_pct` uses frames at or above `50ms`.
- Render quality starts from device hints (`navigator.deviceMemory`, `navigator.hardwareConcurrency`, and DPR) and can downgrade from `high` to `medium` or `low` when p95 frame time or jank rate stays high. Use `render_reason` to separate device-based defaults from runtime jank downgrades.
- Browser ad events use the local game-themed mock ad chain (`ad_network=mock_game_ads`). Meta Instant Games builds use `ad_network=meta_instant_games`. Native Capacitor builds use `ad_network=admob` when the AdMob plugin is available, or `native_game_ads` if a custom bridge supplies the placement.

## Additional Events To Consider

- `scene_select` and `role_select` can be split out from `setting_select` if reporting needs dedicated funnels.
- `item_pickup` and `skill_cast` are useful once the design needs balance, economy, or monetization dashboards.
- `game_error` or `asset_load_error` would help diagnose WebView/device issues in production.
