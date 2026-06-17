# Growth Content Intake - 2026-06-16

Purpose: turn external short-video and community signals into original, playable `斗球球` updates. Do not copy platform creators, third-party characters, or copyrighted game assets; extract only the reusable mechanic pattern.

## Source Pass

YouTube / overseas references:

- YouTube search patterns used: `auto battler who wins shorts`, `battle simulator who would win shorts`, `team builder auto battler counter picks`.
- `Super Auto Pets` pattern: frequent pack/roster freshness, easy-to-read unit synergies, and "try another pack" replay intent. Public reference: https://www.youtube.com/results?search_query=Super+Auto+Pets+weekly+pack
- `Mechabellum` pattern: positioning, counter-units, and "what beats this board?" framing. Public reference: https://store.steampowered.com/app/669330/Mechabellum/
- `Teamfight Tactics` pattern: rotating sets, draft adaptation, and counter-composition talk. Public reference: https://teamfighttactics.leagueoflegends.com/
- `The Bazaar` pattern: hero + item automation with compounding triggers. Public reference: https://store.steampowered.com/app/2427700/The_Bazaar/

Xiaohongshu / Chinese references:

- Chrome-managed attempt: `https://www.xiaohongshu.com/search_result?keyword=电子斗蛐蛐 赛博斗蛐蛐 游戏 玩法` timed out before usable DOM content.
- Chrome-managed fallback: `https://www.xiaohongshu.com/explore` loaded the page title but DOM extraction timed out. No Xiaohongshu note content was copied into the project.
- Public Chinese search signal still supports the same high-level theme: "电子斗蛐蛐 / 赛博斗蛐蛐" content is usually about audience prediction, matchup curiosity, and result spectacle.

## Growth Translation

| Observed hook | Product translation | In-game surface |
| --- | --- | --- |
| "谁会赢" matchup title | Ask the result before the battle starts | quick start, daily playlist, result recommendation |
| Counter-pick discussion | Every winner should suggest a challenger | `ROLE_COUNTER_RECOMMENDATIONS` |
| Roster freshness | Add small, readable content weekly | profession / hero / daily matchup |
| Trigger chains and item chaos | Let battles produce visible surprises | hero skills, item mode, match variants |
| Short-video first 3 seconds | One clear conflict, no tutorial | playlist title + tagline + immediate battle |

## Integrated Content

### Super Profession: 磁轨球 / `railgun`

Creative hook:

```text
悠悠球一直拉扯，磁轨球能不能预判点中？
```

Gameplay contract:

- Fragile ranged burst role.
- Uses existing projectile combat path.
- Counters slow charge / predictable orbit roles, but loses tempo against fast assassins.
- Added to the super arena role pool and next-match counter map.

### Hero: 磁暴工匠 / `stormEngineer`

Creative hook:

```text
宙斯抢天神下凡，磁暴工匠提前埋伏落雷。
```

Gameplay contract:

- Projectile baseline attack.
- `stormBeacon`: homing stun projectile, good for interrupting tempo.
- `voltageTrap`: delayed lightning prediction, good for short-video "will it land?" suspense.
- Added to hero arena role pool and next-match counter map.

### New Daily Playlist Entries

| Entry | Matchup | Hook |
| --- | --- | --- |
| `railgunCheck` | 磁轨球 vs 静电球 | Static charge versus first clean predictive shot |
| `loopBreaker` | 磁轨球 vs 悠悠球 | Spacing loop versus long-range prediction |
| `stormLab` | 磁暴工匠 vs 宙斯 | Trap timing versus divine timing |

## Next Update Queue

1. `评分战-lite`: after result, show a non-monetary "观赛评分" based on time, comeback, skill hit, and map hazard. This maps to Chinese "score battle / 沙盘" viewing habits without adding gambling language.
2. `周更反制包`: rotate 3 curated matchups weekly and tag each with `creative_tags`.
3. `召唤干扰位`: add one future role that spawns temporary blockers or weak followers, based on "small units disrupt big carry" auto-battler hooks.
4. `反套路英雄`: add one hero whose main skill punishes long wind-up casts, giving shorts a clean "bait the big move" storyline.

## Capture Prompts

- `磁轨球 vs 悠悠球：拉扯能躲过预判吗？`
- `磁暴工匠 vs 宙斯：谁先把雷打实？`
- `磁轨球 vs 静电球：一发点射打断充能？`
- `召唤师 vs 磁暴工匠：小单位会不会送雷？`

## Measurement

Tag the first batch as:

```text
creative_tags=prediction, counter_pick, railgun, storm_engineer, short_video
```

Readout priority:

- `game_start` by content tag.
- `first_battle_complete` for whether the new matchup is readable.
- `second_battle_start` and `next_match_recommend_click` for whether the counter loop improved.
- Short-video retention for the first 3 seconds of `railgunCheck` and `stormLab`.
