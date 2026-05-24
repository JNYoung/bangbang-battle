# Analytics Events

The Android build sends game telemetry through Firebase Analytics via the native `GameAnalytics` Capacitor plugin. Collection is disabled by default and starts only after the user accepts the current privacy policy and user agreement.

## Event Schema

| Event | When | Key parameters |
| --- | --- | --- |
| `game_init_success` | App boot finishes platform initialization | `scene`, `locale`, `surface`, `analytics_enabled` |
| `game_start` | A match starts | `match_id`, `scene`, `ball_count`, `own_side`, `opponent_side`, `own_role`, `opponent_role`, `locale`, `surface` |
| `game_end` | A match reaches the result screen | `match_id`, `scene`, `ball_count`, `own_role`, `opponent_role`, `duration_sec`, `result`, `winner_side`, `own_result`, `own_attack_count`, `opponent_attack_count`, `own_attacked_count`, `opponent_attacked_count`, `own_damage_dealt`, `opponent_damage_dealt`, `own_damage_taken`, `opponent_damage_taken`, `total_attack_count`, `total_attacked_count` |
| `setting_select` | A configurable option changes | `setting_name`, `setting_value`, `previous_value`, `scene`, `locale` |

## Definitions

- `own_side` is currently side `A`; `opponent_side` is side `B`.
- `own_role` and `opponent_role` are the selected profession or hero ids. In item mode they are reported as `item_ball`.
- Attack counts are aggregated successful damaging hits, not every animation attempt.
- Attacked counts are aggregated successful damaging hits received.
- Damage values are aggregated applied damage after health clamping.

## Additional Events To Consider

- `scene_select` and `role_select` can be split out from `setting_select` if reporting needs dedicated funnels.
- `item_pickup`, `skill_cast`, and `ad_show` are useful once the design needs balance, economy, or monetization dashboards.
- `game_error` or `asset_load_error` would help diagnose WebView/device issues in production.
