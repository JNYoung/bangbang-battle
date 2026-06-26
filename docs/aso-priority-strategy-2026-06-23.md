# 斗球球 ASO 优先策略

Date: 2026-06-23
Scope: Google Play first, App Store follow-up
Primary evidence: `reports/aso-insights/aso-insights-2026-06-23.md`

## 结论

ASO 当前第一优先级不是扩大关键词覆盖，而是修正商店页承诺：从“这是一个自动对战游戏”改成“选一组对阵，猜谁会赢，看结果，再挑战反制阵容”。

GA 已可读后的早期信号：

| Signal | 2026-06-22 |
| --- | ---: |
| Active users | 17 |
| Events | 161 |
| `game_start / game_init_success` | 7 / 18 = 38.9% |
| `game_end / game_start` | 3 / 7 = 42.9% |
| `second_battle_start` | 0 |
| `next_match_recommend_click` | 0 |
| `next_day_return` | 12 |
| `ad_request / ad_show / ad_close` | 23 / 14 / 1 |

Interpretation:

- 用户已经能进来，但从进入应用到开第一局偏弱。商店页、首图、短描述、隐私同意后的首屏都需要更明确地告诉用户“下一步就是选对阵开战”。
- 已开局用户到完成一局也偏弱。ASO 可以主打自动对战，但不要过度承诺深策略、复杂英雄或高强度竞技，先强调“快速看一局、结果清楚”。
- 二局和 next-match 当前为 0。ASO 如果主打 counter/matchup，产品内结算页和截图第 3 张必须承接“继续挑战反制阵容”。
- Play Console 商店页曝光到安装转化仍未接入。GA 只能说明应用内承接，不足以判断关键词或首图是否提高了安装转化。

## P0: 数据和合规先收口

### 1. 接入 Play Console acquisition

把 Play Console 导出的 Store listing acquisition 放到：

```text
reports/play-console/
```

需要字段优先级：

| Field | 用途 |
| --- | --- |
| store listing visitors | 看首屏/关键词是否带来访问 |
| installers / acquisitions | 看访问到安装转化 |
| country / language | 决定 zh-CN/en-US 素材权重 |
| traffic source / search term | 决定关键词和创意角度 |
| date | 和 GA 的 `game_start`、`game_end` 对齐 |

没有这份数据前，ASO 只能优化“安装后的承接”，不能判断“商店页是否更会转化”。

### 2. 核对广告事件来源

当前 docs/ad-flow.md 写的是现版本不展示广告，但 GA 昨日有 `ad_request`、`ad_show`、`ad_close`。这会影响 Google Play Data safety、Ads declaration 和商店文案。

处理方式：

- 如果来自旧包或测试包：在 ASO 复盘里标注，不改变当前商店口径。
- 如果当前生产包仍在发广告事件：先修文档/商店披露，再跑 ASO；不要在商店写“no ads”或类似承诺。

## P1: Google Play 立即改的内容

### 1. Short Description

Current:

```text
Pick professions and watch quick pixel-ball auto battles.
```

Recommended first test:

```text
Pick a matchup, watch pixel-ball battles, then try the counter.
```

Backup test:

```text
Who wins the pixel arena? Pick a matchup and watch the counter.
```

zh-CN:

```text
选择对阵，观看球球自动开战，再挑战反制阵容。
```

Why:

- 直接解释用户动作：pick -> watch -> counter。
- 和当前增长方向 `matchup prediction` 对齐。
- 避免只列职业/武器/英雄，先把新用户带进第一局。

### 2. Full Description 首段

en-US:

```text
Profession Ball Arena is a fast portrait auto-battle game about compact pixel matchups. Pick two professions, watch the arena decide the result, then try the counter in the next round.
```

zh-CN:

```text
斗球球是一款竖屏 2D 自动对战小游戏。先选择一组职业对阵，猜猜谁会赢，再观看球球在像素竞技场里自动开战；结算后可以继续挑战反制阵容。
```

Feature bullets should be reordered:

1. 对阵选择 / Matchup battles
2. 快速开局 / Fast rounds
3. 反制循环 / Counter loop
4. 随机道具 / Item chaos
5. 英雄模式 / Hero mode
6. 透明设置 / Transparent settings

### 3. Screenshot Order

Current set is feature-led:

1. active battle
2. profession select
3. item mode
4. hero battle
5. settings/privacy

Recommended set:

1. `matchup-question-battle`: active battle with caption `长矛球 vs 盾牌球，谁会赢？`
2. `pick-matchup`: profession select with caption `选职业，看克制`
3. `result-verdict-next`: result/verdict screen with next-match recommendation `赢了？马上挑战反制`
4. `item-chaos`: item mode with caption `随机武器，局局不同`
5. `settings-privacy`: compliance screenshot last

Current visual gap:

- 第一张是真实战斗，但缺少 matchup 问题。
- 第二张像配置页，不像增长钩子。
- 当前推荐截图里没有结算/verdict，而 GA 正显示二局和 next-match 是断点。

### 4. Feature Graphic

Current feature graphic is mostly a cropped battle scene. Test a graphic based on real gameplay but with clear high-contrast copy:

```text
长矛球 VS 盾牌球
谁会赢？
```

English:

```text
Spear vs Shield
Who wins?
```

Avoid:

```text
下注, 赔率, 赌, 梭哈, 赚钱, 真实斗蛐蛐
```

## App Store Follow-Up

If iOS is live or near-live:

zh-CN subtitle:

```text
先猜胜负，再看对战
```

en-US subtitle:

```text
Pick, watch, counter
```

Promotional text zh-CN:

```text
先猜谁赢，再看球球自动开战。结算后挑战反制阵容，快速一局看出职业克制。
```

Promotional text en-US:

```text
Pick a matchup, watch a fast pixel-ball duel, then try the counter after the result.
```

Product Page Optimization first treatment:

- Keep icon unchanged.
- Change only screenshot order/captions and promotional text.
- Do not test icon + screenshots + video at the same time in the first run.

## Experiment Plan

### Round 1: Promise Clarity

Goal:

```text
Increase users who start and finish the first match after arriving from store/organic sources.
```

Change:

- Short description to matchup/counter promise.
- First screenshot to matchup question battle.
- Add result/verdict screenshot as #3.
- Feature graphic gets matchup question copy.

Read after 3-7 days or once sample is meaningful:

| Metric | Source | Direction |
| --- | --- | --- |
| Store listing visitors -> installers | Play Console | up |
| `google-play / organic` active users | GA | up |
| `game_start / game_init_success` | GA | up from 38.9% |
| `game_end / game_start` | GA | up from 42.9% |
| `second_battle_start` / `next_match_recommend_click` | GA | above 0 |
| `app_remove` | GA | down |

Decision rule:

- If installs rise but `game_start` stays weak, store promise still attracts low-intent users or first in-app action is unclear.
- If `game_start` rises but `game_end` stays weak, keep the ASO promise and fix first-battle readability/product flow.
- If `game_start`, `game_end`, and next-match all rise, reuse this same message in YouTube, Meta, and Google creatives.

### Round 2: Angle Split

Only after Round 1 has a baseline:

| Variant | Promise | Asset focus |
| --- | --- | --- |
| A | Matchup prediction | `谁会赢？` / `Who wins?` |
| B | Item chaos | random weapons and surprising reversals |
| C | Daily champion | daily matchup / winner loop |

Do not run all three as paid channels until the organic Google Play funnel has a readable baseline.

## Keyword Strategy

Primary English:

```text
auto battle, auto battler, battle simulator, pixel arena, casual strategy, matchup, heroes, weapons
```

Secondary English:

```text
quick battle, offline game, arena duel, brawler, fantasy combat
```

Primary Chinese:

```text
自动对战, 像素, 休闲, 策略, 职业, 道具, 英雄, 谁会赢
```

Avoid:

```text
球球大作战, 下注, 赔率, 赌博, 真实斗蛐蛐, 赚钱
```

Reason:

- 当前活跃主要来自中文环境，但 Google Play organic 已出现，需要中英两套承诺保持一致。
- 在 `game_start` 低于 50% 前，不追太宽泛的 `arcade`、`action game`、`brawler` 流量。

## 7-Day ASO Work Plan

Day 1:

- Export Play Console acquisition baseline.
- Confirm ad event source.
- Update short description draft and screenshot captions.

Day 2:

- Capture or generate new screenshot #1 and #3.
- Create feature graphic variant with matchup question.

Day 3:

- Publish metadata/assets or start Play store listing experiment.
- Record exact publish time.

Days 4-6:

- Run `npm run aso:insights` daily.
- Watch `game_start / game_init_success`, `game_end / game_start`, `second_battle_start`, `next_match_recommend_click`.

Day 7:

- Decide keep / iterate / revert.
- If Round 1 improves first-start and first-completion, prepare Round 2 angle split.

## Immediate Recommendation

Ship the matchup/counter ASO update first. The current data says users can reach the app, but the first-match intent and completion loop are weak. A clearer short description, first screenshot, feature graphic, and result-loop screenshot are higher leverage than broad keyword expansion or paid scale.
